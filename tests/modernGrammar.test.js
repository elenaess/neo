const test = require('node:test');
const assert = require('node:assert/strict');
const {translatePtToNeo,translateNeoToPt,searchLexicon} = require('../src/engine/neoEngine');

test('preserves punctuation in place', () => {
  assert.equal(translatePtToNeo('Eu como, você bebe!').text.includes(','), true);
  assert.equal(translatePtToNeo('Eu como, você bebe!').text.endsWith('!'), true);
  assert.equal(/\s[,!?;:.]/.test(translatePtToNeo('Eu como, você bebe!').text), false);
});

test('uses modern copula markers a, da and auf', () => {
  assert.equal(translatePtToNeo('eu sou estável').text, 'mai gyla a');
  assert.equal(translatePtToNeo('eu estava estável').text, 'mai gyla da');
  assert.equal(translatePtToNeo('eu estarei estável').text, 'mai gyla auf');
});

test('treats imperfect and imperfect subjunctive as past', () => {
  assert.equal(translatePtToNeo('eu comia').text.includes('da'), true);
  assert.equal(translatePtToNeo('se estivesse estável').text, 'se gyla da');
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
