import { Link, useLocation } from 'react-router-dom';

const menus = [
  { name: '홈', path: '/' },
  { section: '개발자 도구' },
  { name: 'Base64', path: '/playground/base64' },
  { name: 'JSON 포맷터', path: '/playground/json' },
  { name: '텍스트 비교', path: '/playground/diff' },
  { name: '날짜/시간', path: '/playground/datetime' },
  { name: 'QR 코드', path: '/playground/qr' },
  { section: '암호 알고리즘' },
  { name: 'Overview', path: '/crypto' },
  { name: '해시 함수', path: '/crypto/hash' },
  { name: '블록 암호', path: '/crypto/block' },
  { name: '공개키 암호', path: '/crypto/pubkey' },
  { name: '키 설정', path: '/crypto/agreement' },
  { name: '전자서명', path: '/crypto/signature' },
  { name: '메시지 인증', path: '/crypto/mac' },
  { name: 'PQC', path: '/crypto/pqc' },
  { name: 'KPQC', path: '/crypto/kpqc' },
  { name: 'PQ/T 하이브리드', path: '/crypto/pq-hybrid' },
];

export default function Sidebar() {
  const location = useLocation();

  const closeSidebar = () => {
    const el = document.getElementById('sidebar-toggle');
    if (el) el.checked = false;
  };

  return (
    <aside className="cs-sidebar">
      <div className="cs-sidebar-logo">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" fill="currentColor" opacity="0.9"/>
          <rect x="9" y="1" width="6" height="6" fill="currentColor" opacity="0.45"/>
          <rect x="1" y="9" width="6" height="6" fill="currentColor" opacity="0.45"/>
          <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.9"/>
        </svg>
        <span>CS Lee</span>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 0 16px' }}>
        {menus.map((item, i) => {
          if (item.section) {
            return <div key={i} className="cs-nav-section">{item.section}</div>;
          }
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={i}
              to={item.path}
              onClick={item.disabled ? undefined : closeSidebar}
              className={`cs-nav-item${isActive ? ' active' : ''}${item.disabled ? ' disabled' : ''}`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--cs-border)', fontSize: '11px', color: 'oklch(var(--bc) / 0.28)' }}>
        dev-cs.cloud
      </div>
    </aside>
  );
}