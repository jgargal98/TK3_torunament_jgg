import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { errorMessage } from '../../core/api';
import { byeCount, totalRounds } from '../../core/bracket';
import { Participant, TournamentDetail } from '../../core/models';
import { ParticipantApi } from '../../core/participant-api';
import { TournamentApi } from '../../core/tournament-api';

type Step = 1 | 2 | 3;

/**
 * Three-step wizard to create a tournament (or edit it while it is in preparation):
 * 1) name, 2) "character select" with the active participants, 3) summary.
 */
@Component({
  selector: 'app-tournament-wizard',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  templateUrl: './tournament-wizard.html',
  styleUrl: './tournament-wizard.css',
})
export class TournamentWizard implements OnInit {
  private readonly participantApi = inject(ParticipantApi);
  private readonly tournamentApi = inject(TournamentApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Route parameter (bound thanks to withComponentInputBinding). Empty when creating. */
  readonly id = input<string>();

  protected readonly steps: { number: Step; label: string }[] = [
    { number: 1, label: 'Nombre' },
    { number: 2, label: 'Jugadores' },
    { number: 3, label: '¿Listos?' },
  ];
  protected readonly step = signal<Step>(1);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3), Validators.maxLength(80)],
  });
  private readonly nameValue = toSignal(this.name.valueChanges, { initialValue: '' });

  /** Only active participants can be chosen. */
  protected readonly available = signal<Participant[]>([]);
  protected readonly selectedIds = signal<ReadonlySet<number>>(new Set());

  protected readonly selected = computed(() =>
    this.available().filter((p) => this.selectedIds().has(p.id)),
  );
  protected readonly count = computed(() => this.selectedIds().size);
  protected readonly rounds = computed(() => totalRounds(this.count()));
  protected readonly byes = computed(() => byeCount(this.count()));
  protected readonly firstRoundMatches = computed(() =>
    this.count() >= 2 ? 2 ** (this.rounds() - 1) : 0,
  );
  protected readonly trimmedName = computed(() => this.nameValue().trim());

  protected get isEdit(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const tournament$ = this.isEdit
      ? this.tournamentApi.getById(Number(this.id()))
      : of<TournamentDetail | null>(null);

    forkJoin({ participants: this.participantApi.getAll('active'), tournament: tournament$ })
      .subscribe({
        next: ({ participants, tournament }) => {
          this.available.set(participants);
          if (tournament) {
            this.name.setValue(tournament.name);
            const activeIds = new Set(participants.map((p) => p.id));
            // Players deactivated after joining are dropped: they cannot take part anymore.
            this.selectedIds.set(
              new Set(tournament.participants.map((p) => p.id).filter((id) => activeIds.has(id))),
            );
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.loadError.set(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  protected toggle(participant: Participant): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(participant.id)) {
        next.delete(participant.id);
      } else {
        next.add(participant.id);
      }
      return next;
    });
  }

  protected selectAll(): void {
    this.selectedIds.set(new Set(this.available().map((p) => p.id)));
  }

  protected selectNone(): void {
    this.selectedIds.set(new Set());
  }

  protected canGoTo(step: Step): boolean {
    if (step >= 2 && this.name.invalid) {
      return false;
    }
    if (step >= 3 && this.count() < 2) {
      return false;
    }
    return true;
  }

  protected goTo(step: Step): void {
    if (step === 2 && this.name.invalid) {
      this.name.markAsTouched();
      return;
    }
    if (this.canGoTo(step)) {
      this.step.set(step);
    }
  }

  protected save(): void {
    const data = { name: this.trimmedName(), participant_ids: [...this.selectedIds()] };
    const request = this.isEdit
      ? this.tournamentApi.update(Number(this.id()), data)
      : this.tournamentApi.create(data);

    this.saving.set(true);
    request.subscribe({
      next: (tournament) => {
        this.snackBar.open(
          `${tournament.name} ${this.isEdit ? 'actualizado' : 'creado'}`,
          'OK',
          { duration: 2500 },
        );
        this.router.navigate(['/torneos', tournament.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(errorMessage(err), 'Cerrar', { duration: 5000 });
      },
    });
  }
}
