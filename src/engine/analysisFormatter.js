function cap(value) {
  const s=String(value||'');
  return s?s[0].toUpperCase()+s.slice(1):s;
}

function cleanPos(value){
  const p=String(value||'item');
  if(p==='word') return 'palavra';
  if(p==='verb') return 'verbo';
  if(p==='function') return 'função';
  return p;
}

function formatItem(unit) {
  if(unit.type==='affirmation'&&unit.neo==='hei'){
    return {surface:'hei',title:'hei — partícula de afirmação',detail:'equivale a “sim”',type:'grammar'};
  }
  if(unit.type==='negation'&&unit.neo==='ie'){
    return {surface:'ie',title:'ie — partícula de negação',detail:'equivale a “não”',type:'grammar'};
  }
  if(unit.type==='function'){
    const gloss=unit.pt||unit.gloss||'';
    const label=unit.pos==='locução'?'expressão relacional':'conjunção';
    return {surface:unit.neo,title:`${unit.neo} — ${label} “${gloss}”`,detail:unit.explanation||'',type:'grammar'};
  }
  if(unit.type==='tense'&&unit.neo==='da'){
    return {surface:'da',title:'da — marcador de passado',detail:'marca tempo passado',type:'grammar'};
  }
  if(unit.type==='tense'&&unit.neo==='auf'){
    return {surface:'auf',title:'auf — marcador de futuro',detail:'marca tempo futuro',type:'grammar'};
  }
  if(unit.type==='plural'&&unit.neo==='li'){
    return {surface:'li',title:'li — marcador de plural',detail:'plural explícito',type:'grammar'};
  }
  if(unit.type==='locative'){
    return {
      surface:unit.neo,
      title:`${unit.neo} — ${cap(unit.base)} + locativo de lugar (${unit.suffix})`,
      detail:unit.explanation||'relação locativa inferida pelo contexto',
      type:'grammar',
    };
  }
  if(unit.type==='copula-fusion'){
    return {
      surface:unit.neo,
      title:`${unit.neo} — fusão eufônica`,
      detail:`${unit.base} + cópula presente a`,
      type:'grammar',
    };
  }
  if(unit.type==='numeral'){
    const value=unit.value??unit.pt??'';
    return {surface:unit.neo,title:`${unit.neo} — numeral ${value}`,detail:'',type:'lexical'};
  }
  if(unit.pos==='pronome'&&unit.case){
    const labels={erg:'ergativo',poss:'possessivo',dat:'dativo',ins:'instrumental',loc:'locativo'};
    const label=labels[unit.case]||unit.case;
    const gloss=unit.raw||unit.pt||unit.base||'pronome';
    return {
      surface:unit.neo||unit.neoBase||unit.raw||'',
      title:`${unit.neo||unit.neoBase||unit.raw} — ${gloss} + caso ${label}`,
      detail:'',
      type:'grammar',
    };
  }
  const surface=unit.neo||unit.neoBase||unit.raw||'';
  const gloss=unit.pt||unit.lemma||unit.entry?.pt||unit.raw||'';
  const pos=cleanPos(unit.pos||unit.type||'item');
  if(pos==='desconhecido'){
    return {surface,title:`${surface} — termo preservado`,detail:String(gloss),type:'lexical'};
  }
  return {
    surface,
    title:`${surface} — ${pos} “${gloss}”`,
    detail:unit.explanation||'',
    type:'lexical',
  };
}

function shouldHideUnderlyingCopula(analysis,index){
  const unit=analysis[index];
  if(unit?.type!=='verb'||!['ser','estar'].includes(unit.lemma)) return false;
  for(let i=index+1;i<analysis.length;i++){
    const next=analysis[i];
    if(next?.type==='punct') break;
    if(next?.type==='copula-fusion') return true;
  }
  return false;
}

function formatAnalysis(analysis,{limit=14}={}){
  const raw=analysis||[];
  const items=raw
    .filter((unit,index)=>unit&&unit.type!=='punct'&&!shouldHideUnderlyingCopula(raw,index))
    .map(formatItem);
  return {items:items.slice(0,limit),hiddenCount:Math.max(0,items.length-limit)};
}

module.exports={formatAnalysis};
