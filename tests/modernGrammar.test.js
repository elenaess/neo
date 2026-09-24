const test = require('node:test');
const assert = require('node:assert/strict');
const {translatePtToNeo,translateNeoToPt,searchLexicon} = require('../src/engine/neoEngine');

test('preserves punctuation in place', () => {
  assert.equal(translatePtToNeo('Eu como, você bebe!').text.includes(','), true);
  assert.equal(translatePtToNeo('Eu como, você bebe!').text.endsWith('!'), true);
  assert.equal(/\s[,!?;:.]/.test(translatePtToNeo('Eu como, você bebe!').text), false);
});

test('uses modern copula markers a, da and auf', () => {
  assert.equal(translatePtToNeo('eu sou estável').text, 'mai gylaia');
  assert.equal(translatePtToNeo('eu estava estável').text, 'mai gyla da');
  assert.equal(translatePtToNeo('eu estarei estável').text, 'mai gyla auf');
});

test('treats imperfect and imperfect subjunctive as past', () => {
  assert.equal(translatePtToNeo('eu comia').text.includes('da'), true);
  assert.equal(translatePtToNeo('se estivesse estável').text, 'sai gyla da');
});

test('derives manner adverbs with -au and vowel replacement', () => {
  assert.equal(translatePtToNeo('estavelmente').text, 'gylau');
});

test('implements the approved Neo numeral composition', () => {
  const cases = new Map([
    ['0','ur'],['1','deri'],['2','care'],['10','em'],['11','dyrem'],['12','carem'],
    ['20','fen'],['21','dyrfen'],['100','ami'],['101','dyrami'],['121','ami-dyrfen'],
    ['1000','mon'],['1001','dyrmon'],['1021','mon-dyrfen'],['1121','monami-dyrfen'],['2121','care monami-dyrfen'],
  ]);
  for (const [pt, neo] of cases) assert.equal(translatePtToNeo(pt).text, neo, pt);
});

test('parses Portuguese number words into Neo numerals', () => {
  assert.equal(translatePtToNeo('cento e vinte e um').text, 'ami-dyrfen');
  assert.equal(translatePtToNeo('dois mil cento e vinte e um').text, 'care monami-dyrfen');
});

test('modern vocabulary exposes stable and numeral entries in dictionary', () => {
  assert.equal(searchLexicon('estável').some(x => x.neo === 'gyla'), true);
  assert.equal(searchLexicon('mil').some(x => x.neo === 'mon'), true);
});

test('Neo to Portuguese understands modern copula and manner adverb', () => {
  assert.match(translateNeoToPt('mai gyla a').text, /eu .*estável/i);
  assert.match(translateNeoToPt('gylau').text, /estavelmente/i);
});

test('distinguishes conjunction e from accented copula é', () => {
  assert.equal(translatePtToNeo('e').text, 'ei');
  assert.equal(translatePtToNeo('tudo bem e estável').text.includes('ei'), true);
  assert.equal(translatePtToNeo('é estável').text.includes('ei'), false);
});

test('collapses approved wellbeing phrases to sava', () => {
  for (const pt of ['tá bem','está bem','tudo bem','tudo bom']) {
    assert.equal(translatePtToNeo(pt).text, 'sava', pt);
  }
});

test('uses modern lexical forms om leif and ca', () => {
  assert.equal(searchLexicon('ano').some(x => x.neo === 'om'), true);
  assert.equal(searchLexicon('ter').some(x => x.neo === 'leif'), true);
  assert.equal(searchLexicon('ser').some(x => x.neo === 'ca' || x.forma_legada === 'lede'), true);
});

test('suppresses redundant plural after explicit numeral', () => {
  const out = translatePtToNeo('21 anos').text;
  assert.equal(out, 'dyrfen om');
  assert.equal(out.includes(' li '), false);
});

test('applies place locative by morar government and place ending', () => {
  const salvador=translatePtToNeo('eu moro Salvador');
  assert.equal(salvador.text, 'mai salvadoria lene');
  assert.equal(salvador.analysis.some(x=>x.type==='locative'&&x.neo==='salvadoria'&&x.suffix==='-ia'), true);

  const lisboa=translatePtToNeo('eu moro Lisboa');
  assert.equal(lisboa.text, 'mai lisboala lene');
  assert.equal(lisboa.analysis.some(x=>x.type==='locative'&&x.neo==='lisboala'&&x.suffix==='-la'), true);
});

test('explicit locative preposition uses the same place allomorphy', () => {
  assert.equal(translatePtToNeo('eu moro em Salvador').text, 'mai salvadoria lene');
});

test('copula fusion removes spurious ergative marking from proper-name subjects', () => {
  const out=translatePtToNeo('Pedro é professor').text;
  assert.equal(out.startsWith('Pedroka '), false);
  assert.match(out, /^Pedro\s+.+ia$/);
});

test('translates a long conversational sentence concisely with grammar explained', () => {
  const result = translatePtToNeo(
    'Olá! Tudo bem? Meu nome é Pedro. Eu tenho 21 anos, e moro Salvador.'
  );

  assert.match(result.text, /sava\?/i);
  assert.match(result.text, /pedroia/i);
  assert.match(result.text, /dyrfen om/i);
  assert.match(result.text, /\bei\b/i);
  assert.match(result.text, /salvadoria/i);
  assert.equal(result.text.includes(' li om'), false);

  const fusion = result.analysis.find(x => x.type === 'copula-fusion');
  assert.ok(fusion);
  assert.match(fusion.explanation, /cópula presente/i);

  const locative = result.analysis.find(x => x.type === 'locative');
  assert.ok(locative);
  assert.equal(locative.neo, 'salvadoria');
});

test('Neo to Portuguese decomposes fused copula in lexical and proper-name predicates', () => {
  assert.equal(translateNeoToPt('mai gylaia').text, 'eu sou estável');
  assert.match(translateNeoToPt('mal muje Pedroia').text, /meu\/minha nome é Pedro/i);
});

test('Neo to Portuguese reverses place locative under morar', () => {
  assert.match(translateNeoToPt('mai salvadoria lene').text, /eu moro em salvador/i);
  assert.match(translateNeoToPt('mai lisboala lene').text, /eu moro em lisboa/i);
});

test('coordinating conjunctions preserve independent clause order', () => {
  assert.equal(translatePtToNeo('eu como e você bebe').text, 'mai selir ei tys velir');
  const contrast=translatePtToNeo('eu trabalho mas estou cansado').text;
  assert.match(contrast, /^mai varir mei .+ia$/);
});


test('uses hei for yes and ie for modern negation', () => {
  assert.equal(translatePtToNeo('sim').text, 'hei');
  assert.equal(translatePtToNeo('não').text, 'ie');
  assert.equal(translatePtToNeo('eu não trabalho').text, 'mai ie varir');
  assert.equal(translateNeoToPt('hei').text, 'sim');
  assert.equal(translateNeoToPt('ie').text, 'não');
  assert.equal(translateNeoToPt('no').text, 'não');
});

test('explains ie as the negation particle', () => {
  const result = translatePtToNeo('eu não trabalho');
  assert.equal(result.analysis.some(x => x.type === 'negation' && x.neo === 'ie'), true);
});
