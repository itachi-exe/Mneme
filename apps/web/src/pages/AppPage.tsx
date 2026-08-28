import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Wordmark } from "../components/Mark";
import { api, type Activity, type Hit, type Memory, type Pool } from "../lib/api";
import { agentLabel, ago, initials, memCode, shortHash } from "../lib/format";
import "../styles/app.css";

export function AppPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [pools, setPools] = useState<Pool[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [layer, setLayer] = useState<"all" | "episodic" | "working">("all");
  const [draft, setDraft] = useState("");
  const [cmd, setCmd] = useState(false);
  const [cmdText, setCmdText] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");

  const active = slug ?? pools[0]?.slug ?? "research-swarm";
  const pool = pools.find((p) => p.slug === active);

  async function refresh() {
    try {
      const [ps, ev] = await Promise.all([api.pools(), api.activity()]);
      setPools(ps);
      setActivity(ev);
      const s = slug ?? ps[0]?.slug;
      if (s) {
        const mems = await api.memories(s);
        setMemories(mems);
        setSelected((cur) => (cur && mems.some((m) => m.id === cur.id) ? cur : mems[0] ?? null));
        if (!slug && s) nav(`/app/${s}`, { replace: true });
      }
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  useEffect(() => {
    refresh();
  }, [slug]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
        setCmdText("");
      }
      if (e.key === "Escape") {
        setCmd(false);
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(() => {
    const base = hits ? hits.map((h) => h.memory) : memories;
    return layer === "all" ? base : base.filter((m) => m.layer === layer);
  }, [hits, memories, layer]);

  async function doRecall(query: string) {
    setQ(query);
    setBusy("Searching…");
    try {
      const r = await api.recall({ q: query, pool: active, limit: 20 });
      setHits(r.hits);
      setCmd(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function doRemember(text: string, agent = "agt_console") {
    if (!text.trim()) return;
    setBusy("Writing…");
    try {
      await api.remember({ pool: active, content: text.trim(), tags: ["console"], privacy: "shared" }, agent);
      setDraft("");
      setHits(null);
      setQ("");
      await refresh();
      setCmd(false);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function runDemo() {
    setBusy("Swarm running…");
    try {
      await api.demo();
      await refresh();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function doInherit() {
    setBusy("Inheriting…");
    try {
      const taken = new Set(pools.map((p) => p.slug));
      let n = (pool?.version ?? 1) + 1;
      let child = `${active}-v${n}`;
      while (taken.has(child)) {
        n += 1;
        child = `${active}-v${n}`;
      }
      const p = await api.inherit(active, child);
      await refresh();
      nav(`/app/${p.slug}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className={`app-shell${selected ? " show-detail" : ""}`}>
      <aside className="side">
        <div className="side-top">
          <Link to="/">
            <Wordmark />
          </Link>
          <Link to="/docs" className="btn ghost sm">
            Docs
          </Link>
        </div>
        <button className="side-search" onClick={() => setCmd(true)} type="button">
          Search or jump… <span className="kbd">Ctrl K</span>
        </button>
        <div className="side-label">Pools</div>
        {pools.map((p) => (
          <Link
            key={p.slug}
            to={`/app/${p.slug}`}
            className={`pool-item${p.slug === active ? " active" : ""}`}
            onClick={() => {
              setSelected(null);
              setHits(null);
              setQ("");
            }}
          >
            <span className="pool-dot" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</span>
            <span className="pool-meta">{p.writeCount}</span>
          </Link>
        ))}
        <div className="side-label">Agents</div>
        {["researcher", "analyst", "executor"].map((a) => (
          <div key={a} className="pool-item">
            <span className={`av ${a}`}>{initials(a)}</span>
            {a}
          </div>
        ))}
        <div className="side-foot">
          {busy || err || "Local index · 0G idle"}
        </div>
      </aside>

      <section className="main">
        <div className="main-bar">
          <div className="main-title">
            <div>
              <h1>{pool?.name ?? active}</h1>
              <p>
                {pool?.access ?? "public"} · v{pool?.version ?? 1} · {pool?.memberCount ?? 0} members
                {pool?.parentSlug ? ` · inherited ${pool.parentSlug}` : ""}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn sm" onClick={runDemo} type="button">
              Run demo
            </button>
            <button className="btn sm" onClick={doInherit} type="button">
              Inherit
            </button>
          </div>
        </div>
        <div className="filters">
          {(["all", "episodic", "working"] as const).map((l) => (
            <button key={l} className={`chip${layer === l ? " on" : ""}`} onClick={() => setLayer(l)} type="button">
              {l}
            </button>
          ))}
          {q ? (
            <button
              className="chip on"
              onClick={() => {
                setHits(null);
                setQ("");
              }}
              type="button"
            >
              recall: {q} ×
            </button>
          ) : null}
        </div>
        <div className="list">
          {shown.map((m) => (
            <div
              key={m.id}
              className={`row${selected?.id === m.id ? " sel" : ""}`}
              onClick={() => setSelected(m)}
            >
              <div className="row-id">{memCode(m.id, m.seq)}</div>
              <div>
                <div className="row-title">{m.title}</div>
                <div className="row-sub">
                  <span>{agentLabel(m.writer)}</span>
                  {m.tags.slice(0, 3).map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                  <span>{m.layer}</span>
                </div>
              </div>
              <div className="row-right">
                <span className={`av ${agentLabel(m.writer)}`}>{initials(m.writer)}</span>
                {ago(m.createdAt)}
              </div>
            </div>
          ))}
          {shown.length === 0 ? (
            <div className="detail-empty">No memories in this view. Remember something below, or run the demo.</div>
          ) : null}
        </div>
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            doRemember(draft);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Remember to this pool…"
          />
          <button className="btn primary sm" type="submit">
            Remember
          </button>
        </form>
      </section>

      <aside className="detail">
        {selected ? (
          <>
            <div className="detail-head">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span className="badge">{memCode(selected.id, selected.seq)}</span>
                <button className="btn ghost sm" type="button" onClick={() => setSelected(null)}>
                  Close
                </button>
              </div>
              <h2>{selected.title}</h2>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="badge iris">{selected.privacy}</span>
                <span className="badge">{selected.layer}</span>
                {selected.tags.map((t) => (
                  <span key={t} className="badge">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="detail-body">{selected.body}</div>
            <div className="prov">
              <h3>Provenance</h3>
              <div className="prov-row">
                <span>Writer</span>
                <b>{selected.writer}</b>
              </div>
              <div className="prov-row">
                <span>Agentic ID</span>
                <b className="mono">{selected.agenticId}</b>
              </div>
              <div className="prov-row">
                <span>Content</span>
                <b className="mono" title={selected.contentHash}>
                  {shortHash(selected.contentHash)}
                </b>
              </div>
              <div className="prov-row">
                <span>Context</span>
                <b className="mono">{shortHash(selected.contextHash)}</b>
              </div>
              <div className="prov-row">
                <span>Storage</span>
                <b className="mono">{shortHash(selected.storageRoot)}</b>
              </div>
              <div className="prov-row">
                <span>Settlement</span>
                <b>{selected.settlement}</b>
              </div>
              <h3>Pool activity</h3>
              {activity
                .filter((a) => a.pool === active)
                .slice(0, 8)
                .map((a) => (
                  <div className="prov-row" key={a.id}>
                    <span>{a.kind.replace(".", " ")}</span>
                    <b>
                      {a.actor} · {ago(a.at)}
                    </b>
                  </div>
                ))}
            </div>
          </>
        ) : (
          <div className="detail-empty">
            Select a memory to inspect provenance.
            <br />
            Ctrl+K to recall or remember.
          </div>
        )}
      </aside>

      {cmd ? (
        <div className="cmd-scrim" onClick={() => setCmd(false)}>
          <div className="cmd" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              placeholder="Recall, remember, inherit, open a pool…"
              value={cmdText}
              onChange={(e) => setCmdText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const t = cmdText.trim();
                  if (t.startsWith("remember ")) doRemember(t.slice(9));
                  else if (t.startsWith("inherit")) doInherit();
                  else if (t) doRecall(t);
                }
              }}
            />
            <div className="cmd-list">
              <div className="cmd-item" onClick={() => doRecall(cmdText || "market trends Q3")}>
                Recall {cmdText || "market trends Q3"} <small>semantic + BM25</small>
              </div>
              <div className="cmd-item" onClick={() => doRemember(cmdText || "Console note from ⌘K")}>
                Remember {cmdText || "a note"} <small>append-only log</small>
              </div>
              <div className="cmd-item" onClick={runDemo}>
                Run 3-agent demo <small>researcher → analyst → executor</small>
              </div>
              <div className="cmd-item" onClick={doInherit}>
                Inherit this pool <small>snapshot + child pool</small>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
