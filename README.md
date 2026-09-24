# Neo Android

Aplicativo Android offline para o idioma **Neo**.

## O que há aqui

- Tradutor Português ⇄ Neo com pontuação preservada e análise gramatical explicativa.
- Dicionário com **11 mil+ entradas locais**, incluindo 500 novas bases modernas de uso comum.
- Busca paginada por Português, Neo, raiz e domínio, sem carregar o léxico inteiro ao abrir a aba.
- Voz em português via Vosk, traduzida localmente para Neo.
- Interface nativa pastel laranja + branco e ícones MaterialCommunityIcons.
- Sem câmera, sem tradução por imagem e sem necessidade de rede em uso normal.

## Gramática moderna

- Cópula: presente `a`, passado `da`, futuro `auf`.
- No presente, a cópula funde na superfície: `doma + a → domaia`, `mar + a → mara`.
- `e → ei`; `tá bem / está bem / tudo bem / tudo bom → sava`.
- `ano → om`, `ter → leif`, `ser` lexical → `ca`, `estável → gyla`.
- Advérbio de modo produtivo em `-au`: `gyla → gylau`.
- Locativo de lugar: consoante + `-ia` (`Salvador → salvadoria`) e vogal + `-la` (`Lisboa → lisboala`).
- Numerais maiores que um dispensam `li` quando já quantificam diretamente um substantivo: `21 anos → dyrfen om`.

## Testes

```bash
npm test
```

## Vosk e build Android

O reconhecimento de voz usa um modelo Vosk em português empacotado no APK. Antes de um build local, execute:

```bash
bash tools/fetch_vosk_model.sh
```

O GitHub Actions executa testes, baixa o modelo, prepara o Gradle, assina a build e gera o APK de release. Veja `BUILD_ANDROID.md` para as etapas manuais.
