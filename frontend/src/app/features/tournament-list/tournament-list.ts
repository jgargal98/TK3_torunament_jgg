import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';

import { errorMessage } from '../../core/api';
import { TournamentSummary } from '../../core/models';
import { TournamentApi } from '../../core/tournament-api';

/** How many logos are shown on each card before "+N". */
const MAX_LOGOS = 8;

@Component({
  selector: 'app-tournament-list',
  imports: [DatePipe, RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  templateUrl: './tournament-list.html',
  styleUrl: './tournament-list.css',
})
export class TournamentList implements OnInit {
  private readonly api = inject(TournamentApi);

  protected readonly tournaments = signal<TournamentSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly maxLogos = MAX_LOGOS;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAll().subscribe({
      next: (tournaments) => {
        this.tournaments.set(tournaments);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
