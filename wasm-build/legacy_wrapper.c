#include <stdio.h>
#include <string.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/err.h>
#include <openssl/rsa.h>
#include <openssl/ec.h>
#include <openssl/pem.h>
#include <openssl/provider.h>
#include <openssl/seed.h>
#include <openssl/modes.h>
#include <emscripten.h>

// --- Helper Functions ---

EMSCRIPTEN_KEEPALIVE
void init_openssl() {
    OSSL_PROVIDER_load(NULL, "default");
    OSSL_PROVIDER_load(NULL, "legacy");
    EVP_set_default_properties(NULL, "provider=legacy,?provider=default");
    OpenSSL_add_all_algorithms();
    ERR_load_crypto_strings();
}

// Custom RNG for deterministic testing
static unsigned char deterministic_seed[32];
static int use_deterministic_rng = 0;

static int custom_rand_bytes(unsigned char *buf, int num) {
    if (use_deterministic_rng) {
        // Simple deterministic RNG for testing purposes
        // In a real CAVP test, we might need a more robust DRBG
        for (int i = 0; i < num; i++) {
            buf[i] = deterministic_seed[i % 32] ^ i;
        }
        return 1;
    }
    return RAND_bytes(buf, num);
}

static int custom_rand_status() { return 1; }

static RAND_METHOD custom_rand_method = {
    NULL, // seed
    custom_rand_bytes,
    NULL, // cleanup
    NULL, // add
    custom_rand_bytes, // pseudorand
    custom_rand_status
};

EMSCRIPTEN_KEEPALIVE
void set_rng_seed(unsigned char *seed, int len) {
    if (len > 32) len = 32;
    memcpy(deterministic_seed, seed, len);
    use_deterministic_rng = 1;
    RAND_set_rand_method(&custom_rand_method);
}

EMSCRIPTEN_KEEPALIVE
void disable_rng_seed() {
    use_deterministic_rng = 0;
    RAND_set_rand_method(RAND_OpenSSL());
}

// --- Fetch Helpers ---
static EVP_CIPHER* fetch_cipher(const char *name) {
    char up[64];
    strncpy(up, name, 63); up[63] = '\0';
    for(int i=0; up[i]; i++) if(up[i]>='a' && up[i]<='z') up[i]-=32;
    
    EVP_CIPHER *c = EVP_CIPHER_fetch(NULL, up, NULL);
    if (!c) c = EVP_CIPHER_fetch(NULL, name, NULL);
    
    if (!c) {
        const EVP_CIPHER *lc = EVP_get_cipherbyname(up);
        if (!lc) lc = EVP_get_cipherbyname(name);
        if (lc) return (EVP_CIPHER *)lc;
    }
    return c;
}

static EVP_MD* fetch_md(const char *name) {
    char up[64];
    strncpy(up, name, 63); up[63] = '\0';
    for(int i=0; up[i]; i++) if(up[i]>='a' && up[i]<='z') up[i]-=32;
    
    EVP_MD *m = EVP_MD_fetch(NULL, up, NULL);
    if (!m) m = EVP_MD_fetch(NULL, name, NULL);
    
    if (!m) {
        const EVP_MD *lm = EVP_get_digestbyname(up);
        if (!lm) lm = EVP_get_digestbyname(name);
        if (lm) return (EVP_MD *)lm;
    }
    return m;
}

static void free_cipher(EVP_CIPHER *c) {
    if (c && EVP_CIPHER_get0_provider(c)) EVP_CIPHER_free(c);
}

static void free_md(EVP_MD *m) {
    if (m && EVP_MD_get0_provider(m)) EVP_MD_free(m);
}

// --- Symmetric Ciphers (EVP) ---

