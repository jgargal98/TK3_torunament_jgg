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

/** One box of the bracket tree. Future matches have no id and may have empty slots. */
export interface BracketMatch {
  id: number | null;
  slot1: ParticipantSummary | null;
  slot2: ParticipantSummary | null;
  isBye: boolean;
}

export interface BracketRound {
  number: number;
  name: string;
  matches: BracketMatch[];
}

/**
 * Builds every round of the tree from the stored first round. In phase 2 only round 1
 * exists in the database: the next rounds are drawn empty ("???"), except for the
 * players that went through with a BYE, who already appear in round 2.
 */
export function buildBracket(matches: Match[], participantCount: number): BracketRound[] {
  const rounds = totalRounds(participantCount);
  const firstRound = [...matches]
    .filter((match) => match.round === 1)
    .sort((a, b) => a.position - b.position);
  if (rounds === 0 || firstRound.length === 0) {
    return [];
  }

  const result: BracketRound[] = [
    {
      number: 1,
      name: roundName(1, rounds),
      matches: firstRound.map((match) => ({
        id: match.id,
        slot1: match.participant1,
        slot2: match.participant2,
        isBye: match.is_bye,
      })),
    },
  ];

  for (let round = 2; round <= rounds; round++) {
    const previous = result[round - 2].matches;
    const current: BracketMatch[] = [];
    for (let index = 0; index < previous.length / 2; index++) {
      current.push({
        id: null,
        slot1: winnerOf(previous[2 * index]),
        slot2: winnerOf(previous[2 * index + 1]),
        isBye: false,
      });
    }
    result.push({ number: round, name: roundName(round, rounds), matches: current });
  }
  return result;
}

/** Only BYE matches have a known winner before phase 3. */
function winnerOf(match: BracketMatch): ParticipantSummary | null {
  return match.isBye ? match.slot1 : null;
}
