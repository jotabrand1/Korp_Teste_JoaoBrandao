import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const dbFile = path.resolve('data/test-stock.db');
process.env.STOCK_DB = dbFile;
fs.rmSync(dbFile, { force: true });
const { app } = await import('../src/app.js');
const { db } = await import('../src/db.js');
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}`;

test.after(() => { server.close(); db.close(); fs.rmSync(dbFile, { force: true }); });

test('cadastra produto e baixa estoque de forma idempotente', async () => {
  let response = await fetch(`${base}/products`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code: 'T-01', description: 'Produto teste', balance: 10 }) });
  assert.equal(response.status, 201);
  const product = await response.json();
  const debit = { idempotencyKey: 'test:1', items: [{ productId: product.id, quantity: 2 }] };
  response = await fetch(`${base}/stock/debit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(debit) });
  assert.equal(response.status, 200);
  response = await fetch(`${base}/stock/debit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(debit) });
  assert.equal((await response.json()).idempotentReplay, true);
  const products = await (await fetch(`${base}/products`)).json();
  assert.equal(products[0].balance, 8);
});

test('falha simulada não altera o saldo', async () => {
  await fetch(`${base}/admin/fail-next`, { method: 'POST' });
  const response = await fetch(`${base}/stock/debit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idempotencyKey: 'test:fail', items: [{ productId: 1, quantity: 1 }] }) });
  assert.equal(response.status, 503);
  const products = await (await fetch(`${base}/products`)).json();
  assert.equal(products[0].balance, 8);
});

test('soma itens repetidos antes de validar o saldo', async () => {
  const response = await fetch(`${base}/stock/debit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idempotencyKey: 'test:duplicate', items: [{ productId: 1, quantity: 5 }, { productId: 1, quantity: 5 }] }) });
  assert.equal(response.status, 409);
  const products = await (await fetch(`${base}/products`)).json();
  assert.equal(products[0].balance, 8);
});

test('rejeita identificador de produto inválido', async () => {
  const response = await fetch(`${base}/products/abc`);
  assert.equal(response.status, 400);
});

test('rejeita reutilização da chave de idempotência com payload diferente', async () => {
  const response = await fetch(`${base}/stock/debit`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idempotencyKey: 'test:1', items: [{ productId: 1, quantity: 1 }] }) });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).code, 'IDEMPOTENCY_KEY_REUSED');
});

test('responde JSON para corpo inválido e rota inexistente', async () => {
  let response = await fetch(`${base}/products`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'INVALID_JSON');
  response = await fetch(`${base}/unknown`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).code, 'ROUTE_NOT_FOUND');
});