EMSCRIPTEN_KEEPALIVE
int legacy_encrypt(const char *alg_name, 
                   const unsigned char *key, int key_len,
                   const unsigned char *iv, int iv_len,
                   const unsigned char *in, int in_len,
                   unsigned char *out, int *out_len,
                   const unsigned char *aad, int aad_len,
                   unsigned char *tag, int tag_len) {
    
    // Special handling for SEED to bypass provider loading issues in WASM
    if (strstr(alg_name, "seed") || strstr(alg_name, "SEED")) {
        SEED_KEY_SCHEDULE ks;
        SEED_set_key(key, &ks);
        unsigned char ivec[16];
        if (iv && iv_len >= 16) memcpy(ivec, iv, 16);
        else memset(ivec, 0, 16);

        if (strstr(alg_name, "cbc") || strstr(alg_name, "CBC")) {
            SEED_cbc_encrypt(in, out, in_len, &ks, ivec, 1);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ecb") || strstr(alg_name, "ECB")) {
            for (int i = 0; i < in_len; i += 16) {
                SEED_ecb_encrypt(in + i, out + i, &ks, 1);
            }
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "cfb") || strstr(alg_name, "CFB")) {
            int num = 0;
            SEED_cfb128_encrypt(in, out, in_len, &ks, ivec, &num, 1);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ofb") || strstr(alg_name, "OFB")) {
            int num = 0;
            SEED_ofb128_encrypt(in, out, in_len, &ks, ivec, &num);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ctr") || strstr(alg_name, "CTR")) {
            unsigned char ecount[16] = {0};
            unsigned int num = 0;
            CRYPTO_ctr128_encrypt(in, out, in_len, &ks, ivec, ecount, &num, (block128_f)SEED_encrypt);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "gcm") || strstr(alg_name, "GCM")) {
            GCM128_CONTEXT *gctx = CRYPTO_gcm128_new(&ks, (block128_f)SEED_encrypt);
            if (!gctx) return -3;
            CRYPTO_gcm128_setiv(gctx, iv, iv_len);
            if (aad && aad_len > 0) CRYPTO_gcm128_aad(gctx, aad, aad_len);
            CRYPTO_gcm128_encrypt(gctx, in, out, in_len);
            if (tag && tag_len > 0) CRYPTO_gcm128_tag(gctx, tag, tag_len);
            CRYPTO_gcm128_release(gctx);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ccm") || strstr(alg_name, "CCM")) {
            int M = tag_len > 0 ? tag_len : 16;
            int L = 15 - iv_len; if (L < 2) L = 2; if (L > 8) L = 8;
            unsigned char ctx_buf[1024]; // Safe buffer for CCM128_CONTEXT
            CRYPTO_ccm128_init((CCM128_CONTEXT*)ctx_buf, M, L, &ks, (block128_f)SEED_encrypt);
            CRYPTO_ccm128_setiv((CCM128_CONTEXT*)ctx_buf, iv, iv_len, in_len);
            if (aad && aad_len > 0) CRYPTO_ccm128_aad((CCM128_CONTEXT*)ctx_buf, aad, aad_len);
            CRYPTO_ccm128_encrypt((CCM128_CONTEXT*)ctx_buf, in, out, in_len);
            if (tag && tag_len > 0) CRYPTO_ccm128_tag((CCM128_CONTEXT*)ctx_buf, tag, tag_len);
            *out_len = in_len;
            return 0;
        }
    }

    EVP_CIPHER *cipher = fetch_cipher(alg_name);
    if (!cipher) return -1;

    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    int len;
    int ret = 1;
    int is_ccm = (strstr(alg_name, "ccm") != NULL || strstr(alg_name, "CCM") != NULL);

    if (EVP_EncryptInit_ex(ctx, cipher, NULL, NULL, NULL) != 1) { 
        unsigned long err = ERR_get_error();
        char buf[256];
        ERR_error_string_n(err, buf, sizeof(buf));
        printf("EVP_EncryptInit_ex failed: %s\n", buf);
        ret = -2; 
        goto cleanup; 
    }
    
    if (iv_len > 0) {
        EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_IVLEN, iv_len, NULL);
    }

    if (is_ccm) {
        if (tag_len > 0) {
            EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_TAG, tag_len, NULL);
        }
    }

    if (EVP_EncryptInit_ex(ctx, NULL, NULL, key, iv) != 1) { ret = -3; goto cleanup; }

    if (is_ccm) {
        if (EVP_EncryptUpdate(ctx, NULL, &len, NULL, in_len) != 1) { ret = -4; goto cleanup; }
    }

    if (aad && aad_len > 0) {
        if (EVP_EncryptUpdate(ctx, NULL, &len, aad, aad_len) != 1) { ret = -4; goto cleanup; }
    }

    if (EVP_EncryptUpdate(ctx, out, &len, in, in_len) != 1) { ret = -5; goto cleanup; }
    *out_len = len;

    if (EVP_EncryptFinal_ex(ctx, out + len, &len) != 1) { ret = -6; goto cleanup; }
    *out_len += len;

    if (tag && tag_len > 0) {
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_GET_TAG, tag_len, tag) != 1) { ret = -7; goto cleanup; }
    }

