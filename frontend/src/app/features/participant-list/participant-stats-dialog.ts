import { DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { errorMessage } from '../../core/api';
import { Participant, ParticipantStats } from '../../core/models';
import { ReportApi } from '../../core/report-api';

/** Statistics of one participant, opened by clicking their card. */
@Component({
  selector: 'app-participant-stats-dialog',
  imports: [DecimalPipe, MatButtonModule, MatDialogModule, MatProgressBarModule],
  template: `
    <h2 mat-dialog-title class="title">
      <span class="logo" aria-hidden="true">{{ participant.logo }}</span>
      <span class="nick">{{ participant.nick }}</span>
    </h2>
    <mat-dialog-content>
      @if (loading()) {
        <mat-progress-bar mode="indeterminate" />
      } @else if (error(); as message) {
        <p class="error">{{ message }}</p>
      } @else if (stats(); as stats) {
        <dl class="stats">
          <div><dt>Combates</dt><dd>{{ stats.matches_played }}</dd></div>
          <div><dt>Victorias</dt><dd class="wins">{{ stats.wins }}</dd></div>
          <div><dt>Derrotas</dt><dd class="losses">{{ stats.losses }}</dd></div>
          <div><dt>% Victorias</dt><dd>{{ stats.win_rate | number: '1.0-1' }}%</dd></div>
          <div><dt>Títulos</dt><dd>{{ stats.tournaments_won }}</dd></div>
        </dl>
        @if (stats.matches_played === 0) {
          <p class="note">Todavía no ha jugado ningún combate. Los BYE no cuentan.</p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close cdkFocusInitial>Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .title {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-top: 20px;
    }
    .title::before {
      display: none;
    }
    .logo {
      display: grid;
      flex: none;
      place-items: center;
      width: 52px;
      height: 52px;
      font-size: 30px;
      background: var(--arcade-cream);
      border: var(--arcade-border);
    }
    .nick {
      min-width: 0;
      font-family: var(--arcade-font);
      font-size: 13px;
      line-height: 1.5;
      word-break: break-word;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
      gap: 10px;
      margin: 0;
    }
    .stats div {
      padding: 10px;
      background: var(--arcade-night);
      border: 2px solid var(--arcade-ink);
    }
    dt {
      font-size: 12px;
      color: var(--arcade-muted-bg);
    }
    dd {
      margin: 6px 0 0;
      font-family: var(--arcade-font);
      font-size: 16px;
      color: var(--arcade-cyan);
    }
    dd.wins {
      color: var(--arcade-lime);
    }
    dd.losses {
      color: var(--arcade-pink);
    }
    .note {
      margin: 12px 0 0;
      font-weight: 700;
    }
    .error {
      margin: 0;
      font-weight: 700;
      color: #c2185b;
    }
    mat-dialog-actions {
      padding: 8px 24px 20px;
    }
  `,
})
export class ParticipantStatsDialog implements OnInit {
  private readonly api = inject(ReportApi);

  protected readonly participant = inject<Participant>(MAT_DIALOG_DATA);
  protected readonly stats = signal<ParticipantStats | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.getStatsOfParticipant(this.participant.id).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
