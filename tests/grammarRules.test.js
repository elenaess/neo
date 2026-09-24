const test = require('node:test');
const assert = require('node:assert/strict');

const {
  collapseFixedExpressions,
  translateFunctionWord,
  applyPlaceLocative,
  fusePresentCopula,
  decomposePresentCopula,
  shouldSuppressPluralAfterNumeral,
} = require('../src/engine/grammarRules');

test('function word e maps to ei without treating é as e', () => {
  assert.deepEqual(translateFunctionWord('e'), {neo:'ei', kind:'conjunction', gloss:'e'});
  assert.equal(translateFunctionWord('é'), null);
});

test('fixed wellbeing expressions collapse before lexical translation', () => {
  assert.deepEqual(collapseFixedExpressions(['tudo','bem']), ['sava']);
  assert.deepEqual(collapseFixedExpressions(['está','bem']), ['sava']);
});

test('place locative uses ia after consonant and la after vowel', () => {
  assert.equal(applyPlaceLocative('salvador', {isPlace:true}), 'salvadoria');
  assert.equal(applyPlaceLocative('lisboa', {isPlace:true}), 'lisboala');
  assert.equal(applyPlaceLocative('ferro', {isPlace:false}), 'ferro');
});

test('present copula surface fusion follows approved euphony', () => {
  assert.equal(fusePresentCopula('pedro'), 'pedroia');
  assert.equal(fusePresentCopula('elena'), 'elenaia');
  assert.equal(fusePresentCopula('doma'), 'domaia');
  assert.equal(fusePresentCopula('mar'), 'mara');
  assert.equal(fusePresentCopula('letir'), 'letira');
});

test('copula decomposition requires a valid known base', () => {
  const known = new Set(['pedro','elena','doma','mar','letir']);
  assert.deepEqual(decomposePresentCopula('pedroia', known), {base:'pedro', copula:'a'});
  assert.deepEqual(decomposePresentCopula('mara', known), {base:'mar', copula:'a'});
  assert.equal(decomposePresentCopula('historia', known), null);
});

test('numeral greater than one suppresses adjacent plural marker', () => {
  assert.equal(
    shouldSuppressPluralAfterNumeral({type:'numeral', value:21}, {type:'word', plural:true}),
    true,
  );
  assert.equal(
    shouldSuppressPluralAfterNumeral({type:'numeral', value:1}, {type:'word', plural:true}),
    false,
  );
});
