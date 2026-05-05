import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';

const CURVES = [
  { id: 'ecdh-p224', label: 'P-224', curve: 'P-224' },
  { id: 'ecdh-p256', label: 'P-256', curve: 'P-256' },
  { id: 'ecdh-k233', label: 'K-233', curve: 'K-233' },
  { id: 'ecdh-b233', label: 'B-233', curve: 'B-233' },
  { id: 'ecdh-k283', label: 'K-283', curve: 'K-283' },
  { id: 'ecdh-b283', label: 'B-283', curve: 'B-283' },
];

export default function KeyAgreementPlayground() {
  const [mode, setMode]       = useState('simple');
  const [curveId, setCurveId] = useState('ecdh-p256');
  const [logs, setLogs]       = useState([]);
  const [keyPair, setKeyPair] = useState(null);
  const [peerKeyPair, setPeerKeyPair] = useState(null);
  const [cavpPubPem, setCavpPubPem]   = useState('');
  const [cavpPrivPem, setCavpPrivPem] = useState('');
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  const clearLog = () => setLogs([]);
  const handleModeChange = (m) => { setMode(m); setLogs([]); setKeyPair(null); setPeerKeyPair(null); };
  const curve = CURVES.find(c => c.id === curveId);

  const genKeyPair = async (isPeer = false) => {
    if (!wasmReady) return;
    try {
      const kp = legacyWasm.ecKeygen(curve.curve);
      if (isPeer) setPeerKeyPair(kp);
      else setKeyPair(kp);
      addLog([
        { type: 'section', label: `${curve.label} ${isPeer ? 'Peer ' : 'My '}Key Generation` },
        ...kp.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const runECDH = async () => {
    if (!keyPair || !peerKeyPair || !wasmReady) {
      addLog([{ type: 'error', label: 'Error', value: 'Generate both key pairs first' }]);
      return;
    }
    try {
      const res = legacyWasm.ecdhDerive(keyPair.privateKey, peerKeyPair.publicKey);
      addLog([
        { type: 'section', label: 'ECDH Shared Secret' },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const cavpDerive = async () => {
    if (!wasmReady) return;
    try {
      const res = legacyWasm.ecdhDerive(cavpPrivPem, cavpPubPem);
      addLog([
        { type: 'section', label: 'ECDH CAVP Derive' },
        ...res.logs
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">키 설정 (Key Agreement)</h1>
          <p className="cs-page-desc">ECDH — Elliptic Curve Diffie-Hellman Shared Secret Derivation</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="cs-label">커브 선택</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {CURVES.map(c => (
            <button
              key={c.id}
              className={`cs-algo-pill${curveId === c.id ? ' active' : ''}`}
              onClick={() => { setCurveId(c.id); setKeyPair(null); setPeerKeyPair(null); setLogs([]); }}
            >
              {c.label}
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
                <button onClick={() => genKeyPair(false)} className="cs-btn cs-btn-primary cs-btn-full">1. 내 키쌍 생성</button>
                <button onClick={() => genKeyPair(true)}  className="cs-btn cs-btn-primary cs-btn-full">2. 상대 키쌍 생성</button>
                <button onClick={runECDH}               className="cs-btn cs-btn-outline cs-btn-full" disabled={!keyPair || !peerKeyPair}>3. 공유비밀 도출</button>
              </div>
              <button onClick={clearLog} className="cs-btn cs-btn-ghost" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Clear</button>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">CAVP / Manual</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>내 개인키 (PEM)</label>
                <textarea className="cs-textarea" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                  placeholder="-----BEGIN PRIVATE KEY-----" value={cavpPrivPem} onChange={e => setCavpPrivPem(e.target.value)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>상대 공개키 (PEM)</label>
                <textarea className="cs-textarea" rows={4} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}
                  placeholder="-----BEGIN PUBLIC KEY-----" value={cavpPubPem} onChange={e => setCavpPubPem(e.target.value)} />
              </div>
              <button onClick={cavpDerive} className="cs-btn cs-btn-primary">공유비밀 도출</button>
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
