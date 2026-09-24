const test = require('node:test');
const assert = require('node:assert/strict');

const {
  translatePtToNeo,
  translateNeoToPt,
  searchLexicon,
  LEXICON,
} = require('../src/engine/neoEngine');

test('expands common daily, internet, religious, sexual, economic and academic vocabulary', () => {
  const required = [
    'olá', 'tchau', 'natal', 'deus', 'religião', 'sexo', 'transar',
    'capitalismo', 'socialismo', 'senha', 'link', 'meme', 'consciência',
    'repressão', 'intrapsíquico', 'transcendência', 'metodologia', 'inferência',
  ];
  const pts = new Set(LEXICON.map(x => String(x.pt).toLowerCase()));
  for (const term of required) assert.ok(pts.has(term), `missing ${term}`);
});

test('keeps locative translation working', () => {
  const out = translatePtToNeo('na praia');
  assert.match(out.text, /gahala/);
});

test('translates new sexual verb and common inflections', () => {
  const infinitive = translatePtToNeo('transar').text;
  assert.notEqual(infinitive, 'transar');
  assert.equal(translatePtToNeo('eu transo').text.includes('transo'), false);
  assert.equal(translatePtToNeo('eu transei').text.includes('transei'), false);
});

test('capitalism derives from money and socialism from society', () => {
  const money = searchLexicon('dinheiro').find(x => x.pt === 'dinheiro');
  const society = searchLexicon('sociedade').find(x => x.pt === 'sociedade');
  const capitalism = searchLexicon('capitalismo').find(x => x.pt === 'capitalismo');
  const socialism = searchLexicon('socialismo').find(x => x.pt === 'socialismo');
  assert.ok(money && society && capitalism && socialism);
  assert.ok(capitalism.neo.includes(money.raiz.slice(0, -1)), 'capitalism should visibly reuse money root');
  assert.ok(socialism.neo.includes(society.raiz.slice(0, -1)), 'socialism should visibly reuse society root');
});

test('dictionary search ignores accents and can filter by domain', () => {
  const accentless = searchLexicon('consciencia');
  assert.ok(accentless.some(x => x.pt === 'consciência'));
  const academic = searchLexicon('repressao', { domain: 'Acadêmico/Psicologia' });
  assert.ok(academic.some(x => x.pt === 'repressão'));
});

test('neo to portuguese knows newly added words', () => {
  const entry = searchLexicon('natal').find(x => x.pt === 'natal');
  assert.ok(entry);
  const back = translateNeoToPt(entry.neo).text.toLowerCase();
  assert.match(back, /natal/);
});


test('covers common conversational adjectives and fully translates feliz natal', () => {
  const pts = new Set(LEXICON.map(x => String(x.pt).toLowerCase()));
  for (const term of ['feliz','bom','ruim','certo','errado','fácil','difícil','cringe','flop']) {
    assert.ok(pts.has(term), `missing ${term}`);
  }
  const out = translatePtToNeo('feliz natal').text.toLowerCase();
  assert.equal(out.includes('feliz'), false);
  assert.equal(out.includes('natal'), false);
});
