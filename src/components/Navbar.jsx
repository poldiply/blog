import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Navbar() {
  // 테마 상태 관리 (기본값: 로컬 스토리지에 저장된 값 없으면 'light')
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") ? localStorage.getItem("theme") : "light"
  );

  // 테마 변경 시 HTML 태그에 적용 & 저장
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 토글 핸들러
  const handleToggle = (e) => {
    if (e.target.checked) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  return (
    <div className="navbar bg-base-100 border-b border-base-300 sticky top-0 z-50 px-4">
      {/* 왼쪽: 햄버거 버튼 & 로고 */}
      <div className="flex-1">
        <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost lg:hidden mr-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </label>
        <Link to="/" className="btn btn-ghost text-xl font-bold text-primary">Dev.CS Tools 🛠️</Link>
      </div>

      {/* 오른쪽: 링크들 & 다크모드 토글 */}
      <div className="flex-none gap-2">
        
        {/* 1. 인스타그램 링크 */}
        <a 
          href="https://insta.dev-cs.cloud" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn btn-ghost btn-circle"
          title="Instagram"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>

        {/* 2. 이메일 링크 */}
        <a 
          href="mailto:cslee@dev-cs.cloud" 
          className="btn btn-ghost btn-circle"
          title="Contact Me"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </a>

        {/* 3. 다크모드 토글 (DaisyUI Swap 사용) */}
        <label className="swap swap-rotate btn btn-ghost btn-circle ml-1">
          {/* hidden checkbox controls the state */}
          <input 
            type="checkbox" 
            onChange={handleToggle} 
            checked={theme === "dark"} 
          />
          
          {/* sun icon (Light 모드일 때 보임) */}
          <svg className="swap-off fill-current w-6 h-6 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,5.64,7.05Zm13.02,9.9a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,18.66,16.95ZM21,12a1,1,0,0,0-1-1H19a1,1,0,0,0,0,2h1A1,1,0,0,0,21,12Zm-4.24-5.66a1,1,0,0,0,0-1.41l-.71-.71a1,1,0,0,0-1.41,0,1,1,0,0,0,0,1.41l.71.71A1,1,0,0,0,16.76,6.34ZM12,20a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V21A1,1,0,0,0,12,20Zm0-13A7,7,0,1,0,19,12,7,7,0,0,0,12,7Z"/></svg>
          
          {/* moon icon (Dark 모드일 때 보임) */}
          <svg className="swap-on fill-current w-6 h-6 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
          
        </label>
      </div>
    </div>
  );
}