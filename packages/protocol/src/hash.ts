import createKeccakHash from "keccak";
import { canonicalJson } from "./canonical.js";
import { PROTOCOL_VERSION, type MemoryDoc, type Privacy, type MemoryLayer } from "./types.js";

export function keccak256(data: string | Uint8Array): string {
  const hash = createKeccakHash("keccak256");
  if (typeof data === "string") hash.update(Buffer.from(data, "utf8"));
  else hash.update(Buffer.from(data));
  return "0x" + hash.digest("hex");
}

export function hexToBytes(hex: string): Uint8Array {
  const h = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (h.length % 2 !== 0) throw new Error("odd hex");
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}

export function concatHex(a: string, b: string): string {
  const ba = hexToBytes(a);
  const bb = hexToBytes(b);
  const out = new Uint8Array(ba.length + bb.length);
  out.set(ba, 0);
  out.set(bb, ba.length);
  return keccak256(out);
}

export function toMemoryDoc(input: {
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
}): MemoryDoc {
  return {
    protocolVersion: PROTOCOL_VERSION,
    kind: "memory",
    pool: input.pool,
    title: input.title,
    body: input.body,
    tags: [...input.tags].sort(),
    privacy: input.privacy,
    layer: input.layer,
    parentId: input.parentId,
    writer: input.writer,
    agenticId: input.agenticId,
    createdAt: input.createdAt,
  };
}

export function contentHash(doc: MemoryDoc): string {
  return keccak256(canonicalJson(doc));
}

export function contextHash(input: {
  pool: string;
  parentId: string | null;
  tags: string[];
  privacy: Privacy;
  layer: MemoryLayer;
}): string {
  return keccak256(
    canonicalJson({
      layer: input.layer,
      parentId: input.parentId,
      pool: input.pool,
      privacy: input.privacy,
      tags: [...input.tags].sort(),
    }),
  );
}

export function leafHash(content: string, storageRoot: string, writer: string): string {
  return keccak256(canonicalJson({ content, storageRoot, writer }));
}
