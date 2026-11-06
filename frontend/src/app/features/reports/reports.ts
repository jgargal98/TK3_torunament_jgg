import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { errorMessage } from '../../core/api';
import { ParticipantStats, STATUS_LABELS, TournamentSummary } from '../../core/models';
import { ReportApi } from '../../core/report-api';
import { TournamentApi } from '../../core/tournament-api';
import { MatchHistory } from '../../shared/match-history/match-history';

/** Reports page: wins and losses per participant and match history of a tournament. */
@Component({
  selector: 'app-reports',
  imports: [
    DecimalPipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
    MatchHistory,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  private readonly reportApi = inject(ReportApi);
  private readonly tournamentApi = inject(TournamentApi);

  protected readonly stats = signal<ParticipantStats[]>([]);
  /** Tournaments with a bracket: the ones in preparation have no matches to show. */
  protected readonly tournaments = signal<TournamentSummary[]>([]);
  protected readonly selectedTournament = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusLabels = STATUS_LABELS;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      stats: this.reportApi.getParticipantStats(),
      tournaments: this.tournamentApi.getAll(),
    }).subscribe({
      next: ({ stats, tournaments }) => {
        const withBracket = tournaments.filter((t) => t.status !== 'PREPARACION');
        this.stats.set(stats);
        this.tournaments.set(withBracket);
        this.selectedTournament.set(withBracket[0]?.id ?? null);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
