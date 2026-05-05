import { useState, useCallback, useEffect } from 'react';
import { legacyWasm } from '../../lib/crypto/LegacyWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import ModeToggle from '../../components/crypto/ModeToggle';
import HexInput from '../../components/crypto/HexInput';
import { hexToBytes, bytesToHex, randomBytes, pkcs7Pad, pkcs7Unpad } from '../../utils/cryptoHelpers';

const CIPHERS = [
  { id: 'aes128',  label: 'AES-128',  family: 'AES',  keyLen: 16, ossl: 'aes-128' },
  { id: 'aes192',  label: 'AES-192',  family: 'AES',  keyLen: 24, ossl: 'aes-192' },
  { id: 'aes256',  label: 'AES-256',  family: 'AES',  keyLen: 32, ossl: 'aes-256' },
  { id: 'aria128', label: 'ARIA-128', family: 'ARIA', keyLen: 16, ossl: 'aria-128' },
  { id: 'aria192', label: 'ARIA-192', family: 'ARIA', keyLen: 24, ossl: 'aria-192' },
  { id: 'aria256', label: 'ARIA-256', family: 'ARIA', keyLen: 32, ossl: 'aria-256' },
  { id: 'seed128', label: 'SEED-128', family: 'SEED', keyLen: 16, ossl: 'seed' },
];
const MODES = ['ECB', 'CBC', 'CFB', 'OFB', 'CTR', 'GCM', 'CCM'];

