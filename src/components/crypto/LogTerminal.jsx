import { useRef, useEffect } from 'react';

const LABELS = {
  section: '——',
  info:    'INFO',
  success: 'OK  ',
  data:    'DATA',
  error:   'ERR ',
};

export default function LogTerminal({ logs, onClear }) {
  const statusBodyRef = useRef(null);
  const dataBodyRef = useRef(null);

  // Filter logs for the Status Console (Text/Status only)
  const statusLogs = logs.filter(log => log.type !== 'hex' && log.type !== 'result');

  // Filter logs for the Data Terminal (Hex data and Verification results from the most recent operation)
  const lastSectionIdx = logs.map(l => l.type).lastIndexOf('section');
  const targetLogsForHex = lastSectionIdx !== -1 ? logs.slice(lastSectionIdx) : logs;
  const latestDataLogs = targetLogsForHex.filter(log => log.type === 'hex' || log.type === 'result');

  useEffect(() => {
    if (statusBodyRef.current) {
      statusBodyRef.current.scrollTop = statusBodyRef.current.scrollHeight;
    }
  }, [statusLogs]);

  useEffect(() => {
    if (dataBodyRef.current) {
      dataBodyRef.current.scrollTop = dataBodyRef.current.scrollHeight;
    }
  }, [latestDataLogs]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 480 }}>
      {/* 1. Status Console (Top Panel) */}
      <div className="cs-status-console">
        {/* Status Console Header */}
        <div className="cs-status-header">
          <span style={{ letterSpacing: '0.01em' }}>
            상태 로그 (Status History)
          </span>
          <button
            onClick={onClear}
            style={{
              fontSize: '11px',
              color: 'inherit',
              opacity: 0.6,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 4px',
              fontWeight: 500,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
          >
            Clear Log
          </button>
        </div>
        {/* Status Console Body */}
        <div ref={statusBodyRef} className="cs-status-body">
          {statusLogs.length === 0 ? (
            <div style={{ opacity: 0.4, fontSize: '11px' }}>
              — 실행 내역이 없습니다. (No execution logs)
            </div>
          ) : (
            statusLogs.map((log, i) => {
              const label = LABELS[log.type] || 'INFO';
              const labelClass = log.type === 'success' ? 'cs-label-ok' : log.type === 'error' ? 'cs-label-err' : 'cs-label-info';
              const valClass = log.type === 'success' ? 'cs-val-ok' : log.type === 'error' ? 'cs-val-err' : 'cs-val-info';
              
              return (
                <div key={i} className="cs-status-line">
                  <span className={labelClass} style={{ width: '45px', textAlign: 'right', fontSize: '10.5px' }}>
                    {label}
                  </span>
                  <span className={valClass}>
                    {log.label}
                    {log.value !== undefined && log.value !== '' && (
                      <>
                        {': '}
                        <span style={{ fontWeight: 500 }}>{log.value}</span>
                      </>
                    )}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Data Output Terminal (Bottom Panel) */}
      <div className="cs-data-console">
        {/* Hex Terminal Header */}
        <div className="cs-data-header">
          <span style={{ letterSpacing: '0.01em' }}>
            결과 데이터 (Output Data)
          </span>
          <span style={{ fontSize: '10px', opacity: 0.5 }}>HEX DUMP & RESULT</span>
        </div>
        {/* Hex Terminal Body */}
        <div ref={dataBodyRef} className="cs-data-body">
          {latestDataLogs.length === 0 ? (
            <div style={{ opacity: 0.4, fontSize: '12px' }}>
              — 결과 데이터가 여기에 표시됩니다. (Output values will be displayed here)
            </div>
          ) : (
            latestDataLogs.map((log, i) => {
              if (log.type === 'result') {
                const isSuccess = ['VALID', 'MATCHED', 'DECAP_SUCCESS', 'SUCCESS'].includes(log.value);
                const cardClass = isSuccess ? 'cs-result-card success' : 'cs-result-card failure';
                
                let displayMessage = '';
                if (log.value === 'VALID') {
                  displayMessage = '✓ 서명 검증 성공 (Signature Verification: VALID)';
                } else if (log.value === 'INVALID') {
                  displayMessage = '✗ 서명 검증 실패 (Signature Verification: INVALID)';
                } else if (log.value === 'MATCHED') {
                  displayMessage = '✓ Shared Secret 일치 (Shared Secrets Match)';
                } else if (log.value === 'MISMATCHED') {
                  displayMessage = '✗ Shared Secret 불일치 (Shared Secrets Mismatch)';
                } else if (log.value === 'DECAP_SUCCESS') {
                  displayMessage = '✓ 디캡슐화 성공 (Decapsulation Complete)';
                } else {
                  displayMessage = `${log.label}: ${log.value}`;
                }

                return (
                  <div key={i} className={cardClass}>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>
                      {displayMessage}
                    </div>
                  </div>
                );
              }

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
                const oldText = target.innerText;
                target.innerText = 'Copied!';
                target.style.color = '#10b981';
                setTimeout(() => {
                  target.innerText = oldText;
                  target.style.color = '';
                }, 1000);
              };

              return (
                <div key={i} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: 'oklch(var(--b2))',
                  border: '1px solid oklch(var(--bc) / 0.08)',
                  borderRadius: '5px',
                  overflow: 'hidden'
                }}>
                  {/* Hex Item Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    backgroundColor: 'oklch(var(--b3))',
                    borderBottom: '1px solid oklch(var(--bc) / 0.08)'
                  }} className="flex items-center justify-between">
                    <span style={{ fontWeight: 600, color: 'oklch(var(--p))', fontSize: '11.5px', fontFamily: 'monospace' }}>
                      {log.label} <span style={{ color: 'oklch(var(--bc) / 0.4)', fontWeight: 400, marginLeft: '6px', fontSize: '10.5px' }}>[ {byteLen} bytes ]</span>
                    </span>
                    <button
                      onClick={handleCopy}
                      style={{
                        fontSize: '11px',
                        color: 'oklch(var(--p))',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        fontWeight: 600,
                        transition: 'opacity 0.2s',
                        opacity: 0.8
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                      onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
                    >
                      Copy
                    </button>
                  </div>
                  {/* Hex Item Body (Compact Scroll) */}
                  <div
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      whiteSpace: 'pre-wrap',
                      color: 'oklch(var(--bc) / 0.8)',
                      padding: '10px 12px',
                      wordBreak: 'break-all',
                      lineHeight: '1.6',
                      maxHeight: '100px',
                      overflowY: 'auto',
                      backgroundColor: 'oklch(var(--b1))'
                    }}
                  >
                    {lines.join('\n')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


