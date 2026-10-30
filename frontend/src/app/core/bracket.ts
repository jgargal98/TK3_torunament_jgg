import { Match, ParticipantSummary } from './models';

/** Same rule as the backend: rounds needed to get a champion (6 players -> 3 rounds). */
export function totalRounds(participantCount: number): number {
  return participantCount >= 2 ? Math.ceil(Math.log2(participantCount)) : 0;
}

/** Empty slots of the bracket that become BYEs (6 players in 8 slots -> 2 BYEs). */
export function byeCount(participantCount: number): number {
  return participantCount >= 2 ? 2 ** totalRounds(participantCount) - participantCount : 0;
}

export function roundName(round: number, rounds: number): string {
  const matchesInRound = 2 ** (rounds - round);
  const names: Record<number, string> = {
    1: 'Final',
    2: 'Semifinales',
    4: 'Cuartos',
    8: 'Octavos',
  };
  return names[matchesInRound] ?? `Ronda ${round}`;
}

/** One box of the bracket tree. Matches not created yet have no id. */
export interface BracketMatch {
  id: number | null;
  slot1: ParticipantSummary | null;
  slot2: ParticipantSummary | null;
  winnerId: number | null;
  isBye: boolean;
}

export interface BracketRound {
  number: number;
  name: string;
  matches: BracketMatch[];
}

/** A match can be played when it exists, has both players and no winner yet. */
export function isPlayable(match: BracketMatch): boolean {
  return match.id !== null && !match.isBye && !!match.slot1 && !!match.slot2 && !match.winnerId;
}

/**
 * Builds every round of the tree. Rounds already stored in the database are shown as
 * they are; the next ones are projected from the known winners (BYEs or played
 * matches) and the rest is drawn empty ("???").
 */
export function buildBracket(matches: Match[], participantCount: number): BracketRound[] {
  const rounds = totalRounds(participantCount);
  if (rounds === 0 || matches.length === 0) {
    return [];
  }

  const result: BracketRound[] = [];
  for (let round = 1; round <= rounds; round++) {
    const stored = matches
      .filter((match) => match.round === round)
      .sort((a, b) => a.position - b.position);

    const roundMatches: BracketMatch[] =
      stored.length > 0
        ? stored.map((match) => ({
            id: match.id,
            slot1: match.participant1,
            slot2: match.participant2,
            winnerId: match.winner_id,
            isBye: match.is_bye,
          }))
        : projectNextRound(result[round - 2].matches);

    result.push({ number: round, name: roundName(round, rounds), matches: roundMatches });
  }
  return result;
}

/** Matches 2k and 2k+1 of a round feed match k of the next one. */
function projectNextRound(previous: BracketMatch[]): BracketMatch[] {
  const next: BracketMatch[] = [];
  for (let index = 0; index < previous.length / 2; index++) {
    next.push({
      id: null,
      slot1: winnerOf(previous[2 * index]),
      slot2: winnerOf(previous[2 * index + 1]),
      winnerId: null,
      isBye: false,
    });
  }
  return next;
}

function winnerOf(match: BracketMatch): ParticipantSummary | null {
  if (match.winnerId === null) {
    return null;
  }
  return match.slot1?.id === match.winnerId ? match.slot1 : match.slot2;
}
