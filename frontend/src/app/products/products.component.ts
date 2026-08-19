import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../core/api.service';
import { NotificationService } from '../core/notification.service';
import { Product } from '../models';

@Component({ selector: 'app-products', standalone: true, imports: [FormsModule], template: `
<section class="page-head"><div><h1>Produtos</h1><p>Gerencie o catálogo e acompanhe o saldo disponível.</p></div><button class="primary" (click)="openForm.set(true)">＋ Novo produto</button></section>
<section class="stats"><article><span class="stat-icon mint">▦</span><div><small>PRODUTOS CADASTRADOS</small><strong>{{ products().length }}</strong></div></article><article><span class="stat-icon amber">◒</span><div><small>UNIDADES EM ESTOQUE</small><strong>{{ totalBalance() }}</strong></div></article><article><span class="stat-icon rose">!</span><div><small>ESTOQUE BAIXO</small><strong>{{ lowStock() }}</strong></div></article></section>
<section class="panel"><div class="panel-head"><div><h3>Catálogo de produtos</h3><p>Dados atualizados em tempo real</p></div><button class="icon-btn" (click)="load()">↻</button></div>
@if (loading()) { <div class="empty">Carregando produtos…</div> } @else if (!products().length) { <div class="empty"><b>Seu catálogo está vazio</b><span>Cadastre o primeiro produto para começar.</span></div> } @else { <div class="table-wrap"><table><thead><tr><th>CÓDIGO</th><th>DESCRIÇÃO</th><th>SALDO DISPONÍVEL</th><th>SITUAÇÃO</th></tr></thead><tbody>@for (p of products(); track p.id) {<tr><td><b class="code">{{ p.code }}</b></td><td>{{ p.description }}</td><td><b>{{ p.balance }}</b> un.</td><td><span class="badge" [class.warning]="p.balance <= 3">{{ p.balance <= 3 ? 'Estoque baixo' : 'Disponível' }}</span></td></tr>}</tbody></table></div> }</section>
@if (openForm()) { <div class="overlay" (click)="openForm.set(false)"><form class="modal" (click)="$event.stopPropagation()" (ngSubmit)="save()"><div class="modal-head"><div><span class="eyebrow">NOVO REGISTRO</span><h2>Cadastrar produto</h2></div><button type="button" class="close" (click)="openForm.set(false)">×</button></div><label>Código<input name="code" [(ngModel)]="form.code" required maxlength="30" placeholder="Ex.: PRD-001"></label><label>Descrição<input name="description" [(ngModel)]="form.description" required minlength="2" placeholder="Nome do produto"></label><label>Saldo inicial<input name="balance" [(ngModel)]="form.balance" type="number" min="0" required></label><div class="actions"><button type="button" class="secondary" (click)="openForm.set(false)">Cancelar</button><button class="primary" [disabled]="saving()">{{ saving() ? 'Salvando…' : 'Cadastrar produto' }}</button></div></form></div> }
` })
export class ProductsComponent implements OnInit {
  private api = inject(ApiService); private notes = inject(NotificationService);
  products = signal<Product[]>([]); loading = signal(true); saving = signal(false); openForm = signal(false);
  form = { code: '', description: '', balance: 0 };
  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.api.products().pipe(finalize(() => this.loading.set(false))).subscribe({ next: data => this.products.set(data), error: () => this.products.set([]) }); }
  totalBalance() { return this.products().reduce((sum, p) => sum + p.balance, 0); }
  lowStock() { return this.products().filter(p => p.balance <= 3).length; }
  save() { const balance = Number(this.form.balance); if (!this.form.code.trim() || this.form.description.trim().length < 2 || !Number.isInteger(balance) || balance < 0) { this.notes.show('Preencha código, descrição e um saldo inteiro não negativo.', 'error'); return; } this.saving.set(true); this.api.createProduct({ code: this.form.code.trim(), description: this.form.description.trim(), balance }).pipe(finalize(() => this.saving.set(false))).subscribe({ next: () => { this.notes.show('Produto cadastrado com sucesso.', 'success'); this.form = { code: '', description: '', balance: 0 }; this.openForm.set(false); this.load(); }, error: () => undefined }); }
}
