import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  // 메뉴 리스트
  const menus = [
    { name: '🏠 홈', path: '/' },
    { category: '텍스트 도구' },
    { name: '🔄 Base64 변환기', path: '/playground/base64' },
    { name: '🔒 해시 생성기', path: '/playground/hash' },
    { name: '📝 JSON 포맷터', path: '/playground/json' },
    { name: '🔍 텍스트 비교', path: '/playground/diff' },
    { category: '유틸리티' },
    { name: '⏰ 날짜/시간 도구', path: '/playground/datetime' },
    { name: '📱 QR 코드 생성기', path: '/playground/qr' },
    { category: '이미지 도구 (예정)' },    
    { name: '🖼️ 이미지 압축/변환', path: '/playground/image' },
    { category: '보안 도구 (예정)' },
    { name: '🔑 JWT 디코더', path: '/playground/jwt' },
  ];

  // ✨ 핵심 기능: 사이드바 닫기 함수
  const closeSidebar = () => {
    // Layout.jsx에 있는 체크박스 ID('my-drawer-2')를 찾아서 체크 해제
    const drawerCheckbox = document.getElementById('my-drawer-2');
    if (drawerCheckbox) {
      drawerCheckbox.checked = false;
    }
  };

  return (
    <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
      <li className="mb-4 font-bold text-lg px-4">Menu</li>
      {menus.map((menu, index) => {
        if (menu.category) {
          return <li key={index} className="menu-title mt-4">{menu.category}</li>;
        }
        return (
          <li key={index}>
            <Link 
              to={menu.path} 
              className={location.pathname === menu.path ? "active" : ""}
              onClick={closeSidebar} // 👈 클릭할 때마다 닫기 함수 실행!
            >
              {menu.name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}