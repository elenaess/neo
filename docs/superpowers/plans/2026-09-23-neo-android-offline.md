# Neo Android Offline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expandir o léxico Neo com vocabulário cotidiano, internet, sexualidade, religião, economia e acadêmico dos dois PDFs, e criar um app React Native Android offline com Tradutor, Dicionário e Voz/Vosk.

**Architecture:** O léxico e o motor de tradução ficam em módulos JavaScript puros, compartilhados pelo HTML e pelo app React Native. O app usa três abas e renderização nativa; o reconhecimento de voz usa `react-native-vosk` com `vosk-model-small-pt-0.3` embarcado em assets. O projeto é Android-only e não possui tela de câmera/imagem.

**Tech Stack:** React Native (bare), JavaScript, React Navigation, MaterialCommunityIcons, react-native-vosk, JSON offline, Node test runner.

**Spec:** requisitos aprovados na conversa atual.

## Global Constraints

- Android APK only.
- Tudo deve funcionar offline depois da instalação.
- STT apenas em português brasileiro via Vosk.
- Três telas: Tradutor, Dicionário, Voz.
- Sem tela de câmera/imagem.
- Estética laranja pastel + branco; ícones vetoriais, sem emoji/Unicode como ícone.
- Alfabeto Neo exibido em latino normal.
- Preservar as 10.164 entradas existentes e acrescentar novas formas sem renomear o legado.
- Incluir vocabulário cotidiano, internet, saudações, palavrões, sexualidade, festas, religião, economia/sociedade e acadêmico/analítico.
- Usar como fontes acadêmicas os dois PDFs anexados.

## Review Focus

- Tradução de formas novas e inflexões verbais portuguesas comuns.
- Busca do dicionário sem acentos e por domínio.
- Locativo e casos existentes não podem regredir.
- Vosk deve ser opcional em testes JS e não quebrar o app antes de carregar o modelo.
- Nenhum recurso de câmera/imagem deve existir na navegação.

---

### Task 1: Expandir o léxico e o motor

**Files:**
- Create: `src/data/lexicon.json`
- Create: `src/engine/neoEngine.js`
- Create: `tests/neoEngine.test.js`
- Create: `/mnt/data/Neo_Dicionario_v2.4.xlsx`
- Create: `/mnt/data/Neo_Translator_v2.4.html`

**Interfaces:**
- Produces: `translatePtToNeo(text)`, `translateNeoToPt(text)`, `searchLexicon(query, filters)`, `LEXICON`.

- [ ] Write failing tests for new daily/internet/academic/sexual/religious vocabulary and existing locative behavior.
- [ ] Run tests and verify failure.
- [ ] Generate append-only lexicon and engine.
- [ ] Run tests and verify pass.
- [ ] Export workbook and HTML translator.
- [ ] Commit.

### Task 2: Criar interface React Native Android

**Files:**
- Create: `package.json`, `index.js`, `App.js`
- Create: `src/screens/TranslatorScreen.js`
- Create: `src/screens/DictionaryScreen.js`
- Create: `src/screens/VoiceScreen.js`
- Create: `src/theme.js`
- Create: `src/components/*`
- Create: `assets/icon.png`
- Test: `tests/navigationSpec.test.js`

**Interfaces:**
- Consumes engine from Task 1.
- Produces three-screen offline UI.

- [ ] Write failing structural tests for exactly three screens and no camera route.
- [ ] Run tests and verify failure.
- [ ] Implement orange-pastel UI and vector icon imports.
- [ ] Run tests and verify pass.
- [ ] Commit.

### Task 3: Integrar Vosk offline e Android native scaffold

**Files:**
- Create: `src/speech/voskService.js`
- Create: `android/*`
- Create: `assets/model-small-pt/README_MODEL.txt`
- Test: `tests/voskService.test.js`

**Interfaces:**
- Produces: `loadPortugueseModel()`, `startListening()`, `stopListening()`, result subscriptions.

- [ ] Write failing service tests with injected Vosk adapter.
- [ ] Run tests and verify failure.
- [ ] Implement Vosk service and microphone permission/native configuration.
- [ ] Run tests and verify pass.
- [ ] Commit.

### Task 4: Empacotar e verificar

**Files:**
- Create: `/mnt/data/Neo_Android_Source_v1.zip`
- Create: `BUILD_ANDROID.md`

- [ ] Run full Node test suite.
- [ ] Verify generated lexicon counts and key translation cases.
- [ ] Attempt APK build if Android SDK/dependencies are available; otherwise record exact environment limitation.
- [ ] Zip complete source tree.
- [ ] Commit.
