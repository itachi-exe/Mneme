import { Hono } from "hono";
import { cors } from "hono/cors";
import { agentFrom } from "../lib/agent.js";
import { listActivity } from "../db.js";
import { env, computeEnabled, chainEnabled, storageEnabled } from "../env.js";
import { recall } from "../search/index.js";
import {
  createPool,
  getPool,
  inheritPool,
  joinPool,
  leavePool,
  listMembers,
  listPools,
  snapshotPool,
} from "../services/pools.js";
import { getMemory, listMemories, remember, workingOf } from "../services/memory.js";
import { runSwarm } from "../demo/swarm.js";

export const app = new Hono();

app.use("*", cors({ origin: "*", allowHeaders: ["Content-Type", "x-mneme-agent", "x-mneme-agent-name", "x-mneme-address", "x-mneme-agentic-id"] }));

app.onError((err, c) => {
  const status = (err as { status?: number }).status ?? 500;
  return c.json({ error: err.message }, status as 400);
});

app.get("/health", (c) =>
  c.json({
    ok: true,
    name: "mneme",
    network: env.network,
    adapters: {
      compute: computeEnabled(),
      storage: storageEnabled(),
      chain: chainEnabled(),
    },
  }),
);

app.get("/v1/meta", (c) =>
  c.json({
    protocolVersion: 1,
    network: env.network,
    chainId: env.chainId,
    rpcUrl: env.rpcUrl,
    factory: env.factory || null,
    compute: computeEnabled(),
  }),
);

app.get("/v1/pools", (c) => c.json({ pools: listPools() }));

app.get("/v1/pools/:slug", (c) => {
  const pool = getPool(c.req.param("slug"));
  if (!pool) return c.json({ error: "pool not found" }, 404);
  return c.json({
    ...pool,
    members: listMembers(pool.slug),
    working: workingOf(pool.slug),
  });
});

app.get("/v1/pools/:slug/memories", (c) => {
  const agent = agentFrom(c);
  const pool = getPool(c.req.param("slug"));
  if (!pool) return c.json({ error: "pool not found" }, 404);
  return c.json({ memories: listMemories(pool.slug, agent) });
});

app.post("/v1/pools", async (c) => {
  const body = await c.req.json();
  return c.json(createPool(body, agentFrom(c)), 201);
});

app.post("/v1/pools/:slug/join", async (c) => c.json(joinPool(c.req.param("slug"), agentFrom(c))));
app.post("/v1/pools/:slug/leave", async (c) => {
  leavePool(c.req.param("slug"), agentFrom(c));
  return c.json({ ok: true });
});
app.post("/v1/pools/:slug/snapshot", async (c) => c.json(snapshotPool(c.req.param("slug"), agentFrom(c))));
app.post("/v1/pools/:slug/inherit", async (c) => {
  const body = await c.req.json();
  return c.json(inheritPool(c.req.param("slug"), body, agentFrom(c)), 201);
});

app.post("/v1/remember", async (c) => {
  const body = await c.req.json();
  return c.json(await remember(body, agentFrom(c)), 201);
});

app.post("/v1/recall", async (c) => {
  const body = await c.req.json();
  const hits = await recall(
    {
      q: String(body.q ?? body.query ?? ""),
      pool: body.pool,
      limit: body.limit,
      tags: body.tags,
      writer: body.writer,
      privacy: body.privacy,
      layer: body.layer,
    },
    agentFrom(c),
  );
  return c.json({ hits });
});

app.get("/v1/memories/:id", (c) => {
  const mem = getMemory(c.req.param("id"), agentFrom(c));
  if (!mem) return c.json({ error: "not found" }, 404);
  return c.json(mem);
});

app.get("/v1/activity", (c) => {
  const limit = Number(c.req.query("limit") ?? 40);
  return c.json({ events: listActivity(limit) });
});

app.get("/v1/agents", (c) => {
  const rows = c.req.query("pool")
    ? listMembers(c.req.query("pool")!)
    : [];
  return c.json({ agents: rows });
});

app.post("/v1/demo/run", async (c) => {
  const events = await runSwarm();
  return c.json({ events });
});
