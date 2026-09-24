from pathlib import Path
import json, re, unicodedata, hashlib, html

ROOT=Path('/mnt/data/neo_android_app')
BASE=Path('/mnt/data')
core=(BASE/'neo_core_v1.3.js').read_text(encoding='utf-8')

# Parse generated literals from the established v1.3 engine.
lex=json.loads(re.search(r'const L=(\[.*?\]);\nconst VF=', core, re.S).group(1))
VF=json.loads(re.search(r'const VF=(\{.*?\});\nconst CONJ=', core, re.S).group(1))
CONJ=json.loads(re.search(r'const CONJ=(\{.*?\});\nconst L2N=', core, re.S).group(1))
L2N=json.loads(re.search(r'const L2N=(\{.*?\});const N2L=', core, re.S).group(1))
LEGACY=json.loads(re.search(r'const LEGACY=(\{.*?\});\nconst NM=', core, re.S).group(1))

VOWELS='aeiouy'
CONS='lrnsvmfjbcgkdtpz'

def norm(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s).lower()) if unicodedata.category(c)!='Mn')

def harmony(root):
    last=next((c for c in reversed(root) if c in VOWELS),'i')
    return 'A' if last in 'aou' else 'E'

def verb_form(root):
    return root[:-1] + ('ur' if harmony(root)=='A' else 'ir')

def adj_form(root):
    return root[:-1] + ('ul' if harmony(root)=='A' else 'il')

def agent_form(root):
    return root[:-1] + ('us' if harmony(root)=='A' else 'is')

used_neo={e['neo'] for e in lex}
pt_index={norm(e['pt']) for e in lex}
root_index={e['raiz'] for e in lex}

# Avoid roots looking identical to common Portuguese forms and preserve Neo phonotactics.
def valid_root(w):
    if not (3 <= len(w) <= 7): return False
    if any(c not in CONS+VOWELS for c in w): return False
    if w[-1] not in VOWELS: return False
    # no consonant clusters; only ai/ei are allowed vowel clusters
    for a,b in zip(w,w[1:]):
        if a in CONS and b in CONS: return False
        if a in VOWELS and b in VOWELS and a+b not in ('ai','ei'): return False
    return True

def candidates(seed):
    # mostly CVCV, then CVCVCV; deterministic and euphonic first.
    soft='lrnsvmfj'
    hard='bcgkdtpz'
    seq=[]
    for c1 in soft+hard:
        for v1 in VOWELS:
            for c2 in soft+hard:
                if c2==c1: continue
                for v2 in VOWELS:
                    if v1==v2: continue
                    seq.append(c1+v1+c2+v2)
    h=int(hashlib.sha256(seed.encode()).hexdigest()[:12],16)
    n=len(seq); start=h%n; step=97
    for i in range(n): yield seq[(start+i*step)%n]

def reserve_root(seed, preferred=None):
    choices=[]
    if preferred: choices.append(preferred)
    choices.extend(candidates(seed))
    for r in choices:
        if not valid_root(r): continue
        forms={r,verb_form(r),adj_form(r),agent_form(r)}
        if forms & used_neo: continue
        if r in root_index: continue
        root_index.add(r); used_neo.update(forms)
        return r
    raise RuntimeError('no root for '+seed)

def entry(neo, pt, cls, root, deriv='base', domain='Cotidiano', freq='média', register='neutro', lemma=None, source='Expansão geral'):
    d={
        'neo':neo,'pt':pt,'classe':cls,'raiz':root,'derivacao':deriv,'harmonia':harmony(root),
        'dominio':domain,'frequencia':freq,'exemplo_neo':f'mai {neo}.','exemplo_pt':f'Exemplo: {pt}.',
        'base_pt':pt if deriv=='base' else pt,'forma_legada':'', 'registro':register, 'fonte_vocabulario':source,
    }
    if lemma: d['lemma_pt']=lemma
    return d

new=[]
PT_ALIASES={}

