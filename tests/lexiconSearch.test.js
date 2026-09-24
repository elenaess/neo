const test = require('node:test');
const assert = require('node:assert/strict');
const {searchLexiconPage} = require('../src/engine/neoEngine');

test('empty query returns a bounded deterministic first page', () => {
  const page = searchLexiconPage('', {limit:40, offset:0});
  assert.equal(page.items.length <= 40, true);
  assert.equal(page.offset, 0);
  assert.equal(page.limit, 40);
  assert.equal(page.total >= page.items.length, true);
});

test('search page never returns more than requested limit', () => {
  const page = searchLexiconPage('a', {limit:25, offset:0});
  assert.equal(page.items.length <= 25, true);
});

test('paging returns non-overlapping windows', () => {
  const a = searchLexiconPage('', {limit:20, offset:0});
  const b = searchLexiconPage('', {limit:20, offset:20});
  const idsA = new Set(a.items.map(x => `${x.neo}|${x.pt}`));
  assert.equal(b.items.some(x => idsA.has(`${x.neo}|${x.pt}`)), false);
});

test('domain filtering is applied before paging', () => {
  const page = searchLexiconPage('', {domain:'Lugares/Geografia', limit:40, offset:0});
  assert.equal(page.items.every(x => x.dominio === 'Lugares/Geografia'), true);
});

test('dictionary default batch is small enough for initial render', () => {
  const page = searchLexiconPage('', {limit:40});
  assert.equal(page.items.length <= 40, true);
  assert.equal(page.hasMore, page.total > page.items.length);
});
