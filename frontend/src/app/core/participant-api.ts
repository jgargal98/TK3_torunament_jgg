import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { Participant, ParticipantFilter, ParticipantInput } from './models';

/** Base URL of the backend. The dev server proxies /api to http://localhost:8000. */
export const API_BASE_URL = '/api';

/** Centralizes every call to the participants endpoints of the Python API. */
@Injectable({ providedIn: 'root' })
export class ParticipantApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/participants`;

  getAll(filter: ParticipantFilter = 'all'): Observable<Participant[]> {
    let params = new HttpParams();
    if (filter !== 'all') {
      params = params.set('active', filter === 'active');
    }
    return this.http.get<Participant[]>(this.url, { params });
  }

  getById(id: number): Observable<Participant> {
    return this.http.get<Participant>(`${this.url}/${id}`);
  }

  create(data: ParticipantInput): Observable<Participant> {
    return this.http.post<Participant>(this.url, data);
  }

  update(id: number, data: ParticipantInput): Observable<Participant> {
    return this.http.put<Participant>(`${this.url}/${id}`, data);
  }

  setActive(id: number, active: boolean): Observable<Participant> {
    return this.http.patch<Participant>(`${this.url}/${id}/active`, { active });
  }
}

/** Turns an HTTP error into a readable message, using FastAPI's `detail` when present. */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0 || error.status === 504) {
      return 'No se puede conectar con el backend. ¿Está arrancado en el puerto 8000?';
    }
    const detail = error.error?.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail.map((item) => item.msg).join('. ');
    }
    return `Error ${error.status}: ${error.statusText}`;
  }
  return 'Error inesperado';
}
