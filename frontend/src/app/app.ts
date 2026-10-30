import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar class="toolbar">
      <a routerLink="/" class="brand" aria-label="TK3 KO Tournament Manager, inicio">
        <span class="brand-mark">TK3</span>
        <span class="brand-ko">KO!</span>
        <span class="brand-sub">Tournament Manager</span>
      </a>
      <span class="spacer"></span>
      <a routerLink="/participantes" routerLinkActive="active" class="nav-link">
        <mat-icon>groups</mat-icon>
        <span>Participantes</span>
      </a>
    </mat-toolbar>

    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: `
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      height: 72px;
      gap: 12px;
      background: var(--arcade-yellow);
      color: var(--arcade-ink);
      border-bottom: var(--arcade-border);
    }
    .brand {
      display: flex;
      align-items: baseline;
      gap: 10px;
      color: inherit;
      text-decoration: none;
      font-family: var(--arcade-font);
    }
    .brand-mark {
      padding: 6px 8px;
      font-size: 16px;
      background: var(--arcade-ink);
      color: var(--arcade-yellow);
    }
    .brand-ko {
      font-size: 16px;
      color: var(--arcade-pink);
      text-shadow: 2px 2px 0 var(--arcade-ink);
    }
    .brand-sub {
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .spacer {
      flex: 1;
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-family: var(--arcade-font);
      font-size: 10px;
      color: var(--arcade-ink);
      text-decoration: none;
      border: 3px solid transparent;
    }
    .nav-link:hover {
      border-color: var(--arcade-ink);
    }
    .nav-link.active {
      background: var(--arcade-paper);
      border-color: var(--arcade-ink);
      box-shadow: 3px 3px 0 var(--arcade-ink);
    }
    .content {
      max-width: 1100px;
      margin: 0 auto;
      padding: 32px 16px 64px;
    }
    @media (max-width: 700px) {
      .brand-sub,
      .nav-link span {
        display: none;
      }
    }
  `,
})
export class App {}
