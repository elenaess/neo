const core = require('./core');
const LEXICON = require('../data/lexicon.json');

function norm(s){
  return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
}
function translatePtToNeo(text){ return core.P2N(String(text ?? '')); }
function translateNeoToPt(text){ return core.N2P(String(text ?? '')); }
function searchLexicon(query, filters={}){
  const q=norm(query);
  const domain=filters.domain || null;
  const register=filters.register || null;
  return LEXICON.filter(e => {
    if(domain && e.dominio !== domain) return false;
    if(register && e.registro !== register) return false;
    if(!q) return true;
    const hay=[e.pt,e.neo,e.raiz,e.dominio,e.registro,e.base_pt].map(norm).join(' ');
    return hay.includes(q);
  }).sort((a,b) => {
    const ae=norm(a.pt)===q ? 0 : 1;
    const be=norm(b.pt)===q ? 0 : 1;
    return ae-be || String(a.pt).localeCompare(String(b.pt),'pt-BR');
  });
}
module.exports={translatePtToNeo,translateNeoToPt,searchLexicon,LEXICON,DOMAINS:[...new Set(LEXICON.map(x=>x.dominio))].sort()};
