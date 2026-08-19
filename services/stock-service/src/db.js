import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const file = process.env.STOCK_DB ?? path.resolve('data/stock.db');
fs.mkdirSync(path.dirname(file), { recursive: true });
export const db = new Database(file);
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    balance INTEGER NOT NULL CHECK (balance >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idempotency_key TEXT NOT NULL UNIQUE,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);
const movementColumns = db.pragma('table_info(stock_movements)');
if (!movementColumns.some((column) => column.name === 'request_hash')) db.exec('ALTER TABLE stock_movements ADD COLUMN request_hash TEXT');
