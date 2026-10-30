import { NgTemplateOutlet } from '@angular/common';
import { Component, input } from '@angular/core';

import { BracketRound } from '../../core/bracket';

/**
 * Draws the KO tree: one column per round, joined with lines. Each pair of matches
 * (2k, 2k+1) is connected to the match k of the next column.
 */
@Component({
  selector: 'app-bracket',
  imports: [NgTemplateOutlet],
  templateUrl: './bracket.html',
  styleUrl: './bracket.css',
})
export class Bracket {
  readonly rounds = input.required<BracketRound[]>();
}
