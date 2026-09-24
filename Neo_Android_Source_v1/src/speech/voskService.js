let injected = null;
let instance = null;
let loaded = false;
let loading = null;

function getVosk(){
  if (injected) return injected;
  if (instance) return instance;
  // Lazy require keeps Node tests and dictionary tooling independent of React Native.
  const mod = require('react-native-vosk');
  const Vosk = mod.default || mod;
  instance = new Vosk();
  return instance;
}

function normalizeResult(value){
  if (typeof value !== 'string') {
    if (value && typeof value.text === 'string') return value.text.trim();
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
  loading = getVosk().loadModel('model-small-pt').then(()=>{loaded=true;}).finally(()=>{loading=null;});
  return loading;
}

async function startListening(options={}){
  await loadPortugueseModel();
  return getVosk().start({timeout: 15000, ...options});
}

function stopListening(){
  return getVosk().stop();
}

function unloadModel(){
  if (!injected && !instance) return;
  const v=getVosk();
  loaded=false;
  return v.unload();
}

function subscribeResults(callback){
  const v=getVosk();
  const sub=v.onResult(value=>{
    const text=normalizeResult(value);
    if (text) callback(text);
  });
  return sub;
}

function subscribePartialResults(callback){
  const v=getVosk();
  return v.onPartialResult(value=>{
    const text=normalizeResult(value);
    if (text) callback(text);
  });
}

function subscribeErrors(callback){
  return getVosk().onError(callback);
}

function __setVoskForTests(fake){
  injected=fake; instance=null; loaded=false; loading=null;
}

module.exports={
  loadPortugueseModel,startListening,stopListening,unloadModel,
  subscribeResults,subscribePartialResults,subscribeErrors,
  normalizeResult,__setVoskForTests,
};
