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
    // 👇 max-w-4xl 제거하고 w-full로 변경! (화면 꽉 차게)
    <div className="w-full space-y-6">
      
      {/* 헤더 */}
      <div className="border-b border-base-300 pb-4">
        <h2 className="text-3xl font-bold text-base-content">Base64 Converter</h2>
        <p className="text-base-content/70 mt-1">텍스트 ↔ Base64 변환 도구</p>
      </div>

      {/* 메인 카드 */}
      <div className="card bg-base-100 shadow-xl border border-base-200 w-full">
        <div className="card-body p-6">
          
          {/* 입력 영역 */}
          <div className="form-control w-full">
            <label className="label w-full flex justify-between items-center mb-1">
              <span className="label-text font-bold text-lg">Input (입력)</span>
              <span className="badge badge-ghost">{input.length}자</span>
            </label>
            
            {/* 👇 border-2 (두껍게) + border-gray-300 (확실한 색) 추가 */}
            <textarea 
              className="textarea textarea-bordered border-2 border-gray-300 dark:border-gray-600 w-full h-40 font-mono text-base leading-relaxed focus:border-primary focus:outline-none resize-y"
              placeholder="여기에 텍스트를 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            ></textarea>
          </div>

          {/* 버튼 그룹 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
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

          {/* 결과 영역 */}
          <div className="form-control w-full">
            <label className="label w-full flex justify-between items-center mb-1">
              <span className="label-text font-bold text-lg">Output (결과)</span>
              <button 
                onClick={handleCopy} 
                className={`btn btn-xs ${copySuccess ? 'btn-success text-white' : 'btn-neutral'}`}
                disabled={!output}
              >
                {copySuccess ? '✅ 복사완료' : '📋 결과 복사'}
              </button>
            </label>
            
            {/* 👇 여기도 border-2 + border-gray-300 추가 */}
            <textarea 
              className="textarea textarea-bordered border-2 border-gray-300 dark:border-gray-600 bg-base-200 w-full h-40 font-mono text-base leading-relaxed resize-y"
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