def add_word(pt, cls='substantivo', domain='Cotidiano', freq='média', register='neutro', preferred=None, source='Expansão geral', neo=None, root=None, deriv='base', lemma=None, aliases=()):
    global new
    if norm(pt) in pt_index:
        # still register aliases to existing canonical form when requested
        if aliases:
            existing=next((e for e in lex if norm(e['pt'])==norm(pt)),None)
            if existing:
                for a in aliases: PT_ALIASES[norm(a)]=existing['neo']
        return next((e for e in lex if norm(e['pt'])==norm(pt)),None)
    if root is None:
        root=reserve_root(pt,preferred)
    if neo is None: neo=root
    if neo in {e['neo'] for e in new} or neo in {e['neo'] for e in lex}:
        raise RuntimeError(f'duplicate neo {neo} for {pt}')
    e=entry(neo,pt,cls,root,deriv,domain,freq,register,lemma,source)
    new.append(e); pt_index.add(norm(pt)); used_neo.add(neo)
    for a in aliases: PT_ALIASES[norm(a)]=neo
    return e

def add_family(base_pt, domain, *, preferred=None, verb=None, adjective=None, agent=None, register='neutro', freq='média', source='Expansão geral', aliases=()):
    if norm(base_pt) in pt_index:
        base=next(e for e in lex+new if norm(e['pt'])==norm(base_pt))
        root=base['raiz']
    else:
        root=reserve_root(base_pt,preferred)
        base=add_word(base_pt,'substantivo',domain,freq,register,source=source,neo=root,root=root,aliases=aliases)
    if verb and norm(verb) not in pt_index:
        vf=verb_form(root)
        add_word(verb,'verbo',domain,freq,register,source=source,neo=vf,root=root,deriv='verbo_derivado',lemma=verb)
        L2N[verb]=vf
    if adjective and norm(adjective) not in pt_index:
        add_word(adjective,'adjetivo',domain,freq,register,source=source,neo=adj_form(root),root=root,deriv='adjetivo')
    if agent and norm(agent) not in pt_index:
        add_word(agent,'substantivo',domain,freq,register,source=source,neo=agent_form(root),root=root,deriv='agente')
    return root

# --- Core requested concepts with transparent derivation ---
# society/social/socialize and ideological prefix sa-
soc_root=add_family('sociedade','Sociedade/Economia',preferred='nare',verb='socializar',adjective='social',source='Expansão solicitada')
# capitalism visibly uses existing money root lify
money_root=next(e['raiz'] for e in lex if norm(e['pt'])=='dinheiro' and e['derivacao']=='base')
for pt,neo,cls in [
    ('capitalismo','sa'+money_root,'substantivo'),('capitalista','sa'+money_root[:-1]+'is','substantivo')]:
    if norm(pt) not in pt_index:
        add_word(pt,cls,'Sociedade/Economia','alta','acadêmico',source='Expansão solicitada',neo=neo,root=money_root,deriv='ideologia' if pt=='capitalismo' else 'agente')
for pt,neo,cls in [
    ('socialismo','sa'+soc_root,'substantivo'),('socialista','sa'+soc_root[:-1]+'is','substantivo')]:
    if norm(pt) not in pt_index:
        add_word(pt,cls,'Sociedade/Economia','alta','acadêmico',source='Expansão solicitada',neo=neo,root=soc_root,deriv='ideologia' if pt=='socialismo' else 'agente')

# sexual family; neutral vs vulgar kept distinct
sex_root=add_family('sexo','Sexo/Relacionamentos',preferred='lase',verb='transar',adjective='sexual',source='Expansão solicitada')
relig_root=add_family('religião','Religião/Espiritualidade',preferred='jare',verb='rezar',adjective='religioso',source='Expansão solicitada')
add_word('deus','substantivo','Religião/Espiritualidade','alta','neutro',preferred='vara',source='Expansão solicitada',aliases=('Deus',))
add_word('natal','substantivo','Festas/Calendário','alta','neutro',preferred='nola',source='Expansão solicitada')

