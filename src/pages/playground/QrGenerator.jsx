import { useState } from 'react';
import QRCode from 'react-qr-code';

export default function QrGenerator() {
  const [text, setText]       = useState('https://dev-cs.cloud');
  const [showLogo, setShowLogo] = useState(true);

  return (
    <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 className="cs-page-title">QR 코드 생성</h1>
        <p className="cs-page-desc">텍스트나 URL을 입력하면 실시간으로 QR 코드를 생성합니다</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* Input */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="cs-label">입력</div>
            <span style={{ fontSize: 11.5, color: 'oklch(var(--bc) / 0.35)', fontVariantNumeric: 'tabular-nums' }}>
              {text.length}자
            </span>
          </div>
          <textarea
            className="cs-textarea"
            rows={6}
            placeholder="https://... 또는 아무 텍스트나 입력하세요"
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
          />

          <div className="cs-divider" />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'oklch(var(--bc) / 0.65)' }}>가운데 로고 표시</label>
            <button
              onClick={() => setShowLogo(v => !v)}
              style={{
                width: 40, height: 22, borderRadius: 11,
                backgroundColor: showLogo ? 'var(--cs-accent)' : 'oklch(var(--bc) / 0.15)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background-color 0.15s',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, left: showLogo ? 21 : 3,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.15s',
              }} />
            </button>
          </div>
        </div>

        {/* QR Output */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <div className="cs-label" style={{ width: '100%' }}>QR 코드</div>
          <div style={{
            background: '#fff', padding: 20, borderRadius: 4,
            border: '1px solid oklch(var(--bc) / 0.08)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {text ? (
              <>
                <QRCode
                  value={text}
                  size={200}
                  level="H"
                  style={{ height: 'auto', maxWidth: '100%', width: 200 }}
                />
                {showLogo && (
                  <img
                    src="/favicon.png"
                    alt="logo"
                    style={{
                      position: 'absolute', width: 42, height: 42,
                      backgroundColor: '#fff', borderRadius: '50%',
                      padding: 4, border: '1px solid #eee',
                    }}
                  />
                )}
              </>
            ) : (
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(var(--bc) / 0.25)', fontSize: 13 }}>
                내용을 입력해주세요
              </div>
            )}
          </div>
          <p style={{ fontSize: 11.5, color: 'oklch(var(--bc) / 0.35)', textAlign: 'center' }}>
            우클릭 → 이미지 저장으로 다운로드
          </p>
        </div>

      </div>
    </div>
  );
}