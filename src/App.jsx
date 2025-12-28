import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// 페이지들 (일단 껍데기만 연결)
import Home from './pages/Home';
import Base64 from './pages/playground/Base64';
import Hash from './pages/playground/Hash';
import JsonFormatter from './pages/playground/JsonFormatter';
import QrGenerator from './pages/playground/QrGenerator';
import DateTime from './pages/playground/DateTime';
import TextDiff from './pages/playground/TextDiff';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Playground 라우트들 */}
        <Route path="/playground/base64" element={<Base64 />} />
        <Route path="/playground/hash" element={<Hash />} />
        <Route path="/playground/json" element={<JsonFormatter />} />
        <Route path="/playground/qr" element={<QrGenerator />} />
        <Route path="/playground/datetime" element={<DateTime />} />
        <Route path="/playground/diff" element={<TextDiff />} />
        
        {/* 아직 안 만든 페이지는 임시로 Home 보여주거나 404 페이지 연결 */}
        <Route path="*" element={<div className="text-center mt-20">🚧 공사 중입니다!</div>} />
      </Routes>
    </Layout>
  );
}

export default App;