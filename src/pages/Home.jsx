import { Link } from 'react-router-dom';

const devTools = [
  { name: 'Base64', desc: 'Encode / decode Base64', path: '/playground/base64' },
  { name: 'JSON 포맷터', desc: 'Format and validate JSON', path: '/playground/json' },
  { name: '텍스트 비교', desc: '두 텍스트 비교 (diff)', path: '/playground/diff' },
  { name: '날짜/시간', desc: '타임스탬프 변환, 세계 시각', path: '/playground/datetime' },
  { name: 'QR 코드', desc: 'QR 코드 생성', path: '/playground/qr' },
];

const cryptoTools = [
  { name: '해시 함수', desc: 'SHA-2 / SHA-3 / SHAKE', path: '/crypto/hash' },
  { name: '블록 암호', desc: 'AES · ARIA · SEED', path: '/crypto/block' },
  { name: '공개키 암호', desc: 'RSAES-OAEP', path: '/crypto/pubkey' },
  { name: '키 설정', desc: 'ECDH P-224/P-256', path: '/crypto/agreement' },
  { name: '전자서명', desc: 'RSA-PSS · ECDSA', path: '/crypto/signature' },
  { name: '메시지 인증', desc: 'HMAC-SHA2 · HMAC-SHA3', path: '/crypto/mac' },
  { name: 'PQC', desc: 'ML-KEM · ML-DSA · SLH-DSA (FIPS 203/204/205)', path: '/crypto/pqc' },
  { name: 'KPQC', desc: 'NTRU+ · SMAUG-T · AIMer · HAETAE', path: '/crypto/kpqc' },
];

export default function Home() {
  return (
    <div className="cs-page" style={{ paddingTop: 40, paddingBottom: 48 }}>

      {/* Hero */}
      <div style={{ marginBottom: 36 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--cs-accent)',
          marginBottom: 10,
        }}>
          Developer Playground
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 10, color: 'oklch(var(--bc))' }}>
          CS Lee
        </h1>
        <p style={{ fontSize: 14.5, color: 'oklch(var(--bc) / 0.48)', lineHeight: 1.75, maxWidth: 500 }}>
          개인 도구 모음과 암호 알고리즘 플레이그라운드입니다.
        </p>
      </div>

      {/* Crypto section */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <div className="cs-label">암호 알고리즘</div>
          <Link
            to="/crypto"
            style={{ fontSize: 12.5, color: 'var(--cs-accent)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Overview →
          </Link>
        </div>
        <div className="cs-tool-grid">
          {cryptoTools.map(item => (
            <Link key={item.path} to={item.path} className="cs-tool-cell">
              <div className="cs-tool-cell-name">{item.name}</div>
              <div className="cs-tool-cell-desc">{item.desc}</div>
            </Link>
          ))}
        </div>
        <div style={{ marginTop: 7, fontSize: 11.5, color: 'oklch(var(--bc) / 0.32)' }}>

        </div>
      </section>

      <div className="cs-divider" />

      {/* Dev tools */}
      <section style={{ marginBottom: 48 }}>
        <div className="cs-label" style={{ marginBottom: 10 }}>개발자 도구</div>
        <div className="cs-tool-grid">
          {devTools.map(item => (
            <Link key={item.path} to={item.path} className="cs-tool-cell">
              <div className="cs-tool-cell-name">{item.name}</div>
              <div className="cs-tool-cell-desc">{item.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer Info */}
      <div style={{
        marginTop: 16,
        padding: '16px 20px',
        backgroundColor: 'var(--cs-accent-soft)',
        borderRadius: 4,
        border: '1px solid oklch(var(--bc) / 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--cs-accent)" strokeWidth="1.5">
            <path d="M8 2v12M2 8h12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p style={{ fontSize: 13.5, color: 'oklch(var(--bc) / 0.7)', fontWeight: 500, margin: 0 }}>
            Built with <span style={{ color: 'var(--cs-accent)' }}>AI</span> & <span style={{ color: 'var(--cs-accent)' }}>Open Source</span>
          </p>
        </div>
        <p style={{ fontSize: 12, color: 'oklch(var(--bc) / 0.4)', marginTop: 8, lineHeight: 1.6, margin: '8px 0 0' }}>
          본 사이트는 인공지능 보조 도구와 다양한 오픈소스 암호화 라이브러리(liboqs, KpqClean 등)를 활용하여 제작되었습니다.
        </p>
      </div>

    </div>
  );
}