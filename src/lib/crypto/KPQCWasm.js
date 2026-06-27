import createKPQCWasm from './kpqc.js';

class KPQCWasm {
    constructor() {
        this.module = null;
        this.initialized = false;

        // Corrected Algorithm Parameters from api.h
        this.ALGS = {
            // NTRU+ KEM (NTRU+ sk is (poly << 1) + 32)
            'ntruplus576': { type: 'kem', pkSize: 864, skSize: 1760, ctSize: 864, ssSize: 32 },
            'ntruplus768': { type: 'kem', pkSize: 1152, skSize: 2336, ctSize: 1152, ssSize: 32 },
            'ntruplus864': { type: 'kem', pkSize: 1296, skSize: 2624, ctSize: 1296, ssSize: 32 },
            'ntruplus1152': { type: 'kem', pkSize: 1728, skSize: 3488, ctSize: 1728, ssSize: 32 },

            // SMAUG-T KEM
            'smaugt1': { type: 'kem', pkSize: 672, skSize: 832, ctSize: 672, ssSize: 32 },
            'smaugt3': { type: 'kem', pkSize: 1088, skSize: 1312, ctSize: 992, ssSize: 32 },
            'smaugt5': { type: 'kem', pkSize: 1440, skSize: 1728, ctSize: 1376, ssSize: 32 },

            // AIMer Signature
            'aimer128f': { type: 'sign', pkSize: 32, skSize: 48, sigSize: 5888 },
            'aimer128s': { type: 'sign', pkSize: 32, skSize: 48, sigSize: 4160 },
            'aimer192f': { type: 'sign', pkSize: 48, skSize: 72, sigSize: 13056 },
            'aimer192s': { type: 'sign', pkSize: 48, skSize: 72, sigSize: 9120 },
            'aimer256f': { type: 'sign', pkSize: 64, skSize: 96, sigSize: 25120 },
            'aimer256s': { type: 'sign', pkSize: 64, skSize: 96, sigSize: 17056 },

            // HAETAE Signature
            'haetae2': { type: 'sign', pkSize: 992, skSize: 1408, sigSize: 1474 },
            'haetae3': { type: 'sign', pkSize: 1472, skSize: 2112, sigSize: 2349 },
            'haetae5': { type: 'sign', pkSize: 2080, skSize: 2752, sigSize: 2948 }
        };
    }

    async init() {
        if (this.initialized) return;
        try {
            this.module = await createKPQCWasm();
            if (!this.module || !this.module.HEAPU8) {
                throw new Error("KPQC WASM module loaded but HEAPU8 is missing.");
            }
            this.initialized = true;
            console.log("KPQC WASM Initialized");
        } catch (e) {
            console.error("Failed to initialize KPQC WASM", e);
            throw e;
        }
    }

    _toHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    _fromHex(hex) {
        if (!hex) return new Uint8Array(0);
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }

    async keygen(algId) {
        await this.init();
        const alg = this.ALGS[algId];
        if (!alg) throw new Error(`Unknown algorithm: ${algId}`);

        const pkPtr = this.module._malloc(alg.pkSize);
        const skPtr = this.module._malloc(alg.skSize);

        try {
            let res;
            if (alg.type === 'kem') {
                res = this.module.ccall('kpqc_kem_keypair', 'number', ['string', 'number', 'number'], [algId, pkPtr, skPtr]);
            } else {
                res = this.module.ccall('kpqc_sign_keypair', 'number', ['string', 'number', 'number'], [algId, pkPtr, skPtr]);
            }

            if (res !== 0) throw new Error(`Keygen failed with code ${res}`);

            const pk = new Uint8Array(this.module.HEAPU8.buffer, pkPtr, alg.pkSize);
            const sk = new Uint8Array(this.module.HEAPU8.buffer, skPtr, alg.skSize);

            return {
                pk: this._toHex(pk),
                sk: this._toHex(sk)
            };
        } finally {
            this.module._free(pkPtr);
            this.module._free(skPtr);
        }
    }

