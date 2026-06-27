#!/bin/bash
set -e

# Source emsdk if emcmake is not found
if ! command -v emcmake &> /dev/null; then
  if [ -d "emsdk" ]; then
    source ./emsdk/emsdk_env.sh
  else
    echo "Emscripten not found. Please run the install command first."
    exit 1
  fi
fi

echo "Cloning liboqs..."
if [ ! -d "liboqs" ]; then
  git clone --depth 1 -b main https://github.com/open-quantum-safe/liboqs.git
fi

# We will build liboqs first to get the static library
cd liboqs
mkdir -p build && cd build

echo "Configuring liboqs with emcmake..."
emcmake cmake -G Ninja .. \
  -DBUILD_SHARED_LIBS=OFF \
  -DOQS_BUILD_ONLY_LIB=ON \
  -DOQS_USE_OPENSSL=OFF \
  -DOQS_DIST_BUILD=OFF \
  -DOQS_ENABLE_KEM_BIKE=OFF \
  -DOQS_ENABLE_KEM_CLASSIC_MCELIECE=OFF \
  -DOQS_ENABLE_KEM_FRODOKEM=OFF \
  -DOQS_ENABLE_KEM_HQC=OFF \
  -DOQS_ENABLE_KEM_KYBER=OFF \
  -DOQS_ENABLE_KEM_NTRUPRIME=OFF \
  -DOQS_ENABLE_SIG_DILITHIUM=OFF \
  -DOQS_ENABLE_SIG_FALCON=OFF \
  -DOQS_ENABLE_SIG_SPHINCS=OFF \
  -DOQS_ENABLE_SIG_MAYO=OFF \
  -DOQS_ENABLE_SIG_CROSS=OFF \
  -DOQS_ENABLE_KEM_ML_KEM=ON \
  -DOQS_ENABLE_SIG_ML_DSA=ON \
  -DOQS_ENABLE_SIG_SLH_DSA=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHA2_128F=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHA2_128S=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHA2_192F=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHA2_192S=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHA2_256F=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHA2_256S=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHAKE_128F=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHAKE_128S=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHAKE_192F=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHAKE_192S=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHAKE_256F=ON \
  -DOQS_ENABLE_SIG_SLH_DSA_SHAKE_256S=ON \
  -DOQS_ENABLE_SIG_ML_DSA_44=ON \
  -DOQS_ENABLE_SIG_ML_DSA_65=ON \
  -DOQS_ENABLE_SIG_ML_DSA_87=ON \
  -DOQS_ENABLE_KEM_ML_KEM_512=ON \
  -DOQS_ENABLE_KEM_ML_KEM_768=ON \
  -DOQS_ENABLE_KEM_ML_KEM_1024=ON

echo "Building liboqs..."
ninja
cd ../..

echo "Compiling C wrapper to WASM..."
emcc -O3 -s WASM=1 \
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "ccall", "setValue", "getValue"]' \
  -s EXPORTED_FUNCTIONS='["_malloc", "_free"]' \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s STACK_SIZE=2MB \
  -s EXPORT_ES6=1 \
  -s MODULARIZE=1 \
  -s EXPORT_NAME="createOQSModule" \
  -I./liboqs/src \
  -I./liboqs/build/include \
  -o oqs.js \
  oqs_wrapper.c ./liboqs/build/lib/liboqs.a

echo "Copying outputs to app directories..."
cp oqs.js ../src/lib/pqc/oqs.js
cp oqs.wasm ../public/oqs.wasm

echo "Build complete. Output: oqs.js and oqs.wasm"

