import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero min-h-[60vh]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold">Dev.CS Developer Tools 🛠️</h1>
          <p className="py-6 text-lg text-base-content/70">
            개발하면서 필요했던 모든 도구들을 한곳에 모았습니다.<br/>
            이미지 처리, 암호화, 포맷팅까지 브라우저에서 안전하게 처리하세요.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
            <Link to="/playground/base64" className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
              <div className="card-body">
                <h2 className="card-title">🔄 Base64 변환기</h2>
                <p>텍스트나 이미지를 Base64로 인코딩/디코딩합니다.</p>
              </div>
            </Link>
            
            <Link to="/playground/hash" className="card bg-base-200 hover:bg-base-300 transition-colors cursor-pointer">
              <div className="card-body">
                <h2 className="card-title">🔒 해시 생성기</h2>
                <p>MD5, SHA-256 등 단방향 암호화를 테스트합니다.</p>
              </div>
            </Link>

            <div className="card bg-base-200 opacity-50">
              <div className="card-body">
                <h2 className="card-title">🖼️ 이미지 도구 (준비중)</h2>
                <p>압축, 크롭, 변환 기능을 준비하고 있습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}