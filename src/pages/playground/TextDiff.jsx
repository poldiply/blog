import { useState, useEffect } from 'react';
import ReactDiffViewer from 'react-diff-viewer-continued';

export default function TextDiff() {
  const [oldText, setOldText]   = useState('');
  const [newText, setNewText]   = useState('');
  const [splitView, setSplitView] = useState(true);
  const [isDark, setIsDark]     = useState(false);

  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="cs-page-title">텍스트 비교</h1>
          <p className="cs-page-desc">두 텍스트(코드)를 비교하여 변경된 부분을 시각적으로 표시합니다</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'oklch(var(--bc) / 0.55)', fontWeight: 500 }}>좌우 분할 보기</span>
          <button
            onClick={() => setSplitView(v => !v)}
            style={{
              width: 40, height: 22, borderRadius: 11,
              backgroundColor: splitView ? 'var(--cs-accent)' : 'oklch(var(--bc) / 0.15)',
              border: 'none', cursor: 'pointer', position: 'relative',
              transition: 'background-color 0.15s',
            }}
          >
            <span style={{
              position: 'absolute', top: 3, left: splitView ? 21 : 3,
              width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff',
              transition: 'left 0.15s',
            }} />
          </button>
        </div>
      </div>

      {/* Input row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cs-label" style={{ color: 'oklch(var(--er) / 0.75)' }}>이전 버전 (Original)</div>
          <textarea
            className="cs-textarea"
            rows={8}
            placeholder="원본 코드를 붙여넣으세요"
            value={oldText}
            onChange={e => setOldText(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, borderColor: oldText ? 'oklch(var(--er) / 0.3)' : undefined }}
          />
        </div>
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="cs-label" style={{ color: 'oklch(var(--su) / 0.75)' }}>수정된 버전 (Modified)</div>
          <textarea
            className="cs-textarea"
            rows={8}
            placeholder="수정된 코드를 붙여넣으세요"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, borderColor: newText ? 'oklch(var(--su) / 0.3)' : undefined }}
          />
        </div>
      </div>

      {/* Diff result */}
      <div className="cs-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid var(--cs-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span className="cs-label" style={{ marginBottom: 0 }}>Diff 결과</span>
        </div>
        <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
          <ReactDiffViewer
            oldValue={oldText}
            newValue={newText}
            splitView={splitView}
            useDarkTheme={isDark}
            styles={{
              variables: {
                light: {
                  diffViewerBackground: '#ffffff',
                  diffViewerColor: '#24292e',
                  addedBackground: '#e6ffec',
                  addedColor: '#24292e',
                  removedBackground: '#ffebe9',
                  removedColor: '#24292e',
                  wordAddedBackground: '#acf2bd',
                  wordRemovedBackground: '#fdb8c0',
                  gutterBackground: '#f6f8fa',
                },
                dark: {
                  diffViewerBackground: '#111111',
                  diffViewerColor: '#d1d1d1',
                  addedBackground: '#052e16',
                  addedColor: '#d1d1d1',
                  removedBackground: '#450a0a',
                  removedColor: '#d1d1d1',
                  wordAddedBackground: '#15803d',
                  wordRemovedBackground: '#b91c1c',
                  gutterBackground: '#1a1a1a',
                },
              },
            }}
          />
        </div>
      </div>

    </div>
  );
}