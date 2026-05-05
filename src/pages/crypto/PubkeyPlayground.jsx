import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { bytesToHex, hexToBytes } from '../../utils/cryptoHelpers';

const ALGORITHMS = [
  { id: 'rsa-oaep', label: 'RSA-OAEP', type: 'RSA' },
];
const KEY_SIZES = [
  { label: 'RSA-2048', bits: 2048 },
  { label: 'RSA-3072', bits: 3072 },
];

export default function PubkeyPlayground() {
  const [mode, setMode]       = useState('simple');
  const [algoId, setAlgoId]   = useState('rsa-oaep');
  const [keySize, setKeySize] = useState(2048);
  const [logs, setLogs]       = useState([]);
  const [keyPair, setKeyPair] = useState(null);
  const [cavpPubPem, setCavpPubPem]   = useState('');
  const [cavpPrivPem, setCavpPrivPem] = useState('');
  const [cavpMsgHex, setCavpMsgHex]   = useState('');
  const [lastCtHex, setLastCtHex]     = useState('');
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  const clearLog = () => setLogs([]);
  const handleModeChange = (m) => { setMode(m); setLogs([]); setKeyPair(null); };

  const genKeyPair = async () => {
    if (!wasmReady) return;
    try {
      const kp = legacyWasm.rsaKeygen(keySize);
      setKeyPair(kp);
      addLog([
        { type: 'section', label: `RSA-${keySize} Key Generation` },
        ...kp.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const encryptSimple = async () => {
    if (!keyPair || !wasmReady) { addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]); return; }
    const msg = 'Hello, RSAES-OAEP!';
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const res = legacyWasm.rsaOaepEncrypt(keyPair.publicKey, msgHex);
      setLastCtHex(res.ciphertext);
      addLog([
        { type: 'section', label: 'RSAES-OAEP Encrypt' },
        { type: 'info',    label: 'Plaintext', value: msg },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const decryptSimple = async () => {
    if (!keyPair || !lastCtHex || !wasmReady) { addLog([{ type: 'error', label: 'Error', value: 'Encrypt first' }]); return; }
    try {
      const res = legacyWasm.rsaOaepDecrypt(keyPair.privateKey, lastCtHex);
      const pt = new TextDecoder().decode(hexToBytes(res.plaintext));
      addLog([
        { type: 'section', label: 'RSAES-OAEP Decrypt' },
        { type: 'success', label: 'Plaintext', value: pt },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const cavpEncrypt = async () => {
    if (!wasmReady) return;
    try {
      const res = legacyWasm.rsaOaepEncrypt(cavpPubPem, cavpMsgHex);
      addLog([
        { type: 'section', label: 'RSAES-OAEP CAVP Encrypt' },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const cavpDecrypt = async () => {
    if (!wasmReady) return;
    try {
      const res = legacyWasm.rsaOaepDecrypt(cavpPrivPem, cavpMsgHex);
      addLog([
        { type: 'section', label: 'RSAES-OAEP CAVP Decrypt' },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">공개키 암호</h1>
          <p className="cs-page-desc">RSAES-OAEP — 키쌍 생성, 암호화, 복호화 & CAVP 검증</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Params */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 20 }}>
        <div>
          <div className="cs-label">키 크기</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {KEY_SIZES.map(k => (
              <button
                key={k.bits}
                className={`cs-algo-pill${keySize === k.bits ? ' active' : ''}`}
                onClick={() => { setKeySize(k.bits); setKeyPair(null); setLogs([]); }}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {mode === 'simple' ? (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cs-label">간편 모드</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={genKeyPair}     className="cs-btn cs-btn-primary cs-btn-full">1. 키쌍 생성</button>
                <button onClick={encryptSimple}  className="cs-btn cs-btn-outline cs-btn-full" disabled={!keyPair}>2. 암호화</button>
                <button onClick={decryptSimple}  className="cs-btn cs-btn-outline cs-btn-full" disabled={!lastCtHex}>3. 복호화</button>
              </div>
              <button onClick={clearLog} className="cs-btn cs-btn-ghost" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Clear</button>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">CAVP</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>공개키 (PEM)</label>
                <textarea className="cs-textarea" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;..." value={cavpPubPem} onChange={e => setCavpPubPem(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>개인키 (PEM)</label>
                <textarea className="cs-textarea" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;..." value={cavpPrivPem} onChange={e => setCavpPrivPem(e.target.value)} />
              </div>
              <HexInput label="평문 (hex)" value={cavpMsgHex} onChange={setCavpMsgHex} rows={2} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={cavpEncrypt} className="cs-btn cs-btn-primary" style={{ flex: 1 }}>암호화</button>
                <button onClick={cavpDecrypt} className="cs-btn cs-btn-outline" style={{ flex: 1 }}>복호화</button>
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