cleanup:
    EVP_CIPHER_CTX_free(ctx);
    free_cipher(cipher);
    return ret == 1 ? 0 : ret;
}

EMSCRIPTEN_KEEPALIVE
int legacy_decrypt(const char *alg_name, 
                   const unsigned char *key, int key_len,
                   const unsigned char *iv, int iv_len,
                   const unsigned char *in, int in_len,
                   unsigned char *out, int *out_len,
                   const unsigned char *aad, int aad_len,
                   const unsigned char *tag, int tag_len) {
    
    // Special handling for SEED
    if (strstr(alg_name, "seed") || strstr(alg_name, "SEED")) {
        SEED_KEY_SCHEDULE ks;
        SEED_set_key(key, &ks);
        unsigned char ivec[16];
        if (iv && iv_len >= 16) memcpy(ivec, iv, 16);
        else memset(ivec, 0, 16);

        if (strstr(alg_name, "cbc") || strstr(alg_name, "CBC")) {
            SEED_cbc_encrypt(in, out, in_len, &ks, ivec, 0);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ecb") || strstr(alg_name, "ECB")) {
            for (int i = 0; i < in_len; i += 16) {
                SEED_ecb_encrypt(in + i, out + i, &ks, 0);
            }
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "cfb") || strstr(alg_name, "CFB")) {
            int num = 0;
            SEED_cfb128_encrypt(in, out, in_len, &ks, ivec, &num, 0);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ofb") || strstr(alg_name, "OFB")) {
            int num = 0;
            SEED_ofb128_encrypt(in, out, in_len, &ks, ivec, &num);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ctr") || strstr(alg_name, "CTR")) {
            unsigned char ecount[16] = {0};
            unsigned int num = 0;
            CRYPTO_ctr128_encrypt(in, out, in_len, &ks, ivec, ecount, &num, (block128_f)SEED_encrypt);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "gcm") || strstr(alg_name, "GCM")) {
            GCM128_CONTEXT *gctx = CRYPTO_gcm128_new(&ks, (block128_f)SEED_encrypt);
            if (!gctx) return -3;
            CRYPTO_gcm128_setiv(gctx, iv, iv_len);
            if (aad && aad_len > 0) CRYPTO_gcm128_aad(gctx, aad, aad_len);
            CRYPTO_gcm128_decrypt(gctx, in, out, in_len);
            if (tag && tag_len > 0) {
                if (CRYPTO_gcm128_finish(gctx, tag, tag_len) != 0) {
                    CRYPTO_gcm128_release(gctx);
                    return -5; // Tag mismatch
                }
            }
            CRYPTO_gcm128_release(gctx);
            *out_len = in_len;
            return 0;
        } else if (strstr(alg_name, "ccm") || strstr(alg_name, "CCM")) {
            int M = tag_len > 0 ? tag_len : 16;
            int L = 15 - iv_len; if (L < 2) L = 2; if (L > 8) L = 8;
            unsigned char ctx_buf[1024];
            CRYPTO_ccm128_init((CCM128_CONTEXT*)ctx_buf, M, L, &ks, (block128_f)SEED_encrypt);
            CRYPTO_ccm128_setiv((CCM128_CONTEXT*)ctx_buf, iv, iv_len, in_len);
            if (aad && aad_len > 0) CRYPTO_ccm128_aad((CCM128_CONTEXT*)ctx_buf, aad, aad_len);
            CRYPTO_ccm128_decrypt((CCM128_CONTEXT*)ctx_buf, in, out, in_len);
            if (tag && tag_len > 0) {
                unsigned char res_tag[16];
                CRYPTO_ccm128_tag((CCM128_CONTEXT*)ctx_buf, res_tag, tag_len);
                if (memcmp(res_tag, tag, tag_len) != 0) return -5;
            }
            *out_len = in_len;
            return 0;
        }
    }

    EVP_CIPHER *cipher = fetch_cipher(alg_name);
    if (!cipher) return -1;

    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    int len;
    int ret = 1;
    int is_ccm = (strstr(alg_name, "ccm") || strstr(alg_name, "CCM"));

    if (EVP_DecryptInit_ex(ctx, cipher, NULL, NULL, NULL) != 1) { 
        unsigned long err = ERR_get_error();
        char buf[256];
        ERR_error_string_n(err, buf, sizeof(buf));
        printf("EVP_DecryptInit_ex failed: %s\n", buf);
        ret = -2; 
        goto cleanup; 
    }
    
    if (iv_len > 0) {
        EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_IVLEN, iv_len, NULL);
    }

    if (is_ccm) {
        if (tag_len > 0) {
            EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_TAG, tag_len, (void*)tag);
        }
    }

    if (EVP_DecryptInit_ex(ctx, NULL, NULL, key, iv) != 1) { ret = -3; goto cleanup; }

    if (is_ccm) {
        if (EVP_DecryptUpdate(ctx, NULL, &len, NULL, in_len) != 1) { ret = -4; goto cleanup; }
    }

    if (aad && aad_len > 0) {
        if (EVP_DecryptUpdate(ctx, NULL, &len, aad, aad_len) != 1) { ret = -4; goto cleanup; }
    }

    if (EVP_DecryptUpdate(ctx, out, &len, in, in_len) != 1) { ret = -5; goto cleanup; }
    *out_len = len;

    if (!is_ccm && tag && tag_len > 0) {
        if (EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_AEAD_SET_TAG, tag_len, (void*)tag) != 1) { ret = -6; goto cleanup; }
    }

    if (EVP_DecryptFinal_ex(ctx, out + len, &len) != 1) { ret = -7; goto cleanup; }
    *out_len += len;