# --- Vocabulary blocks ---
blocks={
'Saudações/Conversa': [
'oi','olá','tchau','adeus','desculpa','perdão','obrigado','obrigada','valeu','parabéns','saudação','cumprimento','boas-vindas','prazer','talvez','certamente','claro','beleza','combinado','entendi','entendido','ajuda','socorro','silêncio','atenção','cuidado','calma','urgente','agora','depois','antes','sempre','nunca','ainda','já','aqui','ali','lá','perto','longe','junto','sozinho','sozinho','mesmo','outro','alguém','ninguém','tudo','nada','coisa','motivo','razão','ideia','dúvida','pergunta','resposta','exemplo','problema','solução','chance','sorte','azar','feliz','triste','bom','ruim','ótimo','péssimo','certo','errado','fácil','difícil','rápido','lento','novo','velho','jovem','bonito','feio','forte','fraco','grande','pequeno','simples','complexo','importante','necessário','possível','impossível','normal','estranho','legal','chato','pronto','ocupado','livre'],
'Internet/Tecnologia': [
'senha','login','logout','link','url','meme','post','postagem','comentário','curtida','compartilhamento','seguidor','bloqueio','desbloqueio','conta','perfil','feed','servidor','canal','mensagem','chat','chamada','vídeo','áudio','arquivo','download','upload','nuvem','site','navegador','aba','aplicativo','app','código','bug','erro','atualização','versão','rede','wifi','dados','banco de dados','api','algoritmo','inteligência artificial','bot','spam','golpe','phishing','print','captura de tela','notificação','emoji','sticker','figurinha','gif','stream','live','podcast','busca','pesquisa','viral','trend','hashtag','usuário','moderador','admin','administrador','privacidade','segurança','criptografia','token','sessão','cache','cookie','backup','sincronização','dispositivo','celular','computador','teclado','tela','mouse','fone','microfone','câmera','bateria','carregador','sinal','conexão','offline','online','cringe','flop','flopado','hype','ship','thread','timeline','influencer','criador de conteúdo','conteúdo','cancelamento','cancelado','troll','hater','fandom','mutual','reels','shorts','story','stories','viralizar'],
'Festas/Calendário': [
'ano novo','páscoa','carnaval','feriado','festa','aniversário','presente','réveillon','celebração','convite','bolo','vela','decoração','tradição','dezembro','janeiro','fim de semana','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado','domingo'],
'Religião/Espiritualidade': [
'fé','igreja','templo','oração','santo','sagrada','sagrado','pecado','alma','espírito','céu','inferno','cristianismo','cristão','judaísmo','judeu','islamismo','muçulmano','ateísmo','ateu','agnosticismo','agnóstico','budismo','budista','hinduísmo','hindu','divino','espiritualidade','ritual','crença','teologia','transcendência','imanência','milagre','profeta','sacerdote','pastor','bíblia','evangelho','doutrina','meditação','culto','divindade','eterno','eternidade'],
'Sociedade/Economia': [
'capital','mercado','economia','econômico','empresa','empresário','trabalhador','salário','imposto','estado','governo','comunidade','classe','renda','riqueza','pobreza','lucro','prejuízo','investimento','propriedade','público','privado','produção','consumo','inflação','juros','moeda','preço','custo','contrato','sindicato','indústria','comércio','serviço','emprego','desemprego','banco','crédito','dívida','orçamento','finança','financeiro','recurso','capitalismo','socialismo','comunismo','comunista','capitalista','socialista','coletivo','individual','instituição','organização','hierarquia','liderança','cooperação','competição','desigualdade','igualdade','direito','dever','cidadania','política','político','democracia','lei','norma','regra','autoridade','poder'],
'Sexo/Relacionamentos': [
'beijo','namoro','relacionamento','orgasmo','excitação','desejo','libido','consentimento','camisinha','preservativo','anticoncepcional','gravidez','intimidade','nudez','nu','genital','genitais','pênis','vagina','vulva','ânus','seio','seios','masturbação','ejaculação','ereção','fetiche','pornografia','pornô','parceiro','parceira','atração','orientação sexual','bissexual','heterossexual','homossexual','gay','lésbica','trans','transgênero','cisgênero','gênero','identidade de gênero','romance','paixão','carinho','afeto','ciúme','término','casamento','divórcio','ficante','crush'],
'Gíria/Palavrão': [
'merda','porra','caralho','foda','fodido','cacete','puta','arrombado','idiota','otário','babaca','cu','bunda','pau','buceta','xota','pica','rola','tesão','sacanagem','putaria','xingar','xingamento','foder','gozar'],
'Acadêmico/Geral': [
'método','metodologia','teoria','argumento','premissa','conclusão','evidência','variável','amostra','população','correlação','causalidade','inferência','dedução','indução','síntese','conceito','categoria','fenômeno','estrutura','sistema','paradigma','modelo','estudo','artigo','capítulo','seção','resumo','introdução','discussão','resultado','referência','citação','fonte','bibliografia','revisão','literatura','tradução','interpretação','crítica','comparação','distinção','definição','abstração','concretude','lógica','validade','consistência','coerência','contradição','ambiguidade','complexidade','mediação','diferença','semelhança','oposição','unidade','dualidade','equilíbrio','desequilíbrio','historicidade','temporalidade','finitude','infinitude','liberdade','necessidade','possibilidade','responsabilidade','vontade','consciência','individualidade','interioridade','essência','devir','autenticidade','subjetividade','objetividade','racionalidade','empirismo','idealismo','materialismo','existencialismo','fenomenologia','ética','estética','análise qualitativa','análise quantitativa','contexto','pressuposto','proposição','tese','antítese','critério','escopo','limitação','procedimento','observação','mensuração','indicador','resultado','confiabilidade','validade externa','validade interna','generalização'],
'Acadêmico/Psicologia': [
'psicologia','personalidade','caráter','instinto','emoção','fantasia','neurose','psicodinâmica','intrapsíquico','interpessoal','repressão','resistência','motivação','evitação','conflito','diferenciação','adaptação','pertencimento','vazio existencial','carência','dependência','compulsão','autoestima','autonomia','ansiedade','depressão','defesa','mecanismo','altruísmo','regressão','perversão','estratégia defensiva','impulso','elaboração cognitiva','elaboração psíquica','percepção','comportamento','transtorno','sintoma','diagnóstico','terapia','terapêutico','autoconhecimento','transformação','inconsciente','consciente','identidade','medo','raiva','tristeza','alegria','timidez','agressividade','passividade','resignação','inércia','preguiça','acídia','empatia','projeção','racionalização','conformidade','suGestionável','manipulação','formação reativa','ansiedade básica','mundo interno','experiência interior','esquecimento de si','carência nuclear'],
'Acadêmico/Filosofia': [
'existência','relação','indivíduo','finito','infinito','temporal','eterno','necessidade','possibilidade','liberdade','consciência','vontade','espírito','alma','corpo','divino','humano','transcendente','historicidade','fragmentariedade','descontinuidade','tensão','ambiguidade','conciliação','dualidade','mediação','estádio','estético','ético','religioso','cristandade','angústia','desespero','fé','sentido','singularidade','multidão','essência','existencial','solipsismo','absoluto','paradoxo','síntese'],
'Universidade/Estudo': [
'universidade','faculdade','aula','aluno','aluna','prova','nota','trabalho acadêmico','tese','dissertação','mestrado','doutorado','graduação','bolsa','campus','biblioteca','disciplina','semestre','currículo','matrícula','edital','vaga','seleção','laboratório','experimento','orientador','orientadora','pesquisador','pesquisadora','congresso','seminário','palestra','resenha','fichamento','plágio','referencial teórico','objetivo','objetivo geral','objetivo específico'],
'Ciência/Química': [
'átomo','molécula','ligação','reação','reagente','produto','solução','solvente','soluto','concentração','mol','massa','volume','densidade','temperatura','pressão','energia','entalpia','entropia','ácido','base','ph','catalisador','cinética','termodinâmica','orgânico','inorgânico','polímero','membrana','adsorção','espectro','gráfico','tabela','cálculo','equação','íon','cátion','ânion','orbital','elétron','próton','nêutron','elemento','composto','mistura','precipitado','titulação','espectroscopia','cromatografia','rendimento','estequiometria','polaridade','solubilidade','oxidação','redução','eletroquímica']
}

