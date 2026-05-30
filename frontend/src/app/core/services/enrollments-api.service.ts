import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CreateEnrollmentPayload {
  studentId: string;
  classId: string;
}

@Injectable({ providedIn: 'root' })
export class EnrollmentsApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/enrollments`;

  create(payload: CreateEnrollmentPayload) {
    return firstValueFrom(this.http.post(this.base, payload));
  }

  setStatus(id: string, status: 'Active' | 'Dropped' | 'Transferred') {
    return firstValueFrom(this.http.patch(`${this.base}/${id}`, { status }));
  }
}
