import { env, chainEnabled } from "../env.js";

const WRITE_ABI = [
  "function write(bytes32 contentHash, bytes32 contextHash, bytes32 storageRoot, uint256 tokenId) returns (uint256)",
];

export async function settleWrite(input: {
  poolAddress: string;
  contentHash: string;
  contextHash: string;
  storageRoot: string;
  tokenId: string;
}): Promise<string | null> {
  if (!chainEnabled() || !input.poolAddress) return null;
  try {
    const ethers = await import("ethers");
    const provider = new ethers.JsonRpcProvider(env.rpcUrl);
    const signer = new ethers.Wallet(env.privateKey, provider);
    const c = new ethers.Contract(input.poolAddress, WRITE_ABI, signer);
    const tx = await c.write(input.contentHash, input.contextHash, input.storageRoot, BigInt(input.tokenId || "0"));
    const rec = await tx.wait();
    return rec?.hash ?? tx.hash;
  } catch (err) {
    console.warn("[chain] write settle failed:", (err as Error).message);
    return null;
  }
}