# Assign class heuristically. Multiword entries remain dictionary/search entries; translator handles token composition unless exact alias is added later.
adjectives={'econômico','público','privado','individual','político','financeiro','nu','bissexual','heterossexual','homossexual','gay','lésbica','trans','transgênero','cisgênero','divino','sagrado','religioso','social','terapêutico','intrapsíquico','interpessoal','consciente','inconsciente','estético','ético','existencial','orgânico','inorgânico','transcendente','finito','infinito','temporal','eterno','feliz','triste','bom','ruim','ótimo','péssimo','certo','errado','fácil','difícil','rápido','lento','novo','velho','jovem','bonito','feio','forte','fraco','grande','pequeno','simples','complexo','importante','necessário','possível','impossível','normal','estranho','legal','chato','pronto','ocupado','livre','cringe','flopado','cancelado'}
verbs={'xingar','foder','gozar'}
interjections={'oi','olá','tchau','adeus','desculpa','perdão','obrigado','obrigada','valeu','parabéns','socorro'}
vulgar={'merda','porra','caralho','foda','fodido','cacete','puta','arrombado','idiota','otário','babaca','cu','bunda','pau','buceta','xota','pica','rola','tesão','sacanagem','putaria','xingar','xingamento','foder','gozar'}

source_for_domain={
    'Acadêmico/Filosofia':'Santos & Minatto (2022), PDF anexado',
    'Acadêmico/Psicologia':'Naranjo e colaboradores, PDF anexado',
}

