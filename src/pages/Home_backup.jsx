import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  // Giscus(방명록)를 React에서 쓰기 위한 설정
  const commentRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "poldiply/blog");
    script.setAttribute("data-repo-id", "R_kgDOQdL1zA");
    script.setAttribute("data-category", "General");
    script.setAttribute("data-category-id", "DIC_kwDOQdL1zM4CzDVQ");
    script.setAttribute("data-mapping", "url");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "transparent_dark");
    script.setAttribute("data-lang", "ko");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;
    
    if (commentRef.current) {
      commentRef.current.appendChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="glow"></div>
      
      <div className="card w-full max-w-lg bg-slate-800/70 backdrop-blur-md border border-white/10 shadow-2xl p-8 rounded-3xl text-center animate-[float_6s_ease-in-out_infinite]">
        <img 
          src="/seokbong.jpg" 
          alt="석봉" 
          className="w-32 h-32 rounded-full object-cover mx-auto mb-6 border-4 border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:scale-110 hover:rotate-6 transition-transform duration-300"
        />

        <h1 className="text-4xl font-bold mb-2">Changseok Lee</h1>
        <div className="typing-text">🐶🐶🐶🐶🐶🐶🐶 💙🖤</div>
        
        <p className="text-slate-400 mb-8 leading-relaxed">
          안녕하세요! React로 리모델링된<br/>
          제 포트폴리오에 오신 것을 환영합니다.
        </p>

        <div className="flex flex-col gap-3">
          <a href="https://insta.dev-cs.cloud" target="_blank" className="btn btn-outline border-white/10 hover:bg-sky-500/10 hover:border-sky-400 hover:text-sky-400 text-slate-200">
            📸 Instagram
          </a>
          
          <div className="divider divider-neutral my-2">Tools</div>

          <Link to="/base64" className="btn btn-outline border-sky-400 text-sky-400 hover:bg-sky-400 hover:text-slate-900">
            🔄 Base64 Converter
          </Link>
          
          <Link to="/hash" className="btn btn-outline border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-slate-900">
            🔒 Hash Generator
          </Link>
          
          <a href="mailto:cslee@dev-cs.cloud" className="btn btn-ghost text-slate-400 hover:text-white mt-2">
            📧 Contact Me
          </a>
        </div>

        <div className="mt-12 text-left">
          <h3 className="text-sky-400 font-bold mb-4">📝 방명록</h3>
          <div ref={commentRef}></div>
        </div>

        <div className="mt-8 text-xs text-slate-600">
          © 2025 Dev.CS
        </div>
      </div>
    </div>
  );
}