cleanup:
    EVP_CIPHER_CTX_free(ctx);
    free_cipher(cipher);
    return ret == 1 ? 0 : ret;
}

// --- Hash Functions ---

EMSCRIPTEN_KEEPALIVE
int legacy_hash(const char *alg_name, const unsigned char *in, int in_len, unsigned char *out, unsigned int *out_len) {
    EVP_MD *md = fetch_md(alg_name);
    if (!md) return -1;

    EVP_MD_CTX *ctx = EVP_MD_CTX_new();
    int ret = 0;
    if (EVP_DigestInit_ex(ctx, md, NULL) != 1) { ret = -2; goto cleanup; }
    if (EVP_DigestUpdate(ctx, in, in_len) != 1) { ret = -3; goto cleanup; }
    if (EVP_DigestFinal_ex(ctx, out, out_len) != 1) { ret = -4; goto cleanup; }
    
cleanup:
    EVP_MD_CTX_free(ctx);
    free_md(md);
    return ret;
}

EMSCRIPTEN_KEEPALIVE
int legacy_hmac(const char *md_name, const unsigned char *key, int key_len, const unsigned char *in, int in_len, unsigned char *out, unsigned int *out_len) {
    EVP_MD *md = fetch_md(md_name);
    if (!md) return -1;

    int ret = 0;
    if (!HMAC(md, key, key_len, in, in_len, out, out_len)) ret = -2;

    free_md(md);
    return ret;
}

