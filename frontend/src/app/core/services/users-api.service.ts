import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

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

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/users`;

  createTeacher(payload: CreateTeacherPayload): Promise<User> {
    return firstValueFrom(this.http.post<User>(`${this.base}/teachers`, payload));
  }

  createStudent(payload: CreateStudentPayload): Promise<User> {
    return firstValueFrom(this.http.post<User>(`${this.base}/students`, payload));
  }
}
