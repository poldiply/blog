import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/ko';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('ko');

const TIMEZONES = [
  { city: 'Seoul (KST)', tz: 'Asia/Seoul' },
  { city: 'UTC', tz: 'UTC', isUtc: true },
  { city: 'New York (EST)', tz: 'America/New_York' },
  { city: 'London (GMT)', tz: 'Europe/London' },
  { city: 'Tokyo (JST)', tz: 'Asia/Tokyo' },
  { city: 'Los Angeles (PST)', tz: 'America/Los_Angeles' },
];

export default function DateTime() {
  const [now, setNow]             = useState(dayjs());
  const [input, setInput]         = useState(Math.floor(Date.now() / 1000).toString());
  const [parsed, setParsed]       = useState(dayjs());
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate]     = useState(dayjs().add(100, 'day').format('YYYY-MM-DD'));

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!input) return;
    let d;
    if (/^\d+$/.test(input)) {
      d = input.length <= 10 ? dayjs.unix(parseInt(input)) : dayjs(parseInt(input));
    } else { d = dayjs(input); }
    if (d.isValid()) setParsed(d);
  }, [input]);

  const diffDays  = dayjs(endDate).diff(dayjs(startDate), 'day');
  const diffHours = dayjs(endDate).diff(dayjs(startDate), 'hour');

  return (
    <div className="cs-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div>
        <h1 className="cs-page-title">날짜 / 시간</h1>
        <p className="cs-page-desc">타임스탬프 변환, 세계 시각, 기간 계산</p>
      </div>

      {/* Converter */}
      <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="cs-label">타임스탬프 / 날짜 변환</div>
        <input
          className="cs-input"
          style={{ fontFamily: 'JetBrains Mono, monospace', maxWidth: 380 }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="예: 1704067200 또는 2025-01-01"
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
          {[
            { label: 'Unix Timestamp (초)', value: parsed.unix() },
            { label: 'Unix Timestamp (ms)', value: parsed.valueOf() },
            { label: 'ISO 8601', value: parsed.toISOString() },
            { label: 'Local Time (한국)', value: parsed.format('YYYY-MM-DD HH:mm:ss') },
            { label: '상대 시간', value: parsed.fromNow() },
            { label: 'UTC', value: parsed.utc().format('YYYY-MM-DD HH:mm:ss') },
          ].map(item => (
            <ResultBox key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* World Clock */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="cs-label">세계 시각 (실시간)</div>
          {TIMEZONES.map(z => (
            <div key={z.tz} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0', borderBottom: '1px solid var(--cs-border)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'oklch(var(--bc) / 0.65)' }}>
                {z.city}
              </span>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600,
                color: z.isUtc ? 'var(--cs-accent)' : 'oklch(var(--bc))',
              }}>
                {z.isUtc ? now.utc().format('HH:mm:ss') : now.tz(z.tz).format('HH:mm:ss')}
              </span>
            </div>
          ))}
        </div>

        {/* D-Day Calculator */}
        <div className="cs-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="cs-label">기간 계산기 (D-Day)</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="date" className="cs-input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ flex: 1 }} />
            <span style={{ color: 'oklch(var(--bc) / 0.4)', fontWeight: 600, padding: '0 4px' }}>~</span>
            <input type="date" className="cs-input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ flex: 1 }} />
          </div>
          <div style={{
            border: '1px solid var(--cs-border)', borderRadius: 4, padding: '16px 20px',
            display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'oklch(var(--bc) / 0.35)' }}>
              일수 차이
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--cs-accent)', lineHeight: 1 }}>
              {Math.abs(diffDays).toLocaleString()}일
            </div>
            <div style={{ fontSize: 12.5, color: 'oklch(var(--bc) / 0.45)' }}>
              {diffDays >= 0 ? '이후' : '이전'} · 총 {Math.abs(diffHours).toLocaleString()} 시간
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultBox({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div
      onClick={copy}
      style={{
        border: '1px solid var(--cs-border)',
        borderRadius: 4, padding: '8px 10px', cursor: 'pointer',
        transition: 'border-color 0.12s, background-color 0.12s',
        backgroundColor: 'oklch(var(--b2))',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--cs-accent-border)';
        e.currentTarget.style.backgroundColor = 'var(--cs-accent-soft)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--cs-border)';
        e.currentTarget.style.backgroundColor = 'oklch(var(--b2))';
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'oklch(var(--bc) / 0.35)', marginBottom: 3 }}>
        {copied ? '복사됨' : label}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: copied ? 'var(--cs-accent)' : 'oklch(var(--bc))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  );
}