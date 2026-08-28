import { tokenize } from "./embed.js";

export interface Doc {
  id: string;
  text: string;
}

export function bm25(query: string, docs: Doc[], k1 = 1.5, b = 0.75): Map<string, number> {
  const qTokens = tokenize(query);
  const scored = new Map<string, number>();
  if (!qTokens.length || !docs.length) return scored;

  const tokenized = docs.map((d) => ({ id: d.id, toks: tokenize(d.text) }));
  const avg = tokenized.reduce((s, d) => s + d.toks.length, 0) / tokenized.length;
  const df = new Map<string, number>();
  for (const d of tokenized) {
    const seen = new Set(d.toks);
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = tokenized.length;
  for (const d of tokenized) {
    const tf = new Map<string, number>();
    for (const t of d.toks) tf.set(t, (tf.get(t) ?? 0) + 1);
    let score = 0;
    for (const t of qTokens) {
      const f = tf.get(t) ?? 0;
      if (!f) continue;
      const n = df.get(t) ?? 0;
      const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
      score += idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.toks.length / avg))));
    }
    if (score) scored.set(d.id, score);
  }
  return scored;
}