// --- PBKDF2 ---

EMSCRIPTEN_KEEPALIVE
int legacy_pbkdf2(const char *md_name, const char *pass, int pass_len, const unsigned char *salt, int salt_len, int iter, int key_len, unsigned char *out) {
    EVP_MD *md = fetch_md(md_name);
    if (!md) return -1;

    int ret = 0;
    if (PKCS5_PBKDF2_HMAC(pass, pass_len, salt, salt_len, iter, md, key_len, out) != 1) ret = -2;

    free_md(md);
    return ret;
}

// --- Public Key Operations ---

EMSCRIPTEN_KEEPALIVE
int rsa_keygen(int bits, unsigned char *out_pk_pem, int *pk_len, unsigned char *out_sk_pem, int *sk_len) {
    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_id(EVP_PKEY_RSA, NULL);
    EVP_PKEY *pkey = NULL;
    int ret = 0;

    if (EVP_PKEY_keygen_init(ctx) <= 0) { ret = -1; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_keygen_bits(ctx, bits) <= 0) { ret = -2; goto cleanup; }
    if (EVP_PKEY_keygen(ctx, &pkey) <= 0) { ret = -3; goto cleanup; }

    BIO *bio_pk = BIO_new(BIO_s_mem());
    PEM_write_bio_PUBKEY(bio_pk, pkey);
    *pk_len = BIO_read(bio_pk, out_pk_pem, 4096);
    BIO_free(bio_pk);

    BIO *bio_sk = BIO_new(BIO_s_mem());
    PEM_write_bio_PrivateKey(bio_sk, pkey, NULL, NULL, 0, NULL, NULL);
    *sk_len = BIO_read(bio_sk, out_sk_pem, 4096);
    BIO_free(bio_sk);

cleanup:
    if (pkey) EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(ctx);
    return ret;
}

EMSCRIPTEN_KEEPALIVE
int rsa_pss_sign(const unsigned char *sk_pem, int sk_len, const unsigned char *msg, int msg_len, unsigned char *sig, unsigned int *sig_len) {
    BIO *bio = BIO_new_mem_buf(sk_pem, sk_len);
    EVP_PKEY *pkey = PEM_read_bio_PrivateKey(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!pkey) return -1;

    EVP_MD_CTX *mctx = EVP_MD_CTX_new();
    EVP_PKEY_CTX *pkctx = NULL;
    int ret = 0;

    if (EVP_DigestSignInit(mctx, &pkctx, EVP_sha256(), NULL, pkey) <= 0) { ret = -2; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_padding(pkctx, RSA_PKCS1_PSS_PADDING) <= 0) { ret = -3; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_pss_saltlen(pkctx, -1) <= 0) { ret = -4; goto cleanup; }

    size_t slen = 2048;
    if (EVP_DigestSign(mctx, sig, &slen, msg, msg_len) <= 0) { ret = -5; goto cleanup; }
    *sig_len = (unsigned int)slen;

cleanup:
    EVP_MD_CTX_free(mctx);
    EVP_PKEY_free(pkey);
    return ret;
}

EMSCRIPTEN_KEEPALIVE
int rsa_pss_verify(const unsigned char *pk_pem, int pk_len, const unsigned char *msg, int msg_len, const unsigned char *sig, int sig_len) {
    BIO *bio = BIO_new_mem_buf(pk_pem, pk_len);
    EVP_PKEY *pkey = PEM_read_bio_PUBKEY(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!pkey) return -1;

    EVP_MD_CTX *mctx = EVP_MD_CTX_new();
    EVP_PKEY_CTX *pkctx = NULL;
    int ret = 0;

    if (EVP_DigestVerifyInit(mctx, &pkctx, EVP_sha256(), NULL, pkey) <= 0) { ret = -2; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_padding(pkctx, RSA_PKCS1_PSS_PADDING) <= 0) { ret = -3; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_pss_saltlen(pkctx, -1) <= 0) { ret = -4; goto cleanup; }

    if (EVP_DigestVerify(mctx, sig, sig_len, msg, msg_len) <= 0) { ret = -5; goto cleanup; }
    ret = 1; // Valid

cleanup:
    EVP_MD_CTX_free(mctx);
    EVP_PKEY_free(pkey);
    return ret;
}

