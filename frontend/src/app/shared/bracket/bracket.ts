import { NgTemplateOutlet } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { BracketMatch, BracketRound, isPlayable } from '../../core/bracket';
import { ParticipantSummary } from '../../core/models';

export interface WinnerPick {
  matchId: number;
  winner: ParticipantSummary;
  loser: ParticipantSummary;
}

/**
 * Draws the KO tree: one column per round, joined with lines. Each pair of matches
 * (2k, 2k+1) is connected to the match k of the next column. When `interactive` is on,
 * clicking a player of a pending match emits `pick` to register them as the winner.
 */
@Component({
  selector: 'app-bracket',
  imports: [NgTemplateOutlet],
  templateUrl: './bracket.html',
  styleUrl: './bracket.css',
})
export class Bracket {
  readonly rounds = input.required<BracketRound[]>();
  readonly interactive = input(false);
  readonly pick = output<WinnerPick>();

  protected canPick(match: BracketMatch): boolean {
    return this.interactive() && isPlayable(match);
  }

  protected choose(match: BracketMatch, winner: ParticipantSummary): void {
    if (!this.canPick(match) || match.id === null) {
      return;
    }
    const loser = match.slot1?.id === winner.id ? match.slot2 : match.slot1;
    if (loser) {
      this.pick.emit({ matchId: match.id, winner, loser });
    }
  }
}
