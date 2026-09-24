# Build do Neo para Android

## Estado deste pacote

O código-fonte do app está pronto em React Native e os testes JavaScript passam.
Este ambiente de geração não possui Android SDK, `node_modules` nem o JAR do Gradle Wrapper,
e bloqueou o download binário do modelo Vosk. Por isso este pacote não finge conter um APK que
não foi realmente compilado.

## Recursos do app

- Android somente.
- Três abas: Tradutor, Dicionário e Voz.
- Tradutor e dicionário usam o léxico local, sem rede.
- Voz usa Vosk e o modelo pequeno de português.
- O modelo deve estar em `assets/model-small-pt/` no momento do build.
- O aplicativo não possui tela de câmera/imagem.
- Não é necessária permissão de internet para o funcionamento final.

## 1. Pré-requisitos

Instale:

- Node.js 22
- JDK 21
- Android Studio + Android SDK compatível com `compileSdkVersion` do projeto
- ferramentas padrão do React Native Android

## 2. Dependências JavaScript

Na raiz:

```bash
npm install
npm test
```

## 3. Modelo Vosk português

Execute:

```bash
bash tools/fetch_vosk_model.sh
```

O script baixa `vosk-model-small-pt-0.3`, valida SHA-256
`6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7`
e o instala como `assets/model-small-pt/`.

Antes do build, confirme que existe:

```text
assets/model-small-pt/am/final.mdl
```

## 4. Gradle Wrapper

O snapshot gerado nesta conversa não contém `android/gradle/wrapper/gradle-wrapper.jar`,
porque não há Gradle instalado no ambiente de geração para produzi-lo. Gere o wrapper uma vez
em uma máquina com Gradle, ou substitua a pasta `android/` pela pasta nativa gerada por um
projeto React Native 0.86 equivalente preservando `applicationId=com.neotranslator`, Manifest,
ícones e fontes do `react-native-vector-icons`.

Com Gradle instalado, na pasta `android/`:

```bash
gradle wrapper
```

## 5. Compilar APK

Depois do wrapper e do Android SDK configurados:

```bash
cd android
./gradlew assembleRelease
```

Saída esperada:

```text
android/app/build/outputs/apk/release/app-release.apk
```

A configuração atual assina a variante `release` com a chave de debug para facilitar instalação
de teste. Para publicar em loja, crie um keystore de produção e troque `signingConfigs`.

## GitHub Actions

O projeto também contém `.github/workflows/build-android.yml`. Ele instala dependências,
baixa/verifica o modelo Vosk, executa os testes e tenta gerar o APK como artifact.

No GitHub Actions, o workflow instala Gradle 8.14.3, gera o Wrapper automaticamente e então compila.
