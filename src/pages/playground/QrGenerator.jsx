import { useState } from 'react';
import QRCode from "react-qr-code";

export default function QrGenerator() {
  const [text, setText] = useState('https://dev-cs.cloud');
  const [showLogo, setShowLogo] = useState(true); // 로고 표시 여부

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-4">
      
      {/* 헤더 */}
      <div className="border-b border-base-300 pb-2 flex-none">
        <h2 className="text-3xl font-bold text-base-content">QR Code Generator</h2>
        <p className="text-base-content/70 mt-1">텍스트나 URL을 입력하면 실시간으로 QR 코드를 생성합니다.</p>
      </div>

      {/* 메인 카드 */}
      <div className="card bg-base-100 shadow-xl border border-base-200 w-full flex-1 overflow-hidden">
        <div className="card-body p-4 flex flex-col h-full">
          
          {/* 1. 입력 영역 */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="label w-full flex justify-between items-center pt-0 pb-1">
              <span className="label-text font-bold text-lg">Input (내용 입력)</span>
              <span className="badge badge-ghost">{text.length}자</span>
            </label>
            
            <textarea 
              className="textarea textarea-bordered border-2 border-gray-300 dark:border-gray-600 w-full flex-1 font-mono text-base leading-relaxed focus:border-primary focus:outline-none resize-none"
              placeholder="https://... 또는 아무 텍스트나 입력하세요"
              value={text}
              onChange={(e) => setText(e.target.value)}
            ></textarea>
          </div>

          {/* 옵션 (로고 토글) */}
          <div className="form-control w-full my-2">
            <label className="cursor-pointer label justify-start gap-4">
              <span className="label-text font-bold">가운데 로고 넣기</span> 
              <input 
                type="checkbox" 
                className="toggle toggle-primary" 
                checked={showLogo} 
                onChange={(e) => setShowLogo(e.target.checked)} 
              />
            </label>
          </div>

          {/* 2. 결과 영역 */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="label w-full pt-0 pb-1">
              <span className="label-text font-bold text-lg">QR Code (결과)</span>
            </label>
            
            <div className="w-full flex-1 bg-base-200 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center p-4">
              {/* 흰색 배경 박스 */}
              <div className="bg-white p-4 rounded-xl shadow-lg relative">
                {text ? (
                  <div className="relative flex items-center justify-center">
                    <QRCode 
                      value={text} 
                      size={200} 
                      level="H" // 👈 중요! 에러 복원 레벨을 High로 설정 (가려져도 인식됨)
                      viewBox={`0 0 256 256`}
                      style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    />
                    
                    {/* 로고 이미지 (중앙 정렬) */}
                    {showLogo && (
                      <img 
                        src="/favicon.png" // public 폴더에 있는 파비콘 사용
                        alt="Logo"
                        className="absolute w-12 h-12 bg-white rounded-full p-1 border border-gray-200 shadow-sm"
                        // w-12 h-12: 로고 크기 조절 (너무 크면 인식 안 됨)
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm">내용을 입력해주세요</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}