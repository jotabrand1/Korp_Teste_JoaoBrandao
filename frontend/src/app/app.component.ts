import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NotificationService } from './core/notification.service';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive], template: `
  <aside class="sidebar">
    <div class="brand"><span class="brand-mark">TT</span><div><strong>Teste Técnico</strong><small>ESTOQUE E FATURAMENTO</small></div></div>
    <nav><a routerLink="/produtos" routerLinkActive="active">▦ <span>Produtos</span></a><a routerLink="/notas" routerLinkActive="active">▤ <span>Notas fiscais</span></a></nav>
    <div class="service-card"><span class="pulse"></span><div><strong>Serviços online</strong><small>Estoque e faturamento</small></div></div>
  </aside>
  <main><header><div><span class="eyebrow">OPERAÇÕES</span><h2>Controle operacional</h2></div><div class="avatar">ET</div></header><router-outlet></router-outlet></main>
  @if (notifications.message(); as note) { <div class="toast" [class]="'toast ' + note.type"><span>{{ note.type === 'success' ? '✓' : note.type === 'error' ? '!' : 'i' }}</span>{{ note.text }}</div> }
  ` })
export class AppComponent { constructor(public notifications: NotificationService) {} }
