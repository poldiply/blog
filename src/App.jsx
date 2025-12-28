import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// 페이지들 (일단 껍데기만 연결)
import Home from './pages/Home';
import Base64 from './pages/playground/Base64';
import Hash from './pages/playground/Hash'; // 파일명 Crypto로 통일해도 됨

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Playground 라우트들 */}
        <Route path="/playground/base64" element={<Base64 />} />
        <Route path="/playground/hash" element={<Hash />} />
        
        {/* 아직 안 만든 페이지는 임시로 Home 보여주거나 404 페이지 연결 */}
        <Route path="*" element={<div className="text-center mt-20">🚧 공사 중입니다!</div>} />
      </Routes>
    </Layout>
  );
}

export default App;