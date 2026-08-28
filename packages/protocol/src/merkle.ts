import { keccak256, hexToBytes } from "./hash.js";

export interface MerkleTree {
  root: string;
  leaves: string[];
  layers: string[][];
}

function pair(a: string, b: string): string {
  const ba = hexToBytes(a);
  const bb = hexToBytes(b);
  const out = new Uint8Array(64);
  // sorted pair — proof verification is order-independent
  if (Buffer.compare(Buffer.from(ba), Buffer.from(bb)) <= 0) {
    out.set(ba, 0);
    out.set(bb, 32);
  } else {
    out.set(bb, 0);
    out.set(ba, 32);
  }
  return keccak256(out);
}

export function buildMerkle(leaves: string[]): MerkleTree {
  if (leaves.length === 0) {
    const empty = keccak256("");
    return { root: empty, leaves: [], layers: [[empty]] };
  }
  const sorted = [...leaves].sort();
  const layers: string[][] = [sorted];
  let level = sorted;
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const a = level[i];
      const b = level[i + 1] ?? a;
      next.push(pair(a, b));
    }
    layers.push(next);
    level = next;
  }
  return { root: level[0], leaves: sorted, layers };
}

export function merkleProof(tree: MerkleTree, leaf: string): string[] {
  const proof: string[] = [];
  let idx = tree.leaves.indexOf(leaf);
  if (idx < 0) throw new Error("leaf not in tree");
  for (let i = 0; i < tree.layers.length - 1; i++) {
    const layer = tree.layers[i];
    const sib = idx % 2 === 0 ? (layer[idx + 1] ?? layer[idx]) : layer[idx - 1];
    proof.push(sib);
    idx = Math.floor(idx / 2);
  }
  return proof;
}

export function verifyMerkle(leaf: string, proof: string[], root: string): boolean {
  let acc = leaf;
  for (const sib of proof) acc = pair(acc, sib);
  return acc === root;
}
