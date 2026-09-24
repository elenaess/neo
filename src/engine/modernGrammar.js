const core = require('./core');
const {
  collapseFixedExpressions,
  translateFunctionWord,
  applyPlaceLocative,
  fusePresentCopula,
  decomposePresentCopula,
  shouldSuppressPluralAfterNumeral,
  functionPlaceholder,
} = require('./grammarRules');
const {registerModernLexicon, CONNECTIVES} = require('./modernLexicon');

const norm = value => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

function makeEntry(neo, pt, classe, dominio = 'Gramática/Moderno', extra = {}) {
  return {
    neo, pt, classe,
    raiz: extra.raiz || neo,
    derivacao: extra.derivacao || 'base',
    harmonia: extra.harmonia || 'A',
    dominio,
    frequencia: extra.frequencia || 'núcleo',
    exemplo_neo: extra.exemplo_neo || '',
    exemplo_pt: extra.exemplo_pt || '',
    base_pt: extra.base_pt || pt,
    forma_legada: extra.forma_legada || '',
    registro: extra.registro || 'neutro',
    fonte_vocabulario: extra.fonte_vocabulario || 'Neo moderno',
    ...extra,
  };
}

function registerEntry(entry) {
  const current = core.NM.get(entry.neo);
  if (current && norm(current.pt) !== norm(entry.pt)) return current;
  if (!current) core.L.push(entry);
  core.NM.set(entry.neo, entry);
  core.PM.set(norm(entry.pt), entry);
  if (entry.base_pt) core.PM.set(norm(entry.base_pt), entry);
  for (const alias of entry.aliases || []) core.PM.set(norm(alias), entry);
  return entry;
}

const STATIC_EXTRA = [
  makeEntry('gyla', 'estável', 'adjetivo', 'Qualidades', {harmonia: 'A'}),
  makeEntry('om', 'ano', 'substantivo', 'Tempo'),
  makeEntry('leif', 'ter', 'verbo', 'Gramática/Verbos', {lemma_pt:'ter'}),
  makeEntry('ca', 'ser', 'verbo', 'Gramática/Verbos', {lemma_pt:'ser', forma_legada:'lede'}),
  makeEntry('hei', 'sim', 'partícula', 'Gramática/Partículas'),
  makeEntry('ie', 'não', 'partícula', 'Gramática/Partículas', {forma_legada:'no'}),
  makeEntry('ur', 'zero', 'numeral', 'Gramática/Numerais'),
  makeEntry('deri', 'um', 'numeral', 'Gramática/Numerais'),
  makeEntry('care', 'dois', 'numeral', 'Gramática/Numerais'),
  makeEntry('tavi', 'três', 'numeral', 'Gramática/Numerais'),
  makeEntry('peni', 'quatro', 'numeral', 'Gramática/Numerais'),
  makeEntry('gori', 'cinco', 'numeral', 'Gramática/Numerais'),
  makeEntry('naku', 'seis', 'numeral', 'Gramática/Numerais'),
  makeEntry('bely', 'sete', 'numeral', 'Gramática/Numerais'),
  makeEntry('hiri', 'oito', 'numeral', 'Gramática/Numerais'),
  makeEntry('mepo', 'nove', 'numeral', 'Gramática/Numerais'),
  makeEntry('em', 'dez', 'numeral', 'Gramática/Numerais'),
  makeEntry('fen', 'vinte', 'numeral', 'Gramática/Numerais'),
  makeEntry('tal', 'trinta', 'numeral', 'Gramática/Numerais'),
  makeEntry('vor', 'quarenta', 'numeral', 'Gramática/Numerais'),
  makeEntry('lum', 'cinquenta', 'numeral', 'Gramática/Numerais'),
  makeEntry('nec', 'sessenta', 'numeral', 'Gramática/Numerais'),
  makeEntry('zar', 'setenta', 'numeral', 'Gramática/Numerais'),
  makeEntry('kiv', 'oitenta', 'numeral', 'Gramática/Numerais'),
  makeEntry('nop', 'noventa', 'numeral', 'Gramática/Numerais'),
  makeEntry('ami', 'cem', 'numeral', 'Gramática/Numerais'),
  makeEntry('mon', 'mil', 'numeral', 'Gramática/Numerais'),
];
STATIC_EXTRA.forEach(registerEntry);
core.L2N.ter='leif'; core.N2L.leif='ter';
core.L2N.ser='ca'; core.N2L.ca='ser';
const MODERN_LEXICON_STATS = registerModernLexicon({registerEntry, makeEntry, core, targetAdditions:500});

