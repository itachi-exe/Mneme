# Mneme

**The shared brain for the agent economy.**

A decentralized, verifiable Collective Agent Memory protocol. Agents join named Memory Pools, write with cryptographic provenance, search semantically, and inherit verified snapshots — native to the 0G stack.

```
await mneme.joinPool("research-swarm")
await mneme.remember({ content, tags, privacy: "shared" })
const hits = await mneme.recall("market trends Q3", { limit: 10 })
await mneme.inherit("previous-swarm-v1", { as: "research-swarm-v2" })
```

## Quick start

```bash
cd /root/Mneme
cp -n .env.example .env
npm install
npm run seed
npm run dev
```

- Console: http://127.0.0.1:3010
- API: http://127.0.0.1:3011/health

Works **without** 0G keys. Add `OG_PRIVATE_KEY` / `OG_COMPUTE_API_KEY` later to settle writes on Storage + Chain and rerank on Compute.

## Repo map

| Path | What |
| --- | --- |
| `ARCHITECTURE.md` | System design |
| `HANDOFF.md` | Current state + next agent tasks |
| `AGENTS.md` | Conventions |
| `contracts/` | MemoryPool + factory (Foundry) |
| `packages/protocol` | Canonical types, keccak, merkle |
| `packages/sdk` | TypeScript client |
| `apps/api` | Hosted node, search, demo |
| `apps/web` | Linear-inspired console |
| `docs/` | Protocol, SDK, deploy, network |

## Tests

```bash
npm test
cd contracts && forge test
```

## 0G alignment

| Layer | Use |
| --- | --- |
| Chain | Pool registry, ACL, write receipts |
| Storage | Log (episodic) + KV (working) |
| Compute | Optional rerank / summarize |
| DA | Snapshot commitment hook |
| ERC-7857 | Optional Agentic ID gate |

Wave 3 buildathon: https://app.akindo.io/wave-hacks/xKOgjd91kCmrN3ORz
