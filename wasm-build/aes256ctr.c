#include "aes256ctr.h"
#include <string.h>

void aes256ctr_init(aes256ctr_ctx *state, const uint8_t key[32], uint64_t nonce) {
    aes256_ctr_keyexp(&state->ctx, key);
    // KpqClean's aes256ctr seems to use a 64-bit nonce and a 64-bit counter (starting at 0)
    // The nonce is usually in the first 8 bytes and counter in the last 8 bytes (big-endian)
    memset(state->iv, 0, 16);
    for (int i = 0; i < 8; i++) {
        state->iv[i] = (nonce >> (8 * (7 - i))) & 0xFF;
    }
}

void aes256ctr_squeezeblocks(uint8_t *out, size_t nblocks, aes256ctr_ctx *state) {
    aes256_ctr(out, nblocks * 16, state->iv, &state->ctx);
    // Update IV (counter part)
    // This is a bit tricky because aes256_ctr in aes.c doesn't update the IV.
    // We need to manually increment the counter.
    // For 16-byte blocks, nblocks * 16 bytes were processed.
    // The counter is the last 8 bytes of IV.
    uint64_t count = 0;
    for (int i = 0; i < 8; i++) {
        count = (count << 8) | state->iv[i + 8];
    }
    count += nblocks;
    for (int i = 0; i < 8; i++) {
        state->iv[i + 8] = (count >> (8 * (7 - i))) & 0xFF;
    }
}

void aes256ctr_prf(uint8_t *out, size_t outlen, const uint8_t key[32], uint64_t nonce) {
    aes256ctr_ctx state;
    aes256ctr_init(&state, key, nonce);
    aes256_ctr(out, outlen, state.iv, &state.ctx);
    aes256_ctx_release(&state.ctx);
}
