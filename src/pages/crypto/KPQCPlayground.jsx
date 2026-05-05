import { useState, useCallback, useRef, useEffect } from 'react';
import kpqcWasm from '../../lib/crypto/KPQCWasm';
import LogTerminal from '../../components/crypto/LogTerminal';
import HexInput from '../../components/crypto/HexInput';
import { bytesToHex } from '../../utils/cryptoHelpers';

const ALGO_TYPES = ['KEM', 'Signature'];

const ALGO_GROUPS = {
  'KEM': ['NTRU+', 'SMAUG-T'],
  'Signature': ['AIMer', 'HAETAE']
};

const ALGO_PARAMS = {
  'NTRU+': ['576', '768', '864', '1152'],
  'SMAUG-T': ['T1', 'T3', 'T5'],
  'AIMer': ['128f', '128s', '192f', '192s', '256f', '256s'],
  'HAETAE': ['2', '3', '5']
};

const ALGO_MAP = {
  'NTRU+': 'ntruplus',
  'SMAUG-T': 'smaug',
  'AIMer': 'aimer',
  'HAETAE': 'haetae'
};

export default function KPQCPlayground() {
  const [algoType, setAlgoType]   = useState('KEM');
  const [algoGroup, setAlgoGroup] = useState('NTRU+');
  const [algoParam, setAlgoParam] = useState('576');

  const [logs, setLogs]           = useState([]);
  const [simpleMsg, setSimpleMsg] = useState('');

  const kpRef    = useRef(null);
  const ctRef    = useRef(null);
  const sigRef   = useRef(null);

  useEffect(() => {
    kpqcWasm.init().catch(e => console.error("KPQC WASM Load Error", e));
  }, []);

  const addLog = useCallback((e) => setLogs(p => [...p, ...e]), []);
  
  const clearLog = () => {
    setLogs([]);
    kpRef.current = null;
    ctRef.current = null; 
    sigRef.current = null;
  };

  const handleTypeChange = (t) => { 
    setAlgoType(t);
    const firstGroup = ALGO_GROUPS[t][0];
    setAlgoGroup(firstGroup);
    setAlgoParam(ALGO_PARAMS[firstGroup][0]);
    clearLog(); 
  };
  
  const handleGroupChange = (g) => {
    setAlgoGroup(g);
    setAlgoParam(ALGO_PARAMS[g][0]);
    clearLog();
  };

  const handleParamChange = (p) => {
    setAlgoParam(p);
    clearLog();
  };

  const getFullAlgId = () => {
    const base = ALGO_MAP[algoGroup];
    return base + algoParam.toLowerCase();
  };

  const kemGenKey = async () => {
    const algId = getFullAlgId();
    addLog([{ type: 'info', label: `Generating ${algoGroup} ${algoParam} key pair...` }]);
    try {
      const kp = await kpqcWasm.keygen(algId);
      kpRef.current = kp;
      addLog([
        { type: 'section', label: `${algoGroup} ${algoParam} Key Generation` },
        { type: 'hex',     label: 'pk', value: kp.pk },
        { type: 'hex',     label: 'sk', value: kp.sk },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const kemEncap = async () => {
    if (!kpRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]); return; }
    const algId = getFullAlgId();
    try {
      const res = await kpqcWasm.encapsulate(algId, kpRef.current.pk);
      ctRef.current = res.ct;
      addLog([
        { type: 'section', label: `${algoGroup} ${algoParam} Encapsulation` },
        { type: 'hex',     label: 'ct', value: res.ct },
        { type: 'hex',     label: 'ss', value: res.ss },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const kemDecap = async () => {
    if (!kpRef.current || !ctRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Encapsulate first' }]); return; }
    const algId = getFullAlgId();
    try {
      const res = await kpqcWasm.decapsulate(algId, ctRef.current, kpRef.current.sk);
      addLog([
        { type: 'section', label: `${algoGroup} ${algoParam} Decapsulation` },
        { type: 'hex',     label: 'ss', value: res.ss },
        { type: 'info',    label: 'Note', value: 'Compare ss with encapsulation ss — they should match.' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const sigGenKey = async () => {
    const algId = getFullAlgId();
    addLog([{ type: 'info', label: `Generating ${algoGroup} ${algoParam} key pair...` }]);
    try {
      const kp = await kpqcWasm.keygen(algId);
      kpRef.current = kp;
      addLog([
        { type: 'section', label: `${algoGroup} ${algoParam} Key Generation` },
        { type: 'hex',     label: 'pk', value: kp.pk },
        { type: 'hex',     label: 'sk', value: kp.sk },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const sigSign = async () => {
    if (!kpRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Generate key pair first' }]); return; }
    const algId = getFullAlgId();
    const msg = simpleMsg || `Hello, KPQC ${algoGroup} ${algoParam}!`;
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const res = await kpqcWasm.sign(algId, msgHex, kpRef.current.sk);
      sigRef.current = res.sm;
      addLog([
        { type: 'section', label: `${algoGroup} ${algoParam} Sign` },
        { type: 'info',    label: 'Message', value: msg },
        { type: 'hex',     label: 'Signature', value: res.sm },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  const sigVerify = async () => {
    if (!kpRef.current || !sigRef.current) { addLog([{ type: 'error', label: 'Error', value: 'Sign first' }]); return; }
    const algId = getFullAlgId();
    const msg = simpleMsg || `Hello, KPQC ${algoGroup} ${algoParam}!`;
    const msgHex = bytesToHex(new TextEncoder().encode(msg));
    try {
      const res = await kpqcWasm.verify(algId, sigRef.current, kpRef.current.pk);
      addLog([
        { type: 'section', label: `${algoGroup} ${algoParam} Verify` },
        { type: res.verified ? 'success' : 'error', label: 'Result', value: res.verified ? 'VALID' : 'INVALID' },
      ]);
    } catch(e) { addLog([{ type: 'error', label: 'Error', value: e.message }]); }
  };

  return (
    <div className="cs-page-wide">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">KPQC</h1>
          <p className="cs-page-desc">국산 양자내성암호 (NTRU+, SMAUG-T, AIMer, HAETAE)</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24 }}>
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
          <div className="cs-label">알고리즘 군 (Algorithm)</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {ALGO_GROUPS[algoType].map(g => (
              <button
                key={g}
                className={`cs-algo-pill${algoGroup === g ? ' active' : ''}`}
                onClick={() => handleGroupChange(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="cs-label">보안 파라미터 (Parameter)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 500 }}>
            {ALGO_PARAMS[algoGroup].map(p => (
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
          
          {algoType === 'KEM' ? (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cs-label">키 캡슐화 — {algoGroup} {algoParam}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={kemGenKey} className="cs-btn cs-btn-primary cs-btn-full">1. 키쌍 생성</button>
                <button onClick={kemEncap}  className="cs-btn cs-btn-outline cs-btn-full" disabled={!kpRef.current}>2. 캡슐화 (Encapsulate)</button>
                <button onClick={kemDecap}  className="cs-btn cs-btn-outline cs-btn-full" disabled={!ctRef.current}>3. 디캡슐화 (Decapsulate)</button>
              </div>
            </div>
          ) : (
            <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="cs-label">전자서명 — {algoGroup} {algoParam}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label className="cs-label" style={{ fontSize: 11 }}>서명할 메시지</label>
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
            </div>
          )}
          
          <button onClick={clearLog} className="cs-btn cs-btn-ghost" style={{ fontSize: 11, alignSelf: 'flex-start' }}>Clear Results</button>
        </div>

        <div style={{ minHeight: 300 }}>
          <LogTerminal logs={logs} onClear={clearLog} />
        </div>
      </div>
    </div>
  );
}
