import { useState, useCallback, useRef, useEffect } from 'react';
import { pqcWasm } from '../../lib/pqc/PQCWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { bytesToHex, hexToBytes } from '../../utils/cryptoHelpers';

const ALGO_TYPES = ['KEM', 'Signature'];

const ALGO_FAMILIES = {
  'KEM': ['ML-KEM'],
  'Signature': ['ML-DSA', 'SLH-DSA']
};

const ALGO_PARAMS = {
  'ML-KEM': ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024'],
  'ML-DSA': ['ML-DSA-44', 'ML-DSA-65', 'ML-DSA-87'],
  'SLH-DSA': [
    'SLH-DSA-SHA2-128s', 'SLH-DSA-SHA2-128f', 
    'SLH-DSA-SHA2-192s', 'SLH-DSA-SHA2-192f', 
    'SLH-DSA-SHA2-256s', 'SLH-DSA-SHA2-256f',
    'SLH-DSA-SHAKE-128s', 'SLH-DSA-SHAKE-128f', 
    'SLH-DSA-SHAKE-192s', 'SLH-DSA-SHAKE-192f', 
    'SLH-DSA-SHAKE-256s', 'SLH-DSA-SHAKE-256f'
  ]
};

// Algorithm mapping removed as we now use custom WASM directly

