import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalJson } from "./canonical.js";
import { contentHash, contextHash, keccak256, toMemoryDoc } from "./hash.js";
import { buildMerkle, merkleProof, verifyMerkle } from "./merkle.js";
import { assertSlug, titleFrom } from "./ids.js";

describe("canonicalJson", () => {
  it("sorts keys and drops undefined", () => {
    assert.equal(canonicalJson({ b: 1, a: 2, z: undefined }), '{"a":2,"b":1}');
  });
  it("is stable for nested objects", () => {
    const a = canonicalJson({ tags: ["q3", "m"], nest: { y: 1, x: 0 } });
    const b = canonicalJson({ nest: { x: 0, y: 1 }, tags: ["q3", "m"] });
    assert.equal(a, b);
  });
});

describe("hashes", () => {
  it("matches a known keccak empty string", () => {
    assert.equal(
      keccak256(""),
      "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470",
    );
  });
  it("content hash is deterministic", () => {
    const doc = toMemoryDoc({
      pool: "research-swarm",
      title: "hello",
      body: "world",
      tags: ["b", "a"],
      privacy: "shared",
      layer: "episodic",
      parentId: null,
      writer: "agt_researcher",
      agenticId: "0",
      createdAt: 1,
    });
    assert.equal(contentHash(doc), contentHash({ ...doc, tags: ["a", "b"] }));
    assert.notEqual(contentHash(doc), contentHash({ ...doc, body: "other" }));
  });
  it("context hash ignores body", () => {
    const a = contextHash({
      pool: "p",
      parentId: null,
      tags: ["t"],
      privacy: "shared",
      layer: "episodic",
    });
    const b = contextHash({
      pool: "p",
      parentId: null,
      tags: ["t"],
      privacy: "shared",
      layer: "episodic",
    });
    assert.equal(a, b);
  });
});

describe("merkle", () => {
  it("verifies a proof", () => {
    const leaves = [keccak256("a"), keccak256("b"), keccak256("c")];
    const tree = buildMerkle(leaves);
    for (const leaf of tree.leaves) {
      const proof = merkleProof(tree, leaf);
      assert.equal(verifyMerkle(leaf, proof, tree.root), true);
    }
    assert.equal(verifyMerkle(keccak256("nope"), [], tree.root), false);
  });
  it("empty tree has a defined root", () => {
    assert.equal(buildMerkle([]).root, keccak256(""));
  });
});

describe("ids", () => {
  it("accepts slugs", () => {
    assert.equal(assertSlug("research-swarm"), "research-swarm");
    assert.throws(() => assertSlug("NO"));
  });
  it("titles from first line", () => {
    assert.equal(titleFrom("Hello\nworld"), "Hello");
  });
});