const UNIT_FULL = ['ur','deri','care','tavi','peni','gori','naku','bely','hiri','mepo'];
const UNIT_PREFIX = ['', 'dyr','car','tav','pen','gor','nak','bel','hir','mep'];
const TENS = ['', 'em','fen','tal','vor','lum','nec','zar','kiv','nop'];

function numberBelow100(n) {
  if (n < 10) return UNIT_FULL[n];
  const tens = Math.floor(n / 10);
  const unit = n % 10;
  return unit ? `${UNIT_PREFIX[unit]}${TENS[tens]}` : TENS[tens];
}

function numberBelow1000(n) {
  if (n < 100) return numberBelow100(n);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = hundreds === 1 ? 'ami' : `${UNIT_FULL[hundreds]} ami`;
  if (!rest) return head;
  if (hundreds === 1 && rest < 10) return `${UNIT_PREFIX[rest]}ami`;
  return `${head}-${numberBelow100(rest)}`;
}

function numberToNeo(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(value);
  if (n < 1000) return numberBelow1000(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = thousands === 1 ? 'mon' : `${UNIT_FULL[thousands]} mon`;
  if (!rest) return head;
  if (thousands === 1 && rest < 10) return `${UNIT_PREFIX[rest]}mon`;
  if (rest >= 100) {
    const tail = numberBelow1000(rest);
    if (tail.startsWith('ami')) return `${head}${tail}`;
    return `${head}-${tail}`;
  }
  return `${head}-${numberBelow100(rest)}`;
}

const PT_SMALL = {
  zero:0, um:1, uma:1, dois:2, duas:2, tres:3, quatro:4, cinco:5,
  seis:6, sete:7, oito:8, nove:9, dez:10, onze:11, doze:12, treze:13,
  quatorze:14, catorze:14, quinze:15, dezesseis:16, dezasseis:16,
  dezessete:17, dezassete:17, dezoito:18, dezenove:19,
};
const PT_TENS = {vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90};
const PT_HUNDREDS = {cem:100,cento:100,duzentos:200,trezentos:300,quatrocentos:400,quinhentos:500,seiscentos:600,setecentos:700,oitocentos:800,novecentos:900};

function isPtNumberWord(token) {
  const raw = String(token).toLowerCase();
  const z = norm(token);
  return raw === 'e' || Object.prototype.hasOwnProperty.call(PT_SMALL, z) ||
    Object.prototype.hasOwnProperty.call(PT_TENS, z) ||
    Object.prototype.hasOwnProperty.call(PT_HUNDREDS, z) || z === 'mil';
}

function parsePortugueseNumberTokens(tokens) {
  if (!tokens.length) return null;
  let total = 0, current = 0, seen = false;
  for (const token of tokens) {
    const z = norm(token);
    if (String(token).toLowerCase() === 'e') {
      if (!seen) return null;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(PT_SMALL, z)) {
      current += PT_SMALL[z]; seen = true; continue;
    }
    if (Object.prototype.hasOwnProperty.call(PT_TENS, z)) {
      current += PT_TENS[z]; seen = true; continue;
    }
    if (Object.prototype.hasOwnProperty.call(PT_HUNDREDS, z)) {
      current += PT_HUNDREDS[z]; seen = true; continue;
    }
    if (z === 'mil') {
      if (!seen) current = 1;
      total += current * 1000;
      current = 0;
      seen = true;
      continue;
    }
    return null;
  }
  const result = total + current;
  return seen && result <= 9999 ? result : null;
}


const PT_UNITS_WORD = ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove'];

const PT_TEENS_WORD = {
  10:'dez',11:'onze',12:'doze',13:'treze',14:'quatorze',
  15:'quinze',16:'dezesseis',17:'dezessete',18:'dezoito',19:'dezenove',
};
const PT_TENS_WORD = {
  20:'vinte',30:'trinta',40:'quarenta',50:'cinquenta',
  60:'sessenta',70:'setenta',80:'oitenta',90:'noventa',
};
const PT_HUNDREDS_WORD = {
  100:'cento',200:'duzentos',300:'trezentos',400:'quatrocentos',
  500:'quinhentos',600:'seiscentos',700:'setecentos',800:'oitocentos',900:'novecentos',
};

function numberBelow100Pt(n) {
  if (n < 10) return PT_UNITS_WORD[n];
  if (n < 20) return PT_TEENS_WORD[n];
  const tens = Math.floor(n / 10) * 10;
  const unit = n % 10;
  return unit ? `${PT_TENS_WORD[tens]} e ${PT_UNITS_WORD[unit]}` : PT_TENS_WORD[tens];
}

function numberBelow1000Pt(n) {
  if (n < 100) return numberBelow100Pt(n);
  if (n === 100) return 'cem';
  const hundreds = Math.floor(n / 100) * 100;
  const rest = n % 100;
  return rest ? `${PT_HUNDREDS_WORD[hundreds]} e ${numberBelow100Pt(rest)}` : PT_HUNDREDS_WORD[hundreds];
}

function numberToPortuguese(n) {
  n = Number(n);
  if (!Number.isInteger(n) || n < 0 || n > 9999) return String(n);
  if (n < 1000) return numberBelow1000Pt(n);
  const thousands = Math.floor(n / 1000);
  const rest = n % 1000;
  const head = thousands === 1 ? 'mil' : `${PT_UNITS_WORD[thousands]} mil`;
  if (!rest) return head;
  const joiner = rest < 100 || rest % 100 === 0 ? ' e ' : ' ';
  return `${head}${joiner}${numberBelow1000Pt(rest)}`;
}

function mannerNeo(base) {
  return /[aeiouy]$/i.test(base) ? `${base.slice(0, -1)}au` : `${base}au`;
}

function mannerPortuguese(adjective) {
  let base = String(adjective);
  if (/o$/i.test(base)) base = `${base.slice(0, -1)}a`;
  return `${base}mente`;
}

function ensureMannerForPortuguese(raw) {
  const z = norm(raw);
  if (!z.endsWith('mente')) return null;
  if (core.PM.has(z)) return core.PM.get(z);
  const stem = z.slice(0, -5);
  const candidates = [stem, stem.replace(/a$/, 'o')];
  for (const candidate of candidates) {
    const adjective = core.PM.get(candidate);
    if (!adjective || adjective.classe !== 'adjetivo') continue;
    const entry = makeEntry(
      mannerNeo(adjective.neo),
      String(raw).toLowerCase(),
      'advérbio',
      'Gramática/Advérbios',
      {raiz: adjective.raiz || adjective.neo, derivacao: 'advérbio_modo', base_pt: String(raw).toLowerCase()},
    );
    return registerEntry(entry);
  }
  return null;
}

registerEntry(makeEntry('gylau', 'estavelmente', 'advérbio', 'Gramática/Advérbios', {
  raiz:'gyla', derivacao:'advérbio_modo', base_pt:'estavelmente',
}));

const EXTRA_VERBS = new Map();

function putVerb(forms, lemma, tense, extra = {}) {
  for (const form of forms) EXTRA_VERBS.set(norm(form), {lemma, tense, ...extra});
}

putVerb(['era','eras','éramos','eramos','eram'], 'ser', 'past');
putVerb(['fosse','fosses','fôssemos','fossemos','fossem'], 'ser', 'past');
putVerb(['seria','serias','seríamos','seriamos','seriam'], 'ser', 'future');
putVerb(['for','fores','formos','forem'], 'ser', 'future', {subjunctive:true});

putVerb(['estava','estavas','estávamos','estavamos','estavam'], 'estar', 'past');
putVerb(['estivesse','estivesses','estivéssemos','estivessemos','estivessem'], 'estar', 'past');
putVerb(['estaria','estarias','estaríamos','estariamos','estariam'], 'estar', 'future');
putVerb(['estiver','estiveres','estivermos','estiverem'], 'estar', 'future', {subjunctive:true});

putVerb(['tinha','tinhas','tínhamos','tinhamos','tinham'], 'ter', 'past');
putVerb(['fazia','fazias','fazíamos','faziamos','faziam'], 'fazer', 'past');
putVerb(['dizia','dizias','dizíamos','diziamos','diziam'], 'dizer', 'past');
putVerb(['ia','ias','íamos','iamos','iam'], 'ir', 'past');
putVerb(['vinha','vinhas','vínhamos','vinhamos','vinham'], 'vir', 'past');
putVerb(['via','vias','víamos','viamos','viam'], 'ver', 'past');
putVerb(['podia','podias','podíamos','podiamos','podiam'], 'poder', 'past');
putVerb(['queria','querias','queríamos','queriamos','queriam'], 'querer', 'past');
putVerb(['sabia','sabias','sabíamos','sabiamos','sabiam'], 'saber', 'past');

function addRegularVerbForms() {
  for (const lemma of Object.keys(core.L2N)) {
    if (!/(ar|er|ir)$/.test(lemma)) continue;
    const ending = lemma.slice(-2);
    const stem = lemma.slice(0, -2);
    const imperfect = ending === 'ar'
      ? [`${stem}ava`,`${stem}avas`,`${stem}avamos`,`${stem}avam`]
      : [`${stem}ia`,`${stem}ias`,`${stem}iamos`,`${stem}iam`];
    const subjSuffix = ending === 'ar' ? 'ass' : ending === 'er' ? 'ess' : 'iss';
    const subj = [`${stem}${subjSuffix}e`,`${stem}${subjSuffix}es`,`${stem}${subjSuffix}emos`,`${stem}${subjSuffix}em`];
    const conditional = [`${lemma}ia`,`${lemma}ias`,`${lemma}iamos`,`${lemma}iam`];
    for (const form of imperfect) if (!EXTRA_VERBS.has(form)) EXTRA_VERBS.set(form,{lemma,tense:'past'});
    for (const form of subj) if (!EXTRA_VERBS.has(form)) EXTRA_VERBS.set(form,{lemma,tense:'past',subjunctive:true});
    for (const form of conditional) if (!EXTRA_VERBS.has(form)) EXTRA_VERBS.set(form,{lemma,tense:'future',conditional:true});
  }
}
addRegularVerbForms();

const CANONICAL_VERB = new Map();
for (const [form, data] of Object.entries(core.VF)) {
  if (!data.tense) continue;
  const key = `${data.lemma}:${data.tense}`;
  if (!CANONICAL_VERB.has(key)) CANONICAL_VERB.set(key, form);
}

function resolveVerb(raw, previous = '') {
  const z = norm(raw);
  let info = EXTRA_VERBS.get(z) || core.VF[z] || null;
  if (!info) return null;
  if (['se','neofunc_se'].includes(norm(previous)) && info.inf) info = {...info, tense:'future', subjunctive:true};
  return info;
}

function canonicalVerb(info, fallback) {
  if (!info?.tense) return fallback;
  return CANONICAL_VERB.get(`${info.lemma}:${info.tense}`) || fallback;
}

function normalizeVerbTokens(tokens) {
  return tokens.map((token, i) => {
    const info = resolveVerb(token, tokens[i - 1] || '');
    if (!info) return token;
    if (EXTRA_VERBS.has(norm(token)) || (['se','neofunc_se'].includes(norm(tokens[i - 1] || '')) && info.inf)) {
      return canonicalVerb(info, token);
    }
    return token;
  });
}


const LOCATIVE_GOVERNORS = new Set(['morar','residir']);
const LOCATIVE_PREPOSITIONS = new Set(['em','no','na','nos','nas','num','numa','nuns','numas']);

function isProperPlaceToken(token) {
  return /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/u.test(String(token || ''));
}

function isKnownPlaceToken(token) {
  const key = norm(token);
  const entry = core.PM.get(key);
  return MODERN_LEXICON_STATS.places.has(key) || entry?.isPlace === true || isProperPlaceToken(token);
}

function injectLocativeGovernment(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    out.push(token);
    const info = resolveVerb(token, tokens[i - 1] || '');
    if (!info || !LOCATIVE_GOVERNORS.has(info.lemma)) continue;
    const next = tokens[i + 1];
    if (!next) continue;
    if (LOCATIVE_PREPOSITIONS.has(norm(next))) continue;
    if (isKnownPlaceToken(next)) out.push('em');
  }
  return out;
}

