#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODEL_NAME="vosk-model-small-pt-0.3"
DEST="$ROOT/assets/model-small-pt"
TMP_DIR="$(mktemp -d)"
ZIP="$TMP_DIR/$MODEL_NAME.zip"
EXPECTED_SHA256="6e1ce909032e1afa7a88e68a3d628ecafff302bdf195befab308826c395e93b7"

cleanup(){ rm -rf "$TMP_DIR"; }
trap cleanup EXIT

urls=(
  "https://alphacephei.com/vosk/models/$MODEL_NAME.zip"
  "https://github.com/BartekReterski/VoskModels/releases/download/v1/$MODEL_NAME.zip"
  "https://huggingface.co/rhasspy/vosk-models/resolve/e7ac2109d134b5f2404ba95389b2fb51916d4cab/pt/$MODEL_NAME.zip?download=true"
)

ok=0
for url in "${urls[@]}"; do
  echo "Baixando $MODEL_NAME de: $url"
  if curl --fail --location --retry 2 --connect-timeout 20 "$url" -o "$ZIP"; then
    got="$(sha256sum "$ZIP" | awk '{print $1}')"
    if [[ "$got" == "$EXPECTED_SHA256" ]]; then
      ok=1
      break
    fi
    echo "SHA-256 inesperado: $got" >&2
  fi
done

if [[ "$ok" != "1" ]]; then
  echo "Não foi possível baixar uma cópia válida do modelo Vosk." >&2
  exit 1
fi

unzip -q "$ZIP" -d "$TMP_DIR/unpacked"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$TMP_DIR/unpacked/$MODEL_NAME/." "$DEST/"

if [[ ! -f "$DEST/am/final.mdl" ]]; then
  echo "Modelo extraído sem am/final.mdl; abortando." >&2
  exit 1
fi

cat > "$DEST/NEO_MODEL_INFO.txt" <<INFO
Modelo: $MODEL_NAME
Uso: reconhecimento de voz offline em português via Vosk
SHA-256 do ZIP: $EXPECTED_SHA256
Licença do modelo: Apache-2.0, conforme catálogo oficial do Vosk
INFO

echo "Modelo Vosk pronto em: $DEST"
