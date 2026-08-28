import type {
  AgentRef,
  MemoryRecord,
  PoolRecord,
  Privacy,
  RecallHit,
  SnapshotRecord,
  WriteInput,
} from "@mneme/protocol";

export interface MnemeOptions {
  endpoint?: string;
  agent?: AgentRef;
}

export interface InheritOptions {
  as: string;
  name?: string;
  access?: PoolRecord["access"];
}

export class MnemeError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "MnemeError";
  }
}

export class Mneme {
  readonly endpoint: string;
  agent: AgentRef;

  constructor(opts: MnemeOptions = {}) {
    this.endpoint = (opts.endpoint ?? "http://127.0.0.1:3011").replace(/\/$/, "");
    this.agent = opts.agent ?? { id: "agt_anonymous", name: "Anonymous" };
  }

  as(agent: AgentRef): Mneme {
    return new Mneme({ endpoint: this.endpoint, agent });
  }

  async joinPool(slug: string): Promise<PoolRecord> {
    return this.post(`/v1/pools/${encodeURIComponent(slug)}/join`, {});
  }

  async leavePool(slug: string): Promise<{ ok: true }> {
    return this.post(`/v1/pools/${encodeURIComponent(slug)}/leave`, {});
  }

  async createPool(input: {
    slug: string;
    name: string;
    description?: string;
    access?: PoolRecord["access"];
    agenticIdRequired?: boolean;
  }): Promise<PoolRecord> {
    return this.post("/v1/pools", input);
  }

  async listPools(): Promise<PoolRecord[]> {
    const r = await this.get<{ pools: PoolRecord[] }>("/v1/pools");
    return r.pools;
  }

  async getPool(slug: string): Promise<PoolRecord> {
    return this.get(`/v1/pools/${encodeURIComponent(slug)}`);
  }

  async remember(input: WriteInput & { pool?: string }): Promise<MemoryRecord> {
    return this.post("/v1/remember", input);
  }

  async recall(
    q: string,
    opts: { pool?: string; limit?: number; tags?: string[]; writer?: string; privacy?: Privacy } = {},
  ): Promise<RecallHit[]> {
    const r = await this.post<{ hits: RecallHit[] }>("/v1/recall", { q, ...opts });
    return r.hits;
  }

  async inherit(parentSlug: string, opts: InheritOptions): Promise<PoolRecord> {
    return this.post(`/v1/pools/${encodeURIComponent(parentSlug)}/inherit`, opts);
  }

  async snapshot(slug: string): Promise<SnapshotRecord> {
    return this.post(`/v1/pools/${encodeURIComponent(slug)}/snapshot`, {});
  }

  async getMemory(id: string): Promise<MemoryRecord> {
    return this.get(`/v1/memories/${encodeURIComponent(id)}`);
  }

  async activity(limit = 40): Promise<unknown[]> {
    const r = await this.get<{ events: unknown[] }>(`/v1/activity?limit=${limit}`);
    return r.events;
  }

  private headers(): Record<string, string> {
    return {
      "content-type": "application/json",
      "x-mneme-agent": this.agent.id,
      "x-mneme-agent-name": encodeURIComponent(this.agent.name),
      ...(this.agent.address ? { "x-mneme-address": this.agent.address } : {}),
      ...(this.agent.agenticTokenId ? { "x-mneme-agentic-id": this.agent.agenticTokenId } : {}),
    };
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(this.endpoint + path, { headers: this.headers() });
    return this.read(res);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.endpoint + path, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.read(res);
  }

  private async read<T>(res: Response): Promise<T> {
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) {
      throw new MnemeError(data.error ?? res.statusText, res.status, data);
    }
    return data as T;
  }
}

export type {
  AgentRef,
  MemoryRecord,
  PoolRecord,
  Privacy,
  RecallHit,
  SnapshotRecord,
  WriteInput,
};
