/**
 * Client and build share these helpers.
 * Item tuple:
 * [id, name, type, category, summary, heat, dateNum, sourceCount, likes, views, dateLabel]
 * `hay[i]` is the normalized full-text blob for `items[i]`.
 */

export function norm(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, "")
    .replace(/\s+/g, "");
}

export function termsOf(query) {
  return String(query ?? "")
    .split(/\s+/)
    .map(norm)
    .filter(Boolean);
}

export function matchHay(hay, terms) {
  if (!terms.length) return true;
  for (const term of terms) {
    if (!hay.includes(term)) return false;
  }
  return true;
}

export function compareHot(a, b) {
  return b[5] - a[5] || b[6] - a[6] || String(a[1]).localeCompare(String(b[1]), "zh");
}

export function compareNew(a, b) {
  return b[6] - a[6] || b[5] - a[5] || String(a[1]).localeCompare(String(b[1]), "zh");
}

/**
 * One pass over the index.
 * Type counts ignore the active type/category so chips show the query's spread.
 * Category counts respect the active type.
 * `matched` respects the active type and still includes every category.
 */
export function summarize(items, hay, { terms, type }) {
  const typeCounts = new Map();
  const catCounts = new Map();
  const matched = [];
  for (let i = 0; i < items.length; i++) {
    if (!matchHay(hay[i], terms)) continue;
    const it = items[i];
    typeCounts.set(it[2], (typeCounts.get(it[2]) || 0) + 1);
    if (type && it[2] !== type) continue;
    catCounts.set(it[3], (catCounts.get(it[3]) || 0) + 1);
    matched.push(it);
  }
  return { typeCounts, catCounts, matched };
}

export function paginate(list, page, pageSize) {
  const pages = Math.max(1, Math.ceil(list.length / pageSize) || 1);
  const current = Math.min(Math.max(1, page || 1), pages);
  const start = (current - 1) * pageSize;
  return {
    pages,
    page: current,
    total: list.length,
    slice: list.slice(start, start + pageSize),
  };
}
