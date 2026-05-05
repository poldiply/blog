import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { hexToBytes, bytesToHex, randomBytes } from '../../utils/cryptoHelpers';

const ALGORITHMS = [
  { id: 'sha224',   label: 'SHA-224',   group: 'SHA-2', ossl: 'sha224' },
  { id: 'sha256',   label: 'SHA-256',   group: 'SHA-2', ossl: 'sha256' },
  { id: 'sha384',   label: 'SHA-384',   group: 'SHA-2', ossl: 'sha384' },
  { id: 'sha512',   label: 'SHA-512',   group: 'SHA-2', ossl: 'sha512' },
  { id: 'sha3_224', label: 'SHA3-224',  group: 'SHA-3', ossl: 'sha3-224' },
  { id: 'sha3_256', label: 'SHA3-256',  group: 'SHA-3', ossl: 'sha3-256' },
  { id: 'sha3_384', label: 'SHA3-384',  group: 'SHA-3', ossl: 'sha3-384' },
  { id: 'sha3_512', label: 'SHA3-512',  group: 'SHA-3', ossl: 'sha3-512' },
  { id: 'shake128', label: 'SHAKE-128', group: 'SHAKE', ossl: 'shake128' },
  { id: 'shake256', label: 'SHAKE-256', group: 'SHAKE', ossl: 'shake256' },
];

const TEST_VECTORS = {
  sha256:   { msg: '616263', md: 'ba7816bf8f01cfea414140de5dae2ec73b00361a396177a9cb410ff61f20015ad' },
  sha384:   { msg: '616263', md: 'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded163...' },
  sha512:   { msg: '616263', md: 'ddaf35a193617aba cc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a...' },
  sha3_256: { msg: '',       md: 'a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a' },
};

export default function HashPlayground() {
  const [mode, setMode]     = useState('simple');
  const [algoId, setAlgoId] = useState('sha256');
  const [logs, setLogs]     = useState([]);
  const [simpleMsg, setSimpleMsg] = useState('');
  const [cavpMsgHex, setCavpMsgHex] = useState('');
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((entries) => setLogs(prev => [...prev, ...entries]), []);
  const clearLog = () => setLogs([]);
  const current = ALGORITHMS.find(a => a.id === algoId);

  const doHash = (msgHex) => {
    return legacyWasm.hash(current.ossl, msgHex);
  };

  const runSimple = () => {
    if (!wasmReady) return;
    const msg = simpleMsg || 'Hello, Crypto Playground!';
    const data = new TextEncoder().encode(msg);
    try {
      const digestHex = doHash(bytesToHex(data));
      addLog([
        { type: 'section', label: `${current.label}` },
        { type: 'info',    label: 'Input', value: msg },
        { type: 'hex',     label: 'Msg',   value: bytesToHex(data) },
        { type: 'hex',     label: 'Digest', value: digestHex },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const runRandom = () => {
    if (!wasmReady) return;
    const data = randomBytes(32);
    try {
      const digestHex = doHash(bytesToHex(data));
      addLog([
        { type: 'section', label: `${current.label} — random input` },
        { type: 'hex',     label: 'Msg',    value: bytesToHex(data) },
        { type: 'hex',     label: 'Digest', value: digestHex },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const runCavp = () => {
    if (!wasmReady) return;
    try {
      const digestHex = doHash(cavpMsgHex || '');
      addLog([
        { type: 'section', label: `${current.label} CAVP` },
        { type: 'hex',     label: 'Msg',    value: cavpMsgHex || '(empty)' },
        { type: 'hex',     label: 'MD',     value: digestHex },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const handleModeChange = (m) => { setMode(m); setLogs([]); };
  const tv = TEST_VECTORS[algoId];

  return (
    <div className="cs-page-wide">

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">해시 함수</h1>
          <p className="cs-page-desc">SHA-2 / SHA-3 / SHAKE — 메시지 다이제스트 & CAVP 검증</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Algorithm selector */}
      <div>
        <div className="cs-label">알고리즘</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALGORITHMS.map(a => (
            <button
              key={a.id}
              className={`cs-algo-pill${algoId === a.id ? ' active' : ''}`}
              onClick={() => { setAlgoId(a.id); setLogs([]); }}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main: control + terminal */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, minHeight: 0 }}>

        {/* Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>
          {mode === 'simple' ? (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="cs-label">입력 메시지 (텍스트)</div>
              <textarea
                className="cs-textarea"
                rows={4}
                placeholder="해시할 메시지 입력 (비우면 예시 사용)"
                value={simpleMsg}
                onChange={e => setSimpleMsg(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={runSimple} className="cs-btn cs-btn-primary" style={{ flex: 1 }}>
                  해시 계산
                </button>
                <button onClick={runRandom} className="cs-btn cs-btn-outline">
                  랜덤
                </button>
              </div>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="cs-label" style={{ marginBottom: 0 }}>CAVP Input</div>
                <span className="cs-badge cs-badge-neutral">
                  {current.group === 'SHA-2' ? 'FIPS 180-4' : 'FIPS 202'}
                </span>
              </div>

              <HexInput
                label="Msg"
                value={cavpMsgHex}
                onChange={setCavpMsgHex}
                rows={3}
              />

              {/* Test vector hint */}
              {tv && (
                <div style={{
                  padding: '10px 12px',
                  background: 'oklch(var(--bc) / 0.04)',
                  border: '1px solid oklch(var(--bc) / 0.08)',
                  borderRadius: 4,
                  fontSize: 11,
                }}>
                  <div style={{ color: 'oklch(var(--bc) / 0.4)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em' }}>KNOWN VECTOR</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'oklch(var(--bc) / 0.4)', width: 28, flexShrink: 0 }}>Msg</span>
                      <button
                        style={{ color: 'oklch(var(--p))', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, padding: 0, textAlign: 'left' }}
                        onClick={() => setCavpMsgHex(tv.msg)}
                      >
                        {tv.msg || '(empty)'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ color: 'oklch(var(--bc) / 0.4)', width: 28, flexShrink: 0 }}>MD</span>
                      <span style={{ color: 'oklch(var(--bc) / 0.5)', wordBreak: 'break-all' }}>{tv.md}</span>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={runCavp} className="cs-btn cs-btn-primary cs-btn-full">
                CAVP 실행
              </button>
            </div>
          )}
        </div>

        {/* Log terminal */}
        <div style={{ minHeight: 240 }}>
          <LogTerminal logs={logs} onClear={clearLog} />
        </div>
      </div>
    </div>
  );
}
