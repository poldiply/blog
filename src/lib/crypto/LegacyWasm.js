import createLegacyModule from './legacy.js';

export class LegacyWasm {
    constructor() {
        this.module = null;
        this.ready = false;
    }

    async init() {
        if (this.ready) return;
        this.module = await createLegacyModule({
            locateFile: (path) => {
                if (path.endsWith('.wasm')) return '/legacy.wasm';
                return path;
            }
        });
        this.module.ccall('init_openssl', null, [], []);
        this.ready = true;
    }

    _hexToBytes(hex) {
        hex = (hex || '').replace(/\s+/g, '');
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++)
            bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
        return bytes;
    }

    _bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    _formatHex(hex) {
        if (!hex) return '';
        // Just return the hex, the terminal component handles the line splitting
        return hex.toUpperCase();
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

    setRNGSeed(seedHex) {
        if (!this.ready) return;
        const seed = this._hexToBytes(seedHex);
        const ptr = this.module._malloc(seed.length);
        this._writeMemory(seed, ptr);
        this.module.ccall('set_rng_seed', null, ['number', 'number'], [ptr, seed.length]);
        this.module._free(ptr);
    }

    disableRNGSeed() {
        if (!this.ready) return;
        this.module.ccall('disable_rng_seed', null, [], []);
    }

    encrypt(algName, keyHex, ivHex, inHex, aadHex = null, tagLen = 0) {
        if (!this.ready) throw new Error("WASM not ready");
        
        const key = this._hexToBytes(keyHex);
        const iv = ivHex ? this._hexToBytes(ivHex) : new Uint8Array(0);
        const input = this._hexToBytes(inHex);
        const aad = aadHex ? this._hexToBytes(aadHex) : null;

        const keyPtr = this.module._malloc(key.length);
        this._writeMemory(key, keyPtr);
        
        const ivPtr = this.module._malloc(iv.length || 1); // OpenSSL might want a ptr even if len 0
        if (iv.length > 0) this._writeMemory(iv, ivPtr);

        const inPtr = this.module._malloc(input.length);
        this._writeMemory(input, inPtr);

        const outPtr = this.module._malloc(input.length + 32); // Buffer for final block
        const outLenPtr = this.module._malloc(4);

        const aadPtr = aad ? this.module._malloc(aad.length) : 0;
        if (aad) this._writeMemory(aad, aadPtr);

        const tagPtr = tagLen > 0 ? this.module._malloc(tagLen) : 0;

        const ret = this.module.ccall('legacy_encrypt', 'number',
            ['string', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
            [algName, keyPtr, key.length, ivPtr, iv.length, inPtr, input.length, outPtr, outLenPtr, aadPtr, aad ? aad.length : 0, tagPtr, tagLen]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            result = {
                ciphertext: this._bytesToHex(this._readMemory(outPtr, outLen)),
                tag: tagPtr ? this._bytesToHex(this._readMemory(tagPtr, tagLen)) : null
            };
        }

        this.module._free(keyPtr);
        this.module._free(ivPtr);
        this.module._free(inPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);
        if (aadPtr) this.module._free(aadPtr);
        if (tagPtr) this.module._free(tagPtr);

        if (ret !== 0) throw new Error(`Encryption failed: ${ret}`);
        return result;
    }

    decrypt(algName, keyHex, ivHex, ctHex, aadHex = null, tagHex = null) {
        if (!this.ready) throw new Error("WASM not ready");
        
        const key = this._hexToBytes(keyHex);
        const iv = ivHex ? this._hexToBytes(ivHex) : new Uint8Array(0);
        const ct = this._hexToBytes(ctHex);
        const aad = aadHex ? this._hexToBytes(aadHex) : null;
        const tag = tagHex ? this._hexToBytes(tagHex) : null;

        const keyPtr = this.module._malloc(key.length);
        this._writeMemory(key, keyPtr);
        
        const ivPtr = this.module._malloc(iv.length || 1);
        if (iv.length > 0) this._writeMemory(iv, ivPtr);

        const inPtr = this.module._malloc(ct.length);
        this._writeMemory(ct, inPtr);

        const outPtr = this.module._malloc(ct.length + 32);
        const outLenPtr = this.module._malloc(4);

        const aadPtr = aad ? this.module._malloc(aad.length) : 0;
        if (aad) this._writeMemory(aad, aadPtr);

        const tagPtr = tag ? this.module._malloc(tag.length) : 0;
        if (tag) this._writeMemory(tag, tagPtr);

        const ret = this.module.ccall('legacy_decrypt', 'number',
            ['string', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
            [algName, keyPtr, key.length, ivPtr, iv.length, inPtr, ct.length, outPtr, outLenPtr, aadPtr, aad ? aad.length : 0, tagPtr, tag ? tag.length : 0]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            result = this._bytesToHex(this._readMemory(outPtr, outLen));
        }

        this.module._free(keyPtr);
        this.module._free(ivPtr);
        this.module._free(inPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);
        if (aadPtr) this.module._free(aadPtr);
        if (tagPtr) this.module._free(tagPtr);

        if (ret !== 0) throw new Error(`Decryption failed: ${ret}`);
        return result;
    }

    hash(algName, inHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const input = this._hexToBytes(inHex);
        const inPtr = this.module._malloc(input.length);
        this._writeMemory(input, inPtr);

        const outPtr = this.module._malloc(64); // Max hash size
        const outLenPtr = this.module._malloc(4);

        const ret = this.module.ccall('legacy_hash', 'number',
            ['string', 'number', 'number', 'number', 'number'],
            [algName, inPtr, input.length, outPtr, outLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            result = this._bytesToHex(this._readMemory(outPtr, outLen));
        }

        this.module._free(inPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);

        if (ret !== 0) throw new Error(`Hash failed: ${ret}`);
        return result;
    }

    hmac(mdName, keyHex, inHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const key = this._hexToBytes(keyHex);
        const input = this._hexToBytes(inHex);

        const keyPtr = this.module._malloc(key.length);
        this._writeMemory(key, keyPtr);
        const inPtr = this.module._malloc(input.length);
        this._writeMemory(input, inPtr);

        const outPtr = this.module._malloc(64);
        const outLenPtr = this.module._malloc(4);

        const ret = this.module.ccall('legacy_hmac', 'number',
            ['string', 'number', 'number', 'number', 'number', 'number', 'number'],
            [mdName, keyPtr, key.length, inPtr, input.length, outPtr, outLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            result = this._bytesToHex(this._readMemory(outPtr, outLen));
        }

        this.module._free(keyPtr);
        this.module._free(inPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);

        if (ret !== 0) throw new Error(`HMAC failed: ${ret}`);
        return result;
    }

    _pemToHex(pem) {
        if (!pem) return '';
        // Remove headers and whitespace
        const lines = pem.split('\n');
        const b64 = lines.filter(l => l && !l.startsWith('---')).join('');
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return this._bytesToHex(bytes);
    }

    rsaKeygen(bits) {
        if (!this.ready) throw new Error("WASM not ready");
        const pkPtr = this.module._malloc(4096);
        const pkLenPtr = this.module._malloc(4);
        const skPtr = this.module._malloc(4096);
        const skLenPtr = this.module._malloc(4);

        const ret = this.module.ccall('rsa_keygen', 'number',
            ['number', 'number', 'number', 'number', 'number'],
            [bits, pkPtr, pkLenPtr, skPtr, skLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const pkLen = this.module.getValue(pkLenPtr, 'i32');
            const skLen = this.module.getValue(skLenPtr, 'i32');
            const pk = new TextDecoder().decode(this._readMemory(pkPtr, pkLen));
            const sk = new TextDecoder().decode(this._readMemory(skPtr, skLen));
            const pkHex = this._pemToHex(pk);
            const skHex = this._pemToHex(sk);
            result = {
                publicKey: pk,
                privateKey: sk,
                logs: [
                    { type: 'hex', label: 'Public Key',  value: pkHex, copyValue: pkHex },
                    { type: 'hex', label: 'Private Key', value: skHex, copyValue: skHex }
                ]
            };
        }

        this.module._free(pkPtr);
        this.module._free(pkLenPtr);
        this.module._free(skPtr);
        this.module._free(skLenPtr);

        if (ret !== 0) throw new Error(`RSA Keygen failed: ${ret}`);
        return result;
    }

    rsaPssSign(skPem, msgHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const skBytes = new TextEncoder().encode(skPem);
        const msgBytes = this._hexToBytes(msgHex);

        const skPtr = this.module._malloc(skBytes.length);
        this._writeMemory(skBytes, skPtr);
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);

        const sigPtr = this.module._malloc(2048);
        const sigLenPtr = this.module._malloc(4);

        const ret = this.module.ccall('rsa_pss_sign', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [skPtr, skBytes.length, msgPtr, msgBytes.length, sigPtr, sigLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const sigLen = this.module.getValue(sigLenPtr, 'i32');
            const sig = this._bytesToHex(this._readMemory(sigPtr, sigLen));
            result = {
                signature: sig,
                logs: [
                    { type: 'hex', label: 'Signature', value: this._formatHex(sig), copyValue: sig }
                ]
            };
        }

        this.module._free(skPtr);
        this.module._free(msgPtr);
        this.module._free(sigPtr);
        this.module._free(sigLenPtr);

        if (ret !== 0) throw new Error(`RSA-PSS Sign failed: ${ret}`);
        return result;
    }

    rsaPssVerify(pkPem, msgHex, sigHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const pkBytes = new TextEncoder().encode(pkPem);
        const msgBytes = this._hexToBytes(msgHex);
        const sigBytes = this._hexToBytes(sigHex);

        const pkPtr = this.module._malloc(pkBytes.length);
        this._writeMemory(pkBytes, pkPtr);
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);
        const sigPtr = this.module._malloc(sigBytes.length);
        this._writeMemory(sigBytes, sigPtr);

        const ret = this.module.ccall('rsa_pss_verify', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [pkPtr, pkBytes.length, msgPtr, msgBytes.length, sigPtr, sigBytes.length]
        );

        this.module._free(pkPtr);
        this.module._free(msgPtr);
        this.module._free(sigPtr);

        return ret === 1;
    }

    ecKeygen(curveName) {
        if (!this.ready) throw new Error("WASM not ready");
        const pkPtr = this.module._malloc(4096);
        const pkLenPtr = this.module._malloc(4);
        const skPtr = this.module._malloc(4096);
        const skLenPtr = this.module._malloc(4);

        const ret = this.module.ccall('ec_keygen', 'number',
            ['string', 'number', 'number', 'number', 'number'],
            [curveName, pkPtr, pkLenPtr, skPtr, skLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const pkLen = this.module.getValue(pkLenPtr, 'i32');
            const skLen = this.module.getValue(skLenPtr, 'i32');
            const pk = new TextDecoder().decode(this._readMemory(pkPtr, pkLen));
            const sk = new TextDecoder().decode(this._readMemory(skPtr, skLen));
            const pkHex = this._pemToHex(pk);
            const skHex = this._pemToHex(sk);
            result = {
                publicKey: pk,
                privateKey: sk,
                logs: [
                    { type: 'hex', label: 'Public Key',  value: pkHex, copyValue: pkHex },
                    { type: 'hex', label: 'Private Key', value: skHex, copyValue: skHex }
                ]
            };
        }

        this.module._free(pkPtr);
        this.module._free(pkLenPtr);
        this.module._free(skPtr);
        this.module._free(skLenPtr);

        if (ret !== 0) throw new Error(`EC Keygen failed: ${ret}`);
        return result;
    }

    ecdsaSign(skPem, msgHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const skBytes = new TextEncoder().encode(skPem);
        const msgBytes = this._hexToBytes(msgHex);

        const skPtr = this.module._malloc(skBytes.length);
        this._writeMemory(skBytes, skPtr);
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);

        const sigPtr = this.module._malloc(256);
        const sigLenPtr = this.module._malloc(4);

        const ret = this.module.ccall('ecdsa_sign', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [skPtr, skBytes.length, msgPtr, msgBytes.length, sigPtr, sigLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const sigLen = this.module.getValue(sigLenPtr, 'i32');
            const sig = this._bytesToHex(this._readMemory(sigPtr, sigLen));
            result = {
                signature: sig,
                logs: [
                    { type: 'hex', label: 'Signature', value: this._formatHex(sig), copyValue: sig }
                ]
            };
        }

        this.module._free(skPtr);
        this.module._free(msgPtr);
        this.module._free(sigPtr);
        this.module._free(sigLenPtr);

        if (ret !== 0) throw new Error(`ECDSA Sign failed: ${ret}`);
        return result;
    }

    ecdsaVerify(pkPem, msgHex, sigHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const pkBytes = new TextEncoder().encode(pkPem);
        const msgBytes = this._hexToBytes(msgHex);
        const sigBytes = this._hexToBytes(sigHex);

        const pkPtr = this.module._malloc(pkBytes.length);
        this._writeMemory(pkBytes, pkPtr);
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);
        const sigPtr = this.module._malloc(sigBytes.length);
        this._writeMemory(sigBytes, sigPtr);

        const ret = this.module.ccall('ecdsa_verify', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [pkPtr, pkBytes.length, msgPtr, msgBytes.length, sigPtr, sigBytes.length]
        );

        this.module._free(pkPtr);
        this.module._free(msgPtr);
        this.module._free(sigPtr);

        return ret === 1;
    }
    rsaOaepEncrypt(pkPem, msgHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const pkBytes = new TextEncoder().encode(pkPem);
        const msgBytes = this._hexToBytes(msgHex);

        const pkPtr = this.module._malloc(pkBytes.length);
        this._writeMemory(pkBytes, pkPtr);
        const msgPtr = this.module._malloc(msgBytes.length);
        this._writeMemory(msgBytes, msgPtr);

        const outPtr = this.module._malloc(2048);
        const outLenPtr = this.module._malloc(4);
        this.module.setValue(outLenPtr, 2048, 'i32');

        const ret = this.module.ccall('rsa_oaep_encrypt', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [pkPtr, pkBytes.length, msgPtr, msgBytes.length, outPtr, outLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            const ct = this._bytesToHex(this._readMemory(outPtr, outLen));
            result = {
                ciphertext: ct,
                logs: [
                    { type: 'hex', label: 'Ciphertext', value: this._formatHex(ct), copyValue: ct }
                ]
            };
        }

        this.module._free(pkPtr);
        this.module._free(msgPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);

        if (ret !== 0) throw new Error(`RSA-OAEP Encrypt failed: ${ret}`);
        return result;
    }

    rsaOaepDecrypt(skPem, ctHex) {
        if (!this.ready) throw new Error("WASM not ready");
        const skBytes = new TextEncoder().encode(skPem);
        const ctBytes = this._hexToBytes(ctHex);

        const skPtr = this.module._malloc(skBytes.length);
        this._writeMemory(skBytes, skPtr);
        const ctPtr = this.module._malloc(ctBytes.length);
        this._writeMemory(ctBytes, ctPtr);

        const outPtr = this.module._malloc(2048);
        const outLenPtr = this.module._malloc(4);
        this.module.setValue(outLenPtr, 2048, 'i32');

        const ret = this.module.ccall('rsa_oaep_decrypt', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [skPtr, skBytes.length, ctPtr, ctBytes.length, outPtr, outLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            const pt = this._bytesToHex(this._readMemory(outPtr, outLen));
            result = {
                plaintext: pt,
                logs: [
                    { type: 'hex', label: 'Plaintext', value: this._formatHex(pt), copyValue: pt }
                ]
            };
        }

        this.module._free(skPtr);
        this.module._free(ctPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);

        if (ret !== 0) throw new Error(`RSA-OAEP Decrypt failed: ${ret}`);
        return result;
    }
    pbkdf2(pass, saltHex, iter, mdName, keyLen) {
        if (!this.ready) throw new Error("WASM not ready");
        const salt = this._hexToBytes(saltHex);
        const outPtr = this.module._malloc(keyLen);

        const ret = this.module.ccall('legacy_pbkdf2', 'number',
            ['string', 'string', 'number', 'number', 'number', 'number', 'number', 'number'],
            [mdName, pass, pass.length, salt, salt.length, iter, keyLen, outPtr]
        );

        let result = null;
        if (ret === 0) {
            result = this._bytesToHex(this._readMemory(outPtr, keyLen));
        }

        this.module._free(outPtr);
        if (ret !== 0) throw new Error(`PBKDF2 failed: ${ret}`);
        return result;
    }

    ecdhDerive(skPem, peerPkPem) {
        if (!this.ready) throw new Error("WASM not ready");
        const skBytes = new TextEncoder().encode(skPem);
        const pkBytes = new TextEncoder().encode(peerPkPem);

        const skPtr = this.module._malloc(skBytes.length);
        this._writeMemory(skBytes, skPtr);
        const pkPtr = this.module._malloc(pkBytes.length);
        this._writeMemory(pkBytes, pkPtr);

        const outPtr = this.module._malloc(256);
        const outLenPtr = this.module._malloc(4);
        this.module.setValue(outLenPtr, 256, 'i32');

        const ret = this.module.ccall('ecdh_derive', 'number',
            ['number', 'number', 'number', 'number', 'number', 'number'],
            [skPtr, skBytes.length, pkPtr, pkBytes.length, outPtr, outLenPtr]
        );

        let result = null;
        if (ret === 0) {
            const outLen = this.module.getValue(outLenPtr, 'i32');
            const secret = this._bytesToHex(this._readMemory(outPtr, outLen));
            result = {
                secret: secret,
                logs: [
                    { type: 'hex', label: 'Shared Secret', value: this._formatHex(secret), copyValue: secret }
                ]
            };
        }

        this.module._free(skPtr);
        this.module._free(pkPtr);
        this.module._free(outPtr);
        this.module._free(outLenPtr);

        if (ret !== 0) throw new Error(`ECDH Derive failed: ${ret}`);
        return result;
    }
}

export const legacyWasm = new LegacyWasm();
