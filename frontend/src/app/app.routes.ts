import { Routes } from '@angular/router';
import { ProductsComponent } from './products/products.component';
import { InvoicesComponent } from './invoices/invoices.component';
export const routes: Routes = [{ path: '', pathMatch: 'full', redirectTo: 'produtos' }, { path: 'produtos', component: ProductsComponent }, { path: 'notas', component: InvoicesComponent }, { path: '**', redirectTo: 'produtos' }];