function surfaceTokens(text) {
  return String(text ?? '').match(/[\p{L}\p{M}0-9_]+(?:-[\p{L}\p{M}0-9_]+)*|\.{3}|[.,!?;:()[\]{}"“”‘’—–-]/gu) || [];
}

const PUNCT = new Set(['.','...',',','!','?',';',':','(',')','[',']','{','}','"','“','”','‘','’','—','–','-']);

function joinSurface(parts) {
  let s = parts.filter(Boolean).join(' ');
  s = s.replace(/\s+(\.{3}|[.,!?;:)\]}])/g, '$1');
  s = s.replace(/([(\[{“‘])\s+/g, '$1');
  s = s.replace(/\s+([”’])/g, '$1');
  s = s.replace(/\s*([—–])\s*/g, ' $1 ');
  return s.replace(/\s{2,}/g, ' ').trim();
}

function registerNumberPlaceholder(n, direction) {
  if (direction === 'pt-neo') {
    const key = `neonum${n}`;
    const entry = makeEntry(numberToNeo(n), key, 'numeral', 'Gramática/Numerais', {base_pt:key});
    core.PM.set(key, entry);
    return key;
  }
  const key = `numneo${n}`;
  const pt = numberToPortuguese(n);
  const entry = makeEntry(key, pt, 'numeral', 'Gramática/Numerais', {base_pt:pt});
  core.NM.set(key, entry);
  return key;
}

function replacePortugueseNumbers(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length;) {
    const token = tokens[i];
    if (/^\d+$/.test(token)) {
      const n = Number(token);
      if (n <= 9999) out.push(registerNumberPlaceholder(n, 'pt-neo'));
      else out.push(token);
      i += 1;
      continue;
    }
    if (!isPtNumberWord(token)) {
      out.push(token);
      i += 1;
      continue;
    }
    let j = i;
    const seq = [];
    while (j < tokens.length && isPtNumberWord(tokens[j])) {
      seq.push(tokens[j]);
      j += 1;
    }
    const n = parsePortugueseNumberTokens(seq);
    const ambiguousOne = seq.length === 1 && ['um','uma'].includes(norm(seq[0]));
    if (n != null && !ambiguousOne) {
      out.push(registerNumberPlaceholder(n, 'pt-neo'));
      i = j;
    } else {
      out.push(token);
      i += 1;
    }
  }
  return out;
}

const NEO_NUMBER_REVERSE = new Map();
for (let i = 0; i <= 9999; i++) {
  const form = numberToNeo(i);
  if (!NEO_NUMBER_REVERSE.has(form)) NEO_NUMBER_REVERSE.set(form, i);
}

function replaceNeoNumbers(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length;) {
    let matched = null;
    if (i + 1 < tokens.length) {
      const pair = `${tokens[i]} ${tokens[i + 1]}`;
      if (NEO_NUMBER_REVERSE.has(pair)) matched = {n: NEO_NUMBER_REVERSE.get(pair), count:2};
    }
    if (!matched && NEO_NUMBER_REVERSE.has(tokens[i])) {
      matched = {n: NEO_NUMBER_REVERSE.get(tokens[i]), count:1};
    }
    if (matched) {
      out.push(registerNumberPlaceholder(matched.n, 'neo-pt'));
      i += matched.count;
    } else {
      out.push(tokens[i]);
      i += 1;
    }
  }
  return out;
}

