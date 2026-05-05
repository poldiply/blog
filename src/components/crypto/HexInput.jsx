import { useState } from 'react';

export default function HexInput({ label, value, onChange, expectedBytes, rows = 2 }) {
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const v = e.target.value.replace(/\s+/g, '');
    onChange(v);
    if (v.length > 0) {
      if (!/^[0-9a-fA-F]*$/.test(v)) {
        setError('Hex only (0-9, a-f)');
      } else if (v.length % 2 !== 0) {
        setError('Odd hex length');
      } else if (expectedBytes && v.length !== expectedBytes * 2) {
        setError(`Expected ${expectedBytes} bytes (${expectedBytes * 2} hex chars), got ${v.length / 2}`);
      } else {
        setError('');
      }
    } else {
      setError('');
    }
  };

  const isValid = !error && value.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ fontSize: 12, fontWeight: 500, color: 'oklch(var(--bc) / 0.6)' }}>{label}</label>
        {value.length > 0 && (
          <span style={{ fontSize: 11, color: error ? 'oklch(var(--er))' : 'oklch(var(--su))' }}>
            {error || `${value.length / 2} bytes`}
          </span>
        )}
      </div>
      <textarea
        className="cs-textarea"
        style={{
          fontFamily: 'JetBrains Mono, Fira Code, monospace',
          fontSize: 11,
          letterSpacing: '0.05em',
          minHeight: rows * 22 + 16,
          borderColor: error ? 'oklch(var(--er) / 0.5)' : isValid ? 'oklch(var(--su) / 0.4)' : undefined,
        }}
        rows={rows}
        value={value}
        onChange={handleChange}
        placeholder="hex string..."
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