export default function BlockCipherPlayground() {
  const [mode, setMode]       = useState('simple');
  const [cipherId, setCipherId] = useState('aes128');
  const [blockMode, setBlockMode] = useState('ECB');
  const [logs, setLogs]       = useState([]);
  const [keyHex, setKeyHex]   = useState('');
  const [ptHex, setPtHex]     = useState('');
  const [ivHex, setIvHex]     = useState('');
  const [aadHex, setAadHex]   = useState('');
  const [tagHex, setTagHex]   = useState('');
  const [wasmReady, setWasmReady] = useState(false);

  useEffect(() => {
    legacyWasm.init().then(() => setWasmReady(true));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  const clearLog = () => setLogs([]);
  const cipher = CIPHERS.find(c => c.id === cipherId);

  const isAEAD = blockMode === 'GCM' || blockMode === 'CCM';

  const getOSSLName = () => {
    return `${cipher.ossl}-${blockMode.toLowerCase()}`;
  };

  async function doEncrypt(k, iv, pt, aad = null) {
    const alg = getOSSLName();
    const res = legacyWasm.encrypt(alg, bytesToHex(k), bytesToHex(iv), bytesToHex(pt), aad ? bytesToHex(aad) : null, isAEAD ? 16 : 0);
    return res;
  }

  async function doDecrypt(k, iv, ct, tag = null, aad = null) {
    const alg = getOSSLName();
    const res = legacyWasm.decrypt(alg, bytesToHex(k), bytesToHex(iv), bytesToHex(ct), aad ? bytesToHex(aad) : null, tag ? bytesToHex(tag) : null);
    return res;
  }

  const runSimple = async () => {
    if (!wasmReady) return;
    try {
      const keyB = randomBytes(cipher.keyLen);
      const ivLen = blockMode === 'ECB' ? 0 : 16;
      const ivB  = ivLen > 0 ? randomBytes(ivLen) : new Uint8Array(0);
      const ptB  = pkcs7Pad(new TextEncoder().encode('Hello, Crypto!  '));
      
      const encRes = await doEncrypt(keyB, ivB, ptB);
      const dtHex = await doDecrypt(keyB, ivB, hexToBytes(encRes.ciphertext), encRes.tag ? hexToBytes(encRes.tag) : null);
      
      addLog([
        { type: 'section', label: `${cipher.label}-${blockMode}` },
        { type: 'hex',     label: 'Key', value: bytesToHex(keyB) },
        ...(ivLen > 0 ? [{ type: 'hex', label: 'IV', value: bytesToHex(ivB) }] : []),
        { type: 'info',    label: 'PT',  value: '"Hello, Crypto!  "' },
        { type: 'hex',     label: 'PT (padded)',  value: bytesToHex(ptB) },
        { type: 'hex',     label: 'CT',  value: encRes.ciphertext },
        ...(encRes.tag ? [{ type: 'hex', label: 'Tag', value: encRes.tag }] : []),
        { type: 'hex',     label: 'DT',  value: dtHex },
        { type: 'info',    label: 'Plaintext', value: new TextDecoder().decode(pkcs7Unpad(hexToBytes(dtHex))) },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const runCavpEncrypt = async () => {
    if (!wasmReady) return;
    try {
      const keyB = hexToBytes(keyHex);
      if (keyB.length !== cipher.keyLen) throw new Error(`Key must be ${cipher.keyLen} bytes`);
      const ptB  = hexToBytes(ptHex);
      const ivB  = ivHex ? hexToBytes(ivHex) : new Uint8Array(0);
      const aadB = aadHex ? hexToBytes(aadHex) : null;

      const res = await doEncrypt(keyB, ivB, ptB, aadB);
      addLog([
        { type: 'section', label: `${cipher.label}-${blockMode} CAVP Encrypt` },
        { type: 'hex',     label: 'CT',  value: res.ciphertext },
        ...(res.tag ? [{ type: 'hex', label: 'Tag', value: res.tag }] : []),
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const runCavpDecrypt = async () => {
    if (!wasmReady) return;
    try {
      const keyB = hexToBytes(keyHex);
      const ctB  = hexToBytes(ptHex);
      const ivB  = ivHex ? hexToBytes(ivHex) : new Uint8Array(0);
      const tagB = tagHex ? hexToBytes(tagHex) : null;
      const aadB = aadHex ? hexToBytes(aadHex) : null;

      const dtHex = await doDecrypt(keyB, ivB, ctB, tagB, aadB);
      addLog([
        { type: 'section', label: `${cipher.label}-${blockMode} CAVP Decrypt` },
        { type: 'hex',     label: 'PT',  value: dtHex },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const handleModeChange = (m) => { setMode(m); setLogs([]); };

  return (
    <div className="cs-page-wide">

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">블록 암호</h1>
          <p className="cs-page-desc">AES · ARIA · SEED — ECB/CBC 모드 암호화/복호화 & CAVP 검증</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </div>

      {/* Selectors */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
        <div>
          <div className="cs-label">알고리즘</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CIPHERS.map(c => (
              <button
                key={c.id}
                className={`cs-algo-pill${cipherId === c.id ? ' active' : ''}`}
                onClick={() => { setCipherId(c.id); setLogs([]); }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="cs-label">운용 모드</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {MODES.map(m => (
              <button
                key={m}
                className={`cs-algo-pill${blockMode === m ? ' active' : ''}`}
                onClick={() => { setBlockMode(m); setLogs([]); }}
              >
                {m}
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
              <div className="cs-label">간편 테스트</div>
              <p style={{ fontSize: 13, color: 'oklch(var(--bc) / 0.5)', lineHeight: 1.5 }}>
                무작위 키{blockMode === 'CBC' ? '/IV' : ''}를 생성하고 예시 평문을 암호화한 뒤 복호화합니다.
              </p>
              <button onClick={runSimple} className="cs-btn cs-btn-primary cs-btn-full">
                암호화 → 복호화 실행
              </button>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="cs-label" style={{ marginBottom: 0 }}>CAVP Input</div>
                <span className="cs-badge cs-badge-neutral">
                  {cipher.family === 'SEED' ? 'RFC 4269' : cipher.family === 'ARIA' ? 'KS X 1213' : 'FIPS 197'}
                </span>
              </div>
              <HexInput label={`Key  (${cipher.keyLen * 8}-bit)`} value={keyHex} onChange={setKeyHex} expectedBytes={cipher.keyLen} />
              {blockMode !== 'ECB' && (
                <HexInput label="IV" value={ivHex} onChange={setIvHex} />
              )}
              {isAEAD && (
                <HexInput label="AAD (Additional Data)" value={aadHex} onChange={setAadHex} />
              )}
              <HexInput label="PT / CT" value={ptHex} onChange={setPtHex} rows={2} />
              {isAEAD && (
                <HexInput label="Tag (16 bytes)" value={tagHex} onChange={setTagHex} expectedBytes={16} />
              )}

              {/* Quick fill: FIPS-197 AES vector */}
              {cipher.family === 'AES' && (
                <div style={{ padding: '10px 12px', background: 'oklch(var(--bc) / 0.04)', border: '1px solid oklch(var(--bc) / 0.08)', borderRadius: 4, fontSize: 11 }}>
                  <div style={{ color: 'oklch(var(--bc) / 0.4)', marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em' }}>
                    FIPS 197 — AES-128-ECB
                  </div>
                  <button
                    style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'oklch(var(--p))', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, lineHeight: 1.8 }}
                    onClick={() => { setKeyHex('000102030405060708090a0b0c0d0e0f'); setPtHex('00112233445566778899aabbccddeeff'); setBlockMode('ECB'); }}
                  >
                    Click to fill: Key=000102...0f, PT=001122...ff
                  </button>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', color: 'oklch(var(--bc) / 0.4)', marginTop: 2 }}>
                    Expected CT: 69c4e0d86a7b0430d8cdb78070b4c55a
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={runCavpEncrypt} className="cs-btn cs-btn-primary" style={{ flex: 1 }}>암호화</button>
                <button onClick={runCavpDecrypt} className="cs-btn cs-btn-outline" style={{ flex: 1 }}>복호화</button>
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
