import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Mneme, MnemeError } from "./index.js";

describe("Mneme client", () => {
  it("normalizes endpoint and default agent", () => {
    const m = new Mneme({ endpoint: "http://localhost:3011/" });
    assert.equal(m.endpoint, "http://localhost:3011");
    assert.equal(m.agent.id, "agt_anonymous");
  });

  it("as() forks the agent", () => {
    const m = new Mneme();
    const r = m.as({ id: "agt_researcher", name: "Researcher" });
    assert.equal(r.agent.id, "agt_researcher");
    assert.equal(m.agent.id, "agt_anonymous");
  });

  it("MnemeError carries status", () => {
    const e = new MnemeError("nope", 403);
    assert.equal(e.status, 403);
  });
});
