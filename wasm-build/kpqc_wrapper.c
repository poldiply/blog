#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include <emscripten.h>

// --- Forward Declarations for KPQC Algorithms ---

// NTRU+ KEM
#define DECLARE_NTRU(val) \
    int kpqclean_ntruplus##val##_clean_crypto_kem_keypair(unsigned char *pk, unsigned char *sk); \
    int kpqclean_ntruplus##val##_clean_crypto_kem_enc(unsigned char *ct, unsigned char *ss, const unsigned char *pk); \
    int kpqclean_ntruplus##val##_clean_crypto_kem_dec(unsigned char *ss, const unsigned char *ct, const unsigned char *sk);

DECLARE_NTRU(576)
DECLARE_NTRU(768)
DECLARE_NTRU(864)
DECLARE_NTRU(1152)

// SMAUG-T KEM
#define DECLARE_SMAUG(val) \
    int cryptolab_smaug##val##_crypto_kem_keypair(uint8_t *pk, uint8_t *sk); \
    int cryptolab_smaug##val##_crypto_kem_enc(uint8_t *ct, uint8_t *ss, const uint8_t *pk); \
    int cryptolab_smaug##val##_crypto_kem_dec(uint8_t *ss, const uint8_t *ct, const uint8_t *sk);

DECLARE_SMAUG(1)
DECLARE_SMAUG(3)
DECLARE_SMAUG(5)

// Special case for SMAUG-T1 which has swapped args in its api.h
// Note: DECLARE_SMAUG(1) already declared it as (ct, ss, pk), 
// but the actual implementation in SMAUG-T1 is (ss, ct, pk).
// So we will just call it with swapped arguments in the wrapper.

// AIMer Signature
#define DECLARE_AIMER(val) \
    int samsungsds_aimer##val##_ref_crypto_sign_keypair(unsigned char *pk, unsigned char *sk); \
    int samsungsds_aimer##val##_ref_crypto_sign(unsigned char *sm, size_t *smlen, const unsigned char *m, size_t mlen, const unsigned char *sk); \
    int samsungsds_aimer##val##_ref_crypto_sign_open(unsigned char *m, size_t *mlen, const unsigned char *sm, size_t smlen, const unsigned char *pk);

DECLARE_AIMER(128f)
DECLARE_AIMER(128s)
DECLARE_AIMER(192f)
DECLARE_AIMER(192s)
DECLARE_AIMER(256f)
DECLARE_AIMER(256s)

// HAETAE Signature
#define DECLARE_HAETAE(val) \
    int cryptolab_haetae##val##_crypto_sign_keypair(unsigned char *pk, unsigned char *sk); \
    int cryptolab_haetae##val##_crypto_sign(unsigned char *sm, size_t *smlen, const unsigned char *m, size_t mlen, const unsigned char *sk); \
    int cryptolab_haetae##val##_crypto_sign_open(unsigned char *m, size_t *mlen, const unsigned char *sm, size_t smlen, const unsigned char *pk);

DECLARE_HAETAE(2)
DECLARE_HAETAE(3)
DECLARE_HAETAE(5)

// --- Custom Entropy / RandomBytes ---
static unsigned char *custom_entropy = NULL;
static size_t custom_entropy_pos = 0;
static size_t custom_entropy_len = 0;

EMSCRIPTEN_KEEPALIVE
void kpqc_set_entropy(unsigned char *entropy, int len) {
    custom_entropy = entropy;
    custom_entropy_pos = 0;
    custom_entropy_len = (size_t)len;
}

int randombytes(unsigned char *out, size_t len) {
    if (custom_entropy && custom_entropy_pos + len <= custom_entropy_len) {
        memcpy(out, custom_entropy + custom_entropy_pos, len);
        custom_entropy_pos += len;
    } else {
        for (size_t i = 0; i < len; i++) {
            out[i] = (unsigned char)(rand() & 0xFF);
        }
    }
    return 0;
}

// --- WASM Exports ---

