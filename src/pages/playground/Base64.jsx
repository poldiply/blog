import { useState } from 'react';

export default function Base64() {
  const [input, setInput]         = useState('');
  const [output, setOutput]       = useState('');
  const [copied, setCopied]       = useState(false);

  const encode = () => {
    try {
      if (!input) { setOutput(''); return; }
      setOutput(btoa(new TextEncoder().encode(input).reduce((d, b) => d + String.fromCharCode(b), '')));
    } catch { setOutput('오류: 인코딩 실패'); }
  };

  const decode = () => {
    try {
      if (!input) { setOutput(''); return; }
      setOutput(new TextDecoder().decode(Uint8Array.from(atob(input), c => c.charCodeAt(0))));
    } catch { setOutput('오류: 올바른 Base64 형식이 아닙니다.'); }
  };

  const copy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clear = () => { setInput(''); setOutput(''); };

  return (
    <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 className="cs-page-title">Base64</h1>
        <p className="cs-page-desc">텍스트 ↔ Base64 인코딩/디코딩 변환 도구</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Input */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="cs-label">입력</div>
            <span style={{ fontSize: 11.5, color: 'oklch(var(--bc) / 0.35)', fontVariantNumeric: 'tabular-nums' }}>
              {input.length}자
            </span>
          </div>
          <textarea
            className="cs-textarea"
            rows={10}
            placeholder="텍스트 또는 Base64 문자열을 입력하세요"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={encode} className="cs-btn cs-btn-primary" style={{ flex: 1 }}>인코딩 (Encode)</button>
            <button onClick={decode} className="cs-btn cs-btn-outline" style={{ flex: 1 }}>디코딩 (Decode)</button>
          </div>
          <button onClick={clear} className="cs-btn cs-btn-ghost" style={{ fontSize: 12, alignSelf: 'flex-start' }}>Clear</button>
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
            rows={10}
            readOnly
            placeholder="결과가 여기 표시됩니다"
            value={output}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, backgroundColor: 'oklch(var(--b2))' }}
          />
        </div>
      </div>
    </div>
  );
}