# AGENTS.md — conventions for the next agent

Read this before touching Mneme. Then read `HANDOFF.md` (state) and `ARCHITECTURE.md` (design).

## What this repo is

Mneme is a **Collective Agent Memory protocol** on 0G. Agents join named Memory Pools, write with cryptographic provenance, search semantically, and inherit verified snapshots.

It is **not** a chatbot. The product is infrastructure + a Linear-quality console for inspecting shared memory.

## Layout (do not flatten)

```
contracts/          Foundry. Source of truth for on-chain state.
packages/protocol   Shared types, hashing, merkle. No I/O.
packages/sdk        Public TypeScript SDK (`@mneme/sdk`).
apps/api            Hosted protocol node (storage, search, demo).
apps/web            Linear-inspired console + marketing site.
docs/               Human protocol/SDK/deploy docs.
data/               Local runtime (gitignored db + storage blobs).
```

## Hard rules

1. **Protocol types live in `packages/protocol`.** If you add a field to a memory write, change it there first, then SDK, then API, then UI.
2. **Never invent 0G endpoints.** Canonical values are in `docs/NETWORK.md` and `apps/api/src/adapters/og.ts`. Galileo = 16602, Aristotle mainnet = 16661.
3. **Adapters must degrade.** Every 0G call has a local fallback so the demo and console work without keys. Do not make live 0G a boot requirement.
4. **Provenance is mandatory.** Every write records writer agentic id, timestamp, content hash, context hash, storage root. Do not add a write path that skips this.
5. **Permission checks happen before results leave the API.** Search ranking must not leak unauthorized hits, even as snippets.
6. **UI is Linear-inspired, not Linear-cloned.** Near-black, hairline borders, Inter, 13–14px body, keyboard-first. Accent is Mneme iris `#7170ff`. Do not introduce a second design system or a component library that fights this.
7. **No placeholder comments for unfinished work.** Either implement, or add a dated item to `HANDOFF.md` under "Open work".
8. **Update `HANDOFF.md` and `brain.md` when you change runtime, ports, or deploy state.**

## Commands

```bash
cd /root/Mneme
npm install
npm run dev          # api :3011 + web :3010
npm test             # protocol + sdk + api + forge
npm run seed         # reset local db + demo swarm
cd contracts && forge test
```

## Style

- TypeScript: ESM, strict, no `any` unless bridging a 0G SDK type.
- Solidity: 0.8.24, named errors, no `console.log` in shipped contracts.
- React: function components, no Redux. App state in `apps/web/src/lib/store.ts`.
- CSS: custom properties in `apps/web/src/styles/tokens.css`. Do not add Tailwind unless the next owner explicitly chooses it.

## How to continue

Start at `HANDOFF.md`. If you are deploying to 0G, follow `docs/DEPLOYMENT.md`. If you are changing the protocol, update `docs/PROTOCOL.md` in the same change.
