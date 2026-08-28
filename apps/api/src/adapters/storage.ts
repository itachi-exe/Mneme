import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { keccak256 } from "@mneme/protocol";
import { env, storageEnabled } from "../env.js";

const blobDir = join(env.dataDir, "local-storage");
mkdirSync(blobDir, { recursive: true });

export interface StoredBlob {
  root: string;
  settlement: "local" | "og-storage";
  bytes: number;
}

export async function putLog(payload: unknown): Promise<StoredBlob> {
  const json = JSON.stringify(payload);
  const buf = Buffer.from(json, "utf8");
  const localRoot = keccak256(buf);

  if (storageEnabled()) {
    try {
      const live = await uploadOg(buf);
      persist(live, buf);
      return { root: live, settlement: "og-storage", bytes: buf.length };
    } catch (err) {
      console.warn("[storage] 0G upload failed, falling back to local:", (err as Error).message);
    }
  }

  persist(localRoot, buf);
  return { root: localRoot, settlement: "local", bytes: buf.length };
}

export function getLog(root: string): Buffer | null {
  const path = join(blobDir, root.replace(/^0x/, "") + ".json");
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

function persist(root: string, buf: Buffer) {
  writeFileSync(join(blobDir, root.replace(/^0x/, "") + ".json"), buf);
}

async function uploadOg(buf: Buffer): Promise<string> {
  const mod = await import("@0gfoundation/0g-storage-ts-sdk").catch(() => null) as
    | { MemData: new (d: Uint8Array) => { merkleTree(): Promise<[{ rootHash(): string } | null, unknown]> }; Indexer: new (u: string) => { upload(f: unknown, rpc: string, signer: unknown): Promise<[{ rootHash?: string }, unknown]> } }
    | null;
  if (!mod) throw new Error("@0gfoundation/0g-storage-ts-sdk not installed");
  const ethers = await import("ethers");
  const provider = new ethers.JsonRpcProvider(env.rpcUrl);
  const signer = new ethers.Wallet(env.privateKey, provider);
  const indexer = new mod.Indexer(env.indexer);
  const mem = new mod.MemData(new Uint8Array(buf));
  const [tree, treeErr] = await mem.merkleTree();
  if (treeErr) throw new Error(String(treeErr));
  const [tx, err] = await indexer.upload(mem, env.rpcUrl, signer);
  if (err) throw new Error(String(err));
  return tx?.rootHash ?? tree?.rootHash() ?? keccak256(buf);
}
