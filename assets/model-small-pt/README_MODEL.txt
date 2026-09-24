MODELO VOSK NÃO INCLUÍDO NESTE SNAPSHOT

Antes de compilar o APK, execute na raiz do projeto:

  bash tools/fetch_vosk_model.sh

O script baixa vosk-model-small-pt-0.3, confere o SHA-256 oficial e copia o conteúdo
para esta pasta, que deve conter diretamente am/, conf/, graph/ etc.

O código carrega o modelo pelo nome "model-small-pt".
