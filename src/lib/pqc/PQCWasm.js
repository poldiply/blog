import createOQSModule from './oqs.js';

export class PQCWasm {
    constructor() {
        this.module = null;
        this.ready = false;
    }

    async init() {
        if (this.ready) return;
        this.module = await createOQSModule({
            locateFile: (path) => {
                if (path.endsWith('.wasm')) return '/oqs.wasm';
                return path;
            }
        });
        this.ready = true;
    }

    _hexToBytes(hex) {
        if (!hex) return new Uint8Array();
        hex = hex.replace(/[^0-9a-fA-F]/g, '');
        const bytes = new Uint8Array(Math.ceil(hex.length / 2));
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    }

    _bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    _writeMemory(bytes, ptr) {
        for (let i = 0; i < bytes.length; i++) {
            this.module.setValue(ptr + i, bytes[i], 'i8');
        }
    }

    _readMemory(ptr, len) {
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = this.module.getValue(ptr + i, 'i8') & 0xff;
        }
        return bytes;
    }

    _setRNGSeed(seedBytes) {
        if (!seedBytes || seedBytes.length === 0) return;
        const seedPtr = this.module._malloc(seedBytes.length);
        this._writeMemory(seedBytes, seedPtr);
        this.module.ccall('init_custom_rng', null, ['number', 'number'], [seedPtr, seedBytes.length]);
        this.module._free(seedPtr);
    }

    _disableRNG() {
        this.module.ccall('disable_custom_rng', null, [], []);
    }

    // --- KEM ---
    kemKeypair(algName, seedHex = null) {
        if (!this.ready) throw new Error("WASM not ready");
        if (seedHex) this._setRNGSeed(this._hexToBytes(seedHex));
        
        const kem = this.module.ccall('oqs_kem_new', 'number', ['string'], [algName]);
        if (!kem) {
            if (seedHex) this._disableRNG();
            throw new Error(`Algorithm ${algName} not supported.`);
        }

        const pkLen = this.module.ccall('oqs_kem_get_public_key_len', 'number', ['number'], [kem]);
        const skLen = this.module.ccall('oqs_kem_get_secret_key_len', 'number', ['number'], [kem]);

        const pkPtr = this.module._malloc(pkLen);
        const skPtr = this.module._malloc(skLen);

        const ret = this.module.ccall('oqs_kem_keypair', 'number', ['number', 'number', 'number'], [kem, pkPtr, skPtr]);
        
        let pkHex = null, skHex = null;
        if (ret === 0) {
            pkHex = this._bytesToHex(this._readMemory(pkPtr, pkLen));
            skHex = this._bytesToHex(this._readMemory(skPtr, skLen));
        }

        this.module._free(pkPtr);
        this.module._free(skPtr);
        this.module.ccall('oqs_kem_free', null, ['number'], [kem]);
        if (seedHex) this._disableRNG();

        if (ret !== 0) throw new Error("KEM Keypair failed");
        return { pk: pkHex, sk: skHex };
    }

    kemEncaps(algName, pkHex, seedHex = null) {
        if (!this.ready) throw new Error("WASM not ready");
        if (seedHex) this._setRNGSeed(this._hexToBytes(seedHex));

        const kem = this.module.ccall('oqs_kem_new', 'number', ['string'], [algName]);
        if (!kem) {
            if (seedHex) this._disableRNG();
            throw new Error(`Algorithm ${algName} not supported.`);
        }

        const ctLen = this.module.ccall('oqs_kem_get_ciphertext_len', 'number', ['number'], [kem]);
        const ssLen = this.module.ccall('oqs_kem_get_shared_secret_len', 'number', ['number'], [kem]);

        const pkBytes = this._hexToBytes(pkHex);
        const pkPtr = this.module._malloc(pkBytes.length);
        this._writeMemory(pkBytes, pkPtr);

        const ctPtr = this.module._malloc(ctLen);
        const ssPtr = this.module._malloc(ssLen);

        const ret = this.module.ccall('oqs_kem_encaps', 'number', ['number', 'number', 'number', 'number'], [kem, ctPtr, ssPtr, pkPtr]);
        
        let ctHex = null, ssHex = null;
        if (ret === 0) {
            ctHex = this._bytesToHex(this._readMemory(ctPtr, ctLen));
            ssHex = this._bytesToHex(this._readMemory(ssPtr, ssLen));
        }

        this.module._free(pkPtr);
        this.module._free(ctPtr);
        this.module._free(ssPtr);
        this.module.ccall('oqs_kem_free', null, ['number'], [kem]);
        if (seedHex) this._disableRNG();

        if (ret !== 0) throw new Error("KEM Encaps failed");
        return { ct: ctHex, ss: ssHex };
    }

    kemDecaps(algName, ctHex, skHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const kem = this.module.ccall('oqs_kem_new', 'number', ['string'], [algName]);
        if (!kem) throw new Error(`Algorithm ${algName} not supported.`);

        const ssLen = this.module.ccall('oqs_kem_get_shared_secret_len', 'number', ['number'], [kem]);

        const ctBytes = this._hexToBytes(ctHex);
        const skBytes = this._hexToBytes(skHex);
        
        const ctPtr = this.module._malloc(ctBytes.length);
        this._writeMemory(ctBytes, ctPtr);
        const skPtr = this.module._malloc(skBytes.length);
        this._writeMemory(skBytes, skPtr);
        
        const ssPtr = this.module._malloc(ssLen);

        const ret = this.module.ccall('oqs_kem_decaps', 'number', ['number', 'number', 'number', 'number'], [kem, ssPtr, ctPtr, skPtr]);
        
        let ssHex = null;
        if (ret === 0) {
            ssHex = this._bytesToHex(this._readMemory(ssPtr, ssLen));
        }

        this.module._free(ctPtr);
        this.module._free(skPtr);
        this.module._free(ssPtr);
        this.module.ccall('oqs_kem_free', null, ['number'], [kem]);

        if (ret !== 0) throw new Error("KEM Decaps failed");
        return { ss: ssHex };
    }

    // --- SIG ---
    sigKeypair(algName, seedHex = null) {
        if (!this.ready) throw new Error("WASM not ready");
        if (seedHex) this._setRNGSeed(this._hexToBytes(seedHex));
        
        const sig = this.module.ccall('oqs_sig_new', 'number', ['string'], [algName]);
        if (!sig) {
            if (seedHex) this._disableRNG();
            throw new Error(`Algorithm ${algName} not supported.`);
        }

        const pkLen = this.module.ccall('oqs_sig_get_public_key_len', 'number', ['number'], [sig]);
        const skLen = this.module.ccall('oqs_sig_get_secret_key_len', 'number', ['number'], [sig]);

        const pkPtr = this.module._malloc(pkLen);
        const skPtr = this.module._malloc(skLen);

        const ret = this.module.ccall('oqs_sig_keypair', 'number', ['number', 'number', 'number'], [sig, pkPtr, skPtr]);
        
        let pkHex = null, skHex = null;
        if (ret === 0) {
            pkHex = this._bytesToHex(this._readMemory(pkPtr, pkLen));
            skHex = this._bytesToHex(this._readMemory(skPtr, skLen));
        }

        this.module._free(pkPtr);
        this.module._free(skPtr);
        this.module.ccall('oqs_sig_free', null, ['number'], [sig]);
        if (seedHex) this._disableRNG();

        if (ret !== 0) throw new Error("SIG Keypair failed");
        return { pk: pkHex, sk: skHex };
    }

    sigSign(algName, msgHex, skHex, seedHex = null) {
        if (!this.ready) throw new Error("WASM not ready");
        if (seedHex) this._setRNGSeed(this._hexToBytes(seedHex));

        const sig = this.module.ccall('oqs_sig_new', 'number', ['string'], [algName]);
        if (!sig) {
            if (seedHex) this._disableRNG();
            throw new Error(`Algorithm ${algName} not supported.`);
        }

        const maxSigLen = this.module.ccall('oqs_sig_get_max_signature_len', 'number', ['number'], [sig]);

        const msgBytes = this._hexToBytes(msgHex);
        const skBytes = this._hexToBytes(skHex);
        
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);
        const skPtr = this.module._malloc(skBytes.length);
        this._writeMemory(skBytes, skPtr);

        const sigPtr = this.module._malloc(maxSigLen);
        const sigLenPtr = this.module._malloc(4); // size_t is 4 bytes in WASM32

        const ret = this.module.ccall('oqs_sig_sign', 'number', 
            ['number', 'number', 'number', 'number', 'number', 'number'], 
            [sig, sigPtr, sigLenPtr, msgPtr, msgBytes.length, skPtr]
        );
        
        let sigHex = null;
        if (ret === 0) {
            const actualSigLen = this.module.getValue(sigLenPtr, 'i32');
            sigHex = this._bytesToHex(this._readMemory(sigPtr, actualSigLen));
        }

        this.module._free(msgPtr);
        this.module._free(skPtr);
        this.module._free(sigPtr);
        this.module._free(sigLenPtr);
        this.module.ccall('oqs_sig_free', null, ['number'], [sig]);
        if (seedHex) this._disableRNG();

        if (ret !== 0) throw new Error("SIG Sign failed");
        return { sig: sigHex };
    }

    sigVerify(algName, msgHex, sigHex, pkHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const sig = this.module.ccall('oqs_sig_new', 'number', ['string'], [algName]);
        if (!sig) throw new Error(`Algorithm ${algName} not supported.`);

        const msgBytes = this._hexToBytes(msgHex);
        const sigBytes = this._hexToBytes(sigHex);
        const pkBytes = this._hexToBytes(pkHex);
        
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);
        const sigPtr = this.module._malloc(sigBytes.length);
        this._writeMemory(sigBytes, sigPtr);
        const pkPtr = this.module._malloc(pkBytes.length);
        this._writeMemory(pkBytes, pkPtr);

        const ret = this.module.ccall('oqs_sig_verify', 'number', 
            ['number', 'number', 'number', 'number', 'number', 'number'], 
            [sig, msgPtr, msgBytes.length, sigPtr, sigBytes.length, pkPtr]
        );

        this.module._free(msgPtr);
        this.module._free(sigPtr);
        this.module._free(pkPtr);
        this.module.ccall('oqs_sig_free', null, ['number'], [sig]);

        return ret === 0; // 0 is Success
    }
}

export const pqcWasm = new PQCWasm();
