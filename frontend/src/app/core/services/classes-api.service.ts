import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

export interface ClassListItem {
  id: string;
  name: string;
  gradeLevel: number;
  section: string;
  schoolYear: string;
  adviserId: string;
  adviser: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  _count: { enrollments: number; subjects: number };
}

export interface ClassDetail {
  id: string;
  name: string;
  gradeLevel: number;
  section: string;
  schoolYear: string;
  adviserId: string;
  adviser: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarColor'>;
  subjects: Array<{
    id: string;
    code: string;
    name: string;
    teacherId: string;
    teacher: Pick<User, 'id' | 'firstName' | 'lastName'>;
  }>;
  enrollments: Array<{
    id: string;
    status: string;
    student: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'avatarColor'> & { lrn?: string | null; studentId?: string | null };
  }>;
}

export interface CreateClassPayload {
  name: string;
  gradeLevel: number;
  section: string;
  schoolYear: string;
  adviserId: string;
}

export interface UpdateClassPayload {
  name?: string;
  gradeLevel?: number;
  section?: string;
  schoolYear?: string;
  adviserId?: string;
}

@Injectable({ providedIn: 'root' })
export class ClassesApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/classes`;

  list(): Promise<ClassListItem[]> {
    return firstValueFrom(this.http.get<ClassListItem[]>(this.base));
  }

  get(id: string): Promise<ClassDetail> {
    return firstValueFrom(this.http.get<ClassDetail>(`${this.base}/${id}`));
  }

  create(payload: CreateClassPayload): Promise<ClassListItem> {
    return firstValueFrom(this.http.post<ClassListItem>(this.base, payload));
  }

  update(id: string, payload: UpdateClassPayload): Promise<ClassListItem> {
    return firstValueFrom(this.http.patch<ClassListItem>(`${this.base}/${id}`, payload));
  }
}
