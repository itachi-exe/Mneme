import { Mneme } from "@mneme/sdk";
import { env } from "../env.js";
import { createPool, getPool } from "../services/pools.js";
import type { Agent } from "../lib/agent.js";

export const RESEARCHER: Agent = {
  id: "agt_researcher",
  name: "Researcher",
  role: "Field notes",
};
export const ANALYST: Agent = {
  id: "agt_analyst",
  name: "Analyst",
  role: "Synthesis",
};
export const EXECUTOR: Agent = {
  id: "agt_executor",
  name: "Executor",
  role: "Decisions",
};

export const AGENTS = [RESEARCHER, ANALYST, EXECUTOR];

const OWNER: Agent = { id: "agt_mneme", name: "Mneme" };

export function ensureDemoPool() {
  if (!getPool(env.demoPool)) {
    createPool(
      {
        slug: env.demoPool,
        name: "Research Swarm",
        description: "Shared market-intel pool for the Wave 3 demo. Three agents write, search, and inherit.",
        access: "public",
      },
      OWNER,
    );
  }
}

export async function seedSwarm(endpoint?: string) {
  ensureDemoPool();
  const base = new Mneme({ endpoint: endpoint ?? `http://127.0.0.1:${env.port}` });
  const researcher = base.as(RESEARCHER);
  const analyst = base.as(ANALYST);
  const executor = base.as(EXECUTOR);

  await researcher.joinPool(env.demoPool);
  await analyst.joinPool(env.demoPool);
  await executor.joinPool(env.demoPool);

  const notes = [
    {
      agent: researcher,
      content:
        "Q3 open: spot BTC bid thinned 18% vs Q2 close on the top-3 CEX books. Depth inside 10 bps fell from $42m to $34m between 00:00–02:00 UTC.",
      tags: ["markets", "q3", "btc", "liquidity"],
    },
    {
      agent: researcher,
      content:
        "Funding flipped negative on Binance BTCUSDT perp at 14:02 UTC (−0.012%). Last time this printed after a quiet Asia session, 4h realized vol expanded 1.6×.",
      tags: ["funding", "q3", "btc"],
    },
    {
      agent: researcher,
      content:
        "ETH/BTC slipped to 0.0512, a 6-week low. Staking exit queue is 6.1 days — not a forced seller, but ETF creations stalled two sessions.",
      tags: ["eth", "q3", "flows"],
    },
    {
      agent: researcher,
      content:
        "0G Galileo storage indexer p50 put latency 1.8s over 40 samples this morning. Compute router listed GLM-5-FP8 as default. Useful for embedding fallback notes.",
      tags: ["0g", "infra"],
    },
  ];

  for (const n of notes) {
    await n.agent.remember({ pool: env.demoPool, content: n.content, tags: n.tags, privacy: "shared" });
  }

  const recalled = await analyst.recall("market trends Q3", { pool: env.demoPool, limit: 6 });
  const cites = recalled
    .slice(0, 3)
    .map((h) => h.memory.id)
    .join(", ");

  await analyst.remember({
    pool: env.demoPool,
    content: `Synthesis — Q3 tape is thinner and more short-biased than Q2. Liquidity hole at the open + negative funding + stalled ETH creations. Treat breakouts as fade-first until depth reclaims $40m. Cited ${cites}.`,
    tags: ["synthesis", "q3", "risk"],
    privacy: "shared",
    parentId: recalled[0]?.memory.id ?? null,
  });

  await analyst.remember({
    pool: env.demoPool,
    title: "Working thesis",
    content: "Bias: fade first 90 minutes. Invalidation: Binance 10-bp depth > $40m AND funding back through 0.",
    tags: ["thesis", "q3"],
    privacy: "shared",
    layer: "working",
    workingKey: "thesis",
  });

  const execHits = await executor.recall("Q3 liquidity and funding thesis", { pool: env.demoPool, limit: 5 });
  await executor.remember({
    pool: env.demoPool,
    content: `Decision: no new directional size until Analyst invalidation prints. If depth reclaims $40m, scale 25% of usual risk, stop at Q2 VWAP. Recalled ${execHits.length} memories. Inheritance candidate: freeze this pool as research-swarm-v2 after the next snapshot.`,
    tags: ["decision", "q3"],
    privacy: "shared",
  });

  return { recalled: recalled.length, execHits: execHits.length };
}

export async function runSwarm() {
  ensureDemoPool();
  // In-process, not HTTP — used by /v1/demo/run so the console can replay without a second hop.
  const { remember } = await import("../services/memory.js");
  const events: Array<Record<string, unknown>> = [];
  const log = (kind: string, agent: Agent, detail: unknown) => {
    events.push({ at: Date.now(), kind, agent, detail });
  };

  const r1 = await remember(
    {
      pool: env.demoPool,
      content: `Live tick ${new Date().toISOString()}: funding still negative, depth $33.4m. Researcher appending to the shared log.`,
      tags: ["live", "q3", "funding"],
    },
    RESEARCHER,
  );
  log("remember", RESEARCHER, { id: r1.id, title: r1.title });

  const { recall } = await import("../search/index.js");
  const hits = await recall({ q: "funding depth Q3", pool: env.demoPool, limit: 5 }, ANALYST);
  log("recall", ANALYST, { n: hits.length, top: hits[0]?.memory.title });

  const syn = await remember(
    {
      pool: env.demoPool,
      content: `Analyst reflection: latest researcher tick agrees with the working thesis. ${hits.length} supporting memories. Still fade-first.`,
      tags: ["synthesis", "live"],
      parentId: r1.id,
    },
    ANALYST,
  );
  log("remember", ANALYST, { id: syn.id, title: syn.title });

  const dec = await remember(
    {
      pool: env.demoPool,
      content: "Executor: hold flat. Snapshot this pool if the next hour stays inside the Q3 range.",
      tags: ["decision", "live"],
    },
    EXECUTOR,
  );
  log("remember", EXECUTOR, { id: dec.id, title: dec.title });
  return events;
}
