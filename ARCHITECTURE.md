# ARCHITECTURE.md

Mneme is a native 0G application: **Chain** for registry and permissions, **Storage** for dual memory, **Compute** for embeddings/search/reflection, **DA** for snapshot anchoring, **Agentic ID (ERC-7857)** for identity.

```
┌──────────────────────────────────────────────────────────────────┐
│  Agents / Console / SDK                                          │
│  joinPool · remember · recall · inherit                          │
└───────────────┬──────────────────────────────────────────────────┘
                │  HTTPS  /  viem
┌───────────────▼──────────────────────────────────────────────────┐
│  Hosted node  (@mneme/api)                                       │
│  permissions → dual write → index → hybrid search                │
└───┬─────────────┬──────────────┬──────────────┬──────────────────┘
    │             │              │              │
 0G Chain     0G Storage      0G Compute      0G DA
 registry     log + KV        embed/rerank    snapshot
 permissions  provenance      summarize       commitment
 inheritance  working mem     optional TEE
    │
 ERC-7857 Agentic ID  (auth + ownership)
```

## 1. Memory Pools

A pool is a named, versioned, permissioned shared knowledge base. On-chain it is a `MemoryPool` contract created by `MemoryPoolFactory`.

| Field | Meaning |
| --- | --- |
| `slug` | Stable handle (`research-swarm`) |
| `access` | `Public` · `Private` · `Group` · `Reputation` · `Paid` |
| `agenticIdRequired` | If true, join/write needs a live ERC-7857 token |
| `version` | Increments on snapshot / inherit |
| `parent` | Optional inherited pool + snapshot id |

Roles: `None < Reader < Writer < Admin`. Owner is Admin. Public pools grant Reader to anyone; Writer still requires join.

## 2. Dual memory model

| Layer | 0G primitive | Mutability | Use |
| --- | --- | --- | --- |
| Working | Storage **KV** | Mutable | Scratch, last-N, agent state |
| Episodic / archival | Storage **Log** | Append-only | Canonical memories + provenance |

Every remember():

1. Hash content (`keccak256` of canonical JSON) and context.
2. Write the blob to the Log layer (or local log fallback). Get `storageRoot`.
3. Upsert a working-memory pointer in KV (`pool/latest/<id>`).
4. Record the write on-chain (`MemoryPool.write`) when a signer is configured.
5. Index embedding + structured fields for search.

Provenance tuple (never optional):

```
{ writer, agenticId, timestamp, contentHash, contextHash, storageRoot, merkleProof }
```

`contextHash` binds the write to `(poolId, parentMemoryId?, tags, privacy)`.

## 3. Semantic search

Hybrid, permissioned:

1. **Structured filter** — pool, tags, writer, privacy, time range, layer.
2. **Lexical** — BM25 over title + body + tags.
3. **Vector** — cosine over embeddings. Local hashed n-gram embeddings always; 0G Compute embeddings/rerank when `OG_COMPUTE_API_KEY` is set.
4. **Permission gate** — drop unauthorized hits *before* serialization.

## 4. Knowledge inheritance

A new swarm inherits a verified snapshot of a previous pool:

1. `MemoryPool.snapshot()` freezes `merkleRoot` of current write set + `storageRoot`.
2. Optional DA commitment stored on `MemorySnapshot`.
3. `inherit(parent, snapshotId)` mints a new pool version whose genesis writes are the snapshot leaves. Content is not copied; pointers + proofs are.

## 5. Identity

`IAgenticId` is a thin ERC-721 / ERC-7857 view (`ownerOf`, `balanceOf`). The hosted node accepts:

- A wallet that owns an Agentic ID (preferred).
- A locally issued demo agent id (`agt_researcher` …) when no registry is configured.

Both are recorded in provenance so later mainnet binding is additive, not a rewrite.

## 6. Packages

| Package | Responsibility | May import |
| --- | --- | --- |
| `packages/protocol` | Types, canonical encoding, merkle, ids | nothing in-repo |
| `packages/sdk` | Client surface | protocol |
| `apps/api` | Persistence, adapters, search, demo | protocol, sdk |
| `apps/web` | Console + marketing | sdk (HTTP) |
| `contracts` | On-chain source of truth | OpenZeppelin |

## 7. Local vs live 0G

| Capability | Local fallback | Live path |
| --- | --- | --- |
| Pool registry | SQLite | `MemoryPoolFactory` |
| Episodic write | `data/local-storage/<root>.json` | `Indexer.upload(MemData)` |
| Working write | SQLite `kv` table | `Batcher` + `KvClient` |
| Embeddings | hashed 256-d n-grams | 0G Compute embeddings or chat-rerank |
| Snapshot DA | hash stored locally | `MemorySnapshot.anchor` + DA commitment |
| Agentic ID | demo agents | ERC-7857 `ownerOf` |

The API never refuses to start because 0G is unset. It stamps every record with `settlement: "local" | "og-storage" | "og-chain"`.

## 8. Trust boundary

- The hosted node is a convenience indexer, not the authority. Content hashes and storage roots are independently verifiable.
- Search ranking is untrusted. Membership and privacy are trusted only as far as the node + chain agree.
- Private memories are encrypted client-side (AES-256-GCM) before they touch Storage. The node stores ciphertext + wrapped key for the writer.