EMSCRIPTEN_KEEPALIVE
int kpqc_kem_keypair(const char *alg, unsigned char *pk, unsigned char *sk) {
    if (strcmp(alg, "ntruplus576") == 0) return kpqclean_ntruplus576_clean_crypto_kem_keypair(pk, sk);
    if (strcmp(alg, "ntruplus768") == 0) return kpqclean_ntruplus768_clean_crypto_kem_keypair(pk, sk);
    if (strcmp(alg, "ntruplus864") == 0) return kpqclean_ntruplus864_clean_crypto_kem_keypair(pk, sk);
    if (strcmp(alg, "ntruplus1152") == 0) return kpqclean_ntruplus1152_clean_crypto_kem_keypair(pk, sk);
    
    if (strcmp(alg, "smaugt1") == 0) return cryptolab_smaug1_crypto_kem_keypair(pk, sk);
    if (strcmp(alg, "smaugt3") == 0) return cryptolab_smaug3_crypto_kem_keypair(pk, sk);
    if (strcmp(alg, "smaugt5") == 0) return cryptolab_smaug5_crypto_kem_keypair(pk, sk);
    
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int kpqc_kem_enc(const char *alg, unsigned char *ct, unsigned char *ss, const unsigned char *pk) {
    if (strcmp(alg, "ntruplus576") == 0) return kpqclean_ntruplus576_clean_crypto_kem_enc(ct, ss, pk);
    if (strcmp(alg, "ntruplus768") == 0) return kpqclean_ntruplus768_clean_crypto_kem_enc(ct, ss, pk);
    if (strcmp(alg, "ntruplus864") == 0) return kpqclean_ntruplus864_clean_crypto_kem_enc(ct, ss, pk);
    if (strcmp(alg, "ntruplus1152") == 0) return kpqclean_ntruplus1152_clean_crypto_kem_enc(ct, ss, pk);

    // SMAUG-T1: api.h says enc(ss, ct, pk)
    if (strcmp(alg, "smaugt1") == 0) return cryptolab_smaug1_crypto_kem_enc(ss, ct, pk); 
    if (strcmp(alg, "smaugt3") == 0) return cryptolab_smaug3_crypto_kem_enc(ct, ss, pk);
    if (strcmp(alg, "smaugt5") == 0) return cryptolab_smaug5_crypto_kem_enc(ct, ss, pk);
    
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int kpqc_kem_dec(const char *alg, unsigned char *ss, const unsigned char *ct, const unsigned char *sk) {
    if (strcmp(alg, "ntruplus576") == 0) return kpqclean_ntruplus576_clean_crypto_kem_dec(ss, ct, sk);
    if (strcmp(alg, "ntruplus768") == 0) return kpqclean_ntruplus768_clean_crypto_kem_dec(ss, ct, sk);
    if (strcmp(alg, "ntruplus864") == 0) return kpqclean_ntruplus864_clean_crypto_kem_dec(ss, ct, sk);
    if (strcmp(alg, "ntruplus1152") == 0) return kpqclean_ntruplus1152_clean_crypto_kem_dec(ss, ct, sk);

    if (strcmp(alg, "smaugt1") == 0) return cryptolab_smaug1_crypto_kem_dec(ss, ct, sk);
    if (strcmp(alg, "smaugt3") == 0) return cryptolab_smaug3_crypto_kem_dec(ss, ct, sk);
    if (strcmp(alg, "smaugt5") == 0) return cryptolab_smaug5_crypto_kem_dec(ss, ct, sk);
    
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int kpqc_sign_keypair(const char *alg, unsigned char *pk, unsigned char *sk) {
    if (strcmp(alg, "aimer128f") == 0) return samsungsds_aimer128f_ref_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "aimer128s") == 0) return samsungsds_aimer128s_ref_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "aimer192f") == 0) return samsungsds_aimer192f_ref_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "aimer192s") == 0) return samsungsds_aimer192s_ref_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "aimer256f") == 0) return samsungsds_aimer256f_ref_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "aimer256s") == 0) return samsungsds_aimer256s_ref_crypto_sign_keypair(pk, sk);

    if (strcmp(alg, "haetae2") == 0) return cryptolab_haetae2_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "haetae3") == 0) return cryptolab_haetae3_crypto_sign_keypair(pk, sk);
    if (strcmp(alg, "haetae5") == 0) return cryptolab_haetae5_crypto_sign_keypair(pk, sk);
    
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int kpqc_sign(const char *alg, unsigned char *sm, size_t *smlen, const unsigned char *m, size_t mlen, const unsigned char *sk) {
    if (strcmp(alg, "aimer128f") == 0) return samsungsds_aimer128f_ref_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "aimer128s") == 0) return samsungsds_aimer128s_ref_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "aimer192f") == 0) return samsungsds_aimer192f_ref_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "aimer192s") == 0) return samsungsds_aimer192s_ref_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "aimer256f") == 0) return samsungsds_aimer256f_ref_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "aimer256s") == 0) return samsungsds_aimer256s_ref_crypto_sign(sm, smlen, m, mlen, sk);

    if (strcmp(alg, "haetae2") == 0) return cryptolab_haetae2_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "haetae3") == 0) return cryptolab_haetae3_crypto_sign(sm, smlen, m, mlen, sk);
    if (strcmp(alg, "haetae5") == 0) return cryptolab_haetae5_crypto_sign(sm, smlen, m, mlen, sk);
    
    return -1;
}

EMSCRIPTEN_KEEPALIVE
int kpqc_sign_open(const char *alg, unsigned char *m, size_t *mlen, const unsigned char *sm, size_t smlen, const unsigned char *pk) {
    if (strcmp(alg, "aimer128f") == 0) return samsungsds_aimer128f_ref_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "aimer128s") == 0) return samsungsds_aimer128s_ref_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "aimer192f") == 0) return samsungsds_aimer192f_ref_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "aimer192s") == 0) return samsungsds_aimer192s_ref_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "aimer256f") == 0) return samsungsds_aimer256f_ref_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "aimer256s") == 0) return samsungsds_aimer256s_ref_crypto_sign_open(m, mlen, sm, smlen, pk);

    if (strcmp(alg, "haetae2") == 0) return cryptolab_haetae2_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "haetae3") == 0) return cryptolab_haetae3_crypto_sign_open(m, mlen, sm, smlen, pk);
    if (strcmp(alg, "haetae5") == 0) return cryptolab_haetae5_crypto_sign_open(m, mlen, sm, smlen, pk);
    
    return -1;
}
