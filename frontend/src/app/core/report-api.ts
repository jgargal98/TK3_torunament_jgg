import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from './api';
import { MatchHistoryItem, ParticipantStats } from './models';

/** Centralizes every call to the reports endpoints of the Python API. */
@Injectable({ providedIn: 'root' })
export class ReportApi {
  private readonly http = inject(HttpClient);

  getParticipantStats(): Observable<ParticipantStats[]> {
    return this.http.get<ParticipantStats[]>(`${API_BASE_URL}/stats/participants`);
  }

  getTournamentHistory(tournamentId: number): Observable<MatchHistoryItem[]> {
    return this.http.get<MatchHistoryItem[]>(`${API_BASE_URL}/tournaments/${tournamentId}/history`);
  }
}
