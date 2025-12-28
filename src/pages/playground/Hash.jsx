import { useState } from 'react';
import CryptoJS from 'crypto-js';

export default function Hash() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState('');

  const handleCopy = (text, type) => {
    if (!text || text === '-') return;
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const getHash = (algo) => {
    if (!input) return '';
    if (algo === 'MD5') return CryptoJS.MD5(input).toString();
    if (algo === 'SHA1') return CryptoJS.SHA1(input).toString();
    if (algo === 'SHA256') return CryptoJS.SHA256(input).toString();
    return '';
  };

  return (
    <div className="w-full space-y-6">
      
      {/* 헤더 */}
      <div className="border-b border-base-300 pb-4">
        <h2 className="text-3xl font-bold text-base-content">Hash Generator</h2>
        <p className="text-base-content/70 mt-1">단방향 암호화 (MD5, SHA-1, SHA-256) 생성기</p>
      </div>

      {/* 메인 카드 */}
      <div className="card bg-base-100 shadow-xl border border-base-200 w-full">
        <div className="card-body p-6">
          
          {/* 입력 영역 (여기는 강조를 위해 두꺼운 테두리 유지) */}
          <div className="form-control w-full mb-8">
            <label className="label w-full flex justify-between items-center mb-1">
              <span className="label-text font-bold text-lg">Input (입력)</span>
              <span className="badge badge-ghost">{input.length}자</span>
            </label>
            <input 
              type="text" 
              className="input input-bordered border-2 border-gray-300 dark:border-gray-600 w-full font-mono text-lg focus:border-primary focus:outline-none"
              placeholder="암호화할 텍스트를 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* 결과 영역 */}
          <div className="space-y-5">
            <HashResult 
              label="MD5" 
              value={getHash('MD5')} 
              onCopy={() => handleCopy(getHash('MD5'), 'MD5')}
              isCopied={copied === 'MD5'}
            />
            <HashResult 
              label="SHA-1" 
              value={getHash('SHA1')} 
              onCopy={() => handleCopy(getHash('SHA1'), 'SHA1')}
              isCopied={copied === 'SHA1'}
            />
            <HashResult 
              label="SHA-256 (추천)" 
              value={getHash('SHA256')} 
              onCopy={() => handleCopy(getHash('SHA256'), 'SHA256')}
              isCopied={copied === 'SHA256'}
              isPrimary={true}
            />
          </div>

        </div>
      </div>
    </div>
  );
}

// ✨ 여기가 핵심 변경 포인트!
function HashResult({ label, value, onCopy, isCopied, isPrimary }) {
  return (
    <div className="form-control w-full">
      <label className="label py-1">
        <span className={`label-text font-bold ${isPrimary ? 'text-primary' : ''}`}>{label}</span>
      </label>
      
      {/* relative: 버튼을 안에 가두기 위해 필요 */}
      <div className="relative">
        <input 
          type="text" 
          className={`input input-bordered w-full font-mono text-sm bg-base-200 text-base-content/80 pr-24 focus:outline-none ${isPrimary ? 'border-primary/50' : ''}`}
          value={value || '-'} 
          readOnly 
        />
        
        {/* absolute: 입력창 안쪽 오른쪽 끝에 배치 */}
        <button 
          onClick={onCopy} 
          className={`absolute right-1 top-1/2 -translate-y-1/2 btn btn-sm h-8 min-h-0 ${isCopied ? 'btn-success text-white' : 'btn-ghost bg-base-300 hover:bg-base-400 border-none'}`}
          disabled={!value || value === '-'}
        >
          {isCopied ? '✅ 복사됨' : '📋 복사'}
        </button>
      </div>
    </div>
  );
}