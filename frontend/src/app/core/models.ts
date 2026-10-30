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

/** PREPARACION: players can still be changed. GENERADO: the draw is done. */
export type TournamentStatus = 'PREPARACION' | 'GENERADO';

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
}

/** Tournament as shown in the list (GET /api/tournaments). */
export interface TournamentSummary {
  id: number;
  name: string;
  status: TournamentStatus;
  created_at: string;
  bracket_generated_at: string | null;
  participant_count: number;
  total_rounds: number;
  bye_count: number;
  logos: string[];
}

/** Full tournament with its players and first-round matches. */
export interface TournamentDetail extends TournamentSummary {
  participants: ParticipantSummary[];
  matches: Match[];
}

/** Body sent to create or edit a tournament. */
export interface TournamentInput {
  name: string;
  participant_ids: number[];
}
