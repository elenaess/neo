const {CONNECTIVES, norm} = require('./modernLexicon');
const VOWEL_RE = /[aeiouyáéíóúâêôãõ]$/i;

const FUNCTION_WORDS = new Map(
  CONNECTIVES.filter(x => !x.pt.includes(' ')).map(x => [x.pt, {
    neo:x.neo,
    kind:x.kind === 'relation' ? 'relation' : 'conjunction',
    gloss:x.pt,
  }]),
);

function functionPlaceholder(raw) {
  return `neofunc_${norm(raw).replace(/[^a-z0-9]+/g,'_')}`;
}

const FIXED_EXPRESSIONS = new Map([
  ['tá bem', 'sava'],
  ['está bem', 'sava'],
  ['tudo bem', 'sava'],
  ['tudo bom', 'sava'],
]);
for (const item of CONNECTIVES) {
  if (item.pt.includes(' ')) FIXED_EXPRESSIONS.set(item.pt, functionPlaceholder(item.pt));
}

function collapseFixedExpressions(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length;) {
    let matched = false;
    for (const size of [3, 2]) {
      if (i + size > tokens.length) continue;
      const phrase = tokens.slice(i, i + size).join(' ').toLowerCase();
      if (!FIXED_EXPRESSIONS.has(phrase)) continue;
      out.push(FIXED_EXPRESSIONS.get(phrase));
      i += size;
      matched = true;
      break;
    }
    if (matched) continue;
    out.push(tokens[i]);
    i += 1;
  }
  return out;
}

function translateFunctionWord(raw) {
  return FUNCTION_WORDS.get(String(raw).toLowerCase()) || null;
}

function applyPlaceLocative(surface, evidence = {}) {
  const base = String(surface);
  if (!evidence.isPlace) return base;
  return VOWEL_RE.test(base) ? `${base}la` : `${base}ia`;
}

function fusePresentCopula(surface) {
  const base = String(surface);
  return VOWEL_RE.test(base) ? `${base}ia` : `${base}a`;
}

function decomposePresentCopula(surface, knownBases) {
  const word = String(surface).toLowerCase();
  const candidates = [];
  if (word.endsWith('ia')) candidates.push(word.slice(0, -2));
  if (word.endsWith('a')) candidates.push(word.slice(0, -1));
  for (const base of candidates) {
    if (knownBases.has(base)) return {base, copula:'a'};
  }
  return null;
}

function shouldSuppressPluralAfterNumeral(previousUnit, nounUnit) {
  return previousUnit?.type === 'numeral' &&
    Number(previousUnit.value) > 1 &&
    nounUnit?.plural === true;
}

module.exports = {
  collapseFixedExpressions,
  translateFunctionWord,
  applyPlaceLocative,
  fusePresentCopula,
  decomposePresentCopula,
  shouldSuppressPluralAfterNumeral,
  functionPlaceholder,
};
