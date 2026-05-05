#!/bin/bash
set -e

# Setup Emscripten
source ./emsdk/emsdk_env.sh

REPO_DIR="KpqClean_ver2"
COMMON_DIR="$REPO_DIR/common"
OUT_DIR="obj"
rm -rf $OUT_DIR
mkdir -p $OUT_DIR

echo "Compiling KPQC Algorithms..."

# 1. Compile Common
echo "Compiling Common..."
emcc -O3 -I. -I$COMMON_DIR -c $COMMON_DIR/fips202.c -o $OUT_DIR/fips202.o
emcc -O3 -I. -I$COMMON_DIR -c $COMMON_DIR/sha2.c -o $OUT_DIR/sha2.o
emcc -O3 -I. -I$COMMON_DIR -c $COMMON_DIR/aes.c -o $OUT_DIR/aes.o
emcc -O3 -I. -I$COMMON_DIR -c aes256ctr.c -o $OUT_DIR/aes256ctr.o

# 2. Compile NTRU+ KEM Variants
for val in 576 768 864 1152; do
    echo "Compiling NTRU+ KEM $val..."
    DIR="$REPO_DIR/crypto_kem/NTRU+KEM$val/clean"
    # NTRU+ has internal symbols that collide
    NTRU_FLAGS="-Dntt=ntru${val}_ntt \
                -Dzetas=ntru${val}_zetas \
                -Dinvntt=ntru${val}_invntt \
                -Dbaseinv=ntru${val}_baseinv \
                -Dbasemul=ntru${val}_basemul \
                -Dbasemul_add=ntru${val}_basemul_add"
    for f in $DIR/*.c; do
        emcc -O3 -I. -I$COMMON_DIR -I$DIR $NTRU_FLAGS -c "$f" -o "$OUT_DIR/ntru${val}_$(basename "$f" .c).o"
    done
done

# 3. Compile SMAUG-T Variants
for val in 1 3 5; do
    echo "Compiling SMAUG-T$val..."
    DIR="$REPO_DIR/crypto_kem/SMAUG-T$val/clean"
    for f in $DIR/*.c; do
        emcc -O3 -I. -I$COMMON_DIR -I$DIR -c "$f" -o "$OUT_DIR/smaug${val}_$(basename "$f" .c).o"
    done
done

# 4. Compile AIMer Variants
for val in 128f 128s 192f 192s 256f 256s; do
    echo "Compiling AIMer $val..."
    DIR="$REPO_DIR/crypto_sign/AIMer$val/clean"
    for f in $DIR/*.c; do
        emcc -O3 -I. -I$COMMON_DIR -I$DIR -c "$f" -o "$OUT_DIR/aimer${val}_$(basename "$f" .c).o"
    done
done

# 5. Compile HAETAE Variants with Aggressive Namespace Injection
for val in 2 3 5; do
    echo "Compiling HAETAE$val..."
    DIR="$REPO_DIR/crypto_sign/HAETAE$val/clean"
    HAETAE_FLAGS="-Dcrypto_sign_keypair=cryptolab_haetae${val}_crypto_sign_keypair \
                 -Dcrypto_sign=cryptolab_haetae${val}_crypto_sign \
                 -Dcrypto_sign_open=cryptolab_haetae${val}_crypto_sign_open \
                 -Dcrypto_sign_signature=cryptolab_haetae${val}_crypto_sign_signature \
                 -Dcrypto_sign_verify=cryptolab_haetae${val}_crypto_sign_verify \
                 -Dfft_init_and_bitrev=haetae${val}_fft_init_and_bitrev \
                 -Dbrv8=haetae${val}_brv8 \
                 -Dcomplex_fp_sqabs=haetae${val}_complex_fp_sqabs \
                 -Dfft=haetae${val}_fft \
                 -Dstart_cube=haetae${val}_start_cube \
                 -Dstart_times_threehalves=haetae${val}_start_times_threehalves \
                 -DhammingWeight_8=haetae${val}_hammingWeight_8 \
                 -Dpolyfixfix_sub=haetae${val}_polyfixfix_sub \
                 -Dfix_round=haetae${val}_fix_round \
                 -Dsample_gauss=haetae${val}_sample_gauss"
                 
    for f in $DIR/*.c; do
        emcc -O3 -I. -I$COMMON_DIR -I$DIR $HAETAE_FLAGS -c "$f" -o "$OUT_DIR/haetae${val}_$(basename "$f" .c).o"
    done
done

# 6. Compile Wrapper
echo "Compiling Wrapper..."
emcc -O3 -I. -I$COMMON_DIR -c kpqc_wrapper.c -o $OUT_DIR/wrapper.o

# 7. Link everything
echo "Linking..."
emcc $OUT_DIR/*.o \
    -O3 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s STACK_SIZE=2MB \
    -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "HEAP8", "HEAPU8", "HEAP16", "HEAPU16", "HEAP32", "HEAPU32"]' \
    -s EXPORTED_FUNCTIONS='["_malloc", "_free", "_kpqc_set_entropy", "_kpqc_kem_keypair", "_kpqc_kem_enc", "_kpqc_kem_dec", "_kpqc_sign_keypair", "_kpqc_sign", "_kpqc_sign_open"]' \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createKPQCWasm' \
    -o ../src/lib/crypto/kpqc.js

echo "Build complete."
