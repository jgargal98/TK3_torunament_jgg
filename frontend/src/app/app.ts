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
      <a routerLink="/" class="brand">
        <mat-icon>emoji_events</mat-icon>
        <span>TK3 · KO Tournament Manager</span>
      </a>
      <span class="spacer"></span>
      <a mat-button routerLink="/participantes" routerLinkActive="active-link">
        <mat-icon>groups</mat-icon>
        Participantes
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
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      gap: 8px;
    }
    .toolbar a[mat-button] {
      color: var(--mat-sys-on-primary);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      color: inherit;
      text-decoration: none;
      font-weight: 500;
    }
    .spacer {
      flex: 1;
    }
    .active-link {
      background: color-mix(in srgb, var(--mat-sys-on-primary) 16%, transparent);
    }
    .content {
      max-width: 1100px;
      margin: 0 auto;
      padding: 24px 16px 48px;
    }
    @media (max-width: 600px) {
      .brand span {
        display: none;
      }
    }
  `,
})
export class App {}
