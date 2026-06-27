import { useState, useCallback, useRef, useEffect } from 'react';
import { pqcWasm } from '../../lib/pqc/PQCWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import { bytesToHex, hexToBytes } from '../../utils/cryptoHelpers';

// Post-Quantum algorithm options
const PQC_KEM_ALGS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'];
const PQC_SIG_ALGS = ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'];

// Traditional algorithm options
const TRAD_KEM_ALGS = ['ECDH P-256', 'ECDH P-384'];
const TRAD_SIG_ALGS = ['ECDSA P-256', 'ECDSA P-384', 'RSA-PSS 2048', 'RSA-PSS 3072'];

// standard presets
const KEM_PRESETS = [
  { id: 'x25519_mlkem768', name: 'x25519_mlkem768', pqc: 'ML-KEM-768', trad: 'ECDH P-256', desc: 'X25519 (P-256 Fallback) + ML-KEM-768 (TLS 1.3 표준 권고)' },
  { id: 'secp256r1_mlkem768', name: 'secp256r1_mlkem768', pqc: 'ML-KEM-768', trad: 'ECDH P-256', desc: 'ECDH P-256 + ML-KEM-768 (공공/표준 조합)' },
  { id: 'secp384r1_mlkem1024', name: 'secp384r1_mlkem1024', pqc: 'ML-KEM-1024', trad: 'ECDH P-384', desc: 'ECDH P-384 + ML-KEM-1024 (고강도 하이브리드)' }
];

const SIG_PRESETS = [
  { id: 'mldsa44_ecdsa256', name: 'mldsa44_ecdsa256', pqc: 'ML-DSA-44', trad: 'ECDSA P-256', desc: 'ML-DSA-44 + ECDSA P-256 (NIST Level 1 복합 서명)' },
  { id: 'mldsa65_ecdsa256', name: 'mldsa65_ecdsa256', pqc: 'ML-DSA-65', trad: 'ECDSA P-256', desc: 'ML-DSA-65 + ECDSA P-256 (NIST Level 3 표준 하이브리드)' },
  { id: 'mldsa87_ecdsa384', name: 'mldsa87_ecdsa384', pqc: 'ML-DSA-87', trad: 'ECDSA P-384', desc: 'ML-DSA-87 + ECDSA P-384 (NIST Level 5 고강도 하이브리드)' },
  { id: 'mldsa44_rsa2048', name: 'mldsa44_rsa2048', pqc: 'ML-DSA-44', trad: 'RSA-PSS 2048', desc: 'ML-DSA-44 + RSA-PSS 2048 (RSA 레거시 대응 조합)' },
  { id: 'mldsa65_rsa3072', name: 'mldsa65_rsa3072', pqc: 'ML-DSA-65', trad: 'RSA-PSS 3072', desc: 'ML-DSA-65 + RSA-PSS 3072 (RSA 기업 보안 표준)' }
];

// base64url helpers for JWK keys
function base64urlToHex(str) {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytesToHex(bytes);
}

// HKDF-SHA256 derivation helper
async function deriveHKDF(ssPqcBytes, ssTradBytes) {
  const combined = new Uint8Array(ssPqcBytes.length + ssTradBytes.length);
  combined.set(ssPqcBytes, 0);
  combined.set(ssTradBytes, ssPqcBytes.length);

  const masterKey = await window.crypto.subtle.importKey(
    "raw",
    combined,
    "HKDF",
    false,
    ["deriveBits"]
  );

  const derived = await window.crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(0),
      info: new TextEncoder().encode("PQ/T Hybrid KEM Shared Secret")
    },
    masterKey,
    256 // 256 bits = 32 bytes
  );

  return new Uint8Array(derived);
}

