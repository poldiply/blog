import { useState } from 'react';

export default function JsonFormatter() {
  const [input, setInput]   = useState('');
  const [output, setOutput] = useState('');
  const [error, setError]   = useState('');
  const [copied, setCopied] = useState(false);

  const parse = () => {
    try {
      if (!input.trim()) return;
      const p = JSON.parse(input);
      setOutput(JSON.stringify(p, null, 2));
      setError('');
    } catch { setError('유효하지 않은 JSON 형식입니다.'); setOutput(''); }
  };

  const minify = () => {
    try {
      if (!input.trim()) return;
      const p = JSON.parse(input);
      setOutput(JSON.stringify(p));
      setError('');
    } catch { setError('유효하지 않은 JSON 형식입니다.'); setOutput(''); }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => { setInput(''); setOutput(''); setError(''); };

  return (
    <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 className="cs-page-title">JSON 포맷터</h1>
        <p className="cs-page-desc">JSON 정렬(Format) 및 압축(Minify) 변환 도구</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Input */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="cs-label">입력</div>
            {error && (
              <span style={{ fontSize: 11.5, color: 'oklch(var(--er))', fontWeight: 500 }}>{error}</span>
            )}
          </div>
          <textarea
            className="cs-textarea"
            rows={12}
            placeholder='{"name": "CS Lee", "field": "cryptography"}'
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5,
              borderColor: error ? 'oklch(var(--er) / 0.5)' : undefined,
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={parse}  className="cs-btn cs-btn-primary" style={{ flex: 1 }}>Format</button>
            <button onClick={minify} className="cs-btn cs-btn-outline" style={{ flex: 1 }}>Minify</button>
            <button onClick={clear}  className="cs-btn cs-btn-ghost">Clear</button>
          </div>
        </div>

        {/* Output */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="cs-label">결과</div>
            <button onClick={copy} className={`cs-btn cs-btn-sm ${copied ? 'cs-btn-primary' : 'cs-btn-outline'}`}>
              {copied ? '복사 완료' : '결과 복사'}
            </button>
          </div>
          <textarea
            className="cs-textarea"
            rows={12}
            readOnly
            placeholder="결과가 여기 표시됩니다"
            value={output}
            style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5,
              backgroundColor: 'oklch(var(--b2))',
              color: output ? 'var(--cs-accent)' : undefined,
            }}
          />
        </div>
      </div>
    </div>
  );
}