export default function PQCPlayground() {
  const [mode, setMode]             = useState('simple');
  const [algoType, setAlgoType]     = useState('KEM');
  const [algoFamily, setAlgoFamily] = useState('ML-KEM');
  const [algoParam, setAlgoParam]   = useState('ML-KEM-768');

  const [logs, setLogs]             = useState([]);
  const [simpleMsg, setSimpleMsg]   = useState('');

  // liboqs instances and keys
  const instRef  = useRef(null);
  const kpRef    = useRef(null);
  const ctRef    = useRef(null);
  const sigRef   = useRef(null);

  // CAVP states
  const [cavpKemZ,  setCavpKemZ]  = useState('');
  const [cavpKemD,  setCavpKemD]  = useState('');
  const [cavpKemM,  setCavpKemM]  = useState(''); // Encapsulation seed
  const [cavpKemPk, setCavpKemPk] = useState('');
  const [cavpKemSk, setCavpKemSk] = useState('');
  const [cavpKemCt, setCavpKemCt] = useState('');
  const [cavpDsaSeed, setCavpDsaSeed] = useState(''); // msg (rnd) for sign
  const [cavpDsaSk,   setCavpDsaSk]   = useState('');
  const [cavpDsaPk,   setCavpDsaPk]   = useState('');
  const [cavpDsaMsg,  setCavpDsaMsg]  = useState('');
  const [cavpDsaSig,  setCavpDsaSig]  = useState('');

  useEffect(() => {
    pqcWasm.init().catch(e => console.error("OQS WASM Load Error", e));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  
  const cleanupInstance = () => {
    // No longer needed for WASM
  };

  const clearLog = () => {
    setLogs([]);
    kpRef.current = null;
    ctRef.current = null; 
    sigRef.current = null;
  };

  const handleModeChange  = (m) => { setMode(m); clearLog(); };
  
  const handleTypeChange  = (t) => { 
    setAlgoType(t);
    const firstFamily = ALGO_FAMILIES[t][0];
    setAlgoFamily(firstFamily);
    setAlgoParam(ALGO_PARAMS[firstFamily][0]);
    clearLog(); 
  };
  
  const handleFamilyChange = (f) => {
    setAlgoFamily(f);
    setAlgoParam(ALGO_PARAMS[f][0]);
    clearLog();
  };

  const handleParamChange = (p) => {
    setAlgoParam(p);
    clearLog();
  };

  // Generic instance getter removed in favor of direct WASM calls


  // ── Generic KEM via Custom WASM ──────────────────────────────────────────
  const kemGenKey = async () => {
    addLog([{ type: 'info', label: `Generating ${algoParam} key pair...` }]);
    try {
      const kp = pqcWasm.kemKeypair(algoParam);
      kpRef.current = kp;
      addLog([
        { type: 'section', label: `${algoParam} Key Generation` },
        { type: 'hex',     label: 'pk', value: kp.pk },
        { type: 'hex',     label: 'sk', value: kp.sk },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const kemEncap = async () => {
    if (!kpRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]); return; }
    try {
      const res = pqcWasm.kemEncaps(algoParam, kpRef.current.pk);
      ctRef.current = res.ct;
      addLog([
        { type: 'section', label: `${algoParam} Encapsulation` },
        { type: 'hex',     label: 'ct', value: res.ct },
        { type: 'hex',     label: 'ss', value: res.ss },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const kemDecap = async () => {
    if (!kpRef.current || !ctRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Encapsulate first' }]); return; }
    try {
      const res = pqcWasm.kemDecaps(algoParam, ctRef.current, kpRef.current.sk);
      addLog([
        { type: 'section', label: `${algoParam} Decapsulation` },
        { type: 'hex',     label: 'ss', value: res.ss },
        { type: 'info',    label: 'Note', value: 'Compare ss with encapsulation ss — they should match.' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  // ── Generic Signature via Custom WASM ──────────────────────────────────────────
  const sigGenKey = async () => {
    addLog([{ type: 'info', label: `Generating ${algoParam} key pair...` }]);
    try {
      const kp = pqcWasm.sigKeypair(algoParam);
      kpRef.current = kp;
      addLog([
        { type: 'section', label: `${algoParam} Key Generation` },
        { type: 'hex',     label: 'pk', value: kp.pk },
        { type: 'hex',     label: 'sk', value: kp.sk },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const sigSign = async () => {
    if (!kpRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]); return; }
    const msg = simpleMsg || `Hello, ${algoParam}!`;
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const res = pqcWasm.sigSign(algoParam, msgHex, kpRef.current.sk);
      sigRef.current = res.sig;
      addLog([
        { type: 'section', label: `${algoParam} Sign` },
        { type: 'info',    label: 'Message', value: msg },
        { type: 'hex',     label: 'Signature', value: res.sig },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const sigVerify = async () => {
    if (!kpRef.current || !sigRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Sign first' }]); return; }
    const msg = simpleMsg || `Hello, ${algoParam}!`;
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const ok = pqcWasm.sigVerify(algoParam, msgHex, sigRef.current, kpRef.current.pk);
      addLog([
        { type: 'section', label: `${algoParam} Verify` },
        { type: ok ? 'success' : 'error', label: 'Result', value: ok ? 'VALID' : 'INVALID' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  // ── CAVP KEM via Custom WASM ─────────────────────────────────────────
  const kemCavpKeyGen = () => {
    try {
      if (!cavpKemZ || !cavpKemD) throw new Error("Enter z and d (32 bytes each)");
      const seedHex = cavpKemD + cavpKemZ; // FIPS 203: seed is d || z
      const kp = pqcWasm.kemKeypair(algoParam, seedHex);
      
      addLog([
        { type: 'section', label: `${algoParam} CAVP Key Generation` },
        { type: 'hex',     label: 'pk', value: kp.pk },
        { type: 'hex',     label: 'sk', value: kp.sk },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const kemCavpEncap = () => {
    try {
      if (!cavpKemPk || !cavpKemM) throw new Error('Enter pk and random seed (m)');
      const res = pqcWasm.kemEncaps(algoParam, cavpKemPk, cavpKemM);

      addLog([
        { type: 'section', label: `${algoParam} CAVP Encapsulation` },
        { type: 'hex',     label: 'ct', value: res.ct },
        { type: 'hex',     label: 'ss', value: res.ss },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const kemCavpDecap = () => {
    try {
      if (!cavpKemSk || !cavpKemCt) throw new Error('Enter sk and ct');
      const res = pqcWasm.kemDecaps(algoParam, cavpKemCt, cavpKemSk);
      addLog([
        { type: 'section', label: `${algoParam} CAVP Decapsulation` },
        { type: 'hex',     label: 'ss', value: res.ss },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  // ── CAVP DSA via Custom WASM ─────────────────────────────────────────
  const dsaCavpKeyGen = () => {
    try {
      if (!cavpDsaSeed) throw new Error('Enter seed (hex)');
      const kp = pqcWasm.sigKeypair(algoParam, cavpDsaSeed);

      addLog([
        { type: 'section', label: `${algoParam} CAVP Key Generation` },
        { type: 'hex',     label: 'pk', value: kp.pk },
        { type: 'hex',     label: 'sk', value: kp.sk },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const dsaCavpSign = () => {
    try {
      if (!cavpDsaSk || !cavpDsaMsg) throw new Error('Enter sk and message');
      // For randomized signing algorithms (like some SLH-DSA variants or ML-DSA test vectors),
      // they might require a seed (rnd). We can use cavpDsaSeed as the randomness if needed, or pass null.
      const res = pqcWasm.sigSign(algoParam, cavpDsaMsg, cavpDsaSk, cavpDsaSeed || null);
      addLog([
        { type: 'section', label: `${algoParam} CAVP Sign` },
        { type: 'hex',     label: 'msg', value: cavpDsaMsg },
        { type: 'hex',     label: 'sig', value: res.sig },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const dsaCavpVerify = () => {
    try {
      if (!cavpDsaPk || !cavpDsaMsg || !cavpDsaSig) throw new Error('Enter pk, msg, and sig');
      const ok = pqcWasm.sigVerify(algoParam, cavpDsaMsg, cavpDsaSig, cavpDsaPk);
      addLog([
        { type: 'section', label: `${algoParam} CAVP Verify` },
        { type: ok ? 'success' : 'error', label: 'Result', value: ok ? 'VALID' : 'INVALID' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">PQC</h1>
          <p className="cs-page-desc">NIST 표준 양자내성암호 (ML-KEM, ML-DSA, SLH-DSA)</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Algo selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div className="cs-label">분류 (Type)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ALGO_TYPES.map(t => (
              <button
                key={t}
                className={`cs-algo-pill${algoType === t ? ' active' : ''}`}
                onClick={() => handleTypeChange(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="cs-label">알고리즘 군 (Family)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ALGO_FAMILIES[algoType].map(f => (
              <button
                key={f}
                className={`cs-algo-pill${algoFamily === f ? ' active' : ''}`}
                onClick={() => handleFamilyChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="cs-label">보안 파라미터 (Parameter)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 400 }}>
            {ALGO_PARAMS[algoFamily].map(p => (
              <button
                key={p}
                className={`cs-algo-pill${algoParam === p ? ' active' : ''}`}
                onClick={() => handleParamChange(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

          {/* Simple Mode - KEM */}
          {algoType === 'KEM' && mode === 'simple' && (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cs-label">간편 모드 — 키 캡슐화 ({algoParam})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={kemGenKey} className="cs-btn cs-btn-primary cs-btn-full">1. 키쌍 생성</button>
                <button onClick={kemEncap}  className="cs-btn cs-btn-outline cs-btn-full" disabled={!kpRef.current}>2. 캡슐화 (Encapsulate)</button>
                <button onClick={kemDecap}  className="cs-btn cs-btn-outline cs-btn-full" disabled={!ctRef.current}>3. 디캡슐화 (Decapsulate)</button>
              </div>
              <button onClick={clearLog} className="cs-btn cs-btn-ghost" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Clear</button>
            </div>
          )}

          {/* CAVP Mode - KEM */}
          {algoType === 'KEM' && mode === 'cavp' && (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">CAVP — Key Generation ({algoParam})</div>
              <HexInput label="z  (32 bytes)" value={cavpKemZ} onChange={setCavpKemZ} expectedBytes={32} />
              <HexInput label="d  (32 bytes)" value={cavpKemD} onChange={setCavpKemD} expectedBytes={32} />
              <button onClick={kemCavpKeyGen} className="cs-btn cs-btn-primary cs-btn-full">Key Gen</button>

              <div className="cs-divider" />
              <div className="cs-label">CAVP — Encapsulation</div>
              <HexInput label="pk  (hex)" value={cavpKemPk} onChange={setCavpKemPk} rows={3} />
              <HexInput label="m (seed) (32 bytes)" value={cavpKemM} onChange={setCavpKemM} expectedBytes={32} />
              <button onClick={kemCavpEncap} className="cs-btn cs-btn-primary cs-btn-full">Encapsulate</button>

              <div className="cs-divider" />
              <div className="cs-label">CAVP — Decapsulation</div>
              <HexInput label="sk  (hex)" value={cavpKemSk} onChange={setCavpKemSk} rows={3} />
              <HexInput label="ct  (hex)" value={cavpKemCt} onChange={setCavpKemCt} rows={2} />
              <button onClick={kemCavpDecap} className="cs-btn cs-btn-primary cs-btn-full">Decapsulate</button>
            </div>
          )}

          {/* Simple Mode - Signature */}
          {algoType === 'Signature' && mode === 'simple' && (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cs-label">간편 모드 — 전자서명 ({algoParam})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>서명할 메시지</label>
                <textarea
                  className="cs-textarea"
                  rows={2}
                  placeholder="비우면 기본 메시지 사용"
                  value={simpleMsg}
                  onChange={e => setSimpleMsg(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={sigGenKey} className="cs-btn cs-btn-primary cs-btn-full">1. 키쌍 생성</button>
                <button onClick={sigSign}   className="cs-btn cs-btn-outline cs-btn-full" disabled={!kpRef.current}>2. 서명 생성</button>
                <button onClick={sigVerify} className="cs-btn cs-btn-outline cs-btn-full" disabled={!sigRef.current}>3. 서명 검증</button>
              </div>
              <button onClick={clearLog} className="cs-btn cs-btn-ghost" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Clear</button>
            </div>
          )}

          {/* CAVP Mode - Signature */}
          {algoType === 'Signature' && mode === 'cavp' && (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">CAVP — Key Generation ({algoParam})</div>
              <HexInput label="seed (for Keygen) (32+ bytes)" value={cavpDsaSeed} onChange={setCavpDsaSeed} />
              <button onClick={dsaCavpKeyGen} className="cs-btn cs-btn-primary cs-btn-full">Key Gen</button>

              <div className="cs-divider" />
              <div className="cs-label">CAVP — Sign</div>
              <HexInput label="sk  (hex)" value={cavpDsaSk} onChange={setCavpDsaSk} rows={3} />
              <HexInput label="msg  (hex)" value={cavpDsaMsg} onChange={setCavpDsaMsg} rows={2} />
              <HexInput label="rnd (for randomized sign, hex)" value={cavpDsaSeed} onChange={setCavpDsaSeed} rows={1} />
              <button onClick={dsaCavpSign} className="cs-btn cs-btn-primary cs-btn-full">Sign</button>

              <div className="cs-divider" />
              <div className="cs-label">CAVP — Verify</div>
              <HexInput label="pk  (hex)" value={cavpDsaPk} onChange={setCavpDsaPk} rows={3} />
              <HexInput label="sig  (hex)" value={cavpDsaSig} onChange={setCavpDsaSig} rows={3} />
              <button onClick={dsaCavpVerify} className="cs-btn cs-btn-outline cs-btn-full">서명 검증</button>
            </div>
          )}
        </div>

        <div style={{ minHeight: 240 }}>
          <LogTerminal logs={logs} onClear={clearLog} />
        </div>
      </div>
    </div>
  );
}
