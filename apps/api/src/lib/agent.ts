import type { Context } from "hono";
import type { AgentRef } from "@mneme/protocol";

export interface Agent extends AgentRef {}

export function agentFrom(c: Context): Agent {
  const id = c.req.header("x-mneme-agent") ?? "agt_anonymous";
  const nameRaw = c.req.header("x-mneme-agent-name");
  const name = nameRaw ? decodeURIComponent(nameRaw) : id.replace(/^agt_/, "");
  const address = c.req.header("x-mneme-address") ?? undefined;
  const agenticTokenId = c.req.header("x-mneme-agentic-id") ?? undefined;
  return { id, name, address, agenticTokenId };
}
