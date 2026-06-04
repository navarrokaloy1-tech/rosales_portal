import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subject } from '../models/models';

export interface CreateSubjectPayload {
  code: string;
  name: string;
  classId: string;
  teacherId?: string;   // Admin-only — teachers always self-assign on the backend
  units?: number;
}

export interface UpdateSubjectPayload {
  code?: string;
  name?: string;
  classId?: string;
  teacherId?: string;
  units?: number;
}

@Injectable({ providedIn: 'root' })
export class SubjectsApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/subjects`;

  list(filters?: { classId?: string; teacherId?: string }): Promise<Subject[]> {
    let params = new HttpParams();
    if (filters?.classId) params = params.set('classId', filters.classId);
    if (filters?.teacherId) params = params.set('teacherId', filters.teacherId);
    return firstValueFrom(this.http.get<Subject[]>(this.base, { params }));
  }

  create(payload: CreateSubjectPayload): Promise<Subject> {
    return firstValueFrom(this.http.post<Subject>(this.base, payload));
  }

  update(id: string, payload: UpdateSubjectPayload): Promise<Subject> {
    return firstValueFrom(this.http.patch<Subject>(`${this.base}/${id}`, payload));
  }

  delete(id: string): Promise<{ ok: true }> {
    return firstValueFrom(this.http.delete<{ ok: true }>(`${this.base}/${id}`));
  }
}
