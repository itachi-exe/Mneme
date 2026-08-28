export function ago(ts: number): string {
  const s = Math.max(1, Math.floor(Date.now() / 1000 - ts));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function shortHash(h: string, n = 6): string {
  if (!h) return "—";
  const x = h.startsWith("0x") ? h.slice(2) : h;
  return "0x" + x.slice(0, n) + "…" + x.slice(-4);
}

export function memCode(id: string, seq?: number): string {
  if (typeof seq === "number") return `MEM-${String(seq + 1).padStart(3, "0")}`;
  return id.slice(0, 10).toUpperCase();
}

export function agentLabel(id: string): string {
  return id.replace(/^agt_/, "");
}

export function initials(name: string): string {
  const p = name.replace(/^agt_/, "").split(/[\s_-]/).filter(Boolean);
  return ((p[0]?.[0] ?? "A") + (p[1]?.[0] ?? "")).toUpperCase();
}
