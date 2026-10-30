import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api';
import { Participant, ParticipantFilter, ParticipantInput } from './models';

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
