import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';

const dbFile = path.resolve('data/test-billing.db');
process.env.BILLING_DB = dbFile;
let stockUnavailable = false;
let debitCalls = 0;
const stockServer = http.createServer((req, res) => {
  res.setHeader('content-type', 'application/json');
  if (stockUnavailable) { res.statusCode = 503; return res.end(JSON.stringify({ code: 'STOCK_TEMPORARILY_UNAVAILABLE', message: 'Estoque indisponível.' })); }
  if (req.method === 'GET' && req.url === '/products/1') return res.end(JSON.stringify({ id: 1, code: 'P1', description: 'Produto oficial', balance: 10 }));
  if (req.method === 'POST' && req.url === '/stock/debit') { debitCalls += 1; return res.end(JSON.stringify({ message: 'Estoque atualizado.' })); }
  res.statusCode = 404; res.end(JSON.stringify({ code: 'PRODUCT_NOT_FOUND', message: 'Produto não encontrado.' }));
});
await new Promise((resolve) => stockServer.listen(0, '127.0.0.1', resolve));
process.env.STOCK_SERVICE_URL = `http://127.0.0.1:${stockServer.address().port}`;
fs.rmSync(dbFile, { force: true });
const { app } = await import('../src/app.js');
const { db } = await import('../src/db.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
test.after(() => { server.close(); stockServer.close(); db.close(); fs.rmSync(dbFile, { force: true }); });

test('gera numeração sequencial e status inicial aberto', async () => {
  const body = { items: [{ productId: 1, productCode: 'P1', productDescription: 'Produto', quantity: 1 }] };
  const create = () => fetch(`${base}/invoices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const first = await (await create()).json(); const second = await (await create()).json();
  assert.equal(first.number, 1); assert.equal(second.number, 2); assert.equal(first.status, 'OPEN');
  assert.equal(first.items[0].productDescription, 'Produto oficial');
});

test('mantém nota aberta quando estoque está indisponível', async () => {
  stockUnavailable = true;
  const response = await fetch(`${base}/invoices/1/print`, { method: 'POST' });
  assert.equal(response.status, 503);
  const invoices = await (await fetch(`${base}/invoices`)).json();
  assert.equal(invoices.find(x => x.id === 1).status, 'OPEN');
  stockUnavailable = false;
});

test('fecha a nota após baixa e bloqueia uma segunda impressão', async () => {
  let response = await fetch(`${base}/invoices/1/print`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'CLOSED');
  response = await fetch(`${base}/invoices/1/print`, { method: 'POST' });
  assert.equal(response.status, 409);
  assert.equal(debitCalls, 1);
});

test('rejeita produtos repetidos na criação', async () => {
  const response = await fetch(`${base}/invoices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 2 }] }) });
  assert.equal(response.status, 400);
});

test('rejeita nota acima do saldo disponível', async () => {
  const response = await fetch(`${base}/invoices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ productId: 1, quantity: 11 }] }) });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'INSUFFICIENT_STOCK');
});

test('responde JSON para corpo inválido e rota inexistente', async () => {
  let response = await fetch(`${base}/invoices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'INVALID_JSON');
  response = await fetch(`${base}/unknown`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 'ROUTE_NOT_FOUND');
});
