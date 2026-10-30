import { Routes } from '@angular/router';

import { ParticipantForm } from './features/participant-form/participant-form';
import { ParticipantList } from './features/participant-list/participant-list';
import { TournamentDetail } from './features/tournament-detail/tournament-detail';
import { TournamentList } from './features/tournament-list/tournament-list';
import { TournamentWizard } from './features/tournament-wizard/tournament-wizard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'participantes' },
  { path: 'participantes', component: ParticipantList, title: 'Participantes · TK3' },
  { path: 'participantes/nuevo', component: ParticipantForm, title: 'Nuevo participante · TK3' },
  {
    path: 'participantes/:id/editar',
    component: ParticipantForm,
    title: 'Editar participante · TK3',
  },
  { path: 'torneos', component: TournamentList, title: 'Torneos · TK3' },
  { path: 'torneos/nuevo', component: TournamentWizard, title: 'Nuevo torneo · TK3' },
  { path: 'torneos/:id', component: TournamentDetail, title: 'Torneo · TK3' },
  { path: 'torneos/:id/editar', component: TournamentWizard, title: 'Editar torneo · TK3' },
  { path: '**', redirectTo: 'participantes' },
];
