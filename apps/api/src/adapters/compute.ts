import { env, computeEnabled } from "../env.js";
import type { RecallHit } from "@mneme/protocol";

export async function rerank(query: string, hits: RecallHit[]): Promise<RecallHit[]> {
  if (!computeEnabled() || hits.length < 2) return hits;
  try {
    const res = await fetch(`${env.computeBase}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.computeKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.computeModel,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Rerank memories for an agent. Reply with a JSON array of memory ids in best-first order. No prose.",
          },
          {
            role: "user",
            content: JSON.stringify({
              query,
              candidates: hits.map((h) => ({
                id: h.memory.id,
                title: h.memory.title,
                tags: h.memory.tags,
                writer: h.memory.writer,
              })),
            }),
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`compute ${res.status}`);
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = body.choices?.[0]?.message?.content ?? "[]";
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return hits;
    const order = JSON.parse(match[0]) as string[];
    const byId = new Map(hits.map((h) => [h.memory.id, h]));
    const next: RecallHit[] = [];
    for (const id of order) {
      const h = byId.get(id);
      if (h) next.push(h);
    }
    for (const h of hits) if (!next.includes(h)) next.push(h);
    return next;
  } catch (err) {
    console.warn("[compute] rerank skipped:", (err as Error).message);
    return hits;
  }
}

export async function summarize(texts: string[]): Promise<string | null> {
  if (!computeEnabled() || texts.length === 0) return null;
  try {
    const res = await fetch(`${env.computeBase}/chat/completions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.computeKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: env.computeModel,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: "Summarize a memory pool in 2 sentences for an operator console. No markdown.",
          },
          { role: "user", content: texts.slice(0, 12).join("\n---\n") },
        ],
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return body.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
