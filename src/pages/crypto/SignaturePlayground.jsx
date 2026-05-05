import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { bytesToHex } from '../../utils/cryptoHelpers';

const ALGORITHMS = [
  { id: 'rsa-pss-2048', label: 'RSA-PSS 2048', type: 'rsa', bits: 2048 },
  { id: 'rsa-pss-3072', label: 'RSA-PSS 3072', type: 'rsa', bits: 3072 },
  { id: 'ecdsa-p224',   label: 'ECDSA P-224',  type: 'ec',  curve: 'P-224' },
  { id: 'ecdsa-p256',   label: 'ECDSA P-256',  type: 'ec',  curve: 'P-256' },
  { id: 'ecdsa-k233',   label: 'ECDSA K-233',  type: 'ec',  curve: 'K-233' },
  { id: 'ecdsa-b233',   label: 'ECDSA B-233',  type: 'ec',  curve: 'B-233' },
  { id: 'ecdsa-k283',   label: 'ECDSA K-283',  type: 'ec',  curve: 'K-283' },
  { id: 'ecdsa-b283',   label: 'ECDSA B-283',  type: 'ec',  curve: 'B-283' },
];

export default function SignaturePlayground() {
  const [mode, setMode]       = useState('simple');
  const [algoId, setAlgoId]   = useState('rsa-pss-2048');
  const [logs, setLogs]       = useState([]);
  const [keyPair, setKeyPair] = useState(null);
  const [lastSig, setLastSig] = useState('');
  const [cavpPrivPem, setCavpPrivPem] = useState('');
  const [cavpPubPem,  setCavpPubPem]  = useState('');
  const [cavpMsgHex,  setCavpMsgHex]  = useState('');
  const [cavpSigHex,  setCavpSigHex]  = useState('');
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  const clearLog = () => setLogs([]);
  const handleModeChange = (m) => { setMode(m); setLogs([]); setKeyPair(null); setLastSig(''); };
  const algo = ALGORITHMS.find(a => a.id === algoId);

  const genKeyPair = async () => {
    if (!wasmReady) return;
    try {
      const kp = algo.type === 'rsa' 
        ? legacyWasm.rsaKeygen(algo.bits)
        : legacyWasm.ecKeygen(algo.curve);
      setKeyPair(kp);
      addLog([
        { type: 'section', label: `${algo.label} Key Generation` },
        ...kp.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const sign = async () => {
    if (!keyPair || !wasmReady) { addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]); return; }
    const msg = 'Test message for signature playground.';
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const res = algo.type === 'rsa'
        ? legacyWasm.rsaPssSign(keyPair.privateKey, msgHex)
        : legacyWasm.ecdsaSign(keyPair.privateKey, msgHex);
      setLastSig(res.signature);
      addLog([
        { type: 'section', label: `${algo.label} Sign` },
        { type: 'info',    label: 'Message', value: msg },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const verify = async () => {
    if (!keyPair || !lastSig || !wasmReady) { addLog([{ type: 'error', label: 'Error', value: 'Sign first' }]); return; }
    const msg = 'Test message for signature playground.';
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const ok = algo.type === 'rsa'
        ? legacyWasm.rsaPssVerify(keyPair.publicKey, msgHex, lastSig)
        : legacyWasm.ecdsaVerify(keyPair.publicKey, msgHex, lastSig);
      addLog([
        { type: 'section', label: `${algo.label} Verify` },
        { type: ok ? 'success' : 'error', label: 'Result', value: ok ? 'VALID' : 'INVALID' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const cavpSign = async () => {
    if (!wasmReady) return;
    try {
      const res = algo.type === 'rsa'
        ? legacyWasm.rsaPssSign(cavpPrivPem, cavpMsgHex)
        : legacyWasm.ecdsaSign(cavpPrivPem, cavpMsgHex);
      setCavpSigHex(res.signature);
      addLog([
        { type: 'section', label: `${algo.label} CAVP Sign` },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const cavpVerify = async () => {
    if (!wasmReady) return;
    try {
      const ok = algo.type === 'rsa'
        ? legacyWasm.rsaPssVerify(cavpPubPem, cavpMsgHex, cavpSigHex)
        : legacyWasm.ecdsaVerify(cavpPubPem, cavpMsgHex, cavpSigHex);
      addLog([
        { type: 'section', label: `${algo.label} CAVP Verify` },
        { type: ok ? 'success' : 'error', label: 'Result', value: ok ? 'VALID' : 'INVALID' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">전자서명</h1>
          <p className="cs-page-desc">RSA-PSS · ECDSA — 키쌍 생성, 서명, 검증 & CAVP</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      <div>
        <div className="cs-label">알고리즘</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              className={`cs-algo-pill${algoId === a.id ? ' active' : ''}`}
              onClick={() => { setAlgoId(a.id); setKeyPair(null); setLastSig(''); setLogs([]); }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {mode === 'simple' ? (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cs-label">간편 모드</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={genKeyPair} className="cs-btn cs-btn-primary cs-btn-full">1. 키쌍 생성</button>
                <button onClick={sign}       className="cs-btn cs-btn-outline cs-btn-full" disabled={!keyPair}>2. 서명 생성</button>
                <button onClick={verify}     className="cs-btn cs-btn-outline cs-btn-full" disabled={!lastSig}>3. 서명 검증</button>
              </div>
              <button onClick={clearLog} className="cs-btn cs-btn-ghost" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Clear</button>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">CAVP</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>개인키 (PEM) — 서명용</label>
                <textarea className="cs-textarea" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                  placeholder="-----BEGIN PRIVATE KEY-----" value={cavpPrivPem} onChange={e => setCavpPrivPem(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>공개키 (PEM) — 검증용</label>
                <textarea className="cs-textarea" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                  placeholder="-----BEGIN PUBLIC KEY-----" value={cavpPubPem} onChange={e => setCavpPubPem(e.target.value)} />
              </div>
              <HexInput label="메시지 (hex)" value={cavpMsgHex} onChange={setCavpMsgHex} rows={2} />
              <HexInput label="서명값 (hex)" value={cavpSigHex} onChange={setCavpSigHex} rows={2} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={cavpSign}   className="cs-btn cs-btn-primary" style={{ flex: 1 }}>서명</button>
                <button onClick={cavpVerify} className="cs-btn cs-btn-outline" style={{ flex: 1 }}>검증</button>
              </div>
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
