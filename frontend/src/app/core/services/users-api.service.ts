import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, User } from '../models/models';

export interface CreateTeacherPayload {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarColor?: string;
}

export interface CreateStudentPayload {
  studentId: string;
  lrn?: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarColor?: string;
}

export interface BulkRowResult {
  row: number;
  name: string;
  status: 'created' | 'failed';
  defaultPassword?: string;
  error?: string;
}

export interface BulkResult {
  created: number;
  failed: number;
  results: BulkRowResult[];
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  list(role?: Role): Promise<User[]> {
    const params = role ? new HttpParams().set('role', role) : undefined;
    return firstValueFrom(this.http.get<User[]>(this.base, { params }));
  }

  createTeacher(payload: CreateTeacherPayload): Promise<User> {
    return firstValueFrom(this.http.post<User>(`${this.base}/teachers`, payload));
  }

  createStudent(payload: CreateStudentPayload): Promise<User> {
    return firstValueFrom(this.http.post<User>(`${this.base}/students`, payload));
  }

  bulkCreateTeachers(rows: CreateTeacherPayload[]): Promise<BulkResult> {
    return firstValueFrom(this.http.post<BulkResult>(`${this.base}/teachers/bulk`, { rows }));
  }

  bulkCreateStudents(rows: CreateStudentPayload[]): Promise<BulkResult> {
    return firstValueFrom(this.http.post<BulkResult>(`${this.base}/students/bulk`, { rows }));
  }
}
