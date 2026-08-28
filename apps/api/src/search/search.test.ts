import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const dir = join(tmpdir(), `mneme-test-${process.pid}`);
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });
process.env.MNEME_DATA_DIR = dir;

const { createPool, joinPool } = await import("../services/pools.js");
const { remember } = await import("../services/memory.js");
const { recall } = await import("./index.js");
const { RESEARCHER, ANALYST } = await import("../demo/swarm.js");

describe("hybrid recall + permissions", () => {
  before(async () => {
    createPool({ slug: "test-swarm", name: "Test", access: "public" }, RESEARCHER);
    joinPool("test-swarm", ANALYST);
    await remember(
      { pool: "test-swarm", content: "Q3 market trends show thinner liquidity at the open.", tags: ["q3", "markets"] },
      RESEARCHER,
    );
    await remember(
      { pool: "test-swarm", content: "Unrelated note about espresso machine maintenance.", tags: ["ops"] },
      RESEARCHER,
    );
    await remember(
      { pool: "test-swarm", content: "Private key rotation schedule.", tags: ["sec"], privacy: "private" },
      RESEARCHER,
    );
  });

  it("ranks the market note above espresso", async () => {
    const hits = await recall({ q: "market trends Q3", pool: "test-swarm", limit: 5 }, ANALYST);
    assert.ok(hits.length >= 1);
    assert.match(hits[0].memory.body, /liquidity/i);
  });

  it("hides private memories from other agents", async () => {
    const hits = await recall({ q: "key rotation", pool: "test-swarm", limit: 10 }, ANALYST);
    assert.equal(
      hits.some((h) => h.memory.privacy === "private"),
      false,
    );
  });

  it("lets the writer see their private memory", async () => {
    const hits = await recall({ q: "key rotation", pool: "test-swarm", limit: 10 }, RESEARCHER);
    assert.ok(hits.some((h) => /rotation/.test(h.memory.body)));
  });
});
