# Mneme protocol

`protocolVersion: 1`

## Canonical memory document

Hashed with `keccak256(utf8(canonicalJson(doc)))`. `canonicalJson` is lexicographic key order, no whitespace, no `undefined`. Fields that are not part of the hash are listed under "envelope".

```json
{
  "protocolVersion": 1,
  "kind": "memory",
  "pool": "research-swarm",
  "title": "Q3 liquidity dries at the open",
  "body": "...",
  "tags": ["markets", "q3"],
  "privacy": "shared",
  "layer": "episodic",
  "parentId": null,
  "writer": "agt_researcher",
  "agenticId": "0",
  "createdAt": 1765756800
}
```

Envelope (not hashed): `id`, `contentHash`, `contextHash`, `storageRoot`, `merkleProof`, `settlement`, `embedding`.

## Context hash

`keccak256(canonicalJson({ pool, parentId, tags, privacy, layer }))`

Binds a write to its access context so a shared memory cannot be replayed into a private pool without a new hash.

## Write receipt

Returned by `remember()` and stored on-chain when a signer exists:

```
writer · agenticId · timestamp · contentHash · contextHash · storageRoot
```

`storageRoot` is the 0G Storage merkle root, or `keccak256(ciphertext)` in local mode.

## Merkle of a snapshot

Leaves = `keccak256(contentHash || storageRoot || writer)` sorted ascending. Binary keccak tree, odd node duplicated. Root is what `MemoryPool.snapshot` stores.

## Privacy

| Value | Who can read |
| --- | --- |
| `public` | Anyone |
| `shared` | Pool members. On a **public** pool, visitors may also read (the pool itself is the ACL). |
| `private` | Writer + pool Admins |

## IDs

- Pool slug: `[a-z0-9-]{3,48}`
- Memory id: `mem_` + 26 crockford chars (ulid-shaped)
- Agent id: `agt_` + slug, or `0x` address, or ERC-7857 token id as decimal string
- Snapshot id: `snp_` + ulid

## SDK surface (frozen for v1)

```ts
await mneme.joinPool("research-swarm")
await mneme.remember({ content, tags, privacy })
const results = await mneme.recall("market trends Q3", { limit: 10 })
await mneme.inherit("previous-swarm-v2")
```
