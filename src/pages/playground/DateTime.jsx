import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import 'dayjs/locale/ko'; // 한국어 설정

// 플러그인 장착
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('ko');

export default function DateTime() {
  // 1. 현재 시간 (실시간 시계용)
  const [now, setNow] = useState(dayjs());
  
  // 2. 변환기 상태
  const [input, setInput] = useState(Math.floor(Date.now() / 1000).toString()); // 기본값: 현재 타임스탬프
  const [parsedDate, setParsedDate] = useState(dayjs());

  // 3. 기간 계산기 상태
  const [startDate, setStartDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(100, 'day').format('YYYY-MM-DD'));

  // 실시간 시계 타이머
  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 입력값이 바뀔 때마다 날짜 파싱 시도
  useEffect(() => {
    if (!input) return;
    
    let date;
    // 숫자만 있으면 타임스탬프로 간주
    if (/^\d+$/.test(input)) {
      const num = parseInt(input);
      // 10자리(초) vs 13자리(밀리초) 자동 감지
      if (input.length <= 10) date = dayjs.unix(num);
      else date = dayjs(num);
    } else {
      // 그 외엔 문자열 파싱
      date = dayjs(input);
    }

    if (date.isValid()) {
      setParsedDate(date);
    }
  }, [input]);

  // 기간 계산 결과
  const diffDays = dayjs(endDate).diff(dayjs(startDate), 'day');
  const diffHours = dayjs(endDate).diff(dayjs(startDate), 'hour');

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full gap-4">
      
      {/* 헤더 */}
      <div className="border-b border-base-300 pb-2 flex-none">
        <h2 className="text-3xl font-bold text-base-content">Date & Time Tools ⏰</h2>
        <p className="text-base-content/70 mt-1">타임스탬프 변환, 세계 시간, 기간 계산을 한곳에서 처리하세요.</p>
      </div>

      {/* 메인 컨텐츠 (스크롤 가능) */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
        
        {/* 섹션 1: 스마트 변환기 */}
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-4">
            <h3 className="card-title text-lg mb-2">🔄 스마트 변환기</h3>
            
            <div className="form-control w-full">
              <label className="label pt-0"><span className="label-text">Input (타임스탬프 or 날짜 문자열)</span></label>
              <input 
                type="text" 
                className="input input-bordered border-2 border-gray-300 dark:border-gray-600 font-mono focus:border-primary"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: 1704067200 또는 2025-01-01"
              />
            </div>

            {/* 변환 결과 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ResultBox label="Unix Timestamp (초)" value={parsedDate.unix()} />
              <ResultBox label="Unix Timestamp (밀리초)" value={parsedDate.valueOf()} />
              <ResultBox label="ISO 8601 (서버용)" value={parsedDate.toISOString()} color="text-primary" />
              <ResultBox label="Local Time (한국)" value={parsedDate.format('YYYY-MM-DD HH:mm:ss')} />
              <ResultBox label="Relative (상대 시간)" value={parsedDate.fromNow()} />
              <ResultBox label="UTC (협정 세계시)" value={parsedDate.utc().format('YYYY-MM-DD HH:mm:ss')} />
            </div>
          </div>
        </div>

        {/* 하단: 2단 분리 (세계 시계 + 기간 계산기) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          
          {/* 섹션 2: 세계 시계 */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body p-4">
              <h3 className="card-title text-lg mb-4">🌍 World Clock (실시간)</h3>
              <div className="space-y-3">
                <ClockRow city="🇰🇷 Seoul" time={now} tz="Asia/Seoul" />
                <ClockRow city="🇬🇧 UTC" time={now} tz="UTC" isUtc />
                <ClockRow city="🇺🇸 New York" time={now} tz="America/New_York" />
                <ClockRow city="🇬🇧 London" time={now} tz="Europe/London" />
              </div>
            </div>
          </div>

          {/* 섹션 3: 기간 계산기 */}
          <div className="card bg-base-100 shadow-md border border-base-200">
            <div className="card-body p-4">
              <h3 className="card-title text-lg mb-4">📅 기간 계산기 (D-Day)</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-2 items-center">
                  <input type="date" className="input input-bordered w-full" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
                  <span className="font-bold">~</span>
                  <input type="date" className="input input-bordered w-full" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
                </div>

                <div className="stats shadow bg-base-200 w-full">
                  <div className="stat place-items-center">
                    <div className="stat-title">일수 차이</div>
                    <div className="stat-value text-primary">{diffDays}일</div>
                    <div className="stat-desc">총 {diffHours.toLocaleString()} 시간</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// 작은 컴포넌트들 (코드 깔끔하게!)
function ResultBox({ label, value, color }) {
  const copy = () => {
    navigator.clipboard.writeText(value.toString());
    alert('복사되었습니다!');
  };
  return (
    <div className="form-control cursor-pointer group" onClick={copy}>
      <label className="label py-0"><span className="label-text text-xs text-base-content/60">{label}</span></label>
      <div className={`input input-sm input-bordered flex items-center font-mono bg-base-200 group-hover:border-primary ${color || ''}`}>
        {value}
      </div>
    </div>
  );
}

function ClockRow({ city, time, tz, isUtc }) {
  return (
    <div className="flex justify-between items-center border-b border-base-200 pb-2 last:border-0">
      <span className="font-bold">{city}</span>
      <span className={`font-mono ${isUtc ? 'text-primary font-bold' : ''}`}>
        {isUtc ? time.utc().format('HH:mm:ss') : time.tz(tz).format('HH:mm:ss')}
        <span className="text-xs text-base-content/50 ml-2">
          {isUtc ? '' : time.tz(tz).format('A')}
        </span>
      </span>
    </div>
  );
}