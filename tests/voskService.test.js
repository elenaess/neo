const test = require('node:test');
const assert = require('node:assert/strict');

function fresh(){
  delete require.cache[require.resolve('../src/speech/voskService')];
  return require('../src/speech/voskService');
}

test('loads the bundled Brazilian Portuguese model exactly once', async () => {
  const svc=fresh();
  const calls=[];
  const fake={loadModel:async p=>calls.push(['load',p]),start:async()=>{},stop(){},unload(){},onResult(){return {remove(){}}},onPartialResult(){return {remove(){}}},onFinalResult(){return {remove(){}}},onError(){return {remove(){}}}};
  svc.__setVoskForTests(fake);
  await svc.loadPortugueseModel();
  await svc.loadPortugueseModel();
  assert.deepEqual(calls,[['load','model-small-pt']]);
});

test('starts and stops offline recognition and forwards normalized final results', async () => {
  const svc=fresh();
  let resultCb; const calls=[];
  const fake={
    loadModel:async p=>calls.push(['load',p]),
    start:async opts=>calls.push(['start',opts]),
    stop:()=>calls.push(['stop']), unload:()=>calls.push(['unload']),
    onResult:cb=>{resultCb=cb;return {remove(){calls.push(['remove'])}}},
    onPartialResult:()=>({remove(){}}),onFinalResult:()=>({remove(){}}),onError:()=>({remove(){}})
  };
  svc.__setVoskForTests(fake);
  await svc.loadPortugueseModel();
  const seen=[]; const sub=svc.subscribeResults(t=>seen.push(t));
  await svc.startListening();
  resultCb('{"text":"eu quero comer"}');
  svc.stopListening();
  sub.remove();
  assert.deepEqual(seen,['eu quero comer']);
  assert.equal(calls.some(x=>x[0]==='start'),true);
  assert.equal(calls.some(x=>x[0]==='stop'),true);
});
