import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
config({ path: resolve(root, ".env") });

export const env = {
  root,
  port: Number(process.env.MNEME_API_PORT ?? 3011),
  dataDir: resolve(root, process.env.MNEME_DATA_DIR ?? "data"),
  network: process.env.MNEME_NETWORK ?? "galileo",
  rpcUrl: process.env.OG_RPC_URL ?? "https://evmrpc-testnet.0g.ai",
  chainId: Number(process.env.OG_CHAIN_ID ?? 16602),
  privateKey: process.env.OG_PRIVATE_KEY ?? "",
  factory: process.env.MNEME_FACTORY_ADDRESS ?? "",
  snapshot: process.env.MNEME_SNAPSHOT_ADDRESS ?? "",
  indexer: process.env.OG_STORAGE_INDEXER ?? "https://indexer-storage-testnet-turbo.0g.ai",
  flow: process.env.OG_STORAGE_FLOW ?? "0x22E03a6A89B950F1c82ec5e74F8eCa321a105296",
  kvNode: process.env.OG_KV_NODE_URL ?? "",
  computeKey: process.env.OG_COMPUTE_API_KEY ?? "",
  computeBase: process.env.OG_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1",
  computeModel: process.env.OG_COMPUTE_MODEL ?? "zai-org/GLM-5-FP8",
  agenticRegistry: process.env.AGENTIC_ID_REGISTRY ?? "",
  demoPool: process.env.MNEME_DEMO_POOL ?? "research-swarm",
};

export function computeEnabled(): boolean {
  return Boolean(env.computeKey);
}

export function chainEnabled(): boolean {
  return Boolean(env.privateKey && env.factory);
}

export function storageEnabled(): boolean {
  return Boolean(env.privateKey);
}
