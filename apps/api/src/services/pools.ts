import {
  assertSlug,
  poolId,
  snapshotId,
  buildMerkle,
  leafHash,
  type AccessMode,
  type PoolRecord,
  type Role,
  type SnapshotRecord,
} from "@mneme/protocol";
import { db, emit, now } from "../db.js";
import { rowToPool } from "../lib/rows.js";
import { canWritePool, roleOf } from "../lib/permissions.js";
import type { Agent } from "../lib/agent.js";

export function listPools(): PoolRecord[] {
  const rows = db.prepare("SELECT * FROM pools ORDER BY rowid ASC").all() as Array<Record<string, unknown>>;
  return rows.map(enrich);
}

export function getPool(slug: string): PoolRecord | null {
  const row = db.prepare("SELECT * FROM pools WHERE slug = ?").get(slug) as Record<string, unknown> | undefined;
  return row ? enrich(row) : null;
}

function enrich(row: Record<string, unknown>): PoolRecord {
  const slug = String(row.slug);
  const memberCount = (
    db.prepare("SELECT COUNT(*) AS n FROM members WHERE pool = ?").get(slug) as { n: number }
  ).n;
  const writeCount = (
    db.prepare("SELECT COUNT(*) AS n FROM memories WHERE pool = ?").get(slug) as { n: number }
  ).n;
  return rowToPool({ ...row, member_count: memberCount, write_count: writeCount });
}

export function createPool(
  input: {
    slug: string;
    name: string;
    description?: string;
    access?: AccessMode;
    agenticIdRequired?: boolean;
    parentSlug?: string | null;
    parentSnapshotId?: string | null;
  },
  agent: Agent,
): PoolRecord {
  const slug = assertSlug(input.slug);
  if (getPool(slug)) throw Object.assign(new Error("slug taken"), { status: 409 });
  const createdAt = now();
  db.prepare(
    `INSERT INTO pools (slug, id, name, description, access, agentic_id_required, version, owner, parent_slug, parent_snapshot_id, created_at, settlement)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'local')`,
  ).run(
    slug,
    poolId(),
    input.name,
    input.description ?? "",
    input.access ?? "public",
    input.agenticIdRequired ? 1 : 0,
    agent.id,
    input.parentSlug ?? null,
    input.parentSnapshotId ?? null,
    createdAt,
  );
  db.prepare(
    `INSERT INTO members (pool, agent_id, agent_name, address, agentic_token_id, role, joined_at)
     VALUES (?, ?, ?, ?, ?, 'admin', ?)`,
  ).run(slug, agent.id, agent.name, agent.address ?? null, agent.agenticTokenId ?? null, createdAt);
  emit("pool.created", slug, agent.id, { name: input.name, access: input.access ?? "public" });
  return getPool(slug)!;
}

export function joinPool(slug: string, agent: Agent): PoolRecord {
  const pool = getPool(slug);
  if (!pool) throw Object.assign(new Error("pool not found"), { status: 404 });
  const existing = roleOf(slug, agent.id);
  if (existing !== "none") return pool;
  if (pool.access === "private") throw Object.assign(new Error("private pool"), { status: 403 });
  const role: Role = pool.access === "public" ? "writer" : "reader";
  db.prepare(
    `INSERT INTO members (pool, agent_id, agent_name, address, agentic_token_id, role, joined_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(slug, agent.id, agent.name, agent.address ?? null, agent.agenticTokenId ?? null, role, now());
  emit("pool.joined", slug, agent.id, { role });
  return getPool(slug)!;
}

export function leavePool(slug: string, agent: Agent) {
  const pool = getPool(slug);
  if (!pool) throw Object.assign(new Error("pool not found"), { status: 404 });
  if (pool.owner === agent.id) throw Object.assign(new Error("owner cannot leave"), { status: 400 });
  db.prepare("DELETE FROM members WHERE pool = ? AND agent_id = ?").run(slug, agent.id);
  emit("pool.left", slug, agent.id, {});
}

export function listMembers(slug: string) {
  return db.prepare("SELECT * FROM members WHERE pool = ? ORDER BY joined_at").all(slug);
}

export function snapshotPool(slug: string, agent: Agent): SnapshotRecord {
  const pool = getPool(slug);
  if (!pool) throw Object.assign(new Error("pool not found"), { status: 404 });
  if (!canWritePool(roleOf(slug, agent.id)) && pool.owner !== agent.id) {
    throw Object.assign(new Error("not authorized"), { status: 403 });
  }
  const mems = db.prepare("SELECT content_hash, storage_root, writer FROM memories WHERE pool = ?").all(slug) as Array<{
    content_hash: string;
    storage_root: string;
    writer: string;
  }>;
  const leaves = mems.map((m) => leafHash(m.content_hash, m.storage_root, m.writer));
  const tree = buildMerkle(leaves);
  const id = snapshotId();
  const createdAt = now();
  const version = pool.version;
  db.prepare(
    `INSERT INTO snapshots (id, pool, version, merkle_root, storage_root, da_commitment, write_count, created_at, creator)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, slug, version, tree.root, tree.root, tree.root, mems.length, createdAt, agent.id);
  db.prepare("UPDATE pools SET version = version + 1 WHERE slug = ?").run(slug);
  emit("pool.snapshot", slug, agent.id, { id, merkleRoot: tree.root, writeCount: mems.length });
  return {
    id,
    pool: slug,
    version,
    merkleRoot: tree.root,
    storageRoot: tree.root,
    daCommitment: tree.root,
    writeCount: mems.length,
    createdAt,
    creator: agent.id,
  };
}

export function inheritPool(
  parentSlug: string,
  opts: { as: string; name?: string; access?: AccessMode },
  agent: Agent,
): PoolRecord {
  const parent = getPool(parentSlug);
  if (!parent) throw Object.assign(new Error("parent not found"), { status: 404 });
  const snap = snapshotPool(parentSlug, agent);
  const child = createPool(
    {
      slug: opts.as,
      name: opts.name ?? `${parent.name} · inherited`,
      description: `Inherited from ${parentSlug} @ ${snap.id}`,
      access: opts.access ?? parent.access,
      parentSlug,
      parentSnapshotId: snap.id,
    },
    agent,
  );
  const src = db.prepare("SELECT * FROM memories WHERE pool = ?").all(parentSlug) as Array<Record<string, unknown>>;
  const insert = db.prepare(
    `INSERT INTO memories (id, pool, title, body, tags, privacy, layer, parent_id, writer, agentic_id, created_at, content_hash, context_hash, storage_root, merkle_proof, settlement, tx_hash, embedding, seq)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  let seq = 0;
  for (const row of src) {
    insert.run(
      `${row.id}~${child.slug}`,
      child.slug,
      row.title,
      row.body,
      row.tags,
      row.privacy,
      row.layer,
      row.id,
      row.writer,
      row.agentic_id,
      now(),
      row.content_hash,
      row.context_hash,
      row.storage_root,
      row.merkle_proof,
      row.settlement,
      row.tx_hash,
      row.embedding,
      seq++,
    );
  }
  emit("pool.inherited", child.slug, agent.id, { parent: parentSlug, snapshot: snap.id, copied: src.length });
  return getPool(child.slug)!;
}
