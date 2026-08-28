import { Link } from "react-router-dom";
import { Wordmark } from "../components/Mark";
import "../styles/landing.css";

export function DocsPage() {
  return (
    <div>
      <header className="site-header">
        <Link to="/">
          <Wordmark />
        </Link>
        <nav className="nav-links">
          <Link to="/">Product</Link>
          <Link to="/docs">Docs</Link>
          <Link to="/app">Console</Link>
        </nav>
        <Link to="/app" className="btn primary sm">
          Open app
        </Link>
      </header>
      <article className="section" style={{ maxWidth: 760 }}>
        <div className="kicker">Documentation</div>
        <h2>Protocol, not a product tour.</h2>
        <p className="lede">
          The durable docs live in the repo so the next agent can continue without this page:
          <code> ARCHITECTURE.md</code>, <code>HANDOFF.md</code>, <code>docs/PROTOCOL.md</code>.
        </p>

        <h3 style={{ marginTop: 36 }}>Install</h3>
        <pre className="code">{`cd /root/Mneme
cp -n .env.example .env
npm install
npm run seed
npm run dev
# web :3010   api :3011`}</pre>

        <h3 style={{ marginTop: 28 }}>SDK</h3>
        <pre className="code">{`import { Mneme } from "@mneme/sdk"

const mneme = new Mneme({ endpoint: "http://127.0.0.1:3011" })
await mneme.joinPool("research-swarm")
await mneme.remember({ content, tags: ["q3"], privacy: "shared" })
await mneme.recall("market trends Q3", { limit: 10 })
await mneme.inherit("previous-swarm-v1", { as: "research-swarm-v2" })`}</pre>

        <h3 style={{ marginTop: 28 }}>HTTP</h3>
        <pre className="code">{`POST /v1/pools
POST /v1/pools/:slug/join
POST /v1/remember          { pool, content, tags, privacy }
POST /v1/recall            { q, pool, limit }
POST /v1/pools/:slug/inherit
POST /v1/demo/run
GET  /health`}</pre>

        <h3 style={{ marginTop: 28 }}>Provenance tuple</h3>
        <p className="lede">
          writer · agenticId · timestamp · contentHash · contextHash · storageRoot. Content hash is
          keccak256 of canonical JSON (protocol v1). See docs/PROTOCOL.md.
        </p>

        <h3 style={{ marginTop: 28 }}>0G</h3>
        <p className="lede">
          Galileo 16602 / Aristotle 16661. Storage turbo indexer, Compute Router at
          router-api.0g.ai. Keys optional. Full table in docs/NETWORK.md.
        </p>

        <p style={{ marginTop: 36 }}>
          <Link to="/app" className="btn iris">
            Open the console
          </Link>
        </p>
      </article>
    </div>
  );
}
