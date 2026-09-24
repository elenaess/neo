const test = require('node:test');
const assert = require('node:assert/strict');
const {formatAnalysis} = require('../src/engine/analysisFormatter');

test('formats grammatical markers explicitly', () => {
  const raw = [
    {type:'function',neo:'ei',pt:'e',pos:'conjunção'},
    {type:'tense',neo:'da',tense:'past'},
    {type:'plural',neo:'li'},
    {type:'locative',neo:'salvadoria',base:'salvador',suffix:'-ia'},
  ];
  const out = formatAnalysis(raw);
  assert.deepEqual(out.items.map(x => x.title), [
    'ei — conjunção “e”',
    'da — marcador de passado',
    'li — marcador de plural',
    'salvadoria — Salvador + locativo de lugar (-ia)',
  ]);
});

test('formats copula fusion with its source', () => {
  const out = formatAnalysis([{
    type:'copula-fusion',
    neo:'pedroia',
    base:'pedro',
    copula:'a',
  }]);
  assert.equal(out.items[0].title, 'pedroia — fusão eufônica');
  assert.match(out.items[0].detail, /pedro \+ cópula presente a/i);
});

test('caps long analysis and reports hidden items', () => {
  const raw = Array.from({length:30}, (_,i) => ({type:'word',neo:`x${i}`,pt:`p${i}`}));
  const out = formatAnalysis(raw, {limit:12});
  assert.equal(out.items.length, 12);
  assert.equal(out.hiddenCount, 18);
});

test('hides underlying copula verb when a fused surface analysis is present', () => {
  const out = formatAnalysis([
    {type:'word',pos:'adjetivo',neo:'gyla',pt:'estável'},
    {type:'verb',pos:'verbo',neo:'ca',lemma:'ser',pt:'ser'},
    {type:'copula-fusion',neo:'gylaia',base:'gyla',copula:'a'},
  ]);
  assert.equal(out.items.some(x => x.surface === 'ca'), false);
  assert.equal(out.items.some(x => x.surface === 'gylaia'), true);
});

test('explains pronoun cases instead of showing opaque forms', () => {
  const out = formatAnalysis([
    {type:'word',pos:'pronome',neo:'mar',base:'mai',case:'erg',raw:'eu'},
    {type:'word',pos:'pronome',neo:'mal',base:'mai',case:'poss',raw:'meu'},
  ]);
  assert.match(out.items[0].title, /ergativo/i);
  assert.match(out.items[1].title, /possessivo/i);
});


test('formats modern affirmation and negation particles', () => {
  const out=formatAnalysis([
    {type:'affirmation',neo:'hei',pt:'sim'},
    {type:'negation',neo:'ie',pt:'não'},
  ]);
  assert.equal(out.items[0].title, 'hei — partícula de afirmação');
  assert.equal(out.items[1].title, 'ie — partícula de negação');
});
