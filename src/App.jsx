import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// 기존 playground 페이지들
import Home from './pages/Home';
import Base64 from './pages/playground/Base64';
import PlayHash from './pages/playground/Hash';
import JsonFormatter from './pages/playground/JsonFormatter';
import QrGenerator from './pages/playground/QrGenerator';
import DateTime from './pages/playground/DateTime';
import TextDiff from './pages/playground/TextDiff';

// 암호 알고리즘 Playground
import CryptoHome       from './pages/crypto/CryptoHome';
import HashPlayground   from './pages/crypto/HashPlayground';
import BlockCipherPlayground from './pages/crypto/BlockCipherPlayground';
import PubkeyPlayground from './pages/crypto/PubkeyPlayground';
import SignaturePlayground from './pages/crypto/SignaturePlayground';
import MACPlayground       from './pages/crypto/MACPlayground';
import KDFPlayground       from './pages/crypto/KDFPlayground';
import PQCPlayground       from './pages/crypto/PQCPlayground';
import KPQCPlayground      from './pages/crypto/KPQCPlayground';
import KeyAgreementPlayground from './pages/crypto/KeyAgreementPlayground';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />

        {/* 기존 Developer Tools Playground */}
        <Route path="/playground/base64"   element={<Base64 />} />
        <Route path="/playground/hash"     element={<PlayHash />} />
        <Route path="/playground/json"     element={<JsonFormatter />} />
        <Route path="/playground/qr"       element={<QrGenerator />} />
        <Route path="/playground/datetime" element={<DateTime />} />
        <Route path="/playground/diff"     element={<TextDiff />} />

        {/* 암호 알고리즘 Playground */}
        <Route path="/crypto"              element={<CryptoHome />} />
        <Route path="/crypto/hash"         element={<HashPlayground />} />
        <Route path="/crypto/block"        element={<BlockCipherPlayground />} />
        <Route path="/crypto/pubkey"       element={<PubkeyPlayground />} />
        <Route path="/crypto/signature"    element={<SignaturePlayground />} />
        <Route path="/crypto/mac"          element={<MACPlayground />} />
        <Route path="/crypto/kdf"          element={<KDFPlayground />} />
        <Route path="/crypto/pqc"          element={<PQCPlayground />} />
        <Route path="/crypto/kpqc"         element={<KPQCPlayground />} />
        <Route path="/crypto/agreement"    element={<KeyAgreementPlayground />} />

        <Route path="*" element={<div className="text-center mt-20">🚧 공사 중입니다!</div>} />
      </Routes>
    </Layout>
  );
}

export default App;