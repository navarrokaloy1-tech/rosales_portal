import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MarkAttendanceDto } from './dto';

type Requester = { id: string; role: Role };

/** Parse a "YYYY-MM-DD" string into a UTC-midnight Date (matches the @db.Date column). */
function toDateOnly(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (isNaN(d.getTime())) throw new BadRequestException('Invalid date');
  return d;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /** List attendance records, scoped by role. Students may only read their own. */
  async list(
    requester: Requester,
    filters: { subjectId?: string; studentId?: string; date?: string },
  ) {
    let studentId = filters.studentId;
    if (requester.role === Role.Student) {
      studentId = requester.id; // students are locked to their own records
    }

    return this.prisma.attendance.findMany({
      where: {
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(studentId ? { studentId } : {}),
        ...(filters.date ? { date: toDateOnly(filters.date) } : {}),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, lrn: true, studentId: true },
        },
        subject: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ date: 'desc' }, { student: { lastName: 'asc' } }],
    });
  }

  /** Bulk upsert attendance for one subject on one date. Teacher must own the subject. */
  async mark(requester: Requester, dto: MarkAttendanceDto) {
    const subject = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
      select: { id: true, teacherId: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');
    if (requester.role === Role.Teacher && subject.teacherId !== requester.id) {
      throw new ForbiddenException('You can only mark attendance for your own subjects');
    }

    const date = toDateOnly(dto.date);

    // Only allow marking students actually enrolled in the subject's class.
    const subjectClass = await this.prisma.subject.findUnique({
      where: { id: dto.subjectId },
      select: { classId: true },
    });
    const enrolled = await this.prisma.enrollment.findMany({
      where: { classId: subjectClass!.classId, status: 'Active' },
      select: { studentId: true },
    });
    const enrolledIds = new Set(enrolled.map(e => e.studentId));

    const valid = dto.entries.filter(e => enrolledIds.has(e.studentId));
    if (valid.length === 0) {
      throw new BadRequestException('No valid enrolled students in the submitted list');
    }

    await this.prisma.$transaction(
      valid.map(e =>
        this.prisma.attendance.upsert({
          where: {
            subjectId_studentId_date: {
              subjectId: dto.subjectId,
              studentId: e.studentId,
              date,
            },
          },
          create: {
            subjectId: dto.subjectId,
            studentId: e.studentId,
            date,
            status: e.status,
            remarks: e.remarks ?? null,
            markedById: requester.id,
          },
          update: {
            status: e.status,
            remarks: e.remarks ?? null,
            markedById: requester.id,
          },
        }),
      ),
    );

    return { ok: true, count: valid.length };
  }

  /** Per-subject attendance summary for a student. Students may only read their own. */
  async summary(requester: Requester, studentIdParam?: string) {
    const studentId =
      requester.role === Role.Student ? requester.id : studentIdParam;
    if (!studentId) throw new BadRequestException('studentId is required');

    const records = await this.prisma.attendance.findMany({
      where: { studentId },
      include: { subject: { select: { id: true, code: true, name: true } } },
      orderBy: { date: 'desc' },
    });

    const bySubject = new Map<
      string,
      {
        subjectId: string;
        code: string;
        name: string;
        present: number;
        absent: number;
        late: number;
        excused: number;
        total: number;
      }
    >();

    for (const r of records) {
      const key = r.subjectId;
      const row =
        bySubject.get(key) ??
        {
          subjectId: r.subjectId,
          code: r.subject.code,
          name: r.subject.name,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
        };
      row.total++;
      if (r.status === AttendanceStatus.Present) row.present++;
      else if (r.status === AttendanceStatus.Absent) row.absent++;
      else if (r.status === AttendanceStatus.Late) row.late++;
      else if (r.status === AttendanceStatus.Excused) row.excused++;
      bySubject.set(key, row);
    }

    return Array.from(bySubject.values()).map(row => ({
      ...row,
      // Attendance rate: present + late (late still attended) over total.
      rate: row.total === 0 ? null : Math.round(((row.present + row.late) / row.total) * 1000) / 10,
    }));
  }
}
