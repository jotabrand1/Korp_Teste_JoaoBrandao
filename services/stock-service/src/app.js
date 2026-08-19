import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { db } from './db.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '100kb' }));

let failNext = false;
const productSchema = z.object({ code: z.string().trim().min(1).max(30).transform((code) => code.toUpperCase()), description: z.string().trim().min(2).max(120), balance: z.number().int().nonnegative() });
const debitSchema = z.object({ idempotencyKey: z.string().min(1), items: z.array(z.object({ productId: z.number().int().positive(), quantity: z.number().int().positive() })).min(1) });

const normalizeItems = (items) => [...items.reduce((map, item) => map.set(item.productId, { productId: item.productId, quantity: (map.get(item.productId)?.quantity ?? 0) + item.quantity }), new Map()).values()];
const hashItems = (items) => createHash('sha256').update(JSON.stringify([...items].sort((a, b) => a.productId - b.productId))).digest('hex');

app.get('/health', (_req, res) => res.json({ service: 'stock', status: 'ok' }));
app.get('/products', (_req, res) => res.json(db.prepare('SELECT id, code, description, balance, created_at AS createdAt FROM products ORDER BY id DESC').all()));
app.get('/products/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ code: 'INVALID_PRODUCT_ID', message: 'Identificador de produto inválido.' });
  const product = db.prepare('SELECT id, code, description, balance FROM products WHERE id = ?').get(id);
  if (!product) return res.status(404).json({ code: 'PRODUCT_NOT_FOUND', message: 'Produto não encontrado.' });
  res.json(product);
});
app.post('/products', (req, res, next) => {
  try {
    const data = productSchema.parse(req.body);
    const result = db.prepare('INSERT INTO products (code, description, balance) VALUES (?, ?, ?)').run(data.code, data.description, data.balance);
    res.status(201).json(db.prepare('SELECT id, code, description, balance FROM products WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) { next(error); }
});

app.post('/admin/fail-next', (_req, res) => { failNext = true; res.json({ message: 'A próxima baixa de estoque falhará de forma simulada.' }); });

app.post('/stock/debit', (req, res, next) => {
  try {
    if (failNext) { failNext = false; return res.status(503).json({ code: 'STOCK_TEMPORARILY_UNAVAILABLE', message: 'Serviço de estoque temporariamente indisponível. Tente novamente.' }); }
    const data = debitSchema.parse(req.body);
    const items = normalizeItems(data.items);
    const requestHash = hashItems(items);
    const transaction = db.transaction(() => {
      const previous = db.prepare('SELECT payload, request_hash AS requestHash FROM stock_movements WHERE idempotency_key = ?').get(data.idempotencyKey);
      if (previous) {
        if (previous.requestHash && previous.requestHash !== requestHash) throw Object.assign(new Error('A chave de idempotência já foi utilizada com outros itens.'), { status: 409, code: 'IDEMPOTENCY_KEY_REUSED' });
        return { ...JSON.parse(previous.payload), idempotentReplay: true };
      }
      for (const item of items) {
        const product = db.prepare('SELECT id, description, balance FROM products WHERE id = ?').get(item.productId);
        if (!product) throw Object.assign(new Error(`Produto ${item.productId} não encontrado.`), { status: 404, code: 'PRODUCT_NOT_FOUND' });
        if (product.balance < item.quantity) throw Object.assign(new Error(`Saldo insuficiente para ${product.description}. Disponível: ${product.balance}.`), { status: 409, code: 'INSUFFICIENT_STOCK' });
      }
      for (const item of items) db.prepare('UPDATE products SET balance = balance - ? WHERE id = ?').run(item.quantity, item.productId);
      const result = { message: 'Estoque atualizado com sucesso.' };
      db.prepare('INSERT INTO stock_movements (idempotency_key, payload, request_hash) VALUES (?, ?, ?)').run(data.idempotencyKey, JSON.stringify(result), requestHash);
      return result;
    });
    res.json(transaction());
  } catch (error) { next(error); }
});

app.use((_req, res) => res.status(404).json({ code: 'ROUTE_NOT_FOUND', message: 'Rota não encontrada no serviço de Estoque.' }));

app.use((error, _req, res, _next) => {
  if (error instanceof z.ZodError) return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Dados inválidos.', details: error.flatten() });
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) return res.status(400).json({ code: 'INVALID_JSON', message: 'O corpo da requisição contém JSON inválido.' });
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ code: 'DUPLICATE_CODE', message: 'Já existe um produto com este código.' });
  if ((error.status ?? 500) >= 500) console.error(error);
  res.status(error.status ?? 500).json({ code: error.code ?? 'INTERNAL_ERROR', message: error.message ?? 'Erro interno.' });
});
