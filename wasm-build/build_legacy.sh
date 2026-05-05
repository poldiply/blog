#!/bin/bash
set -e

# Source emsdk if emcmake is not found
if ! command -v emcc &> /dev/null; then
  if [ -d "emsdk" ]; then
    source ./emsdk/emsdk_env.sh
  else
    echo "Emscripten not found. Please run the install command first."
    exit 1
  fi
fi

OPENSSL_DIR=$(pwd)/openssl/build

echo "Compiling Legacy Wrapper to WASM..."
emcc -O3 -s WASM=1 \
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "setValue", "getValue"]' \
  -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORT_NAME="createLegacyModule" \
  -I$OPENSSL_DIR/include \
  -L$OPENSSL_DIR/lib \
  -L$(pwd)/openssl/providers \
  -o legacy.js \
  legacy_wrapper.c \
  -lcrypto -llegacy

echo "Build complete. Output: legacy.js and legacy.wasm"

# Copy to the main project
mkdir -p ../src/lib/crypto
cp legacy.js ../src/lib/crypto/
cp legacy.wasm ../public/
