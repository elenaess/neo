const modern = require('./modernGrammar');
const LEXICON = modern.LEXICON;
const {
  createLexiconIndex,
  searchLexiconPage: searchPage,
} = require('./lexiconSearch');
const {formatAnalysis} = require('./analysisFormatter');

let SEARCH_INDEX = createLexiconIndex(LEXICON);
let SEARCH_INDEX_SIZE = LEXICON.length;

function refreshSearchIndexIfNeeded(){
  if(SEARCH_INDEX_SIZE === LEXICON.length) return;
  SEARCH_INDEX = createLexiconIndex(LEXICON);
  SEARCH_INDEX_SIZE = LEXICON.length;
}

function translatePtToNeo(text){ return modern.translatePtToNeo(String(text ?? '')); }
function translateNeoToPt(text){ return modern.translateNeoToPt(String(text ?? '')); }

function searchLexiconPage(query, options={}){
  modern.ensureSearchEntry(query);
  refreshSearchIndexIfNeeded();
  return searchPage(SEARCH_INDEX, query, options);
}

function searchLexicon(query, filters={}){
  return searchLexiconPage(query, {...filters, offset:0, limit:100}).items;
}

module.exports={
  translatePtToNeo,
  translateNeoToPt,
  searchLexicon,
  searchLexiconPage,
  formatAnalysis,
  LEXICON,
  DOMAINS:[...new Set(LEXICON.map(x=>x.dominio))].sort(),
};