// ECC keygen and ECDSA support
EMSCRIPTEN_KEEPALIVE
int ec_keygen(const char *curve_name, unsigned char *out_pk_pem, int *pk_len, unsigned char *out_sk_pem, int *sk_len) {
    const char *normalized_name = curve_name;
    if (strcmp(curve_name, "P-256") == 0) normalized_name = "prime256v1";
    else if (strcmp(curve_name, "P-224") == 0) normalized_name = "secp224r1";
    else if (strcmp(curve_name, "P-384") == 0) normalized_name = "secp384r1";
    else if (strcmp(curve_name, "P-521") == 0) normalized_name = "secp521r1";
    else if (strcmp(curve_name, "K-233") == 0) normalized_name = "sect233k1";
    else if (strcmp(curve_name, "B-233") == 0) normalized_name = "sect233r1";
    else if (strcmp(curve_name, "K-283") == 0) normalized_name = "sect283k1";
    else if (strcmp(curve_name, "B-283") == 0) normalized_name = "sect283r1";

    int nid = OBJ_txt2nid(normalized_name);
    if (nid == NID_undef) return -4;

    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new_id(EVP_PKEY_EC, NULL);
    EVP_PKEY *pkey = NULL;
    int ret = 0;

    if (EVP_PKEY_keygen_init(ctx) <= 0) { ret = -1; goto cleanup; }
    if (EVP_PKEY_CTX_set_ec_paramgen_curve_nid(ctx, nid) <= 0) { ret = -2; goto cleanup; }
    if (EVP_PKEY_keygen(ctx, &pkey) <= 0) { ret = -3; goto cleanup; }

    BIO *bio_pk = BIO_new(BIO_s_mem());
    PEM_write_bio_PUBKEY(bio_pk, pkey);
    *pk_len = BIO_read(bio_pk, out_pk_pem, 4096);
    BIO_free(bio_pk);

    BIO *bio_sk = BIO_new(BIO_s_mem());
    PEM_write_bio_PrivateKey(bio_sk, pkey, NULL, NULL, 0, NULL, NULL);
    *sk_len = BIO_read(bio_sk, out_sk_pem, 4096);
    BIO_free(bio_sk);

cleanup:
    if (pkey) EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(ctx);
    return ret;
}


// More RSA/ECC functions can be added here as needed for specific playground tasks

EMSCRIPTEN_KEEPALIVE
int ecdsa_sign(const unsigned char *sk_pem, int sk_len, const unsigned char *msg, int msg_len, unsigned char *sig, unsigned int *sig_len) {
    BIO *bio = BIO_new_mem_buf(sk_pem, sk_len);
    EVP_PKEY *pkey = PEM_read_bio_PrivateKey(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!pkey) return -1;

    EVP_MD_CTX *mctx = EVP_MD_CTX_new();
    int ret = 0;

    if (EVP_DigestSignInit(mctx, NULL, EVP_sha256(), NULL, pkey) <= 0) { ret = -2; goto cleanup; }

    size_t slen = 256;
    if (EVP_DigestSign(mctx, sig, &slen, msg, msg_len) <= 0) { ret = -5; goto cleanup; }
    *sig_len = (unsigned int)slen;

cleanup:
    EVP_MD_CTX_free(mctx);
    EVP_PKEY_free(pkey);
    return ret;
}

