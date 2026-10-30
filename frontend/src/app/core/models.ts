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
