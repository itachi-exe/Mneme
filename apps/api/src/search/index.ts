import type { MemoryRecord, RecallHit, RecallQuery } from "@mneme/protocol";
import { db } from "../db.js";
import { bm25 } from "../lib/bm25.js";
import { cosine, embed } from "../lib/embed.js";
import { canSeeMemory, roleOf } from "../lib/permissions.js";
import { rowToMemory } from "../lib/rows.js";
import type { Agent } from "../lib/agent.js";
import { rerank } from "../adapters/compute.js";

export async function recall(query: RecallQuery, agent: Agent): Promise<RecallHit[]> {
  const limit = Math.min(query.limit ?? 10, 50);
  let sql = "SELECT * FROM memories WHERE 1=1";
  const params: unknown[] = [];
  if (query.pool) {
    sql += " AND pool = ?";
    params.push(query.pool);
  }
  if (query.writer) {
    sql += " AND writer = ?";
    params.push(query.writer);
  }
  if (query.privacy) {
    sql += " AND privacy = ?";
    params.push(query.privacy);
  }
  if (query.layer) {
    sql += " AND layer = ?";
    params.push(query.layer);
  }
  const rows = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
  const visible: MemoryRecord[] = [];
  for (const row of rows) {
    const mem = rowToMemory(row);
    const role = roleOf(mem.pool, agent.id);
    if (query.tags?.length) {
      const have = new Set(mem.tags);
      if (!query.tags.every((t) => have.has(t))) continue;
    }
    if (!canSeeMemory(mem, agent, role)) continue;
    visible.push(mem);
  }

  const qv = embed(query.q);
  const lex = bm25(
    query.q,
    visible.map((m) => ({ id: m.id, text: `${m.title} ${m.body} ${m.tags.join(" ")} ${m.writer}` })),
  );
  let maxLex = 0;
  for (const v of lex.values()) if (v > maxLex) maxLex = v;

  const hits: RecallHit[] = visible.map((memory) => {
    const lexical = maxLex ? (lex.get(memory.id) ?? 0) / maxLex : 0;
    const vector = Math.max(0, cosine(qv, memory.embedding ?? []));
    const recency = Math.max(0, 1 - (Date.now() / 1000 - memory.createdAt) / (60 * 60 * 24 * 30));
    const score = lexical * 0.45 + vector * 0.45 + recency * 0.1;
    return { memory: { ...memory, embedding: undefined }, score, lexical, vector };
  });

  hits.sort((a, b) => b.score - a.score);
  const top = hits.filter((h) => h.score > 0 || !query.q.trim()).slice(0, limit);
  if (!query.q.trim()) {
    visible.sort((a, b) => b.createdAt - a.createdAt);
    return visible.slice(0, limit).map((memory) => ({
      memory: { ...memory, embedding: undefined },
      score: 1,
      lexical: 0,
      vector: 0,
    }));
  }
  return rerank(query.q, top);
}
