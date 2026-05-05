#ifndef AES256CTR_H
#define AES256CTR_H

#include <stddef.h>
#include <stdint.h>
#include "aes.h"

#define AES256CTR_BLOCKBYTES 64

typedef struct {
    aes256ctx ctx;
    uint8_t iv[16];
} aes256ctr_ctx;

void aes256ctr_init(aes256ctr_ctx *state, const uint8_t key[32], uint64_t nonce);
void aes256ctr_squeezeblocks(uint8_t *out, size_t nblocks, aes256ctr_ctx *state);
void aes256ctr_prf(uint8_t *out, size_t outlen, const uint8_t key[32], uint64_t nonce);

#endif
