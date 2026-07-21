import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AttendanceRecord, AttendanceStatus, AttendanceSummaryRow } from '../models/models';

export interface AttendanceEntryPayload {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface MarkAttendancePayload {
  subjectId: string;
  date: string;               // "YYYY-MM-DD"
  entries: AttendanceEntryPayload[];
}

@Injectable({ providedIn: 'root' })
export class AttendanceApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/attendance`;

  list(filters: { subjectId?: string; studentId?: string; date?: string }): Promise<AttendanceRecord[]> {
    let params = new HttpParams();
    if (filters.subjectId) params = params.set('subjectId', filters.subjectId);
    if (filters.studentId) params = params.set('studentId', filters.studentId);
    if (filters.date) params = params.set('date', filters.date);
    return firstValueFrom(this.http.get<AttendanceRecord[]>(this.base, { params }));
  }

  summary(studentId?: string): Promise<AttendanceSummaryRow[]> {
    const params = studentId ? new HttpParams().set('studentId', studentId) : undefined;
    return firstValueFrom(this.http.get<AttendanceSummaryRow[]>(`${this.base}/summary`, { params }));
  }

  mark(payload: MarkAttendancePayload): Promise<{ ok: boolean; count: number }> {
    return firstValueFrom(this.http.post<{ ok: boolean; count: number }>(this.base, payload));
  }
}
