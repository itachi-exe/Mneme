export const PROTOCOL_VERSION = 1 as const;

export type AccessMode = "public" | "private" | "group" | "reputation" | "paid";
export type Role = "none" | "reader" | "writer" | "admin";
export type Privacy = "public" | "shared" | "private";
export type MemoryLayer = "working" | "episodic";
export type Settlement = "local" | "og-storage" | "og-chain";

export interface AgentRef {
  id: string;
  name: string;
  address?: string;
  agenticTokenId?: string;
  role?: string;
}

export interface MemoryDoc {
  protocolVersion: typeof PROTOCOL_VERSION;
  kind: "memory";
  pool: string;
  title: string;
  body: string;
  tags: string[];
  privacy: Privacy;
  layer: MemoryLayer;
  parentId: string | null;
  writer: string;
  agenticId: string;
  createdAt: number;
}

export interface MemoryEnvelope {
  id: string;
  seq?: number;
  contentHash: string;
  contextHash: string;
  storageRoot: string;
  merkleProof?: string[];
  settlement: Settlement;
  txHash?: string;
  embedding?: number[];
}

export type MemoryRecord = MemoryDoc & MemoryEnvelope;

export interface WriteInput {
  content: string;
  title?: string;
  tags?: string[];
  privacy?: Privacy;
  layer?: MemoryLayer;
  parentId?: string | null;
  workingKey?: string;
}

export interface RecallQuery {
  q: string;
  pool?: string;
  limit?: number;
  tags?: string[];
  writer?: string;
  privacy?: Privacy;
  layer?: MemoryLayer;
}

export interface RecallHit {
  memory: MemoryRecord;
  score: number;
  lexical: number;
  vector: number;
}

export interface PoolRecord {
  id: string;
  slug: string;
  name: string;
  description: string;
  access: AccessMode;
  agenticIdRequired: boolean;
  version: number;
  owner: string;
  parentSlug?: string | null;
  parentSnapshotId?: string | null;
  memberCount: number;
  writeCount: number;
  createdAt: number;
  address?: string;
  settlement: Settlement;
}

export interface SnapshotRecord {
  id: string;
  pool: string;
  version: number;
  merkleRoot: string;
  storageRoot: string;
  daCommitment: string;
  writeCount: number;
  createdAt: number;
  creator: string;
}

export interface Membership {
  agent: AgentRef;
  pool: string;
  role: Role;
  joinedAt: number;
}
