import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Invoice, InvoiceItem, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private stock = '/api/stock';
  private billing = '/api/billing';
  constructor(private http: HttpClient) {}
  products(): Observable<Product[]> { return this.http.get<Product[]>(`${this.stock}/products`); }
  createProduct(data: Omit<Product, 'id'>): Observable<Product> { return this.http.post<Product>(`${this.stock}/products`, data); }
  invoices(): Observable<Invoice[]> { return this.http.get<Invoice[]>(`${this.billing}/invoices`); }
  createInvoice(items: InvoiceItem[]): Observable<Invoice> { return this.http.post<Invoice>(`${this.billing}/invoices`, { items }); }
  printInvoice(id: number): Observable<Invoice> { return this.http.post<Invoice>(`${this.billing}/invoices/${id}/print`, {}); }
  failNextDebit(): Observable<{message: string}> { return this.http.post<{message: string}>(`${this.stock}/admin/fail-next`, {}); }
}