function replaceFunctionWords(tokens) {
  return tokens.map(token => {
    const fn = translateFunctionWord(token);
    if (!fn) return token;
    return functionPlaceholder(token);
  });
}

function normalizeAnalysisUnits(units) {
  return (units || []).map(unit => {
    if (String(unit?.raw || '').startsWith('neofunc_')) {
      const gloss = unit?.entry?.pt || String(unit.raw).slice('neofunc_'.length).replace(/_/g,' ');
      const isConjunction = unit?.entry?.classe === 'conjunção';
      return {
        ...unit,
        type:'function',
        pos:isConjunction ? 'conjunção' : (unit?.entry?.classe || 'função'),
        pt:gloss,
        neo:unit?.entry?.neo || unit.neo,
        explanation:isConjunction ? `conjunção “${gloss}”` : `expressão relacional “${gloss}”`,
      };
    }
    const m = /^neonum(\d+)$/.exec(String(unit?.raw || unit?.entry?.pt || ''));
    if (m) {
      const value = Number(m[1]);
      return {...unit, type:'numeral', pos:'numeral', pt:String(value), value, neo:numberToNeo(value)};
    }
    return unit;
  });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceSurfaceTokenOnce(text, from, to) {
  const parts = String(text || '').split(/\s+/);
  const index = parts.indexOf(String(from));
  if (index >= 0) parts[index] = to;
  return parts.join(' ');
}

function applyPlaceLocatives(text, analysis) {
  let output = text;
  const transformed = analysis.map(unit => {
    if (unit?.case !== 'loc') return unit;
    const ptBase = unit.entry?.pt || unit.raw || '';
    if (!isKnownPlaceToken(ptBase)) return unit;
    const base = unit.entry?.neo || norm(unit.raw || unit.neo);
    const neo = applyPlaceLocative(base, {isPlace:true});
    const suffix = /[aeiouy]$/i.test(base) ? '-la' : '-ia';
    output = replaceSurfaceTokenOnce(output, unit.neo || unit.raw, neo);
    return {
      ...unit,
      type:'locative',
      neo,
      base,
      pt:ptBase,
      suffix,
      explanation:`${ptBase} com locativo de lugar ${suffix}`,
    };
  });
  return {text:output, analysis:transformed};
}

function applyPluralEconomy(text, analysis) {
  let out = text;
  for (let i = 1; i < analysis.length; i++) {
    const prev = analysis[i - 1];
    const current = analysis[i];
    if (!shouldSuppressPluralAfterNumeral(prev, current)) continue;
    const pattern = new RegExp(`\\b${escapeRegex(prev.neo)}\\s+li\\s+${escapeRegex(current.neo)}\\b`);
    out = out.replace(pattern, `${prev.neo} ${current.neo}`);
    current.pluralSuppressed = true;
  }
  return out;
}

function explicitGrammarAnalysis(analysis, verbs) {
  const out = [];
  for (const unit of analysis) {
    if (unit.plural && !unit.pluralSuppressed) {
      out.push({type:'plural', neo:'li', pt:'plural', explanation:'marcador de plural'});
    }
    out.push(unit);
  }
  const tense = verbs?.[0]?.tense;
  if (tense === 'past') out.push({type:'tense', neo:'da', tense:'past', pt:'passado', explanation:'marcador de passado'});
  if (tense === 'future') out.push({type:'tense', neo:'auf', tense:'future', pt:'futuro', explanation:'marcador de futuro'});
  return out;
}

function ensureMannerEntries(tokens) {
  for (const token of tokens) ensureMannerForPortuguese(token);
}

function restoreCopulaUnit(unit, index) {
  let neo = unit.neo || unit.neoBase || unit.raw || '';
  if (index === 0 && unit.case === 'erg') {
    neo = unit.base || unit.entry?.neo || unit.raw || neo;
  }
  return unit.plural ? `li ${neo}` : neo;
}

function translatePtClause(tokens) {
  if (!tokens.length) return {text:'',analysis:[]};

  const collapsed = collapseFixedExpressions(tokens);
  if (collapsed.length === 1 && norm(collapsed[0]) === 'sim') {
    return {text:'hei',analysis:[{type:'affirmation',neo:'hei',pt:'sim',pos:'partícula',explanation:'partícula de afirmação'}]};
  }
  if (collapsed.length === 1 && norm(collapsed[0]) === 'nao') {
    return {text:'ie',analysis:[{type:'negation',neo:'ie',pt:'não',pos:'partícula',explanation:'partícula de negação'}]};
  }
  const wholeNumber = parsePortugueseNumberTokens(collapsed);
  if (wholeNumber != null) {
    return {
      text:numberToNeo(wholeNumber),
      analysis:[{type:'numeral',pt:collapsed.join(' '),neo:numberToNeo(wholeNumber),value:wholeNumber,pos:'numeral'}],
    };
  }
  if (collapsed.length === 1 && /^\d+$/.test(collapsed[0])) {
    const n = Number(collapsed[0]);
    if (n <= 9999) {
      return {text:numberToNeo(n),analysis:[{type:'numeral',pt:collapsed[0],neo:numberToNeo(n),value:n,pos:'numeral'}]};
    }
  }

  ensureMannerEntries(collapsed);
  let prepared = replacePortugueseNumbers(collapsed);
  prepared = replaceFunctionWords(prepared);
  prepared = prepared.map(token=>norm(token)==='se'?'se':token);
  prepared = normalizeVerbTokens(prepared);
  prepared = injectLocativeGovernment(prepared);

  const result = core.P2N(prepared.join(' '));
  let analysis = normalizeAnalysisUnits(result.analysis || []);
  const placeAdjusted = applyPlaceLocatives(result.text, analysis);
  analysis = placeAdjusted.analysis;
  const verbs = analysis.filter(x => x.type === 'verb');
  const hadNegation = collapsed.some(x => norm(x) === 'nao');

  if (verbs.length === 1 && ['ser','estar'].includes(verbs[0].lemma)) {
    const tense = verbs[0].tense || 'present';
    const marker = tense === 'past' ? 'da' : tense === 'future' ? 'auf' : 'a';
    const nonVerbs = analysis.filter(x => x.type !== 'verb');
    let output = nonVerbs.map((unit, i) => restoreCopulaUnit(unit, i)).filter(Boolean);
    let text = applyPluralEconomy(output.join(' '), analysis);
    output = text ? text.split(/\s+/) : [];

    if (tense === 'present' && !hadNegation && output.length) {
      const baseSurface = output.pop();
      const fused = fusePresentCopula(baseSurface);
      output.push(fused);
      analysis = explicitGrammarAnalysis(analysis.filter(x=>x.type!=='verb'), []);
      analysis.push({
        type:'copula-fusion',
        neo:fused,
        base:baseSurface,
        copula:'a',
        pt:'cópula presente',
        explanation:`fusão eufônica: ${baseSurface} + cópula presente a`,
      });
      return {text:output.join(' '),analysis};
    }

    if (hadNegation) output.push('ie');
    output.push(marker);
    analysis = explicitGrammarAnalysis(analysis.filter(x=>x.type!=='verb'), [{tense}]);
    if (hadNegation) analysis.push({type:'negation',neo:'ie',pt:'não',pos:'partícula',explanation:'partícula de negação'});
    return {text:output.join(' '),analysis};
  }

  let text = placeAdjusted.text.replace(/\bvu\b/g, 'auf').replace(/\bno\b/g, 'ie');
  text = applyPluralEconomy(text, analysis);

  if (verbs.length > 1 && verbs[0].lemma === 'estar') {
    const secondOriginal = prepared.find((token, i) => {
      const info = resolveVerb(token, prepared[i - 1] || '');
      return info?.lemma === verbs[1].lemma && info?.gerund;
    });
    if (secondOriginal) {
      const aux = core.L2N.estar;
      text = text.split(/\s+/).filter((token, idx, all) => {
        if (token !== aux) return true;
        return all.indexOf(aux) !== idx;
      }).join(' ');
    }
  }

  analysis = explicitGrammarAnalysis(analysis, verbs);
  if (hadNegation) analysis.push({type:'negation',neo:'ie',pt:'não',pos:'partícula',explanation:'partícula de negação'});
  return {text,analysis};
}

function neoSubjectPerson(firstToken) {
  const raw = norm(firstToken);
  const base = core.PRON_FORM?.[raw]?.base || raw;
  if (base === 'mai') return 'mi';
  if (base === 'nai') return 'ni';
  if (base === 'vys' || base === 'zei') return 'zi';
  return 'si';
}

function copulaPortugueseForm(tense, person) {
  if (tense === 'past') return {mi:'era',si:'era',ni:'éramos',zi:'eram'}[person] || 'era';
  if (tense === 'future') return {mi:'serei',si:'será',ni:'seremos',zi:'serão'}[person] || 'será';
  return {mi:'sou',si:'é',ni:'somos',zi:'são'}[person] || 'é';
}

function translateNeoCopula(tokens, markerIndex) {
  const marker = norm(tokens[markerIndex]);
  const tense = marker === 'da' ? 'past' : marker === 'auf' ? 'future' : 'present';
  const beforeMarker = tokens.slice(0, markerIndex);
  const negated = beforeMarker.some(x => ['ie','no'].includes(norm(x)));
  const content = beforeMarker.filter(x => !['ie','no'].includes(norm(x)));
  if (!content.length) return {text:copulaPortugueseForm(tense,'si'),analysis:[]};

  const predicateTokens = [content[content.length - 1]];
  const subjectTokens = content.slice(0, -1);
  const subjectPrepared = replaceNeoNumbers(subjectTokens);
  const predicatePrepared = replaceNeoNumbers(predicateTokens);
  const subjectText = subjectPrepared.length ? core.N2P(subjectPrepared.join(' ')).text.trim() : '';
  const predicateText = core.N2P(predicatePrepared.join(' ')).text.trim();
  const firstPronoun = subjectTokens.length ? core.PRON_FORM?.[norm(subjectTokens[0])] : null;
  const person = subjectTokens.length > 1 && firstPronoun?.case === 'poss'
    ? 'si'
    : (subjectTokens.length ? neoSubjectPerson(subjectTokens[0]) : 'si');
  const copula = copulaPortugueseForm(tense, person);
  const out = [];
  if (subjectText) out.push(subjectText);
  if (negated) out.push('não');
  out.push(copula);
  if (predicateText) out.push(predicateText);
  return {text:out.join(' '),analysis:[]};
}

function decodePlaceLocativeToken(token) {
  const raw = String(token || '');
  const word = norm(raw);
  let base = null;
  let suffix = null;
  if (word.endsWith('la')) {
    const candidate = word.slice(0, -2);
    if (/[aeiouy]$/i.test(candidate)) { base = candidate; suffix = '-la'; }
  }
  if (!base && word.endsWith('ia')) {
    const candidate = word.slice(0, -2);
    if (candidate && !/[aeiouy]$/i.test(candidate)) { base = candidate; suffix = '-ia'; }
  }
  if (!base) return null;
  const entry = core.NM.get(base);
  return {raw, base, suffix, pt:entry?.pt || base};
}

function hasNominalContext(tokens) {
  return tokens.some(token => {
    const w = norm(token);
    if (core.PRON_FORM?.[w]) return true;
    const info = core.analyzeNoCase(w);
    return info && info.pos !== 'verbo';
  });
}

function translateNeoClause(tokens) {
  if (!tokens.length) return {text:'',analysis:[]};

  if (tokens.length === 1 && norm(tokens[0]) === 'hei') {
    return {text:'sim',analysis:[{type:'affirmation',neo:'hei',pt:'sim',pos:'partícula'}]};
  }
  if (tokens.length === 1 && ['ie','no'].includes(norm(tokens[0]))) {
    return {text:'não',analysis:[{type:'negation',neo:tokens[0],pt:'não',pos:'partícula'}]};
  }

  const markerIndex = tokens.findIndex(token => ['a','da','auf'].includes(norm(token)));
  const recognizedVerbs = tokens.map(token => {
    const w = norm(token);
    const info = core.analyzeNoCase(w);
    return info?.pos === 'verbo' ? info : null;
  });
  const hasRecognizedVerb = recognizedVerbs.some(Boolean);
  if (markerIndex >= 0 && !hasRecognizedVerb) return translateNeoCopula(tokens, markerIndex);

  if (!hasRecognizedVerb && tokens.length) {
    const knownBases = new Set([...core.NM.keys(), ...Object.keys(core.PRON_FORM || {})]);
    const last = tokens[tokens.length - 1];
    let fused = decomposePresentCopula(last, knownBases);
    if (!fused && tokens.length > 1 && /ia$/i.test(last) && hasNominalContext(tokens.slice(0,-1))) {
      fused = {base:last.slice(0,-2), copula:'a', contextual:true};
    }
    if (fused) {
      const expanded = [...tokens.slice(0, -1), fused.base, 'a'];
      const result = translateNeoCopula(expanded, expanded.length - 1);
      result.analysis = [{
        type:'copula-fusion',
        neo:last,
        base:fused.base,
        copula:'a',
        pt:'cópula presente',
        explanation:`fusão eufônica: ${fused.base} + cópula presente a`,
      }];
      return result;
    }
  }

  const hasLocativeGovernor = recognizedVerbs.some(info => info && LOCATIVE_GOVERNORS.has(info.lemma));
  const decodedLocatives = hasLocativeGovernor
    ? tokens.map(decodePlaceLocativeToken).filter(Boolean)
    : [];

  const prepared = replaceNeoNumbers(tokens).map(token => {
    const w=norm(token);
    if(w==='auf') return 'vu';
    if(w==='ie') return 'no';
    return token;
  });
  const result = core.N2P(prepared.join(' '));
  let text = result.text;
  for (const locative of decodedLocatives) {
    text = replaceSurfaceTokenOnce(text, locative.raw, `em ${locative.pt}`);
  }
  return {...result,text};
}

const CLAUSE_CONNECTORS = new Set(
  CONNECTIVES.filter(item => !item.pt.includes(' ')).map(item => item.pt.toLowerCase()),
);

function isNumericConnector(tokens,index){
  if(String(tokens[index]).toLowerCase()!=='e') return false;
  if(index<=0||index>=tokens.length-1) return false;
  return isPtNumberWord(tokens[index-1])&&isPtNumberWord(tokens[index+1]);
}

function translatePtSequence(tokens){
  if(!tokens.length) return {text:'',analysis:[]};
  const parts=[];
  let analysis=[];
  let segment=[];

  const flush=()=>{
    if(!segment.length) return;
    const result=translatePtClause(segment);
    if(result.text) parts.push(result.text);
    if(result.analysis) analysis=analysis.concat(result.analysis);
    segment=[];
  };

  for(let i=0;i<tokens.length;i++){
    const raw=tokens[i];
    const key=String(raw).toLowerCase();
    const isConnector=CLAUSE_CONNECTORS.has(key)&&!isNumericConnector(tokens,i);
    if(isConnector&&segment.length&&i<tokens.length-1){
      flush();
      const connector=translatePtClause([raw]);
      if(connector.text) parts.push(connector.text);
      if(connector.analysis) analysis=analysis.concat(connector.analysis);
      continue;
    }
    segment.push(raw);
  }
  flush();
  return {text:parts.join(' '),analysis};
}

function translateWithPunctuation(text, clauseTranslator) {
  const tokens = surfaceTokens(text);
  const parts = [];
  let clause = [];
  let analysis = [];

  const flush = () => {
    if (!clause.length) return;
    const result = clauseTranslator(clause);
    if (result.text) parts.push(result.text);
    if (result.analysis) analysis = analysis.concat(result.analysis);
    clause = [];
  };

  for (const token of tokens) {
    if (PUNCT.has(token)) {
      flush();
      parts.push(token);
      analysis.push({type:'punct',raw:token,neo:token,pt:token});
    } else {
      clause.push(token);
    }
  }
  flush();
  return {text:joinSurface(parts),analysis};
}

function translatePtToNeo(text) {
  return translateWithPunctuation(text, translatePtSequence);
}

function translateNeoToPt(text) {
  return translateWithPunctuation(text, translateNeoClause);
}

function ensureSearchEntry(query) {
  return ensureMannerForPortuguese(query);
}

module.exports = {
  translatePtToNeo,
  translateNeoToPt,
  ensureSearchEntry,
  numberToNeo,
  numberToPortuguese,
  parsePortugueseNumberTokens,
  mannerNeo,
  LEXICON: core.L,
  MODERN_LEXICON_STATS,
};
