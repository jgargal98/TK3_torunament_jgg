import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { Participant, ParticipantFilter } from '../../core/models';
import { errorMessage } from '../../core/api';
import { ParticipantApi } from '../../core/participant-api';

@Component({
  selector: 'app-participant-list',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './participant-list.html',
  styleUrl: './participant-list.css',
})
export class ParticipantList implements OnInit {
  private readonly api = inject(ParticipantApi);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly participants = signal<Participant[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  /** Ids of participants whose state change is waiting for the API. */
  protected readonly saving = signal<ReadonlySet<number>>(new Set());

  protected readonly filter = signal<ParticipantFilter>('all');
  protected readonly search = signal('');

  protected readonly activeCount = computed(
    () => this.participants().filter((p) => p.active).length,
  );
  protected readonly inactiveCount = computed(
    () => this.participants().length - this.activeCount(),
  );

  protected readonly visible = computed(() => {
    const text = this.search().trim().toLowerCase();
    return this.participants().filter((p) => {
      const matchesFilter =
        this.filter() === 'all' || (this.filter() === 'active') === p.active;
      return matchesFilter && p.nick.toLowerCase().includes(text);
    });
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.getAll().subscribe({
      next: (participants) => {
        this.participants.set(participants);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }

  protected toggleActive(participant: Participant, event: MatSlideToggleChange): void {
    const active = event.checked;
    this.setSaving(participant.id, true);
    this.api.setActive(participant.id, active).subscribe({
      next: (updated) => {
        this.participants.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
        this.setSaving(participant.id, false);
        this.snackBar.open(
          `${updated.nick} ${updated.active ? 'activado' : 'desactivado'}`,
          'OK',
          { duration: 2500 },
        );
      },
      error: (err) => {
        this.setSaving(participant.id, false);
        // Put the toggle back in the state that is really stored.
        event.source.checked = participant.active;
        this.snackBar.open(errorMessage(err), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private setSaving(id: number, saving: boolean): void {
    this.saving.update((ids) => {
      const next = new Set(ids);
      if (saving) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