    async encapsulate(algId, pkHex) {
        await this.init();
        const alg = this.ALGS[algId];
        if (!alg || alg.type !== 'kem') throw new Error(`Invalid KEM algorithm: ${algId}`);

        const pk = this._fromHex(pkHex);
        const pkPtr = this.module._malloc(pk.length);
        const ctPtr = this.module._malloc(alg.ctSize);
        const ssPtr = this.module._malloc(alg.ssSize);

        this.module.HEAPU8.set(pk, pkPtr);

        try {
            const res = this.module.ccall('kpqc_kem_enc', 'number', ['string', 'number', 'number', 'number'], [algId, ctPtr, ssPtr, pkPtr]);
            if (res !== 0) throw new Error(`Encapsulation failed with code ${res}`);

            const ct = new Uint8Array(this.module.HEAPU8.buffer, ctPtr, alg.ctSize);
            const ss = new Uint8Array(this.module.HEAPU8.buffer, ssPtr, alg.ssSize);

            return {
                ct: this._toHex(ct),
                ss: this._toHex(ss)
            };
        } finally {
            this.module._free(pkPtr);
            this.module._free(ctPtr);
            this.module._free(ssPtr);
        }
    }

    async decapsulate(algId, ctHex, skHex) {
        await this.init();
        const alg = this.ALGS[algId];
        if (!alg || alg.type !== 'kem') throw new Error(`Invalid KEM algorithm: ${algId}`);

        const ct = this._fromHex(ctHex);
        const sk = this._fromHex(skHex);
        const ctPtr = this.module._malloc(ct.length);
        const skPtr = this.module._malloc(sk.length);
        const ssPtr = this.module._malloc(alg.ssSize);

        this.module.HEAPU8.set(ct, ctPtr);
        this.module.HEAPU8.set(sk, skPtr);

        try {
            const res = this.module.ccall('kpqc_kem_dec', 'number', ['string', 'number', 'number', 'number'], [algId, ssPtr, ctPtr, skPtr]);
            if (res !== 0) throw new Error(`Decapsulation failed with code ${res}`);

            const ss = new Uint8Array(this.module.HEAPU8.buffer, ssPtr, alg.ssSize);
            return {
                ss: this._toHex(ss)
            };
        } finally {
            this.module._free(ctPtr);
            this.module._free(skPtr);
            this.module._free(ssPtr);
        }
    }

    async sign(algId, msgHex, skHex) {
        await this.init();
        const alg = this.ALGS[algId];
        if (!alg || alg.type !== 'sign') throw new Error(`Invalid Sign algorithm: ${algId}`);

        const msg = this._fromHex(msgHex);
        const sk = this._fromHex(skHex);
        const skPtr = this.module._malloc(sk.length);
        const msgPtr = this.module._malloc(msg.length);
        const smPtr = this.module._malloc(msg.length + alg.sigSize + 1024);
        const smlenPtr = this.module._malloc(8);

        this.module.HEAPU8.set(sk, skPtr);
        this.module.HEAPU8.set(msg, msgPtr);

        try {
            const res = this.module.ccall('kpqc_sign', 'number', ['string', 'number', 'number', 'number', 'number', 'number'],
                [algId, smPtr, smlenPtr, msgPtr, msg.length, skPtr]);
            if (res !== 0) throw new Error(`Signing failed with code ${res}`);

            const smlen = new Uint32Array(this.module.HEAPU8.buffer, smlenPtr, 1)[0];
            const sm = new Uint8Array(this.module.HEAPU8.buffer, smPtr, smlen);

            return {
                sm: this._toHex(sm)
            };
        } finally {
            this.module._free(skPtr);
            this.module._free(msgPtr);
            this.module._free(smPtr);
            this.module._free(smlenPtr);
        }
    }

    async verify(algId, smHex, pkHex) {
        await this.init();
        const alg = this.ALGS[algId];
        if (!alg || alg.type !== 'sign') throw new Error(`Invalid Sign algorithm: ${algId}`);

        const sm = this._fromHex(smHex);
        const pk = this._fromHex(pkHex);
        const pkPtr = this.module._malloc(pk.length);
        const smPtr = this.module._malloc(sm.length);
        const msgPtr = this.module._malloc(sm.length);
        const mlenPtr = this.module._malloc(8);

        this.module.HEAPU8.set(pk, pkPtr);
        this.module.HEAPU8.set(sm, smPtr);

        try {
            const res = this.module.ccall('kpqc_sign_open', 'number', ['string', 'number', 'number', 'number', 'number', 'number'],
                [algId, msgPtr, mlenPtr, smPtr, sm.length, pkPtr]);

            return { verified: res === 0 };
        } finally {
            this.module._free(pkPtr);
            this.module._free(smPtr);
            this.module._free(msgPtr);
            this.module._free(mlenPtr);
        }
    }
}

export default new KPQCWasm();
