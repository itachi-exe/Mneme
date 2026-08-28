import { ulid } from "ulid";

const SLUG = /^[a-z0-9-]{3,48}$/;

export function assertSlug(slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`invalid pool slug: ${slug}`);
  return slug;
}

export function memoryId(): string {
  return `mem_${ulid().toLowerCase()}`;
}

export function snapshotId(): string {
  return `snp_${ulid().toLowerCase()}`;
}

export function poolId(): string {
  return `pol_${ulid().toLowerCase()}`;
}

export function titleFrom(content: string): string {
  const line = content.split(/\n/)[0]?.trim() ?? "";
  if (line.length <= 72) return line || "Untitled memory";
  return line.slice(0, 69) + "…";
}
