import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { env } from "./env.js";

// Reset local index so `npm run seed` is deterministic.
rmSync(join(env.dataDir, "mneme.db"), { force: true });
rmSync(join(env.dataDir, "mneme.db-wal"), { force: true });
rmSync(join(env.dataDir, "mneme.db-shm"), { force: true });
mkdirSync(env.dataDir, { recursive: true });

const { db } = await import("./db.js");
const { createPool } = await import("./services/pools.js");
const { remember } = await import("./services/memory.js");
const { inheritPool } = await import("./services/pools.js");
const { RESEARCHER, ANALYST, EXECUTOR, ensureDemoPool } = await import("./demo/swarm.js");

ensureDemoPool();

createPool(
  {
    slug: "previous-swarm-v1",
    name: "Previous Swarm",
    description: "Retired Q2 swarm. Inherited into research-swarm-v2 as a demo of knowledge transfer.",
    access: "public",
  },
  { id: "agt_mneme", name: "Mneme" },
);

await remember(
  {
    pool: "previous-swarm-v1",
    content:
      "Q2 post-mortem: the swarm overfit to weekend funding mean-reversion. Do not carry that rule into Q3 without a depth filter.",
    tags: ["postmortem", "q2"],
  },
  RESEARCHER,
);

await remember(
  {
    pool: env.demoPool,
    content:
      "Q3 open: spot BTC bid thinned 18% vs Q2 close on the top-3 CEX books. Depth inside 10 bps fell from $42m to $34m between 00:00–02:00 UTC.",
    tags: ["markets", "q3", "btc", "liquidity"],
  },
  RESEARCHER,
);
await remember(
  {
    pool: env.demoPool,
    content:
      "Funding flipped negative on Binance BTCUSDT perp at 14:02 UTC (−0.012%). Last time this printed after a quiet Asia session, 4h realized vol expanded 1.6×.",
    tags: ["funding", "q3", "btc"],
  },
  RESEARCHER,
);
await remember(
  {
    pool: env.demoPool,
    content:
      "ETH/BTC slipped to 0.0512, a 6-week low. Staking exit queue is 6.1 days — not a forced seller, but ETF creations stalled two sessions.",
    tags: ["eth", "q3", "flows"],
  },
  RESEARCHER,
);
await remember(
  {
    pool: env.demoPool,
    content:
      "0G Galileo storage indexer p50 put latency 1.8s over 40 samples this morning. Compute router listed GLM-5-FP8 as default.",
    tags: ["0g", "infra"],
  },
  RESEARCHER,
);

const { recall } = await import("./search/index.js");
const hits = await recall({ q: "market trends Q3", pool: env.demoPool, limit: 6 }, ANALYST);
await remember(
  {
    pool: env.demoPool,
    content: `Synthesis — Q3 tape is thinner and more short-biased than Q2. Liquidity hole at the open + negative funding + stalled ETH creations. Treat breakouts as fade-first until depth reclaims $40m. Cited ${hits
      .slice(0, 3)
      .map((h) => h.memory.id)
      .join(", ")}.`,
    tags: ["synthesis", "q3", "risk"],
    parentId: hits[0]?.memory.id ?? null,
  },
  ANALYST,
);
await remember(
  {
    pool: env.demoPool,
    title: "Working thesis",
    content: "Bias: fade first 90 minutes. Invalidation: Binance 10-bp depth > $40m AND funding back through 0.",
    tags: ["thesis", "q3"],
    layer: "working",
    workingKey: "thesis",
  },
  ANALYST,
);

await remember(
  {
    pool: env.demoPool,
    content:
      "Decision: no new directional size until Analyst invalidation prints. If depth reclaims $40m, scale 25% of usual risk, stop at Q2 VWAP. Inheritance candidate: freeze this pool as research-swarm-v2.",
    tags: ["decision", "q3"],
  },
  EXECUTOR,
);

inheritPool("previous-swarm-v1", { as: "research-swarm-v2", name: "Research Swarm v2" }, {
  id: "agt_mneme",
  name: "Mneme",
});

const n = db.prepare("SELECT COUNT(*) AS n FROM memories").get() as { n: number };
console.log(`seeded ${n.n} memories across ${env.demoPool}, previous-swarm-v1, research-swarm-v2`);
