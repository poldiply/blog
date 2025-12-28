import { useState } from 'react';

export default function Base64() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleEncode = () => {
    try {
      if (!input) { setOutput(""); return; }
      const encoded = btoa(new TextEncoder().encode(input).reduce((data, byte) => data + String.fromCharCode(byte), ''));
      setOutput(encoded);
    } catch (e) { setOutput("에러: 인코딩 실패"); }
  };

  const handleDecode = () => {
    try {
      if (!input) { setOutput(""); return; }
      const decoded = new TextDecoder().decode(Uint8Array.from(atob(input), c => c.charCodeAt(0)));
      setOutput(decoded);
    } catch (e) { setOutput("에러: 올바른 Base64 형식이 아닙니다."); }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    // 1. 전체 높이 설정 (JSON Formatter와 동일하게 10rem 여백)
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-4">
      
      {/* 헤더 (flex-none: 고정 높이) */}
      <div className="border-b border-base-300 pb-2 flex-none">
        <h2 className="text-3xl font-bold text-base-content">Base64 Converter</h2>
        <p className="text-base-content/70 mt-1">텍스트 ↔ Base64 변환 도구</p>
      </div>

      {/* 메인 카드 (flex-1: 남는 공간 다 차지) */}
      <div className="card bg-base-100 shadow-xl border border-base-200 w-full flex-1 overflow-hidden">
        <div className="card-body p-4 flex flex-col h-full">
          
          {/* 2. 입력 영역 (flex-1: 카드 내부 공간의 절반 차지) */}
          {/* min-h-0: 스크롤 및 영역 침범 방지 필수 클래스 */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="label w-full flex justify-between items-center pt-0 pb-1">
              <span className="label-text font-bold text-lg">Input (입력)</span>
              <span className="badge badge-ghost">{input.length}자</span>
            </label>
            
            {/* textarea도 flex-1로 부모 높이에 꽉 차게 설정 */}
            <textarea 
              className="textarea textarea-bordered border-2 border-gray-300 dark:border-gray-600 w-full flex-1 font-mono text-base leading-relaxed focus:border-primary focus:outline-none resize-none"
              placeholder="여기에 텍스트를 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            ></textarea>
          </div>

          {/* 3. 버튼 그룹 (flex-none: 고정 높이, py-3으로 간격 확보) */}
          <div className="flex-none py-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={handleEncode} className="btn btn-primary w-full">
                ⬇️ Encode
              </button>
              <button onClick={handleDecode} className="btn btn-secondary w-full">
                ⬆️ Decode
              </button>
              <button 
                onClick={() => {setInput(''); setOutput('');}} 
                className="btn btn-outline btn-error w-full"
              >
                🗑️ Clear
              </button>
            </div>
          </div>

          {/* 4. 결과 영역 (flex-1: 나머지 절반 차지) */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="label w-full flex justify-between items-center pt-0 pb-1">
              <span className="label-text font-bold text-lg">Output (결과)</span>
              <button 
                onClick={handleCopy} 
                className={`btn btn-xs ${copySuccess ? 'btn-success text-white' : 'btn-neutral'}`}
                disabled={!output}
              >
                {copySuccess ? '✅ 복사완료' : '📋 결과 복사'}
              </button>
            </label>
            
            <textarea 
              className="textarea textarea-bordered border-2 border-gray-300 dark:border-gray-600 bg-base-200 w-full flex-1 font-mono text-base leading-relaxed resize-none"
              readOnly 
              placeholder="결과가 여기에 나타납니다."
              value={output}
            ></textarea>
          </div>

        </div>
      </div>
    </div>
  );
}