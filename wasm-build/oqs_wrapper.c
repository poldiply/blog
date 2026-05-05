#include <emscripten.h>
#include <oqs/oqs.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>

// Global context for custom RNG
static uint8_t *custom_rng_seed = NULL;
static size_t custom_rng_seed_len = 0;
static size_t custom_rng_offset = 0;

// The custom RNG callback
void custom_randombytes(uint8_t *random_array, size_t bytes_to_read) {
    if (custom_rng_seed != NULL && (custom_rng_offset + bytes_to_read) <= custom_rng_seed_len) {
        memcpy(random_array, custom_rng_seed + custom_rng_offset, bytes_to_read);
        custom_rng_offset += bytes_to_read;
    } else {
        // Not enough seed provided, fallback to zeros (CAVP tests usually provide exact bytes needed)
        memset(random_array, 0, bytes_to_read);
    }
}

EMSCRIPTEN_KEEPALIVE
void init_custom_rng(uint8_t *seed, size_t seed_len) {
    if (custom_rng_seed) free(custom_rng_seed);
    custom_rng_seed = malloc(seed_len);
    memcpy(custom_rng_seed, seed, seed_len);
    custom_rng_seed_len = seed_len;
    custom_rng_offset = 0;
    OQS_randombytes_custom_algorithm(custom_randombytes);
}

EMSCRIPTEN_KEEPALIVE
void reset_custom_rng() {
    custom_rng_offset = 0;
}

EMSCRIPTEN_KEEPALIVE
void disable_custom_rng() {
    OQS_randombytes_switch_algorithm(OQS_RAND_alg_system);
    if (custom_rng_seed) {
        free(custom_rng_seed);
        custom_rng_seed = NULL;
    }
}

// --- KEM Wrapper Functions ---
EMSCRIPTEN_KEEPALIVE
OQS_KEM* oqs_kem_new(const char *alg_name) {
    return OQS_KEM_new(alg_name);
}

EMSCRIPTEN_KEEPALIVE
void oqs_kem_free(OQS_KEM *kem) {
    OQS_KEM_free(kem);
}

EMSCRIPTEN_KEEPALIVE
size_t oqs_kem_get_public_key_len(const OQS_KEM *kem) { return kem->length_public_key; }

EMSCRIPTEN_KEEPALIVE
size_t oqs_kem_get_secret_key_len(const OQS_KEM *kem) { return kem->length_secret_key; }

EMSCRIPTEN_KEEPALIVE
size_t oqs_kem_get_ciphertext_len(const OQS_KEM *kem) { return kem->length_ciphertext; }

EMSCRIPTEN_KEEPALIVE
size_t oqs_kem_get_shared_secret_len(const OQS_KEM *kem) { return kem->length_shared_secret; }

EMSCRIPTEN_KEEPALIVE
int oqs_kem_keypair(const OQS_KEM *kem, uint8_t *public_key, uint8_t *secret_key) {
    return OQS_KEM_keypair(kem, public_key, secret_key);
}

EMSCRIPTEN_KEEPALIVE
int oqs_kem_encaps(const OQS_KEM *kem, uint8_t *ciphertext, uint8_t *shared_secret, const uint8_t *public_key) {
    return OQS_KEM_encaps(kem, ciphertext, shared_secret, public_key);
}

EMSCRIPTEN_KEEPALIVE
int oqs_kem_decaps(const OQS_KEM *kem, uint8_t *shared_secret, const uint8_t *ciphertext, const uint8_t *secret_key) {
    return OQS_KEM_decaps(kem, shared_secret, ciphertext, secret_key);
}

// --- SIG Wrapper Functions ---
EMSCRIPTEN_KEEPALIVE
OQS_SIG* oqs_sig_new(const char *alg_name) {
    return OQS_SIG_new(alg_name);
}

EMSCRIPTEN_KEEPALIVE
void oqs_sig_free(OQS_SIG *sig) {
    OQS_SIG_free(sig);
}

EMSCRIPTEN_KEEPALIVE
size_t oqs_sig_get_public_key_len(const OQS_SIG *sig) { return sig->length_public_key; }

EMSCRIPTEN_KEEPALIVE
size_t oqs_sig_get_secret_key_len(const OQS_SIG *sig) { return sig->length_secret_key; }

EMSCRIPTEN_KEEPALIVE
size_t oqs_sig_get_max_signature_len(const OQS_SIG *sig) { return sig->length_signature; }

EMSCRIPTEN_KEEPALIVE
int oqs_sig_keypair(const OQS_SIG *sig, uint8_t *public_key, uint8_t *secret_key) {
    return OQS_SIG_keypair(sig, public_key, secret_key);
}

EMSCRIPTEN_KEEPALIVE
int oqs_sig_sign(const OQS_SIG *sig, uint8_t *signature, size_t *signature_len, const uint8_t *message, size_t message_len, const uint8_t *secret_key) {
    return OQS_SIG_sign(sig, signature, signature_len, message, message_len, secret_key);
}

EMSCRIPTEN_KEEPALIVE
int oqs_sig_verify(const OQS_SIG *sig, const uint8_t *message, size_t message_len, const uint8_t *signature, size_t signature_len, const uint8_t *public_key) {
    return OQS_SIG_verify(sig, message, message_len, signature, signature_len, public_key);
}