for domain,terms in blocks.items():
    for pt in terms:
        if norm(pt) in pt_index: continue
        cls='interjeição' if pt in interjections else ('verbo' if pt in verbs else ('adjetivo' if pt in adjectives else 'substantivo'))
        register='vulgar' if pt in vulgar else ('acadêmico' if domain.startswith('Acadêmico') or domain in ('Sociedade/Economia','Ciência/Química','Universidade/Estudo') else 'neutro')
        source=source_for_domain.get(domain,'Expansão temática solicitada')
        # Multiword forms still get lexical entries for dictionary/search. Roots are single Neo words.
        e=add_word(pt,cls,domain,'alta' if domain in ('Saudações/Conversa','Internet/Tecnologia') else 'média',register,source=source,lemma=pt if cls=='verbo' else None)
        if cls=='verbo': L2N[pt]=e['neo']

# Explicit Internet verbs and useful daily actions, sharing families where possible.
verb_specs=[
('postar','Internet/Tecnologia'),('comentar','Internet/Tecnologia'),('compartilhar','Internet/Tecnologia'),('seguir','Internet/Tecnologia'),('bloquear','Internet/Tecnologia'),('desbloquear','Internet/Tecnologia'),('pesquisar','Internet/Tecnologia'),('clicar','Internet/Tecnologia'),('tocar','Internet/Tecnologia'),('rolar','Internet/Tecnologia'),('arrastar','Internet/Tecnologia'),('enviar','Internet/Tecnologia'),('apagar','Internet/Tecnologia'),('deletar','Internet/Tecnologia'),('salvar','Internet/Tecnologia'),('baixar','Internet/Tecnologia'),('instalar','Internet/Tecnologia'),('desinstalar','Internet/Tecnologia'),('copiar','Internet/Tecnologia'),('colar','Internet/Tecnologia'),('editar','Internet/Tecnologia'),('publicar','Internet/Tecnologia'),('responder','Internet/Tecnologia'),('repostar','Internet/Tecnologia'),
('argumentar','Acadêmico/Geral'),('inferir','Acadêmico/Geral'),('deduzir','Acadêmico/Geral'),('induzir','Acadêmico/Geral'),('citar','Acadêmico/Geral'),('interpretar','Acadêmico/Geral'),('comparar','Acadêmico/Geral'),('definir','Acadêmico/Geral'),('observar','Acadêmico/Geral'),('medir','Acadêmico/Geral'),('concluir','Acadêmico/Geral'),('sintetizar','Acadêmico/Geral'),
('beijar','Sexo/Relacionamentos'),('namorar','Sexo/Relacionamentos'),('masturbar','Sexo/Relacionamentos'),('consentir','Sexo/Relacionamentos')]
for v,domain in verb_specs:
    if norm(v) in pt_index: continue
    r=reserve_root(v)
    e=add_word(v,'verbo',domain,'alta','vulgar' if v in vulgar else 'neutro',source='Expansão temática solicitada',neo=r,root=r,lemma=v)
    L2N[v]=r

