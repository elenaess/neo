function norm(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .trim();
}

function createLexiconIndex(entries) {
  return entries.map((entry, index) => ({
    entry,
    index,
    pt: norm(entry.pt),
    neo: norm(entry.neo),
    root: norm(entry.raiz),
    domain: entry.dominio || '',
    register: entry.registro || '',
    haystack: norm([
      entry.pt, entry.neo, entry.raiz, entry.base_pt,
      entry.dominio, entry.registro,
    ].filter(Boolean).join(' ')),
  }));
}

function searchLexiconPage(index, query, options = {}) {
  const q = norm(query);
  const {
    domain = null,
    register = null,
    offset = 0,
    limit = 40,
  } = options;

  const safeLimit = Math.max(1, Math.min(Number(limit) || 40, 240));
  const safeOffset = Math.max(0, Number(offset) || 0);

  let rows = index.filter(row =>
    (!domain || row.domain === domain) &&
    (!register || row.register === register) &&
    (!q || row.haystack.includes(q))
  );

  if (q) {
    const score = row => row.pt === q ? 0 :
      row.neo === q ? 1 :
      row.pt.startsWith(q) ? 2 :
      row.neo.startsWith(q) ? 3 : 4;
    rows = rows.sort((a,b) => score(a) - score(b) || a.index - b.index);
  }

  const total = rows.length;
  const items = rows.slice(safeOffset, safeOffset + safeLimit).map(row => row.entry);

  return {
    items,
    total,
    offset:safeOffset,
    limit:safeLimit,
    hasMore:safeOffset + items.length < total,
  };
}

module.exports = {norm, createLexiconIndex, searchLexiconPage};
