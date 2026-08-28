/** Hashed n-gram embeddings. Always available; 256-d, L2-normalized. */

const DIM = 256;

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function fnv(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function embed(text: string): number[] {
  const vec = new Float64Array(DIM);
  const tokens = tokenize(text);
  const grams: string[] = [...tokens];
  for (let i = 0; i < tokens.length - 1; i++) grams.push(tokens[i] + "_" + tokens[i + 1]);
  for (const g of grams) {
    const a = fnv(g) % DIM;
    const b = fnv("¤" + g) % DIM;
    vec[a] += 1;
    vec[b] -= 0.4;
  }
  let n = 0;
  for (const v of vec) n += v * v;
  n = Math.sqrt(n) || 1;
  const out = new Array<number>(DIM);
  for (let i = 0; i < DIM; i++) out[i] = vec[i] / n;
  return out;
}

export function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}
