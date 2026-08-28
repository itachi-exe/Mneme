import type { MemoryRecord, Privacy, Role } from "@mneme/protocol";
import { db } from "../db.js";
import type { Agent } from "./agent.js";

export function roleOf(pool: string, agentId: string): Role {
  const row = db.prepare("SELECT role FROM members WHERE pool = ? AND agent_id = ?").get(pool, agentId) as
    | { role: Role }
    | undefined;
  return row?.role ?? "none";
}

export function isMember(pool: string, agentId: string): boolean {
  return roleOf(pool, agentId) !== "none";
}

export function canReadPool(access: string, role: Role): boolean {
  if (role === "reader" || role === "writer" || role === "admin") return true;
  return access === "public";
}

export function canWritePool(role: Role): boolean {
  return role === "writer" || role === "admin";
}

export function poolAccess(slug: string): string {
  const row = db.prepare("SELECT access FROM pools WHERE slug = ?").get(slug) as { access: string } | undefined;
  return row?.access ?? "private";
}

export function canSeeMemory(mem: Pick<MemoryRecord, "privacy" | "writer" | "pool">, agent: Agent, role: Role): boolean {
  const privacy = mem.privacy as Privacy;
  if (privacy === "public") return true;
  if (privacy === "private") return mem.writer === agent.id || role === "admin";
  // Shared: members, or anyone who can already read a public pool.
  if (role !== "none") return true;
  return poolAccess(mem.pool) === "public";
}
