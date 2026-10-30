import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { ParticipantInput } from '../../core/models';
import { ParticipantApi, errorMessage } from '../../core/participant-api';

/** Emojis offered as logos. The user can also type any other emoji. */
export const LOGO_OPTIONS = [
  '🦊', '🐺', '🦁', '🐯', '🐻', '🐼', '🦅', '🦈',
  '🐉', '🦄', '🐙', '🦂', '🐍', '🦖', '🐝', '🦉',
  '🔥', '⚡', '❄️', '🌪️', '☄️', '🌙', '⭐', '💎',
  '👑', '🗡️', '🛡️', '🏹', '🎯', '🤖', '👾', '💀',
];

/** Creates a participant, or edits it when the route has an :id. */
@Component({
  selector: 'app-participant-form',
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
  templateUrl: './participant-form.html',
  styleUrl: './participant-form.css',
})
export class ParticipantForm implements OnInit {
  private readonly api = inject(ParticipantApi);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  /** Route parameter (bound thanks to withComponentInputBinding). Empty when creating. */
  readonly id = input<string>();

  protected readonly logoOptions = LOGO_OPTIONS;
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nick: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40)]],
    logo: [LOGO_OPTIONS[0], [Validators.required, Validators.maxLength(16)]],
  });

  protected get isEdit(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    if (this.isEdit) {
      this.loadParticipant(Number(this.id()));
    }
  }

  protected selectLogo(logo: string): void {
    this.form.controls.logo.setValue(logo);
    this.form.controls.logo.markAsDirty();
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const data: ParticipantInput = {
      nick: this.form.controls.nick.value.trim(),
      logo: this.form.controls.logo.value.trim(),
    };
    const request = this.isEdit
      ? this.api.update(Number(this.id()), data)
      : this.api.create(data);

    this.saving.set(true);
    request.subscribe({
      next: (participant) => {
        this.snackBar.open(
          `${participant.nick} ${this.isEdit ? 'actualizado' : 'creado'}`,
          'OK',
          { duration: 2500 },
        );
        this.router.navigate(['/participantes']);
      },
      error: (err) => {
        this.saving.set(false);
        this.snackBar.open(errorMessage(err), 'Cerrar', { duration: 5000 });
      },
    });
  }

  private loadParticipant(id: number): void {
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (participant) => {
        this.form.setValue({ nick: participant.nick, logo: participant.logo });
        this.loading.set(false);
      },
      error: (err) => {
        this.loadError.set(errorMessage(err));
        this.loading.set(false);
      },
    });
  }
}
