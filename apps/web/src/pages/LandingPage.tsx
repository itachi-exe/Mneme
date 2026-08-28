import { Link } from "react-router-dom";
import { Wordmark } from "../components/Mark";
import { ProductPreview } from "../components/landing/ProductPreview";
import "../styles/landing.css";

export function LandingPage() {
  return (
    <div>
      <header className="site-header">
        <Link to="/">
          <Wordmark />
        </Link>
        <nav className="nav-links">
          <a href="#product">Product</a>
          <a href="#protocol">Protocol</a>
          <a href="#sdk">SDK</a>
          <Link to="/docs">Docs</Link>
        </nav>
        <div className="nav-actions">
          <Link to="/docs" className="btn ghost sm">
            Documentation
          </Link>
          <Link to="/app" className="btn primary sm">
            Open app
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="kicker">Collective agent memory · on 0G</div>
        <h1>
          The shared brain
          <br />
          <em>for the agent economy.</em>
        </h1>
        <p className="hero-sub">
          Named, versioned, permissioned Memory Pools. Agents read, write, and inherit
          knowledge with full provenance — natively on Chain, Storage, Compute, and DA.
        </p>
        <div className="hero-cta">
          <Link to="/app" className="btn primary">
            Open the console
          </Link>
          <a href="#sdk" className="btn">
            View the SDK
          </a>
        </div>
      </section>

      <div className="frame-wrap" id="product">
        <div className="frame">
          <div className="frame-bar">
            <div className="dots">
              <i />
              <i />
              <i />
            </div>
            <span className="mono">app.mneme · research-swarm</span>
          </div>
          <ProductPreview />
        </div>
      </div>

      <section className="section">
        <div className="kicker">Why Mneme</div>
        <h2>Not another personal notebook.</h2>
        <p className="lede">
          Individual agent memory dies with the process. Mneme is infrastructure other
          agents join — with ownership, permissions, and a hash for every write.
        </p>
        <div className="grid-3">
          <article className="card">
            <span className="badge iris">Pools</span>
            <h3>Named, permissioned swarms</h3>
            <p>Public, private, group, reputation-gated, or paid. Versioned so a new swarm can inherit the last one.</p>
          </article>
          <article className="card">
            <span className="badge gold">Provenance</span>
            <h3>Every write is attributable</h3>
            <p>Writer Agentic ID, timestamp, context hash, storage root, merkle proof. Nothing enters the log anonymously.</p>
          </article>
          <article className="card">
            <span className="badge green">Recall</span>
            <h3>Hybrid semantic search</h3>
            <p>Vector + BM25 + structured filters. Permission checks run before a hit is serialized — no leaked snippets.</p>
          </article>
        </div>
      </section>

      <section className="section" id="protocol">
        <div className="kicker">0G native</div>
        <h2>The whole stack, not a sticker.</h2>
        <p className="lede">
          Mneme is designed as a 0G application. Local fallbacks keep the demo alive;
          live keys settle onto Galileo / Aristotle without a schema change.
        </p>
        <div className="stack-table">
          <div className="stack-row">
            <span>Layer</span>
            <span>Role</span>
            <span>In Mneme</span>
          </div>
          <div className="stack-row">
            <b>0G Chain</b>
            <span>Registry, ACL, ownership</span>
            <span>MemoryPool factory, write receipts, inheritance pointers</span>
          </div>
          <div className="stack-row">
            <b>0G Storage</b>
            <span>Dual memory</span>
            <span>Log = episodic + provenance · KV = working memory</span>
          </div>
          <div className="stack-row">
            <b>0G Compute</b>
            <span>Embeddings, rerank, summary</span>
            <span>Router chat rerank when a key is present</span>
          </div>
          <div className="stack-row">
            <b>0G DA</b>
            <span>Snapshot anchoring</span>
            <span>MemorySnapshot commitments for inherited roots</span>
          </div>
          <div className="stack-row">
            <b>ERC-7857</b>
            <span>Agentic ID</span>
            <span>Optional join/write gate via ownerOf(tokenId)</span>
          </div>
        </div>
      </section>

      <section className="section" id="sdk">
        <div className="kicker">Developer</div>
        <h2>Four calls. That’s the protocol.</h2>
        <p className="lede">TypeScript ships. Python is specified. Types live in @mneme/protocol so nothing drifts.</p>
        <div className="sdk-panel">
          <pre className="code">{`import { Mneme } from "@mneme/sdk"

const mneme = new Mneme({
  endpoint: "http://127.0.0.1:3011",
  agent: { id: "agt_researcher", name: "Researcher" },
})

await mneme.joinPool("research-swarm")
await mneme.remember({
  content: "Funding flipped negative at 14:02 UTC.",
  tags: ["q3", "funding"],
  privacy: "shared",
})
const hits = await mneme.recall("market trends Q3", { limit: 10 })
await mneme.inherit("previous-swarm-v1", { as: "research-swarm-v2" })`}</pre>
          <div>
            <article className="card">
              <h3>Hosted or direct</h3>
              <p>The SDK talks HTTP to the hosted node. When a factory address and key are set, writes also land on MemoryPool.write.</p>
            </article>
            <article className="card" style={{ marginTop: 12 }}>
              <h3>Demo swarm included</h3>
              <p>Three agents — Researcher, Analyst, Executor — share research-swarm. Open the console and hit Run demo.</p>
            </article>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <span>Mneme · muse of memory · built on 0G</span>
        <span>
          <a href="https://docs.0g.ai" target="_blank" rel="noreferrer">
            docs.0g.ai
          </a>
          {" · "}
          <a href="https://app.akindo.io/wave-hacks/xKOgjd91kCmrN3ORz" target="_blank" rel="noreferrer">
            Wave 3
          </a>
          {" · "}
          <Link to="/docs">Protocol docs</Link>
        </span>
      </footer>
    </div>
  );
}
