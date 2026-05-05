import { useRef, useEffect } from 'react';

const TYPE_CLASSES = {
  section: 'log-section',
  info:    'log-info',
  success: 'log-success',
  data:    'log-data',
  error:   'log-error',
};

const LABELS = {
  section: '——',
  info:    'INFO',
  success: 'OK  ',
  data:    'DATA',
  error:   'ERR ',
};

export default function LogTerminal({ logs, onClear }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="cs-terminal" style={{ height: '100%', minHeight: 240 }}>
      {/* Header */}
      <div className="cs-terminal-header">
        <div className="cs-terminal-dots">
          <div className="cs-terminal-dot" style={{ backgroundColor: '#ff5f57' }} />
          <div className="cs-terminal-dot" style={{ backgroundColor: '#febc2e' }} />
          <div className="cs-terminal-dot" style={{ backgroundColor: '#28c840' }} />
        </div>
        <span style={{ fontSize: 11, color: '#4a4a4a', letterSpacing: '0.02em' }}>Result Log</span>
        <button
          onClick={onClear}
          style={{
            fontSize: 11,
            color: '#4a4a4a',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 4px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#888'}
          onMouseLeave={e => e.currentTarget.style.color = '#4a4a4a'}
        >
          Clear
        </button>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="cs-terminal-body">
        {logs.length === 0 ? (
          <div style={{ color: '#2a2a2a', fontSize: 12, paddingTop: 4 }}>
            — Run an operation to see results.
          </div>
        ) : (
          logs.map((log, i) => {
            if (log.type === 'hex') {
              const hexValue = log.value ? log.value.toUpperCase() : '';
              const byteLen = hexValue ? Math.floor(hexValue.length / 2) : 0;
              const charsPerLine = 64; // 32 bytes
              const lines = [];
              if (hexValue) {
                for (let j = 0; j < hexValue.length; j += charsPerLine) {
                  lines.push(hexValue.slice(j, j + charsPerLine));
                }
              }
              
              const handleCopy = (e) => {
                navigator.clipboard.writeText(hexValue).catch(()=>{});
                const target = e.currentTarget;
                const oldColor = target.style.color;
                target.style.color = '#4ade80'; // flash green
                setTimeout(() => target.style.color = oldColor, 300);
              };

              return (
                <div key={i} className="cs-terminal-line log-data" style={{ flexDirection: 'column', alignItems: 'flex-start', marginTop: 8, marginBottom: 8 }}>
                  <span className="cs-terminal-value" style={{ marginBottom: 4, fontWeight: 600, color: '#93c5fd' }}>
                    {log.label} <span style={{ color: '#555', fontWeight: 400, marginLeft: 6 }}>[ {byteLen} bytes ]</span>
                  </span>
                  <div 
                    onClick={handleCopy}
                    title="클릭하여 복사 (Click to copy)"
                    style={{
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      color: '#aaa',
                      paddingLeft: 12,
                      wordBreak: 'break-all',
                      lineHeight: 1.5,
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                    }}>
                    {lines.join('\n')}
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className={`cs-terminal-line ${TYPE_CLASSES[log.type] || 'log-info'}`}>
                <span className="cs-terminal-label">{LABELS[log.type] || 'INFO'}</span>
                <span className="cs-terminal-value">
                  {log.label}
                  {log.value !== undefined && log.value !== '' && (
                    <>
                      {': '}
                      <span style={{ wordBreak: 'break-all' }}>{log.value}</span>
                    </>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
