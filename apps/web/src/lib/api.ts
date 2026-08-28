export const API = (import.meta.env.VITE_API as string | undefined) ?? "";

async function req<T>(path: string, init: RequestInit = {}, agent = "agt_console"): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-mneme-agent": agent,
      "x-mneme-agent-name": "Console",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data as T;
}

export interface Pool {
  id: string;
  slug: string;
  name: string;
  description: string;
  access: string;
  version: number;
  owner: string;
  parentSlug?: string | null;
  parentSnapshotId?: string | null;
  memberCount: number;
  writeCount: number;
  createdAt: number;
  settlement: string;
  members?: Member[];
  working?: Array<{ key: string; value: string; memory_id: string }>;
}

export interface Member {
  pool: string;
  agent_id: string;
  agent_name: string;
  role: string;
  joined_at: number;
}

export interface Memory {
  id: string;
  pool: string;
  title: string;
  body: string;
  tags: string[];
  privacy: string;
  layer: string;
  parentId: string | null;
  writer: string;
  agenticId: string;
  createdAt: number;
  contentHash: string;
  contextHash: string;
  storageRoot: string;
  settlement: string;
  txHash?: string;
  seq?: number;
}

export interface Hit {
  memory: Memory;
  score: number;
  lexical: number;
  vector: number;
}

export interface Activity {
  id: number;
  at: number;
  kind: string;
  pool: string | null;
  actor: string | null;
  detail: Record<string, unknown>;
}

export const api = {
  health: () => req<{ ok: boolean; adapters: Record<string, boolean> }>("/health"),
  pools: () => req<{ pools: Pool[] }>("/v1/pools").then((r) => r.pools),
  pool: (slug: string) => req<Pool>(`/v1/pools/${slug}`),
  memories: (slug: string) =>
    req<{ memories: Memory[] }>(`/v1/pools/${slug}/memories`).then((r) => r.memories),
  memory: (id: string) => req<Memory>(`/v1/memories/${encodeURIComponent(id)}`),
  remember: (body: Record<string, unknown>, agent = "agt_console") =>
    req<Memory>("/v1/remember", { method: "POST", body: JSON.stringify(body) }, agent),
  recall: (body: Record<string, unknown>) =>
    req<{ hits: Hit[] }>("/v1/recall", { method: "POST", body: JSON.stringify(body) }),
  inherit: (slug: string, as: string) =>
    req<Pool>(`/v1/pools/${slug}/inherit`, { method: "POST", body: JSON.stringify({ as }) }, "agt_executor"),
  snapshot: (slug: string) =>
    req<unknown>(`/v1/pools/${slug}/snapshot`, { method: "POST", body: "{}" }),
  activity: () => req<{ events: Activity[] }>("/v1/activity").then((r) => r.events),
  demo: () =>
    req<{ events: Array<{ kind: string; agent: { id: string; name: string }; detail: Record<string, unknown> }> }>(
      "/v1/demo/run",
      { method: "POST", body: "{}" },
    ),
};
