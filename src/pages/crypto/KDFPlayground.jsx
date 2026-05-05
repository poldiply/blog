import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { bytesToHex, hexToBytes, randomBytes } from '../../utils/cryptoHelpers';

const HASH_ALGS = ['sha256', 'sha384', 'sha512'];

export default function KDFPlayground() {
  const [password, setPassword] = useState('password123');
  const [saltHex, setSaltHex]   = useState('00112233445566778899aabbccddeeff');
  const [iterations, setIterations] = useState(1000);
  const [mdName, setMdName] = useState('sha256');
  const [keyLen, setKeyLen] = useState(32);
  const [logs, setLogs]     = useState([]);
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  const clearLog = () => setLogs([]);

  const runPBKDF2 = () => {
    if (!wasmReady) return;
    try {
      const key = legacyWasm.pbkdf2(password, saltHex, iterations, mdName, keyLen);
      addLog([
        { type: 'section', label: 'PBKDF2' },
        { type: 'info',    label: 'Password', value: password },
        { type: 'hex',     label: 'Salt',     value: saltHex },
        { type: 'info',    label: 'Iterations', value: iterations.toString() },
        { type: 'info',    label: 'Hash',     value: mdName.toUpperCase() },
        { type: 'hex',     label: 'Derived Key', value: key },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">
      <div>
        <h1 className="cs-page-title">키 유도 (KDF)</h1>
        <p className="cs-page-desc">PBKDF2 — 암호 기반 키 유도 함수</p>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, minHeight: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="cs-label">Password</label>
              <input className="cs-input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <HexInput label="Salt (hex)" value={saltHex} onChange={setSaltHex} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="cs-label">Iterations</label>
                <input type="number" className="cs-input" value={iterations} onChange={e => setIterations(parseInt(e.target.value))} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="cs-label">Derived Key Len (Bytes)</label>
                <input type="number" className="cs-input" value={keyLen} onChange={e => setKeyLen(parseInt(e.target.value))} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label className="cs-label">Hash Algorithm</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {HASH_ALGS.map(h => (
                  <button
                    key={h}
                    className={`cs-algo-pill${mdName === h ? ' active' : ''}`}
                    onClick={() => setMdName(h)}
                  >
                    {h.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={runPBKDF2} className="cs-btn cs-btn-primary cs-btn-full">키 유도 실행</button>
          </div>
        </div>
        <div style={{ minHeight: 240 }}>
          <LogTerminal logs={logs} onClear={clearLog} />
        </div>
      </div>
    </div>
  );
}
