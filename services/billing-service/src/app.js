import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { db } from './db.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));
const stockUrl = process.env.STOCK_SERVICE_URL ?? 'http://localhost:3001';
const invoiceSchema = z.object({ items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive(), productCode: z.string().optional(), productDescription: z.string().optional() })).min(1).superRefine((items, context) => {
  const ids = items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Um produto não pode aparecer mais de uma vez na nota.' });
}) });

const readJson = async (response) => {
  try { return await response.json(); }
  catch { return { code: 'INVALID_SERVICE_RESPONSE', message: 'O serviço de Estoque retornou uma resposta inválida.' }; }
};

const fetchProduct = async (productId) => {
  let response;
  try { response = await fetch(`${stockUrl}/products/${productId}`, { signal: AbortSignal.timeout(5000) }); }
  catch { throw Object.assign(new Error('Não foi possível validar os produtos no Estoque.'), { status: 503, code: 'STOCK_UNREACHABLE' }); }
  const payload = await readJson(response);
  if (!response.ok) throw Object.assign(new Error(payload.message), { status: response.status >= 500 ? 503 : response.status, code: payload.code });
  return payload;
};

const invoiceById = (id) => {
  const invoice = db.prepare('SELECT id, number, status, created_at AS createdAt, closed_at AS closedAt FROM invoices WHERE id = ?').get(id);
  if (!invoice) return null;
  invoice.items = db.prepare('SELECT product_id AS productId, product_code AS productCode, product_description AS productDescription, quantity FROM invoice_items WHERE invoice_id = ?').all(id);
  return invoice;
};

app.get('/health', (_req, res) => res.json({ service: 'billing', status: 'ok' }));
app.get('/invoices', (_req, res) => {
  const rows = db.prepare('SELECT id FROM invoices ORDER BY number DESC').all();
  res.json(rows.map(({ id }) => invoiceById(id)));
});
app.post('/invoices', async (req, res, next) => {
  try {
    const data = invoiceSchema.parse(req.body);
    const products = await Promise.all(data.items.map((item) => fetchProduct(item.productId)));
    const unavailable = data.items.find((item, index) => item.quantity > products[index].balance);
    if (unavailable) {
      const product = products[data.items.indexOf(unavailable)];
      return res.status(409).json({ code: 'INSUFFICIENT_STOCK', message: `Saldo insuficiente para ${product.description}. Disponível: ${product.balance}.` });
    }
    const items = data.items.map((item, index) => ({ ...item, productCode: products[index].code, productDescription: products[index].description }));
    const create = db.transaction(() => {
      const number = db.prepare('SELECT COALESCE(MAX(number), 0) + 1 AS next FROM invoices').get().next;
      const result = db.prepare("INSERT INTO invoices (number, status) VALUES (?, 'OPEN')").run(number);
      const insert = db.prepare('INSERT INTO invoice_items (invoice_id, product_id, product_code, product_description, quantity) VALUES (?, ?, ?, ?, ?)');
      for (const item of items) insert.run(result.lastInsertRowid, item.productId, item.productCode, item.productDescription, item.quantity);
      return Number(result.lastInsertRowid);
    });
    const id = create();
    res.status(201).json(invoiceById(id));
  } catch (error) { next(error); }
});

app.post('/invoices/:id/print', async (req, res, next) => {
  try {
    const invoice = invoiceById(Number(req.params.id));
    if (!invoice) return res.status(404).json({ code: 'INVOICE_NOT_FOUND', message: 'Nota fiscal não encontrada.' });
    if (invoice.status !== 'OPEN') return res.status(409).json({ code: 'INVOICE_ALREADY_CLOSED', message: 'Somente notas abertas podem ser impressas.' });
    let response;
    try {
      response = await fetch(`${stockUrl}/stock/debit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idempotencyKey: `invoice:${invoice.id}:print`, items: invoice.items.map(({ productId, quantity }) => ({ productId, quantity })) }), signal: AbortSignal.timeout(5000) });
    } catch {
      return res.status(503).json({ code: 'STOCK_UNREACHABLE', message: 'Não foi possível acessar o estoque. A nota continua aberta; tente novamente.' });
    }
    const payload = await readJson(response);
    if (!response.ok) return res.status(response.status >= 500 ? 503 : response.status).json(payload);
    db.prepare("UPDATE invoices SET status = 'CLOSED', closed_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'OPEN'").run(invoice.id);
    res.json({ ...invoiceById(invoice.id), message: 'Nota impressa e estoque atualizado.' });
  } catch (error) { next(error); }
});

app.use((_req, res) => res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada no serviço de Faturamento.' }));

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: error.flatten() });
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ code: 'INVALID_JSON', message: 'O corpo da requisição contém JSON inválido.' });
  if ((error.status ?? 500) >= 500) console.error(error);
  res.status(error.status ?? 500).json({ code: error.code ?? 'INTERNAL_ERROR', message: error.message ?? 'Erro interno no faturamento.' });
});
