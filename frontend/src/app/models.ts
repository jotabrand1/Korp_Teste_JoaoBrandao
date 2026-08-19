export interface Product { id: number; code: string; description: string; balance: number; }
export interface InvoiceItem { productId: number; productCode: string; productDescription: string; quantity: number; }
export interface Invoice { id: number; number: number; status: 'OPEN' | 'CLOSED'; createdAt: string; closedAt?: string; items: InvoiceItem[]; }
