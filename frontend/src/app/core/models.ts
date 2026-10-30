/** Participant as returned by the API (GET /api/participants). */
export interface Participant {
  id: number;
  nick: string;
  /** Emoji used as the participant's logo. */
  logo: string;
  active: boolean;
  created_at: string;
}

/** Body sent to create or edit a participant. */
export interface ParticipantInput {
  nick: string;
  logo: string;
}

export type ParticipantFilter = 'all' | 'active' | 'inactive';

/** Short version of a participant used inside tournaments and matches. */
export type ParticipantSummary = Pick<Participant, 'id' | 'nick' | 'logo' | 'active'>;

/**
 * PREPARACION: players can still be changed. GENERADO: the draw is done.
 * EN_CURSO: at least one result. FINALIZADO: there is a champion, no more changes.
 */
export type TournamentStatus = 'PREPARACION' | 'GENERADO' | 'EN_CURSO' | 'FINALIZADO';

export const STATUS_LABELS: Record<TournamentStatus, string> = {
  PREPARACION: 'Preparación',
  GENERADO: 'Cuadro generado',
  EN_CURSO: 'En curso',
  FINALIZADO: 'Finalizado',
};

export interface Match {
  id: number;
  round: number;
  /** Order inside the round: matches 2k and 2k+1 feed match k of the next round. */
  position: number;
  participant1: ParticipantSummary | null;
  /** Null when the match is a BYE. */
  participant2: ParticipantSummary | null;
  winner_id: number | null;
  is_bye: boolean;
  resolved_at: string | null;
}

/** Tournament as shown in the list (GET /api/tournaments). */
export interface TournamentSummary {
  id: number;
  name: string;
  status: TournamentStatus;
  created_at: string;
  bracket_generated_at: string | null;
  finished_at: string | null;
  participant_count: number;
  total_rounds: number;
  bye_count: number;
  /** Last round created so far (null before the draw). */
  current_round: number | null;
  pending_matches: number;
  logos: string[];
  champion: ParticipantSummary | null;
}

/** Full tournament with its players and every match created so far. */
export interface TournamentDetail extends TournamentSummary {
  participants: ParticipantSummary[];
  matches: Match[];
}

/** Body sent to create or edit a tournament. */
export interface TournamentInput {
  name: string;
  participant_ids: number[];
}
