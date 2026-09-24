let injected = null;
let instance = null;
let loaded = false;
let loading = null;

function coerceVoskModule(mod) {
  const candidate = mod?.default ?? mod?.Vosk ?? mod;
  if (typeof candidate === 'function') return new candidate();
  if (candidate && typeof candidate === 'object' && typeof candidate.loadModel === 'function') return candidate;
  if (mod && typeof mod === 'object' && typeof mod.loadModel === 'function') return mod;
  throw new TypeError('react-native-vosk não expôs uma API compatível.');
}

function getVosk(){
  if (injected) return injected;
  if (instance) return instance;
  instance = coerceVoskModule(require('react-native-vosk'));
  return instance;
}

function normalizeResult(value){
  if (typeof value !== 'string') {
    if (value && typeof value.text === 'string') return value.text.trim();
    if (value && typeof value.partial === 'string') return value.partial.trim();
    if (value && typeof value.message === 'string') return value.message.trim();
    return String(value ?? '').trim();
  }
  const raw=value.trim();
  if (!raw) return '';
  try {
    const obj=JSON.parse(raw);
    if (obj && typeof obj.text === 'string') return obj.text.trim();
    if (obj && typeof obj.partial === 'string') return obj.partial.trim();
  } catch (_) {}
  return raw;
}

async function loadPortugueseModel(){
  if (loaded) return;
  if (loading) return loading;
  const vosk=getVosk();
  loading = Promise.resolve(vosk.loadModel('model-small-pt'))
    .then(()=>{loaded=true;})
    .finally(()=>{loading=null;});
  return loading;
}

async function startListening(options={}){
  await loadPortugueseModel();
  const vosk=getVosk();
  if (typeof vosk.start === 'function') return vosk.start({timeout:15000,...options});
  if (typeof vosk.startListening === 'function') return vosk.startListening({timeout:15000,...options});
  throw new TypeError('Vosk não expõe start/startListening.');
}

function stopListening(){
  const vosk=getVosk();
  if (typeof vosk.stop === 'function') return Promise.resolve(vosk.stop());
  if (typeof vosk.stopListening === 'function') return Promise.resolve(vosk.stopListening());
  return Promise.resolve();
}

function unloadModel(){
  if (!injected && !instance) return Promise.resolve();
  const vosk=getVosk();
  loaded=false;
  if (typeof vosk.unload === 'function') return Promise.resolve(vosk.unload());
  if (typeof vosk.unloadModel === 'function') return Promise.resolve(vosk.unloadModel());
  return Promise.resolve();
}

function emptySub(){ return {remove(){}}; }
function collectSubs(subs){
  return {remove(){ for(const sub of subs) sub?.remove?.(); }};
}

function subscribeResults(callback){
  const vosk=getVosk();
  const subs=[];
  if (typeof vosk.onResult === 'function') {
    subs.push(vosk.onResult(value=>{
      const text=normalizeResult(value);
      if(text) callback(text);
    }));
  }
  if (typeof vosk.onFinalResult === 'function') {
    subs.push(vosk.onFinalResult(value=>{
      const text=normalizeResult(value);
      if(text) callback(text);
    }));
  }
  return subs.length?collectSubs(subs):emptySub();
}

function subscribePartialResults(callback){
  const vosk=getVosk();
  if (typeof vosk.onPartialResult !== 'function') return emptySub();
  return vosk.onPartialResult(value=>callback(normalizeResult(value)));
}

function subscribeErrors(callback){
  const vosk=getVosk();
  if (typeof vosk.onError !== 'function') return emptySub();
  return vosk.onError(value=>callback(normalizeResult(value)||String(value)));
}

function __setVoskForTests(fake){
  injected=fake; instance=null; loaded=false; loading=null;
}
function __coerceVoskModuleForTests(mod){ return coerceVoskModule(mod); }

module.exports={
  loadPortugueseModel,startListening,stopListening,unloadModel,
  subscribeResults,subscribePartialResults,subscribeErrors,
  normalizeResult,__setVoskForTests,__coerceVoskModuleForTests,
};
