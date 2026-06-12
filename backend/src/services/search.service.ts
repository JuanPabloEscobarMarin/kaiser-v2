import { ServiceRepository } from "../repositories/service.repository.ts";

const SCORE_THRESHOLD = 0.25;
const STOPWORDS = new Set(["de", "la", "el", "en", "y", "a", "del"]);

const bigrams = (str: string) => {
  const s = str.toLowerCase().replace(/\s+/g, " ").trim();
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
};

const dice = (a: string, b: string) => {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const A = bigrams(a);
  const B = bigrams(b);
  let inter = 0;
  A.forEach((bg) => B.has(bg) && inter++);
  return (2 * inter) / (A.size + B.size);
};

const score = (query: string, text: string) => {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();
  if (t.includes(q)) return 1;

  const qTokens = q.split(/\s+/).filter((x) => x.length > 1);
  const tTokens = t.split(/\s+/);
  if (qTokens.length === 0) return 0;

  let total = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const tt of tTokens) {
      if (tt.includes(qt) || qt.includes(tt)) best = Math.max(best, 0.85);
      const sim = dice(qt, tt);
      if (sim > best) best = sim;
    }
    total += best;
  }
  return total / qTokens.length;
};

const tokenize = (q: string) =>
  q
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z]/gi, ""))
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));

export const SearchService = {
  async search(query: string) {
    const tokens = tokenize(query);
    const searchTokens = tokens.length > 0 ? tokens : [query.trim()];
    const services = await ServiceRepository.searchByTokens(searchTokens);

    return services
      .map((s) => ({
        id: s.id,
        label: s.name,
        type: "service" as const,
        score: score(query, s.name),
        meta: {
          price: s.price,
          duration: s.duration,
          discount: s.discount,
          urlImage: s.urlImage,
          description: s.description,
        },
      }))
      .filter((r) => r.score >= SCORE_THRESHOLD)
      .sort((a, b) => b.score - a.score);
  },
};
