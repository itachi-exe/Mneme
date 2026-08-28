import "../app/preview-shim.css";

const rows = [
  { id: "MEM-007", title: "Decision: no new directional size", who: "Executor", tag: "decision", when: "2m" },
  { id: "MEM-006", title: "Working thesis — fade first 90 minutes", who: "Analyst", tag: "thesis", when: "6m" },
  { id: "MEM-005", title: "Synthesis — Q3 tape is thinner than Q2", who: "Analyst", tag: "synthesis", when: "11m" },
  { id: "MEM-004", title: "0G Galileo indexer p50 put 1.8s", who: "Researcher", tag: "0g", when: "18m" },
  { id: "MEM-003", title: "ETH/BTC 0.0512, ETF creations stalled", who: "Researcher", tag: "eth", when: "24m" },
  { id: "MEM-002", title: "Funding flipped negative at 14:02 UTC", who: "Researcher", tag: "funding", when: "31m" },
  { id: "MEM-001", title: "Q3 open: spot bid thinned 18%", who: "Researcher", tag: "liquidity", when: "40m" },
];

export function ProductPreview() {
  return (
    <div className="pv">
      <aside className="pv-side">
        <div className="pv-brand">Mneme</div>
        <div className="pv-search">Search or jump… <span>Ctrl K</span></div>
        <div className="pv-lab">Pools</div>
        <div className="pv-item on">
          <i /> Research Swarm <em>7</em>
        </div>
        <div className="pv-item">
          <i /> Research Swarm v2 <em>1</em>
        </div>
        <div className="pv-item">
          <i /> Previous Swarm <em>1</em>
        </div>
      </aside>
      <div className="pv-main">
        <div className="pv-bar">
          <strong>research-swarm</strong>
          <span>public · v1 · 3 agents</span>
        </div>
        {rows.map((r, i) => (
          <div key={r.id} className={`pv-row${i === 2 ? " sel" : ""}`}>
            <span className="mono">{r.id}</span>
            <span>{r.title}</span>
            <span className="pv-who">{r.who}</span>
            <span className="pv-tag">{r.tag}</span>
            <span className="pv-when">{r.when}</span>
          </div>
        ))}
      </div>
      <aside className="pv-detail">
        <div className="kicker">MEM-005 · shared</div>
        <h4>Synthesis — Q3 tape is thinner than Q2</h4>
        <p>
          Liquidity hole at the open + negative funding + stalled ETH creations. Treat
          breakouts as fade-first until depth reclaims $40m.
        </p>
        <div className="kicker">Provenance</div>
        <ul>
          <li>
            <span>Writer</span> agt_analyst
          </li>
          <li>
            <span>Content</span> 0x8c1a…f03e
          </li>
          <li>
            <span>Storage</span> 0x41d0…9aa2
          </li>
          <li>
            <span>Settlement</span> local
          </li>
        </ul>
      </aside>
    </div>
  );
}
