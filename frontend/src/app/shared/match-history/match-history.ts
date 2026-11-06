import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subscription } from 'rxjs';

import { errorMessage } from '../../core/api';
import { MatchHistoryItem } from '../../core/models';
import { ReportApi } from '../../core/report-api';

/**
 * Matches played in a tournament. Used in the tournament page and in the reports page.
 * It reloads when the tournament changes or when `refreshKey` changes (a new result).
 */
@Component({
  selector: 'app-match-history',
  imports: [DatePipe, MatProgressBarModule],
  templateUrl: './match-history.html',
  styleUrl: './match-history.css',
})
export class MatchHistory {
  private readonly api = inject(ReportApi);
  private request?: Subscription;

  readonly tournamentId = input.required<number>();
  readonly refreshKey = input(0);

  protected readonly matches = signal<MatchHistoryItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.refreshKey();
      this.load(this.tournamentId());
    });
  }

  private load(tournamentId: number): void {
    // Only the latest request counts if the user changes tournament quickly.
    this.request?.unsubscribe();
    this.error.set(null);
    this.request = this.api.getTournamentHistory(tournamentId).subscribe({
      next: (matches) => {
        this.matches.set(matches);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
