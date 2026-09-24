const test = require('node:test');
const assert = require('node:assert/strict');
const {searchLexicon, translatePtToNeo} = require('../src/engine/neoEngine');

test('includes required new common nouns', () => {
  for (const pt of [
    'paz','guerra','cidade','país','rua','bairro','praia','montanha','rio',
    'medo','esperança','memória','decisão','mudança','acordo','conflito',
    'verdade','mentira','risco','segredo','barulho','luz','sombra',
  ]) {
    assert.equal(searchLexicon(pt).some(x => x.pt.toLowerCase() === pt), true, pt);
  }
});

test('includes common conjunctions and relational expressions', () => {
  for (const pt of ['e','ou','mas','porque','porém','quando','enquanto','embora','se','através de']) {
    assert.notEqual(translatePtToNeo(pt).text, pt, pt);
  }
});

test('keeps user curated canonical overrides', () => {
  assert.equal(translatePtToNeo('ano').text, 'om');
  assert.equal(translatePtToNeo('estável').text, 'gyla');
  assert.equal(translatePtToNeo('ferro').text, 'doma');
});

test('adds 500 new modern lexical bases beyond existing vocabulary', () => {
  const modern = require('../src/engine/modernGrammar');
  assert.equal(modern.MODERN_LEXICON_STATS.added, 500);
});

test('expansion is distributed across everyday semantic groups', () => {
  for (const pt of ['cachecol','cansado','residir','flexível']) {
    assert.equal(searchLexicon(pt).some(x => x.pt.toLowerCase() === pt), true, pt);
  }
});
