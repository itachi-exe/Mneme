# HANDOFF.md

Last updated: 2026-08-15 after the initial Wave 3 MVP was verified live on this box.

## What exists

A Wave 3 MVP of **Mneme** — Collective Agent Memory on 0G.

| Surface | Status | Where |
| --- | --- | --- |
| Memory Pool contracts | Implemented + Foundry tests | `contracts/` |
| Dual memory + provenance | Implemented (local + 0G adapters) | `apps/api`, `packages/protocol` |
| Hybrid semantic search | Implemented | `apps/api/src/search` |
| TypeScript SDK | Implemented (`join/remember/recall/inherit`) | `packages/sdk` |
| 3-agent demo | Implemented + seed | `apps/api/src/demo`, `npm run seed` |
| Linear-inspired console | Implemented | `apps/web` |
| Agent-continuable docs | This file + ARCHITECTURE / DECISIONS / AGENTS / docs/* | repo root |

## How to run

```bash
cd /root/Mneme
cp .env.example .env          # optional; works without 0G keys
npm install
npm run seed
npm run dev
# web  http://127.0.0.1:3010
# api  http://127.0.0.1:3011/health
```

Production-style (already running on this box):

```bash
npm run build
pm2 start ecosystem.config.cjs   # names: mneme-api, mneme-web
pm2 save
```

Live now: `http://127.0.0.1:3010` and `http://94.72.105.176:3010`. No nginx vhost.

## Verify it works

Verified 2026-08-15 on this box:

- `npm test` — protocol 9, sdk 3, api 3, forge 12, all green
- `POST /v1/recall "market trends Q3"` ranks Analyst synthesis first, then Researcher liquidity
- `POST /v1/demo/run` — researcher remember → analyst recall → analyst remember → executor remember
- Inherit `research-swarm` → `research-swarm-v3` copied 11 memories + snapshot
- Console at `:3010` (landing / app / docs) 200; Linear-like issue list + provenance rail

```bash
npm test
curl -s http://127.0.0.1:3011/health
curl -s http://127.0.0.1:3011/v1/pools | head
# Console: open /app/research-swarm, Ctrl-K → recall "market trends Q3"
```

## What is live vs local

On first boot, unless `.env` has `OG_PRIVATE_KEY` + compute key:

- Pools, writes, search, inheritance, demo all work against SQLite + local log blobs.
- Records are stamped `settlement: "local"`.
- Connecting a key switches new writes onto 0G Storage / Chain without a schema change.

## Open work (next agent)

Priority order, not a wishlist:

1. **Deploy factory to Galileo** — `docs/DEPLOYMENT.md`. Needs a funded key from https://faucet.0g.ai. Write the address into `.env` as `MNEME_FACTORY_ADDRESS`.
2. **Wire a real ERC-7857 registry** — `AGENTIC_ID_REGISTRY`. Then flip `agenticIdRequired` on a private pool and add a join test that a non-holder reverts.
3. **Live Storage KV** — `OG_KV_NODE_URL` is unset; working memory currently mirrors into SQLite. Log-layer upload via Indexer is implemented and will fire when `OG_PRIVATE_KEY` is present.
4. **0G Compute embeddings** — rerank via chat is implemented. If Router grows a `/v1/embeddings` model, plug it into `apps/api/src/adapters/compute.ts` `embed()`.
5. **DA snapshot anchoring** — contract + local commitment exist. Submitting a real DA blob is stubbed behind `MemorySnapshot.anchor`.
6. **Python SDK** — spec'd in `docs/SDK.md`, not built.
7. **Public HTTPS** — no nginx vhost yet. Ports are loopback-friendly; add a site file only if the owner wants a domain.
8. **Demo video** — script in `docs/DEMO.md`. Record when the UI is owner-approved.

## Do not redo

- Do not replace the design tokens or introduce Tailwind "just for a page".
- Do not make 0G keys a hard boot dependency.
- Do not change canonical hash encoding without a version bump (`protocolVersion` in `@mneme/protocol`).
- Do not run a new public port without checking `ss -ltnp` and updating `brain.md`.

## Known gaps accepted for Wave 3

- No mainnet deploy.
- No paid-access payment flow (enum exists, collector is a stub).
- Reputation-gated access uses a simple on-chain score hook, not a live reputation registry.
- Private-memory encryption is node-side AES for the demo; production should wrap keys to the writer's Agentic ID pubkey.

## Contacts / links

- 0G docs: https://docs.0g.ai
- Galileo explorer: https://chainscan-galileo.0g.ai
- Faucet: https://faucet.0g.ai
- Buildathon: https://app.akindo.io/wave-hacks/xKOgjd91kCmrN3ORz
- This box: Contabo `94.72.105.176`, pm2, ports 3010/3011 reserved for Mneme.
