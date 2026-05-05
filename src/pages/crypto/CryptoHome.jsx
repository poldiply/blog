import { Link } from 'react-router-dom';

const categories = [
  {
    name: '해시 함수',
    path: '/crypto/hash',
    spec: 'FIPS 180-4 / 202',
    algos: ['SHA-256', 'SHA-384', 'SHA-512', 'SHA3-256', 'SHA3-512', 'SHAKE-128/256'],
  },
  {
    name: '블록 암호',
    path: '/crypto/block',
    spec: 'FIPS 197 · KS X 1213',
    algos: ['AES-128/192/256', 'ARIA-128/192/256', 'SEED-128'],
  },
  {
    name: '공개키 암호',
    path: '/crypto/pubkey',
    spec: 'PKCS#1 / RFC 8017',
    algos: ['RSAES-OAEP 2048', 'RSAES-OAEP 3072'],
  },
  {
    name: '키 설정 (Key Agreement)',
    path: '/crypto/agreement',
    spec: 'SP 800-56A',
    algos: ['ECDH P-224/P-256', 'Binary/Koblitz Curves'],
  },
  {
    name: '전자서명',
    path: '/crypto/signature',
    spec: 'FIPS 186-5',
    algos: ['RSA-PSS 2048/3072', 'ECDSA P-224/P-256', 'Binary/Koblitz Curves'],
  },
  {
    name: '메시지 인증 (MAC)',
    path: '/crypto/mac',
    spec: 'RFC 2104 / FIPS 198',
    algos: ['HMAC-SHA2', 'HMAC-SHA3'],
  },
  {
    name: '키 유도 (KDF)',
    path: '/crypto/kdf',
    spec: 'RFC 2898 / FIPS 202',
    algos: ['PBKDF2-HMAC'],
  },
  {
    name: 'PQC (양자내성암호)',
    path: '/crypto/pqc',
    spec: 'FIPS 203 / 204 / 205',
    algos: ['ML-KEM 512/768/1024', 'ML-DSA 44/65/87', 'SLH-DSA'],
  },
  {
    name: 'KPQC (국산 양자내성암호)',
    path: '/crypto/kpqc',
    spec: 'K-PQC 공모전',
    algos: ['NTRU+', 'SMAUG-T', 'AIMer', 'HAETAE'],
    isNew: true,
  },
];

export default function CryptoHome() {
  return (
    <div className="cs-page" style={{ paddingTop: 40, paddingBottom: 48 }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'var(--cs-accent)',
          marginBottom: 10,
        }}>
          Cryptography
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', marginBottom: 8 }}>
          암호 알고리즘 플레이그라운드
        </h1>
        <p style={{ fontSize: 14, color: 'oklch(var(--bc) / 0.45)', lineHeight: 1.75, maxWidth: 540 }}>
          브라우저에서 암호 알고리즘을 테스트합니다. <strong>간편 모드</strong>는 키/입력을 자동 생성하고,
          <strong> CAVP 모드</strong>는 직접 Hex 값을 입력해 공식 테스트 벡터를 검증합니다.
        </p>
      </div>

      {/* Category list */}
      <div style={{
        border: '1px solid var(--cs-border)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {categories.map((cat, i) => (
          <Link
            key={cat.path}
            to={cat.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '15px 18px',
              borderBottom: i < categories.length - 1 ? '1px solid var(--cs-border)' : 'none',
              textDecoration: 'none',
              backgroundColor: 'oklch(var(--b1))',
              transition: 'background-color 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--cs-accent-soft)';
              e.currentTarget.querySelector('.cat-name').style.color = 'var(--cs-accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'oklch(var(--b1))';
              e.currentTarget.querySelector('.cat-name').style.color = 'oklch(var(--bc))';
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span className="cat-name" style={{ fontSize: 14, fontWeight: 600, color: 'oklch(var(--bc))', letterSpacing: '-0.01em', transition: 'color 0.1s' }}>
                  {cat.name}
                </span>
                {cat.isNew && (
                  <span className="cs-badge cs-badge-blue">NEW</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {cat.algos.map(a => (
                  <span key={a} className="cs-badge cs-badge-neutral" style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <span style={{ fontSize: 11.5, color: 'oklch(var(--bc) / 0.3)', fontFamily: 'JetBrains Mono, monospace' }}>
                {cat.spec}
              </span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.28 }}>
                <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
