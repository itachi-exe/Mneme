import type { AccessMode, MemoryRecord, PoolRecord, Settlement } from "@mneme/protocol";

export function rowToPool(row: Record<string, unknown>): PoolRecord {
  const memberCount = Number(row.member_count ?? row.memberCount ?? 0);
  const writeCount = Number(row.write_count ?? row.writeCount ?? 0);
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    access: row.access as AccessMode,
    agenticIdRequired: Boolean(row.agentic_id_required),
    version: Number(row.version),
    owner: String(row.owner),
    parentSlug: (row.parent_slug as string) ?? null,
    parentSnapshotId: (row.parent_snapshot_id as string) ?? null,
    memberCount,
    writeCount,
    createdAt: Number(row.created_at),
    address: (row.address as string) || undefined,
    settlement: row.settlement as Settlement,
  };
}

export function rowToMemory(row: Record<string, unknown>): MemoryRecord {
  return {
    protocolVersion: 1,
    kind: "memory",
    id: String(row.id),
    pool: String(row.pool),
    title: String(row.title),
    body: String(row.body),
    tags: JSON.parse(String(row.tags)),
    privacy: row.privacy as MemoryRecord["privacy"],
    layer: row.layer as MemoryRecord["layer"],
    parentId: (row.parent_id as string) ?? null,
    writer: String(row.writer),
    agenticId: String(row.agentic_id),
    createdAt: Number(row.created_at),
    contentHash: String(row.content_hash),
    contextHash: String(row.context_hash),
    storageRoot: String(row.storage_root),
    merkleProof: row.merkle_proof ? JSON.parse(String(row.merkle_proof)) : undefined,
    settlement: row.settlement as Settlement,
    txHash: (row.tx_hash as string) || undefined,
    embedding: JSON.parse(String(row.embedding)),
    seq: row.seq === null || row.seq === undefined ? undefined : Number(row.seq),
  };
}
