import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { bytesToHex, hexToBytes, randomBytes } from '../../utils/cryptoHelpers';

const HASH_ALGS = [
  { id: 'sha256', label: 'SHA-256', ossl: 'sha256' },
  { id: 'sha384', label: 'SHA-384', ossl: 'sha384' },
  { id: 'sha512', label: 'SHA-512', ossl: 'sha512' },
  { id: 'sha3-256', label: 'SHA3-256', ossl: 'sha3-256' },
];

export default function MACPlayground() {
  const [mode, setMode]     = useState('simple');
  const [algoId, setAlgoId] = useState('sha256');
  const [logs, setLogs]     = useState([]);
  const [keyHex, setKeyHex] = useState('');
  const [msgHex, setMsgHex] = useState('');
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  const clearLog = () => setLogs([]);
  const algo = HASH_ALGS.find(a => a.id === algoId);

  const runHMAC = () => {
    if (!wasmReady) return;
    try {
      const k = keyHex ? keyHex : bytesToHex(randomBytes(32));
      const m = msgHex ? msgHex : bytesToHex(new TextEncoder().encode('Hello, HMAC!'));
      const mac = legacyWasm.hmac(algo.ossl, k, m);
      addLog([
        { type: 'section', label: `HMAC-${algo.label}` },
        { type: 'hex',     label: 'Key', value: k },
        { type: 'hex',     label: 'Msg', value: m },
        { type: 'hex',     label: 'MAC', value: mac },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">메시지 인증 (MAC)</h1>
          <p className="cs-page-desc">HMAC-SHA2 · HMAC-SHA3 — 무결성 및 인증 검증</p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="cs-label">해시 알고리즘</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {HASH_ALGS.map(h => (
            <button
              key={h.id}
              className={`cs-algo-pill${algoId === h.id ? ' active' : ''}`}
              onClick={() => setAlgoId(h.id)}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <HexInput label="Key (hex)" value={keyHex} onChange={setKeyHex} placeholder="비우면 랜덤 생성" />
            <HexInput label="Message (hex)" value={msgHex} onChange={setMsgHex} placeholder="비우면 예시 사용" rows={3} />
            <button onClick={runHMAC} className="cs-btn cs-btn-primary cs-btn-full">HMAC 계산</button>
          </div>
        </div>
        <div style={{ minHeight: 240 }}>
          <LogTerminal logs={logs} onClear={clearLog} />
        </div>
      </div>
    </div>
  );
}
