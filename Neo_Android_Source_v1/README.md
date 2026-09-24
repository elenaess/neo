# Neo Android

Aplicativo Android offline para o idioma **Neo**.

## O que há aqui

- Tradutor Português ⇄ Neo.
- Dicionário com 10.755 entradas locais.
- Busca por Português, Neo, raiz e domínio.
- Vocabulário cotidiano, internet, saudações, gíria/palavrão, sexualidade,
  religião, economia/sociedade, universidade, ciência e vocabulário acadêmico.
- Voz em português via Vosk, traduzida localmente para Neo.
- Interface nativa pastel laranja + branco e ícones MaterialCommunityIcons.
- Sem câmera, sem tradução por imagem e sem necessidade de rede em uso normal.

## Testes

```bash
npm test
```

## Vosk

O modelo binário não está incluído neste snapshot porque o ambiente de geração bloqueou o
download. Antes do build execute:

```bash
bash tools/fetch_vosk_model.sh
```

Veja `BUILD_ANDROID.md` para as etapas completas.
