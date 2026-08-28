import {
  contentHash,
  contextHash,
  memoryId,
  titleFrom,
  toMemoryDoc,
  type MemoryRecord,
  type WriteInput,
} from "@mneme/protocol";
import { db, emit, now } from "../db.js";
import { putLog } from "../adapters/storage.js";
import { settleWrite } from "../adapters/chain.js";
import { embed } from "../lib/embed.js";
import { canSeeMemory, canWritePool, roleOf } from "../lib/permissions.js";
import { rowToMemory } from "../lib/rows.js";
import { getPool, joinPool } from "./pools.js";
import type { Agent } from "../lib/agent.js";

export async function remember(input: WriteInput & { pool?: string }, agent: Agent): Promise<MemoryRecord> {
  const poolSlug = input.pool ?? "research-swarm";
  let pool = getPool(poolSlug);
  if (!pool) throw Object.assign(new Error("pool not found"), { status: 404 });
  if (roleOf(poolSlug, agent.id) === "none") {
    pool = joinPool(poolSlug, agent);
  }
  if (!canWritePool(roleOf(poolSlug, agent.id))) {
    throw Object.assign(new Error("not authorized to write"), { status: 403 });
  }

  const createdAt = now();
  const title = input.title ?? titleFrom(input.content);
  const tags = input.tags ?? [];
  const privacy = input.privacy ?? "shared";
  const layer = input.layer ?? "episodic";
  const parentId = input.parentId ?? null;
  const doc = toMemoryDoc({
    pool: poolSlug,
    title,
    body: input.content,
    tags,
    privacy,
    layer,
    parentId,
    writer: agent.id,
    agenticId: agent.agenticTokenId ?? "0",
    createdAt,
  });
  const cHash = contentHash(doc);
  const xHash = contextHash({ pool: poolSlug, parentId, tags, privacy, layer });
  const stored = await putLog({ doc, contentHash: cHash, contextHash: xHash });
  let settlement = stored.settlement as MemoryRecord["settlement"];
  let txHash: string | undefined;
  if (pool.address) {
    const tx = await settleWrite({
      poolAddress: pool.address,
      contentHash: cHash,
      contextHash: xHash,
      storageRoot: stored.root,
      tokenId: agent.agenticTokenId ?? "0",
    });
    if (tx) {
      txHash = tx;
      settlement = "og-chain";
    }
  }

  const id = memoryId();
  const embedding = embed(`${title} ${input.content} ${tags.join(" ")}`);
  const seqRow = db.prepare("SELECT COUNT(*) AS n FROM memories WHERE pool = ?").get(poolSlug) as { n: number };
  db.prepare(
    `INSERT INTO memories (id, pool, title, body, tags, privacy, layer, parent_id, writer, agentic_id, created_at, content_hash, context_hash, storage_root, settlement, tx_hash, embedding, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    poolSlug,
    title,
    input.content,
    JSON.stringify(tags),
    privacy,
    layer,
    parentId,
    agent.id,
    agent.agenticTokenId ?? "0",
    createdAt,
    cHash,
    xHash,
    stored.root,
    settlement,
    txHash ?? null,
    JSON.stringify(embedding),
    seqRow.n,
  );

  if (layer === "working" && input.workingKey) {
    db.prepare(
      `INSERT INTO kv (pool, key, memory_id, value, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(pool, key) DO UPDATE SET memory_id = excluded.memory_id, value = excluded.value, updated_at = excluded.updated_at`,
    ).run(poolSlug, input.workingKey, id, input.content, createdAt);
  }

  emit("memory.write", poolSlug, agent.id, { id, title, layer, settlement, contentHash: cHash });
  return getMemory(id, agent)!;
}

export function getMemory(id: string, agent: Agent): MemoryRecord | null {
  const row = db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return null;
  const mem = rowToMemory(row);
  const role = roleOf(mem.pool, agent.id);
  if (!canSeeMemory(mem, agent, role)) throw Object.assign(new Error("forbidden"), { status: 403 });
  return { ...mem, embedding: undefined };
}

export function listMemories(pool: string, agent: Agent, limit = 80): MemoryRecord[] {
  const rows = db
    .prepare("SELECT * FROM memories WHERE pool = ? ORDER BY created_at DESC LIMIT ?")
    .all(pool, limit) as Array<Record<string, unknown>>;
  const role = roleOf(pool, agent.id);
  return rows
    .map(rowToMemory)
    .filter((m) => canSeeMemory(m, agent, role))
    .map((m) => ({ ...m, embedding: undefined }));
}

export function workingOf(pool: string) {
  return db.prepare("SELECT key, memory_id, value, updated_at FROM kv WHERE pool = ?").all(pool);
}
