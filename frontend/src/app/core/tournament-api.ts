import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api';
import { TournamentDetail, TournamentInput, TournamentSummary } from './models';

/** Centralizes every call to the tournaments endpoints of the Python API. */
@Injectable({ providedIn: 'root' })
export class TournamentApi {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/tournaments`;

  getAll(): Observable<TournamentSummary[]> {
    return this.http.get<TournamentSummary[]>(this.url);
  }

  getById(id: number): Observable<TournamentDetail> {
    return this.http.get<TournamentDetail>(`${this.url}/${id}`);
  }

  create(data: TournamentInput): Observable<TournamentDetail> {
    return this.http.post<TournamentDetail>(this.url, data);
  }

  update(id: number, data: TournamentInput): Observable<TournamentDetail> {
    return this.http.put<TournamentDetail>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Runs the random draw on the server and returns the tournament with its first round. */
  generateBracket(id: number): Observable<TournamentDetail> {
    return this.http.post<TournamentDetail>(`${this.url}/${id}/bracket`, {});
  }
}
