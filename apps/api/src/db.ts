import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { env } from "./env.js";

mkdirSync(env.dataDir, { recursive: true });

export const db = new DatabaseSync(join(env.dataDir, "mneme.db"));
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS pools (
  slug TEXT PRIMARY KEY,
  id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  access TEXT NOT NULL,
  agentic_id_required INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  owner TEXT NOT NULL,
  parent_slug TEXT,
  parent_snapshot_id TEXT,
  created_at INTEGER NOT NULL,
  address TEXT,
  settlement TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS members (
  pool TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  address TEXT,
  agentic_token_id TEXT,
  role TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (pool, agent_id)
);

CREATE TABLE IF NOT EXISTS memories (
  id TEXT PRIMARY KEY,
  pool TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT NOT NULL,
  privacy TEXT NOT NULL,
  layer TEXT NOT NULL,
  parent_id TEXT,
  writer TEXT NOT NULL,
  agentic_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  context_hash TEXT NOT NULL,
  storage_root TEXT NOT NULL,
  merkle_proof TEXT,
  settlement TEXT NOT NULL,
  tx_hash TEXT,
  embedding TEXT NOT NULL,
  seq INTEGER
);

CREATE TABLE IF NOT EXISTS kv (
  pool TEXT NOT NULL,
  key TEXT NOT NULL,
  memory_id TEXT,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (pool, key)
);

CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  pool TEXT NOT NULL,
  version INTEGER NOT NULL,
  merkle_root TEXT NOT NULL,
  storage_root TEXT NOT NULL,
  da_commitment TEXT NOT NULL,
  write_count INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  creator TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at INTEGER NOT NULL,
  kind TEXT NOT NULL,
  pool TEXT,
  actor TEXT,
  detail TEXT NOT NULL
);
`);

export function now(): number {
  return Math.floor(Date.now() / 1000);
}

export function emit(kind: string, pool: string | null, actor: string | null, detail: unknown) {
  db.prepare("INSERT INTO activity (at, kind, pool, actor, detail) VALUES (?, ?, ?, ?, ?)").run(
    now(),
    kind,
    pool,
    actor,
    JSON.stringify(detail),
  );
}

export function listActivity(limit = 40) {
  const rows = db
    .prepare("SELECT * FROM activity ORDER BY id DESC LIMIT ?")
    .all(limit) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: r.id,
    at: r.at,
    kind: r.kind,
    pool: r.pool,
    actor: r.actor,
    detail: JSON.parse(String(r.detail)),
  }));
}
