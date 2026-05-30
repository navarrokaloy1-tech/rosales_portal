import JSZip from 'jszip';

const SS_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

/**
 * Edits an xlsx file by manipulating its raw zip XML directly.
 *
 * Why not just use ExcelJS/SheetJS?
 *   The DepEd 3-Term E-Class Record has worksheet ranges like A1:WWV130 (2M+ cells)
 *   which trips ExcelJS's "Too many properties to enumerate" error, and SheetJS
 *   Community strips data validations and produces files Excel flags as damaged.
 *   By only touching the specific cells we need (as XML elements) we leave the
 *   rest of the workbook — styles, formulas, dimensions, helper sheets — intact.
 */
export class XlsxEditor {
  private constructor(
    private zip: JSZip,
    private sheetPathByName: Map<string, string>,
    private sheetDocs: Map<string, Document>,
  ) {}

  static async load(buf: ArrayBuffer): Promise<XlsxEditor> {
    const zip = await JSZip.loadAsync(buf);
    const sheetPathByName = await loadSheetMap(zip);
    return new XlsxEditor(zip, sheetPathByName, new Map());
  }

  hasSheet(name: string): boolean {
    return this.sheetPathByName.has(name);
  }

  async setCell(sheetName: string, addr: string, value: string | number | null): Promise<void> {
    if (value === null || value === undefined || value === '') return;
    const path = this.sheetPathByName.get(sheetName);
    if (!path) throw new Error(`Sheet "${sheetName}" not found in workbook`);

    const doc = await this.getSheetDoc(path);
    const { col, row } = parseAddr(addr);
    const sheetData = doc.getElementsByTagName('sheetData')[0];
    if (!sheetData) throw new Error(`No <sheetData> in ${path}`);

    const rowEl = findOrCreateRow(doc, sheetData, row);
    const cellEl = findOrCreateCell(doc, rowEl, addr, col);

    // Clear out existing value/formula nodes (preserve `s` style attribute)
    Array.from(cellEl.children).forEach(c => cellEl.removeChild(c));

    if (typeof value === 'number') {
      cellEl.removeAttribute('t');
      const v = doc.createElementNS(SS_NS, 'v');
      v.textContent = String(value);
      cellEl.appendChild(v);
    } else {
      cellEl.setAttribute('t', 'inlineStr');
      const is = doc.createElementNS(SS_NS, 'is');
      const t = doc.createElementNS(SS_NS, 't');
      if (/^\s|\s$/.test(value)) t.setAttribute('xml:space', 'preserve');
      t.textContent = value;
      is.appendChild(t);
      cellEl.appendChild(is);
    }
  }

  async save(): Promise<ArrayBuffer> {
    const serializer = new XMLSerializer();

    // Force Excel to recompute all formulas on open. Without this, formulas
    // referencing the cells we just modified show their stale cached values
    // (e.g. "0" for empty student-name slots).
    await this.forceFullCalcOnLoad();

    for (const [path, doc] of this.sheetDocs) {
      this.zip.file(path, serializer.serializeToString(doc));
    }
    return this.zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
  }

  private async forceFullCalcOnLoad(): Promise<void> {
    const wbFile = this.zip.file('xl/workbook.xml');
    if (!wbFile) return;
    let xml = await wbFile.async('string');
    if (/forceFullCalcOnLoad="1"/.test(xml)) return;
    if (/<calcPr\b[^/]*\/?>/.test(xml)) {
      // Inject the attribute into the existing <calcPr ... />
      xml = xml.replace(/<calcPr\b([^/]*)\/?>/, '<calcPr$1 fullCalcOnLoad="1"/>');
    } else {
      // Add a <calcPr> element just before </workbook>
      xml = xml.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>');
    }
    this.zip.file('xl/workbook.xml', xml);
  }

  private async getSheetDoc(path: string): Promise<Document> {
    let doc = this.sheetDocs.get(path);
    if (doc) return doc;
    const file = this.zip.file(path);
    if (!file) throw new Error(`Sheet XML missing: ${path}`);
    const xml = await file.async('string');
    doc = new DOMParser().parseFromString(xml, 'application/xml');
    this.sheetDocs.set(path, doc);
    return doc;
  }
}

async function loadSheetMap(zip: JSZip): Promise<Map<string, string>> {
  const wbFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  if (!wbFile || !relsFile) throw new Error('Not a valid .xlsx (missing workbook.xml or rels)');

  const [wbXml, relsXml] = await Promise.all([wbFile.async('string'), relsFile.async('string')]);
  const parser = new DOMParser();
  const wbDoc = parser.parseFromString(wbXml, 'application/xml');
  const relsDoc = parser.parseFromString(relsXml, 'application/xml');

  const ridToTarget = new Map<string, string>();
  Array.from(relsDoc.getElementsByTagName('Relationship')).forEach(r => {
    const id = r.getAttribute('Id');
    const target = r.getAttribute('Target');
    if (id && target) ridToTarget.set(id, target);
  });

  const map = new Map<string, string>();
  Array.from(wbDoc.getElementsByTagName('sheet')).forEach(s => {
    const name = s.getAttribute('name');
    // r:id namespace prefix may or may not parse — try both
    const rid =
      s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') ||
      s.getAttribute('r:id');
    if (!name || !rid) return;
    const target = ridToTarget.get(rid);
    if (!target) return;
    // Targets are relative to xl/, e.g. "worksheets/sheet1.xml"
    const path = target.startsWith('/') ? target.slice(1) : 'xl/' + target;
    map.set(name, path);
  });

  return map;
}

function parseAddr(addr: string): { col: string; row: number } {
  const m = addr.match(/^([A-Z]+)(\d+)$/);
  if (!m) throw new Error(`Invalid cell address: ${addr}`);
  return { col: m[1], row: parseInt(m[2], 10) };
}

function findOrCreateRow(doc: Document, sheetData: Element, row: number): Element {
  for (const r of Array.from(sheetData.children)) {
    if (parseInt(r.getAttribute('r') || '0', 10) === row) return r;
  }
  const rowEl = doc.createElementNS(SS_NS, 'row');
  rowEl.setAttribute('r', String(row));
  // Insert sorted by row number
  const children = Array.from(sheetData.children);
  const next = children.find(c => parseInt(c.getAttribute('r') || '0', 10) > row);
  if (next) sheetData.insertBefore(rowEl, next);
  else sheetData.appendChild(rowEl);
  return rowEl;
}

function findOrCreateCell(doc: Document, rowEl: Element, addr: string, _col: string): Element {
  for (const c of Array.from(rowEl.children)) {
    if (c.getAttribute('r') === addr) return c;
  }
  const cellEl = doc.createElementNS(SS_NS, 'c');
  cellEl.setAttribute('r', addr);
  // Insert sorted by column (left-to-right)
  const children = Array.from(rowEl.children);
  const next = children.find(c => compareCellAddrs(c.getAttribute('r') || '', addr) > 0);
  if (next) rowEl.insertBefore(cellEl, next);
  else rowEl.appendChild(cellEl);
  return cellEl;
}

function compareCellAddrs(a: string, b: string): number {
  const ma = a.match(/^([A-Z]+)(\d+)$/);
  const mb = b.match(/^([A-Z]+)(\d+)$/);
  if (!ma || !mb) return 0;
  if (ma[1] !== mb[1]) {
    if (ma[1].length !== mb[1].length) return ma[1].length - mb[1].length;
    return ma[1] < mb[1] ? -1 : 1;
  }
  return parseInt(ma[2], 10) - parseInt(mb[2], 10);
}