# Aliases useful in Brazilian internet/daily usage.
alias_pairs={
    'ola':'olá','vlw':'valeu','obg':'obrigado','obgd':'obrigado','msg':'mensagem','dm':'mensagem',
    'zap':'chat','whatsapp':'chat','insta':'perfil','memezinho':'meme','printscreen':'captura de tela',
    'password':'senha','site':'site','app':'app','link':'link','porno':'pornô','transa':'sexo',
    'religiao':'religião','deus':'deus','natal':'natal','capitalismo':'capitalismo','socialismo':'socialismo',
}
for alias,target in alias_pairs.items():
    target_e=next((e for e in lex+new if norm(e['pt'])==norm(target)),None)
    if target_e: PT_ALIASES[norm(alias)]=target_e['neo']

# Fix source flags on academic additions from PDFs.
# Add a source-note field to all legacy rows for consistent schema.
for e in lex:
    e.setdefault('registro','neutro')
    e.setdefault('fonte_vocabulario','Neo legado v1.3')

# Ensure uniqueness and append.
all_lex=lex+new
neo_seen={}
for e in all_lex:
    if e['neo'] in neo_seen:
        raise RuntimeError(f"duplicate Neo form {e['neo']}: {neo_seen[e['neo']]} / {e['pt']}")
    neo_seen[e['neo']]=e['pt']

# Regular Portuguese conjugation generator for new verbs so common inputs work.
def regular_conj(lemma):
    if lemma.endswith('ar'):
        stem=lemma[:-2]
        return {
            'present': {'mi':stem+'o','si':stem+'a','ni':stem+'amos','zi':stem+'am'},
            'past': {'mi':stem+'ei','si':stem+'ou','ni':stem+'amos','zi':stem+'aram'},
            'future': {'mi':lemma+'ei','si':lemma+'á','ni':lemma+'emos','zi':lemma+'ão'},
        }
    if lemma.endswith('er'):
        stem=lemma[:-2]
        return {
            'present': {'mi':stem+'o','si':stem+'e','ni':stem+'emos','zi':stem+'em'},
            'past': {'mi':stem+'i','si':stem+'eu','ni':stem+'emos','zi':stem+'eram'},
            'future': {'mi':lemma+'ei','si':lemma+'á','ni':lemma+'emos','zi':lemma+'ão'},
        }
    if lemma.endswith('ir'):
        stem=lemma[:-2]
        return {
            'present': {'mi':stem+'o','si':stem+'e','ni':stem+'imos','zi':stem+'em'},
            'past': {'mi':stem+'i','si':stem+'iu','ni':stem+'imos','zi':stem+'iram'},
            'future': {'mi':lemma+'ei','si':lemma+'á','ni':lemma+'emos','zi':lemma+'ão'},
        }
    return None

new_verbs=[e['lemma_pt'] for e in new if e['classe']=='verbo' and e.get('lemma_pt')]
# Some useful irregular/orthographic forms we care about explicitly.
manual={
    'transar': {'present':{'mi':'transo','si':'transa','ni':'transamos','zi':'transam'},'past':{'mi':'transei','si':'transou','ni':'transamos','zi':'transaram'},'future':{'mi':'transarei','si':'transará','ni':'transaremos','zi':'transarão'}},
    'seguir': {'present':{'mi':'sigo','si':'segue','ni':'seguimos','zi':'seguem'},'past':{'mi':'segui','si':'seguiu','ni':'seguimos','zi':'seguiram'},'future':{'mi':'seguirei','si':'seguirá','ni':'seguiremos','zi':'seguirão'}},
    'medir': {'present':{'mi':'meço','si':'mede','ni':'medimos','zi':'medem'},'past':{'mi':'medi','si':'mediu','ni':'medimos','zi':'mediram'},'future':{'mi':'medirei','si':'medirá','ni':'mediremos','zi':'medirão'}},
}
for lemma in new_verbs:
    cj=manual.get(lemma) or regular_conj(lemma)
    if not cj: continue
    CONJ[lemma]=cj
    VF[norm(lemma)]={'lemma':lemma,'tense':None,'inf':True}
    for tense,persons in cj.items():
        for person,form in persons.items():
            VF[norm(form)]={'lemma':lemma,'tense':tense,'person':person}
    # gerund
    if lemma.endswith('ar'): ger=lemma[:-2]+'ando'
    elif lemma.endswith('er'): ger=lemma[:-2]+'endo'
    else: ger=lemma[:-2]+'indo'
    VF[norm(ger)]={'lemma':lemma,'tense':'present','gerund':True}

