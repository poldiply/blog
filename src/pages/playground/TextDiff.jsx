import { useState, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function TextDiff() {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [splitView, setSplitView] = useState(true); // 좌우 분할 vs 통합 보기
  const [isDark, setIsDark] = useState(false); // 다크모드 감지용

  // 테마 감지 (DaisyUI 테마가 바뀌면 DiffViewer 테마도 바꾸기 위해)
  useEffect(() => {
    const checkTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setIsDark(currentTheme === 'dark');
    };

    // 처음 로드될 때 확인
    checkTheme();

    // 테마 변경 감지 (MutationObserver 사용)
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-4">
      
      {/* 헤더 */}
      <div className="border-b border-base-300 pb-2 flex-none flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-base-content">Text Diff Viewer 🔍</h2>
          <p className="text-base-content/70 mt-1">두 텍스트(코드)를 비교하여 변경된 부분을 시각적으로 보여줍니다.</p>
        </div>
        
        {/* 옵션 컨트롤 */}
        <div className="form-control">
          <label className="label cursor-pointer gap-2">
            <span className="label-text font-bold">좌우 분할 보기</span> 
            <input 
              type="checkbox" 
              className="toggle toggle-primary" 
              checked={splitView} 
              onChange={(e) => setSplitView(e.target.checked)} 
            />
          </label>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        
        {/* 1. 입력 영역 (위쪽: 원본 vs 수정본) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-1/3 min-h-[150px] flex-none">
          {/* 구버전 입력 */}
          <div className="flex flex-col">
            <label className="label pt-0"><span className="label-text font-bold text-error">Original (이전 버전)</span></label>
            <textarea 
              className="textarea textarea-bordered border-2 border-red-200 dark:border-red-900/50 w-full flex-1 font-mono text-xs leading-relaxed resize-none focus:border-error focus:outline-none"
              placeholder="여기에 원본 코드를 붙여넣으세요..."
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
            ></textarea>
          </div>

          {/* 신버전 입력 */}
          <div className="flex flex-col">
            <label className="label pt-0"><span className="label-text font-bold text-success">Modified (변경된 버전)</span></label>
            <textarea 
              className="textarea textarea-bordered border-2 border-green-200 dark:border-green-900/50 w-full flex-1 font-mono text-xs leading-relaxed resize-none focus:border-success focus:outline-none"
              placeholder="여기에 수정된 코드를 붙여넣으세요..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* 2. 결과 영역 (아래쪽: Diff Viewer) */}
        <div className="flex flex-col flex-1 min-h-0 border-2 border-base-300 rounded-xl overflow-hidden bg-base-100 shadow-inner">
          <div className="bg-base-200 px-4 py-2 text-xs font-bold text-base-content/50 border-b border-base-300">
            Diff Result
          </div>
          
          {/* DiffViewer 라이브러리 사용 */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <ReactDiffViewer 
              oldValue={oldText} 
              newValue={newText} 
              splitView={splitView}
              useDarkTheme={isDark} // 다크모드 연동
              styles={{
                variables: {
                  light: {
                    diffViewerBackground: '#ffffff',
                    diffViewerColor: '#212529',
                    addedBackground: '#e6ffec',
                    addedColor: '#24292e',
                    removedBackground: '#ffebe9',
                    removedColor: '#24292e',
                    wordAddedBackground: '#acf2bd',
                    wordRemovedBackground: '#fdb8c0',
                  },
                  dark: {
                    diffViewerBackground: '#1d232a', // DaisyUI dark bg
                    diffViewerColor: '#a6adbb',
                    addedBackground: '#052e16', // dark green
                    addedColor: '#a6adbb',
                    removedBackground: '#450a0a', // dark red
                    removedColor: '#a6adbb',
                    wordAddedBackground: '#15803d',
                    wordRemovedBackground: '#b91c1c',
                  }
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}