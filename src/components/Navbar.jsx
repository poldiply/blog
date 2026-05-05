import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem('theme') || 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <header className="cs-navbar">
      {/* Left: hamburger (mobile) + logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <label
          htmlFor="sidebar-toggle"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            cursor: 'pointer',
            borderRadius: 4,
            color: 'oklch(var(--bc) / 0.5)',
          }}
          className="lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round"/>
          </svg>
        </label>
        <Link
          to="/"
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'oklch(var(--bc))',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="6" height="6" fill="currentColor" opacity="0.9"/>
            <rect x="9" y="1" width="6" height="6" fill="currentColor" opacity="0.5"/>
            <rect x="1" y="9" width="6" height="6" fill="currentColor" opacity="0.5"/>
            <rect x="9" y="9" width="6" height="6" fill="currentColor" opacity="0.9"/>
          </svg>
          CS Lee
        </Link>
      </div>

      {/* Right: links + theme toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <a
          href="https://insta.dev-cs.cloud"
          target="_blank"
          rel="noopener noreferrer"
          className="cs-btn-ghost"
          style={{ width: 32, height: 32, padding: 0 }}
          title="Instagram"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
          </svg>
        </a>

        <a
          href="mailto:cslee@dev-cs.cloud"
          className="cs-btn-ghost"
          style={{ width: 32, height: 32, padding: 0 }}
          title="Email"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </a>

        <button
          onClick={toggleTheme}
          className="cs-btn-ghost"
          style={{ width: 32, height: 32, padding: 0 }}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}