# Rebuild N2L map from L2N for verbs.
N2L={v:k for k,v in L2N.items()}
for old,newform in LEGACY.items():
    if newform in N2L: N2L[old]=N2L[newform]

# Patch established core literals.
patched=core
patched=re.sub(r'const L=\[.*?\];\nconst VF=', 'const L='+json.dumps(all_lex,ensure_ascii=False,separators=(',',':'))+';\nconst VF=', patched, count=1, flags=re.S)
patched=re.sub(r'const VF=\{.*?\};\nconst CONJ=', 'const VF='+json.dumps(VF,ensure_ascii=False,separators=(',',':'))+';\nconst CONJ=', patched, count=1, flags=re.S)
patched=re.sub(r'const CONJ=\{.*?\};\nconst L2N=', 'const CONJ='+json.dumps(CONJ,ensure_ascii=False,separators=(',',':'))+';\nconst L2N=', patched, count=1, flags=re.S)
patched=re.sub(r'const L2N=\{.*?\};const N2L=\{.*?\};const LEGACY=', 'const L2N='+json.dumps(L2N,ensure_ascii=False,separators=(',',':'))+';const N2L='+json.dumps(N2L,ensure_ascii=False,separators=(',',':'))+';const LEGACY=', patched, count=1, flags=re.S)

# Add alias lookup immediately before regular singular candidate search.
alias_json=json.dumps(PT_ALIASES,ensure_ascii=False,separators=(',',':'))
patched=patched.replace('function lookupLex(raw){\n  const z=N(raw);', 'const PT_ALIASES='+alias_json+';\nfunction lookupLex(raw){\n  const z=N(raw);\n  if(PT_ALIASES[z]){const e=NM.get(PT_ALIASES[z]);if(e)return{kind:e.classe==="verbo"?"verb":"lex",e,lemma:e.lemma_pt||null,tense:null,plural:false,raw};}')

# Ensure module exports include data needed by wrapper.
patched=re.sub(r'if\(typeof module!=="undefined"\)module\.exports=\{.*?\};', 'if(typeof module!=="undefined")module.exports={P2N,N2P,NM,PM,L2N,N2L,VF,CONJ,LEGACY,PRON_CASE,PRON_FORM,analyzeNoCase,L,PT_ALIASES};', patched, count=1, flags=re.S)

