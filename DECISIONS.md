# DECISIONS.md

Dated, durable choices. Do not relitigate without updating this file.

## 2026-08-15 — Monorepo, not four repos

One git root so an agent can grep the protocol, contracts, SDK, API, and UI in one place. Workspaces: `apps/*`, `packages/*`. Contracts stay a Foundry project (not an npm package) because `forge` is the source of truth.

## 2026-08-15 — Hosted node + degradable 0G adapters

Wave 3 judging wants a working multi-agent demo and a production-shaped app. Requiring a funded Galileo key to boot would make the console dead. Every 0G integration is an adapter with a local fallback. Live settlement is opportunistic and recorded on the write.

## 2026-08-15 — Protocol package is the type source of truth

`@mneme/protocol` has no I/O. Canonical JSON for hashing lives there. If the hash input ever changes, old memories become unverifiable — treat encoding as frozen after v1.

## 2026-08-15 — Hybrid search, not vectors-only

0G Compute Router is chat-first. Embeddings endpoints may or may not be available on a given key. Local hashed n-gram vectors + BM25 always work; Compute is used for rerank/summarize when configured. This keeps recall honest in the demo.

## 2026-08-15 — Inheritance is pointer-based

Snapshots store merkle roots and storage roots, not a byte-copy of every memory. A child pool can resolve leaves through the parent snapshot. Cheaper on Storage and preserves provenance of the original writers.

## 2026-08-15 — Linear as craft reference, not a skin

Near-black surfaces, Inter, hairline borders, command palette, activity timeline, issue-like memory rows (`MEM-1042`). Distinct brand: iris accent `#7170ff`, gold only for verified/inherited. No Tailwind, no shadcn — the token file is the design system so another agent cannot accidentally fork the look.

## 2026-08-15 — SQLite for the hosted index

One file, zero ops, easy to seed/reset. The index is rebuildable from Storage logs + chain events. Do not put authority in SQLite.

## 2026-08-15 — Demo agents are first-class

`agt_researcher`, `agt_analyst`, `agt_executor` ship as protocol-shaped agents so the 3-agent demo does not depend on minted ERC-7857 tokens. They write the same provenance records. Binding them to real Agentic IDs later is a mapping, not a migration.

## 2026-08-15 — Ports 3010 / 3011

This box already occupies 3000–3007, 8080. Web `3010`, API `3011`. Recorded in `brain.md`.
