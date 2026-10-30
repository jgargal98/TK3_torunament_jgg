import { Routes } from '@angular/router';

import { ParticipantForm } from './features/participant-form/participant-form';
import { ParticipantList } from './features/participant-list/participant-list';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'participantes' },
  { path: 'participantes', component: ParticipantList, title: 'Participantes · TK3' },
  { path: 'participantes/nuevo', component: ParticipantForm, title: 'Nuevo participante · TK3' },
  {
    path: 'participantes/:id/editar',
    component: ParticipantForm,
    title: 'Editar participante · TK3',
  },
  { path: '**', redirectTo: 'participantes' },
];