(ROOT/'src/engine/core.js').write_text(patched,encoding='utf-8')
(ROOT/'src/data/lexicon.json').write_text(json.dumps(all_lex,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'src/data/aliases.json').write_text(json.dumps(PT_ALIASES,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'src/data/lexicon-meta.json').write_text(json.dumps({'version':'2.4','legacy_count':len(lex),'new_count':len(new),'total_count':len(all_lex),'domains':sorted(set(e['dominio'] for e in all_lex))},ensure_ascii=False,indent=2),encoding='utf-8')

# Node wrapper - pure JS, no RN dependency.
wrapper=r'''const core = require('./core');
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
'''
(ROOT/'src/engine/neoEngine.js').write_text(wrapper,encoding='utf-8')

# Modern Latin-only HTML translator using the same generated core.
browser_core=patched
browser_core=re.sub(r'if\(typeof module!=="undefined"\)module\.exports=\{.*?\};','',browser_core,count=1,flags=re.S)
html_page=f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Neo Translator v2.4</title><style>
:root{{--o:#F39A68;--o2:#E97F46;--bg:#FFF6EE;--card:#fff;--ink:#251C17;--muted:#7D6E64;--line:#E9D8CA;--soft:#F8E8DD}}*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}}main{{max-width:980px;margin:auto;padding:18px 14px 50px}}header{{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}}h1{{margin:0;font-size:24px;letter-spacing:-.03em}}.tag{{background:var(--o);color:white;padding:8px 12px;border-radius:999px;font-weight:700;font-size:12px}}.box{{background:var(--card);border:1px solid var(--line);border-radius:26px;overflow:hidden}}.langs{{display:grid;grid-template-columns:1fr 60px 1fr;align-items:center;padding:10px 16px;border-bottom:1px solid var(--line);font-weight:800;font-size:18px}}.langs span:last-child{{text-align:right}}button{{border:0;cursor:pointer;font:inherit}}#swap{{width:46px;height:46px;background:var(--o);color:#fff;border-radius:16px;font-size:20px}}.panes{{display:grid;grid-template-columns:1fr 1fr;min-height:350px}}.pane{{padding:18px}}.pane:first-child{{border-right:1px solid var(--line)}}textarea{{width:100%;min-height:270px;border:0;outline:0;resize:vertical;font:22px/1.45 inherit;color:var(--ink);background:transparent}}#out{{min-height:270px;font-size:22px;white-space:pre-wrap}}.meta{{display:flex;justify-content:space-between;color:var(--muted);font-size:12px}}.smallbtn{{background:var(--soft);padding:9px 12px;border-radius:13px}}.analysis{{margin-top:14px;background:#fff;border:1px solid var(--line);border-radius:24px;padding:16px}}.analysis h2{{margin:0 0 12px;font-size:16px}}.chips{{display:flex;gap:10px;flex-wrap:wrap}}.chip{{background:var(--soft);border-radius:16px;padding:10px 12px;min-width:120px}}.chip b,.chip small{{display:block}}.chip small{{color:var(--muted);margin-top:3px}}@media(max-width:720px){{.panes{{grid-template-columns:1fr}}.pane:first-child{{border-right:0;border-bottom:1px solid var(--line)}}}}
</style></head><body><main><header><div><h1>Neo Translator</h1><div style="color:var(--muted);font-size:12px">offline · léxico v2.4 · alfabeto latino</div></div><div class="tag">{len(all_lex):,} entradas</div></header><section class="box"><div class="langs"><span id="sl">Português</span><button id="swap" aria-label="Trocar idiomas">⇄</button><span id="dl">Neo</span></div><div class="panes"><div class="pane"><textarea id="inp" placeholder="Digite em português…"></textarea><div class="meta"><span>Detecção automática</span><button class="smallbtn" id="clear">Limpar</button></div></div><div class="pane"><div id="out"></div><div class="meta"><span id="count">0 palavras</span><button class="smallbtn" id="copy">Copiar</button></div></div></div></section><section class="analysis"><h2>Análise morfológica</h2><div class="chips" id="chips"></div></section></main><script>{browser_core}
let dir='pt-neo',plain='';const inp=document.getElementById('inp'),out=document.getElementById('out'),chips=document.getElementById('chips');
function esc(s){{return String(s??'').replace(/[&<>\"]/g,c=>({{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}}[c]))}}
function render(){{const r=dir==='pt-neo'?P2N(inp.value):N2P(inp.value);plain=r.text||'';out.textContent=plain;document.getElementById('count').textContent=((plain.match(/\S+/g))||[]).length+' palavras';chips.innerHTML='';for(const x of (r.analysis||[]).slice(0,24)){{if(x.type==='punct')continue;const d=document.createElement('div');d.className='chip';const main=x.neo||x.neoBase||x.pt||x.raw||'';const gloss=x.pt||x.lemma||x.entry?.pt||x.raw||'';d.innerHTML='<b>'+esc(main)+'</b><small>'+esc([gloss,x.pos||x.type||'',x.case||''].filter(Boolean).join(' · '))+'</small>';chips.appendChild(d)}}}}
inp.addEventListener('input',render);document.getElementById('clear').onclick=()=>{{inp.value='';render();inp.focus()}};document.getElementById('copy').onclick=()=>navigator.clipboard?.writeText(plain);document.getElementById('swap').onclick=()=>{{dir=dir==='pt-neo'?'neo-pt':'pt-neo';document.getElementById('sl').textContent=dir==='pt-neo'?'Português':'Neo';document.getElementById('dl').textContent=dir==='pt-neo'?'Neo':'Português';inp.value=plain;inp.placeholder=dir==='pt-neo'?'Digite em português…':'Digite em Neo…';render()}};render();</script></body></html>'''
(BASE/'Neo_Translator_v2.4.html').write_text(html_page,encoding='utf-8')

print(json.dumps({'legacy':len(lex),'new':len(new),'total':len(all_lex),'new_verbs':len(new_verbs),'aliases':len(PT_ALIASES)},ensure_ascii=False))
