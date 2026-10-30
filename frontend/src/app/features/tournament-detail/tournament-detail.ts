import { DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { filter, forkJoin, switchMap, timer } from 'rxjs';

import { errorMessage } from '../../core/api';
import { buildBracket } from '../../core/bracket';
import { TournamentDetail as Tournament } from '../../core/models';
import { TournamentApi } from '../../core/tournament-api';
import { Bracket } from '../../shared/bracket/bracket';
import { ConfirmDialog, ConfirmDialogData } from '../../shared/confirm-dialog/confirm-dialog';

/** Minimum time the draw animation is shown, even if the API answers sooner. */
const DRAW_ANIMATION_MS = 1600;
const REEL_COUNT = 3;

@Component({
  selector: 'app-tournament-detail',
  imports: [
    DatePipe,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    Bracket,
  ],
  templateUrl: './tournament-detail.html',
  styleUrl: './tournament-detail.css',
})
export class TournamentDetail implements OnInit {
  private readonly api = inject(TournamentApi);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** Route parameter (bound thanks to withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly tournament = signal<Tournament | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly busy = signal(false);

  /** Draw animation: logos spinning like a slot machine while the server shuffles. */
  protected readonly drawing = signal(false);
  protected readonly reels = signal<string[]>([]);

  protected readonly isPreparation = computed(() => this.tournament()?.status === 'PREPARACION');
  protected readonly inactivePlayers = computed(
    () => this.tournament()?.participants.filter((p) => !p.active) ?? [],
  );
  protected readonly rounds = computed(() => {
    const tournament = this.tournament();
    return tournament ? buildBracket(tournament.matches, tournament.participant_count) : [];
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getById(Number(this.id())).subscribe({
      next: (tournament) => {
        this.tournament.set(tournament);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected generateBracket(): void {
    const tournament = this.tournament();
    if (!tournament) {
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const stopReels = reducedMotion ? () => {} : this.spinReels(tournament);

    this.busy.set(true);
    this.drawing.set(true);
    forkJoin([
      this.api.generateBracket(tournament.id),
      timer(reducedMotion ? 0 : DRAW_ANIMATION_MS),
    ]).subscribe({
      next: ([updated]) => {
        stopReels();
        this.drawing.set(false);
        this.busy.set(false);
        this.tournament.set(updated);
        this.snackBar.open('¡Cuadro generado!', 'OK', { duration: 2500 });
      },
      error: (err) => {
        stopReels();
        this.drawing.set(false);
        this.busy.set(false);
        this.snackBar.open(errorMessage(err), 'Cerrar', { duration: 6000 });
      },
    });
  }

  protected confirmDelete(): void {
    const tournament = this.tournament();
    if (!tournament) {
      return;
    }
    this.dialog
      .open<ConfirmDialog, ConfirmDialogData, boolean>(ConfirmDialog, {
        data: {
          title: '¿Eliminar torneo?',
          message: `Se eliminará «${tournament.name}». Los participantes no se borran.`,
          confirmLabel: 'Eliminar',
        },
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => {
          this.busy.set(true);
          return this.api.delete(tournament.id);
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open(`${tournament.name} eliminado`, 'OK', { duration: 2500 });
          this.router.navigate(['/torneos']);
        },
        error: (err) => {
          this.busy.set(false);
          this.snackBar.open(errorMessage(err), 'Cerrar', { duration: 5000 });
        },
      });
  }

  /** Changes the reels to random logos every few ms. Returns the function that stops them. */
  private spinReels(tournament: Tournament): () => void {
    const logos = tournament.participants.map((p) => p.logo);
    const randomLogo = () => logos[Math.floor(Math.random() * logos.length)];
    const spin = () => this.reels.set(Array.from({ length: REEL_COUNT }, randomLogo));
    spin();
    const interval = setInterval(spin, 90);
    const stop = () => clearInterval(interval);
    this.destroyRef.onDestroy(stop);
    return stop;
  }
}