export default function PQHybridPlayground() {
  const [tab, setTab] = useState('KEM'); // 'KEM' or 'Signature'
  const [selectionMode, setSelectionMode] = useState('preset'); // 'preset' or 'custom'

  // KEM configurations
  const [kemPreset, setKemPreset] = useState(KEM_PRESETS[0].id);
  const [customPqcKem, setCustomPqcKem] = useState(PQC_KEM_ALGS[1]);
  const [customTradKem, setCustomTradKem] = useState(TRAD_KEM_ALGS[0]);

  // Signature configurations
  const [sigPreset, setSigPreset] = useState(SIG_PRESETS[1].id);
  const [customPqcSig, setCustomPqcSig] = useState(PQC_SIG_ALGS[1]);
  const [customTradSig, setCustomTradSig] = useState(TRAD_SIG_ALGS[0]);

  const [logs, setLogs] = useState([]);
  const [simpleMsg, setSimpleMsg] = useState('');

  // Refs to hold keys and values for KEM
  const pqcKpRef = useRef(null);
  const tradKpRef = useRef(null); // WebCrypto CryptoKeyPair
  const pqcCtRef = useRef(null);
  const tradCtRef = useRef(null); // Ephemeral public key (hex)
  const pqcSsRef = useRef(null);
  const tradSsRef = useRef(null); // derived shared secret (hex)
  const finalSsRef = useRef(null);

  // Refs to hold keys and values for Signature
  const pqcSigKpRef = useRef(null);
  const tradSigKpRef = useRef(null); // WebCrypto CryptoKeyPair
  const pqcSigValRef = useRef(null);
  const tradSigValRef = useRef(null);
  const finalSigValRef = useRef(null);

  useEffect(() => {
    pqcWasm.init().catch(e => console.error("OQS WASM Load Error", e));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);

  const clearLog = () => {
    setLogs([]);
    pqcKpRef.current = null;
    tradKpRef.current = null;
    pqcCtRef.current = null;
    tradCtRef.current = null;
    pqcSsRef.current = null;
    tradSsRef.current = null;
    finalSsRef.current = null;
    pqcSigKpRef.current = null;
    tradSigKpRef.current = null;
    pqcSigValRef.current = null;
    tradSigValRef.current = null;
    finalSigValRef.current = null;
  };

  const getActiveKems = () => {
    if (selectionMode === 'preset') {
      const p = KEM_PRESETS.find(pr => pr.id === kemPreset) || KEM_PRESETS[0];
      return { pqc: p.pqc, trad: p.trad, presetName: p.name };
    }
    return { pqc: customPqcKem, trad: customTradKem, presetName: 'Custom' };
  };

  const getActiveSigs = () => {
    if (selectionMode === 'preset') {
      const p = SIG_PRESETS.find(pr => pr.id === sigPreset) || SIG_PRESETS[1];
      return { pqc: p.pqc, trad: p.trad, presetName: p.name };
    }
    return { pqc: customPqcSig, trad: customTradSig, presetName: 'Custom' };
  };

  // ── KEM Hybrid Actions ───────────────────────────────────────────────────
  const hybridKemKeyGen = async () => {
    const { pqc, trad, presetName } = getActiveKems();
    addLog([{ type: 'info', label: `Generating PQ/T Hybrid Keypair (${presetName})...` }]);

    try {
      // 1. Generate PQC Keypair
      const pqcKp = pqcWasm.kemKeypair(pqc);
      pqcKpRef.current = pqcKp;

      // 2. Generate Traditional Keypair
      const curve = trad.split(' ')[1]; // "P-256" or "P-384"
      const tradKp = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: curve },
        true,
        ["deriveKey", "deriveBits"]
      );
      tradKpRef.current = tradKp;

      const rawTradPk = await window.crypto.subtle.exportKey("raw", tradKp.publicKey);
      const tradPkHex = bytesToHex(new Uint8Array(rawTradPk));

      const jwk = await window.crypto.subtle.exportKey("jwk", tradKp.privateKey);
      const tradSkHex = base64urlToHex(jwk.d);

      addLog([
        { type: 'section', label: `PQ/T Hybrid Key Generation` },
        { type: 'info',    label: 'PQ Algorithm', value: pqc },
        { type: 'hex',     label: 'pqc public key (pk)', value: pqcKp.pk },
        { type: 'hex',     label: 'pqc secret key (sk)', value: pqcKp.sk },
        { type: 'info',    label: 'Traditional Algorithm', value: trad },
        { type: 'hex',     label: 'trad public key (pk)', value: tradPkHex },
        { type: 'hex',     label: 'trad secret key (sk)', value: tradSkHex }
      ]);
    } catch (e) {
      addLog([{ type: 'error', label: 'Keygen Error', value: e.message }]);
    }
  };

  const hybridKemEncap = async () => {
    const { pqc, trad } = getActiveKems();
    if (!pqcKpRef.current || !tradKpRef.current) {
      addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]);
      return;
    }

    try {
      // 1. PQC Encapsulation
      const pqcEncap = pqcWasm.kemEncaps(pqc, pqcKpRef.current.pk);
      pqcCtRef.current = pqcEncap.ct;
      pqcSsRef.current = pqcEncap.ss;

      // 2. Traditional ECDH Ephemeral Key Gen and Shared Secret Derivation
      const curve = trad.split(' ')[1];
      const ephemKp = await window.crypto.subtle.generateKey(
        { name: "ECDH", namedCurve: curve },
        true,
        ["deriveKey", "deriveBits"]
      );

      const bobPkBuffer = await window.crypto.subtle.exportKey("raw", tradKpRef.current.publicKey);
      const bobPkObj = await window.crypto.subtle.importKey(
        "raw",
        bobPkBuffer,
        { name: "ECDH", namedCurve: curve },
        true,
        []
      );

      const tradDeriveSize = curve === "P-256" ? 256 : 384;
      const tradSsBuffer = await window.crypto.subtle.deriveBits(
        { name: "ECDH", public: bobPkObj },
        ephemKp.privateKey,
        tradDeriveSize
      );

      const ephemPkBuffer = await window.crypto.subtle.exportKey("raw", ephemKp.publicKey);
      tradCtRef.current = bytesToHex(new Uint8Array(ephemPkBuffer));
      tradSsRef.current = bytesToHex(new Uint8Array(tradSsBuffer));

      // 3. Derive Hybrid Shared Secret
      const finalSs = await deriveHKDF(hexToBytes(pqcEncap.ss), new Uint8Array(tradSsBuffer));
      finalSsRef.current = bytesToHex(finalSs);

      // Combined ciphertext
      const combinedCt = pqcEncap.ct + tradCtRef.current;

      addLog([
        { type: 'section', label: `PQ/T Hybrid Encapsulation` },
        { type: 'hex',     label: 'pqc cipher (ct)', value: pqcEncap.ct },
        { type: 'hex',     label: 'pqc local ss', value: pqcSsRef.current },
        { type: 'hex',     label: 'trad ephemeral pk (ct)', value: tradCtRef.current },
        { type: 'hex',     label: 'trad local ss', value: tradSsRef.current },
        { type: 'hex',     label: 'combined cipher (ct_final)', value: combinedCt },
        { type: 'hex',     label: 'final hybrid ss (KDF)', value: finalSsRef.current }
      ]);
    } catch (e) {
      addLog([{ type: 'error', label: 'Encapsulation Error', value: e.message }]);
    }
  };

  const hybridKemDecap = async () => {
    const { pqc, trad } = getActiveKems();
    if (!pqcKpRef.current || !tradKpRef.current || !pqcCtRef.current || !tradCtRef.current) {
      addLog([{ type: 'error', label: 'Error', value: 'Encapsulate first' }]);
      return;
    }

    try {
      // 1. PQC Decapsulation
      const pqcDecap = pqcWasm.kemDecaps(pqc, pqcCtRef.current, pqcKpRef.current.sk);

      // 2. Traditional Decapsulation (derive shared secret using Bob's private key and Alice's ephemeral public key)
      const curve = trad.split(' ')[1];
      const ephemPkBytes = hexToBytes(tradCtRef.current);
      const ephemPkObj = await window.crypto.subtle.importKey(
        "raw",
        ephemPkBytes,
        { name: "ECDH", namedCurve: curve },
        true,
        []
      );

      const tradDeriveSize = curve === "P-256" ? 256 : 384;
      const tradSsBuffer = await window.crypto.subtle.deriveBits(
        { name: "ECDH", public: ephemPkObj },
        tradKpRef.current.privateKey,
        tradDeriveSize
      );

      const tradSsHex = bytesToHex(new Uint8Array(tradSsBuffer));

      // 3. Derive Hybrid Shared Secret
      const decappedFinalSs = await deriveHKDF(hexToBytes(pqcDecap.ss), new Uint8Array(tradSsBuffer));
      const decappedFinalSsHex = bytesToHex(decappedFinalSs);
      
      const isMatched = finalSsRef.current === decappedFinalSsHex;

      addLog([
        { type: 'section', label: `PQ/T Hybrid Decapsulation` },
        { type: 'hex',     label: 'decapped pqc ss', value: pqcDecap.ss },
        { type: 'hex',     label: 'decapped trad ss', value: tradSsHex },
        { type: 'hex',     label: 'expected hybrid ss', value: finalSsRef.current || '' },
        { type: 'hex',     label: 'decapsulated hybrid ss', value: decappedFinalSsHex },
        { type: 'result',  label: 'KEM Shared Secret Comparison', value: isMatched ? 'MATCHED' : 'MISMATCHED' }
      ]);
    } catch (e) {
      addLog([{ type: 'error', label: 'Decapsulation Error', value: e.message }]);
    }
  };

  // ── Signature Hybrid Actions ─────────────────────────────────────────────
  const hybridSigKeyGen = async () => {
    const { pqc, trad, presetName } = getActiveSigs();
    addLog([{ type: 'info', label: `Generating PQ/T Hybrid Sign Keypair (${presetName})...` }]);

    try {
      // 1. Generate PQC Signature Keypair
      const pqcKp = pqcWasm.sigKeypair(pqc);
      pqcSigKpRef.current = pqcKp;

      // 2. Generate Traditional Signature Keypair
      let tradPkHex = '';
      let tradSkHex = '';

      if (trad.startsWith('ECDSA')) {
        const curve = trad.split(' ')[1];
        const tradKp = await window.crypto.subtle.generateKey(
          { name: "ECDSA", namedCurve: curve },
          true,
          ["sign", "verify"]
        );
        tradSigKpRef.current = tradKp;

        const rawPk = await window.crypto.subtle.exportKey("raw", tradKp.publicKey);
        tradPkHex = bytesToHex(new Uint8Array(rawPk));

        const jwk = await window.crypto.subtle.exportKey("jwk", tradKp.privateKey);
        tradSkHex = base64urlToHex(jwk.d);
      } else {
        // RSA-PSS
        const modulusLength = parseInt(trad.split(' ')[1]);
        const tradKp = await window.crypto.subtle.generateKey(
          {
            name: "RSA-PSS",
            modulusLength,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
          },
          true,
          ["sign", "verify"]
        );
        tradSigKpRef.current = tradKp;

        const rawPk = await window.crypto.subtle.exportKey("spki", tradKp.publicKey);
        tradPkHex = bytesToHex(new Uint8Array(rawPk));

        const jwk = await window.crypto.subtle.exportKey("jwk", tradKp.privateKey);
        tradSkHex = base64urlToHex(jwk.d);
      }

      addLog([
        { type: 'section', label: `PQ/T Hybrid Signature Key Generation` },
        { type: 'info',    label: 'PQ Algorithm', value: pqc },
        { type: 'hex',     label: 'pqc public key (pk)', value: pqcKp.pk },
        { type: 'hex',     label: 'pqc secret key (sk)', value: pqcKp.sk },
        { type: 'info',    label: 'Traditional Algorithm', value: trad },
        { type: 'hex',     label: 'trad public key (pk)', value: tradPkHex },
        { type: 'hex',     label: 'trad secret key (sk)', value: tradSkHex }
      ]);
    } catch (e) {
      addLog([{ type: 'error', label: 'Keygen Error', value: e.message }]);
    }
  };

  const hybridSigSign = async () => {
    const { pqc, trad } = getActiveSigs();
    if (!pqcSigKpRef.current || !tradSigKpRef.current) {
      addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]);
      return;
    }

    const msg = simpleMsg || `Hello, Hybrid PQ/T!`;
    const msgHex = bytesToHex(new TextEncoder().encode(msg));

    try {
      // 1. PQC Sign
      const pqcSig = pqcWasm.sigSign(pqc, msgHex, pqcSigKpRef.current.sk);
      pqcSigValRef.current = pqcSig.sig;

      // 2. Traditional Sign
      let tradSigHex = '';
      const msgBytes = new TextEncoder().encode(msg);

      if (trad.startsWith('ECDSA')) {
        const curve = trad.split(' ')[1];
        const hashAlg = curve === "P-256" ? "SHA-256" : "SHA-384";
        const sigBuffer = await window.crypto.subtle.sign(
          { name: "ECDSA", hash: hashAlg },
          tradSigKpRef.current.privateKey,
          msgBytes
        );
        tradSigHex = bytesToHex(new Uint8Array(sigBuffer));
      } else {
        // RSA-PSS
        const sigBuffer = await window.crypto.subtle.sign(
          { name: "RSA-PSS", saltLength: 32 },
          tradSigKpRef.current.privateKey,
          msgBytes
        );
        tradSigHex = bytesToHex(new Uint8Array(sigBuffer));
      }

      tradSigValRef.current = tradSigHex;
      finalSigValRef.current = pqcSig.sig + tradSigHex;

      addLog([
        { type: 'section', label: `PQ/T Hybrid Sign` },
        { type: 'info',    label: 'Message', value: msg },
        { type: 'hex',     label: 'pqc signature', value: pqcSig.sig },
        { type: 'hex',     label: 'trad signature', value: tradSigHex },
        { type: 'hex',     label: 'combined signature (sig_final)', value: finalSigValRef.current }
      ]);
    } catch (e) {
      addLog([{ type: 'error', label: 'Signing Error', value: e.message }]);
    }
  };

  const hybridSigVerify = async () => {
    const { pqc, trad } = getActiveSigs();
    if (!pqcSigKpRef.current || !tradSigKpRef.current || !pqcSigValRef.current || !tradSigValRef.current) {
      addLog([{ type: 'error', label: 'Error', value: 'Sign first' }]);
      return;
    }

    const msg = simpleMsg || `Hello, Hybrid PQ/T!`;
    const msgBytes = new TextEncoder().encode(msg);
    const msgHex = bytesToHex(msgBytes);

    try {
      // 1. PQC Verification
      const pqcOk = pqcWasm.sigVerify(pqc, msgHex, pqcSigValRef.current, pqcSigKpRef.current.pk);

      // 2. Traditional Verification
      let tradOk = false;

      if (trad.startsWith('ECDSA')) {
        const curve = trad.split(' ')[1];
        const hashAlg = curve === "P-256" ? "SHA-256" : "SHA-384";
        const sigBytes = hexToBytes(tradSigValRef.current);
        tradOk = await window.crypto.subtle.verify(
          { name: "ECDSA", hash: hashAlg },
          tradSigKpRef.current.publicKey,
          sigBytes,
          msgBytes
        );
      } else {
        // RSA-PSS
        const sigBytes = hexToBytes(tradSigValRef.current);
        tradOk = await window.crypto.subtle.verify(
          { name: "RSA-PSS", saltLength: 32 },
          tradSigKpRef.current.publicKey,
          sigBytes,
          msgBytes
        );
      }

      const finalOk = pqcOk && tradOk;

      addLog([
        { type: 'section', label: `PQ/T Hybrid Verification` },
        { type: 'info',    label: 'pqc verify', value: pqcOk ? 'SUCCESS' : 'FAILED' },
        { type: 'info',    label: 'trad verify', value: tradOk ? 'SUCCESS' : 'FAILED' },
        { type: 'result',  label: 'Signature Verification', value: finalOk ? 'VALID' : 'INVALID' }
      ]);
    } catch (e) {
      addLog([{ type: 'error', label: 'Verification Error', value: e.message }]);
    }
  };

  return (
    <div className="cs-page-wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h1 className="cs-page-title">PQ/T 하이브리드</h1>
          <p className="cs-page-desc">양자내성암호(PQC) + 전통 공개키 암호(Traditional) 결합 테스트베드</p>
        </div>
        
        {/* Tab switcher */}
        <div className="cs-mode-toggle">
          <button
            className={`cs-mode-btn${tab === 'KEM' ? ' active' : ''}`}
            onClick={() => { setTab('KEM'); clearLog(); }}
          >
            KEM (키 합의)
          </button>
          <button
            className={`cs-mode-btn${tab === 'Signature' ? ' active' : ''}`}
            onClick={() => { setTab('Signature'); clearLog(); }}
          >
            Signature (전자서명)
          </button>
        </div>
      </div>

      {/* Mode Selector (Preset vs Custom) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`cs-btn ${selectionMode === 'preset' ? 'cs-btn-primary' : 'cs-btn-outline'}`}
          onClick={() => { setSelectionMode('preset'); clearLog(); }}
          style={{ height: '30px', fontSize: '12px' }}
        >
          표준 프리셋 방식 (Standard Presets)
        </button>
        <button
          className={`cs-btn ${selectionMode === 'custom' ? 'cs-btn-primary' : 'cs-btn-outline'}`}
          onClick={() => { setSelectionMode('custom'); clearLog(); }}
          style={{ height: '30px', fontSize: '12px' }}
        >
          사용자 커스텀 방식 (Custom Selection)
        </button>
      </div>

      {/* Algorithm Config selectors */}
      <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {tab === 'KEM' ? (
          selectionMode === 'preset' ? (
            <div>
              <div className="cs-label">IETF 표준 KEM 프리셋 조합</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {KEM_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`cs-algo-pill${kemPreset === p.id ? ' active' : ''}`}
                    onClick={() => { setKemPreset(p.id); clearLog(); }}
                    title={p.desc}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'oklch(var(--bc) / 0.5)', marginTop: 8 }}>
                {KEM_PRESETS.find(pr => pr.id === kemPreset)?.desc}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div className="cs-label">양자내성 KEM 알고리즘 (PQC KEM)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PQC_KEM_ALGS.map(p => (
                    <button
                      key={p}
                      className={`cs-algo-pill${customPqcKem === p ? ' active' : ''}`}
                      onClick={() => { setCustomPqcKem(p); clearLog(); }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="cs-label">전통 KEM 알고리즘 (ECDH)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {TRAD_KEM_ALGS.map(t => (
                    <button
                      key={t}
                      className={`cs-algo-pill${customTradKem === t ? ' active' : ''}`}
                      onClick={() => { setCustomTradKem(t); clearLog(); }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          selectionMode === 'preset' ? (
            <div>
              <div className="cs-label">표준 복합 서명 프리셋 조합</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {SIG_PRESETS.map(p => (
                  <button
                    key={p.id}
                    className={`cs-algo-pill${sigPreset === p.id ? ' active' : ''}`}
                    onClick={() => { setSigPreset(p.id); clearLog(); }}
                    title={p.desc}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '12px', color: 'oklch(var(--bc) / 0.5)', marginTop: 8 }}>
                {SIG_PRESETS.find(pr => pr.id === sigPreset)?.desc}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
              <div>
                <div className="cs-label">양자내성 서명 알고리즘 (PQC DSA)</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PQC_SIG_ALGS.map(p => (
                    <button
                      key={p}
                      className={`cs-algo-pill${customPqcSig === p ? ' active' : ''}`}
                      onClick={() => { setCustomPqcSig(p); clearLog(); }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="cs-label">전통 서명 알고리즘 (Traditional)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {TRAD_SIG_ALGS.map(t => (
                    <button
                      key={t}
                      className={`cs-algo-pill${customTradSig === t ? ' active' : ''}`}
                      onClick={() => { setCustomTradSig(t); clearLog(); }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Main interactive grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'KEM' ? (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">하이브리드 키 합의 동작 과정</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={hybridKemKeyGen} className="cs-btn cs-btn-primary cs-btn-full">
                  1. 하이브리드 키쌍 생성 (Key Generation)
                </button>
                <button onClick={hybridKemEncap} className="cs-btn cs-btn-outline cs-btn-full" disabled={!pqcKpRef.current}>
                  2. 하이브리드 캡슐화 (Encapsulation)
                </button>
                <button onClick={hybridKemDecap} className="cs-btn cs-btn-outline cs-btn-full" disabled={!pqcCtRef.current}>
                  3. 하이브리드 디캡슐화 (Decapsulation)
                </button>
              </div>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">하이브리드 전자서명 동작 과정</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>
                  서명할 메시지 입력
                </label>
                <textarea
                  className="cs-textarea"
                  rows={2}
                  placeholder="비우면 기본 메시지 사용"
                  value={simpleMsg}
                  onChange={e => setSimpleMsg(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={hybridSigKeyGen} className="cs-btn cs-btn-primary cs-btn-full">
                  1. 하이브리드 키쌍 생성 (Key Generation)
                </button>
                <button onClick={hybridSigSign} className="cs-btn cs-btn-outline cs-btn-full" disabled={!pqcSigKpRef.current}>
                  2. 하이브리드 서명 생성 (Sign)
                </button>
                <button onClick={hybridSigVerify} className="cs-btn cs-btn-outline cs-btn-full" disabled={!pqcSigValRef.current}>
                  3. 하이브리드 서명 검증 (Verify)
                </button>
              </div>
            </div>
          )}
        </div>

        <div style={{ minHeight: 300 }}>
          <LogTerminal logs={logs} onClear={clearLog} />
        </div>
      </div>
    </div>
  );
}