EMSCRIPTEN_KEEPALIVE
int ecdsa_verify(const unsigned char *pk_pem, int pk_len, const unsigned char *msg, int msg_len, const unsigned char *sig, int sig_len) {
    BIO *bio = BIO_new_mem_buf(pk_pem, pk_len);
    EVP_PKEY *pkey = PEM_read_bio_PUBKEY(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!pkey) return -1;

    EVP_MD_CTX *mctx = EVP_MD_CTX_new();
    int ret = 0;

    if (EVP_DigestVerifyInit(mctx, NULL, EVP_sha256(), NULL, pkey) <= 0) { ret = -2; goto cleanup; }
    if (EVP_DigestVerify(mctx, sig, sig_len, msg, msg_len) <= 0) { ret = -5; goto cleanup; }
    ret = 1;

cleanup:
    EVP_MD_CTX_free(mctx);
    EVP_PKEY_free(pkey);
    return ret;
}

EMSCRIPTEN_KEEPALIVE
int rsa_oaep_encrypt(const unsigned char *pk_pem, int pk_len, const unsigned char *in, int in_len, unsigned char *out, size_t *out_len) {
    BIO *bio = BIO_new_mem_buf(pk_pem, pk_len);
    EVP_PKEY *pkey = PEM_read_bio_PUBKEY(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!pkey) return -1;

    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(pkey, NULL);
    int ret = 0;

    if (EVP_PKEY_encrypt_init(ctx) <= 0) { ret = -2; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING) <= 0) { ret = -3; goto cleanup; }

    if (EVP_PKEY_encrypt(ctx, out, out_len, in, in_len) <= 0) { ret = -5; goto cleanup; }

cleanup:
    EVP_PKEY_CTX_free(ctx);
    EVP_PKEY_free(pkey);
    return ret;
}

EMSCRIPTEN_KEEPALIVE
int rsa_oaep_decrypt(const unsigned char *sk_pem, int sk_len, const unsigned char *in, int in_len, unsigned char *out, size_t *out_len) {
    BIO *bio = BIO_new_mem_buf(sk_pem, sk_len);
    EVP_PKEY *pkey = PEM_read_bio_PrivateKey(bio, NULL, NULL, NULL);
    BIO_free(bio);
    if (!pkey) return -1;

    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(pkey, NULL);
    int ret = 0;

    if (EVP_PKEY_decrypt_init(ctx) <= 0) { ret = -2; goto cleanup; }
    if (EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING) <= 0) { ret = -3; goto cleanup; }

    if (EVP_PKEY_decrypt(ctx, out, out_len, in, in_len) <= 0) { ret = -5; goto cleanup; }

cleanup:
    EVP_PKEY_CTX_free(ctx);
    EVP_PKEY_free(pkey);
    return ret;
}



EMSCRIPTEN_KEEPALIVE
int ecdh_derive(const unsigned char *sk_pem, int sk_len, const unsigned char *peer_pk_pem, int peer_pk_len, unsigned char *secret, size_t *secret_len) {
    BIO *bio_sk = BIO_new_mem_buf(sk_pem, sk_len);
    EVP_PKEY *sk = PEM_read_bio_PrivateKey(bio_sk, NULL, NULL, NULL);
    BIO_free(bio_sk);
    if (!sk) return -1;

    BIO *bio_pk = BIO_new_mem_buf(peer_pk_pem, peer_pk_len);
    EVP_PKEY *pk = PEM_read_bio_PUBKEY(bio_pk, NULL, NULL, NULL);
    BIO_free(bio_pk);
    if (!pk) { EVP_PKEY_free(sk); return -2; }

    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(sk, NULL);
    int ret = 0;

    if (EVP_PKEY_derive_init(ctx) <= 0) { ret = -3; goto cleanup; }
    if (EVP_PKEY_derive_set_peer(ctx, pk) <= 0) { ret = -4; goto cleanup; }
    if (EVP_PKEY_derive(ctx, secret, secret_len) <= 0) { ret = -5; goto cleanup; }

cleanup:
    EVP_PKEY_CTX_free(ctx);
    EVP_PKEY_free(sk);
    EVP_PKEY_free(pk);
    return ret;
}
