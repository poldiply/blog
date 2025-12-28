import { useState } from 'react';

export default function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleFormat = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError("❌ 유효하지 않은 JSON 형식입니다.");
      setOutput('');
    }
  };

  const handleMinify = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError('');
    } catch (e) {
      setError("❌ 유효하지 않은 JSON 형식입니다.");
      setOutput('');
    }
  };

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    // 전체 높이 설정 (여백을 좀 더 넉넉하게 10rem으로 잡음)
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-4">
      
      {/* 헤더 */}
      <div className="border-b border-base-300 pb-2 flex-none">
        <h2 className="text-3xl font-bold text-base-content">JSON Formatter</h2>
        <p className="text-base-content/70 mt-1">못생긴 JSON을 예쁘게 정렬하거나 압축합니다.</p>
      </div>

      {/* 메인 카드 */}
      <div className="card bg-base-100 shadow-xl border border-base-200 w-full flex-1 overflow-hidden">
        <div className="card-body p-4 flex flex-col h-full">
          
          {/* 1. 입력 영역 (flex-1: 남는 공간의 절반 차지) */}
          {/* min-h-0: 이게 있어야 flex 자식이 넘치지 않고 스크롤이 생김 */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="label w-full flex justify-between items-center pt-0 pb-1">
              <span className="label-text font-bold text-lg">Input (입력)</span>
              {error ? (
                <span className="badge badge-error text-white animate-pulse">{error}</span>
              ) : (
                <span className="badge badge-ghost">JSON을 붙여넣으세요</span>
              )}
            </label>
            
            {/* textarea 자체도 flex-1로 부모 높이에 꽉 차게 함 */}
            <textarea 
              className={`textarea textarea-bordered border-2 w-full flex-1 font-mono text-sm leading-relaxed focus:outline-none resize-none ${error ? 'border-error focus:border-error' : 'border-gray-300 dark:border-gray-600 focus:border-primary'}`}
              placeholder='{"name": "천재친구", "age": 20}'
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
            ></textarea>
          </div>

          {/* 2. 버튼 그룹 (flex-none: 고정 높이) */}
          {/* py-2: 위아래 간격 확보 */}
          <div className="flex-none py-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={handleFormat} className="btn btn-primary w-full">
                ✨ 예쁘게 (Format)
              </button>
              <button onClick={handleMinify} className="btn btn-secondary w-full">
                📦 압축 (Minify)
              </button>
              <button onClick={handleClear} className="btn btn-outline btn-error w-full">
                🗑️ 지우기
              </button>
            </div>
          </div>

          {/* 3. 결과 영역 (flex-1: 나머지 절반 차지) */}
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
              className="textarea textarea-bordered border-2 border-gray-300 dark:border-gray-600 bg-base-200 w-full flex-1 font-mono text-sm leading-relaxed resize-none text-primary"
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