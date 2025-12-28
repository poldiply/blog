import { Link } from 'react-router-dom';

export default function Home() {
  // 메뉴 데이터 (나중에 기능 추가되면 여기만 고치면 됨!)
  const toolSections = [
    {
      title: "📝 텍스트 & 데이터 도구",
      description: "개발할 때 가장 자주 쓰는 변환, 암호화, 포맷팅 도구 모음입니다.",
      items: [
        {
          name: "Base64 변환기",
          desc: "텍스트나 코드를 Base64 포맷으로 인코딩/디코딩합니다.",
          path: "/playground/base64",
          icon: "🔄",
          color: "text-blue-500 bg-blue-50 dark:bg-blue-900/20"
        },
        {
          name: "Hash 생성기",
          desc: "MD5, SHA-256 등 단방향 암호화 해시를 생성합니다.",
          path: "/playground/hash",
          icon: "🔒",
          color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
        },
        {
          name: "JSON 포맷터",
          desc: "복잡한 JSON 데이터를 예쁘게 정렬하거나 압축합니다.",
          path: "/playground/json",
          icon: "✨",
          color: "text-orange-500 bg-orange-50 dark:bg-orange-900/20"
        },        
        {
        name: "텍스트 비교 (Diff)",
        desc: "두 코드나 텍스트의 차이점을 GitHub 스타일로 비교합니다.",
        path: "/playground/diff",
        icon: "🔍",
        color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
        },
      ]
    },
    {
      title: "🛠️ 유틸리티 & 이미지",
      description: "QR코드 생성 등 시각적인 작업과 편의 기능을 제공합니다.",
      items: [        
        {
            name: "날짜/시간 도구",
            desc: "타임스탬프 변환, 세계 시간, D-Day 계산을 한곳에서.",
            path: "/playground/datetime",
            icon: "⏰",
            color: "text-pink-500 bg-pink-50 dark:bg-pink-900/20"
        },
        {
          name: "QR 코드 생성기",
          desc: "URL이나 텍스트를 입력해 커스텀 QR 코드를 생성합니다.",
          path: "/playground/qr",
          icon: "📱",
          color: "text-purple-500 bg-purple-50 dark:bg-purple-900/20"
        },
        {
          name: "이미지 도구 (준비중)",
          desc: "이미지 압축, 크롭, 변환 기능을 준비하고 있습니다.",
          path: "#",
          icon: "🖼️",
          color: "text-gray-400 bg-gray-100 dark:bg-gray-800",
          disabled: true
        },
      ]
    }
  ];

  return (
    <div className="min-h-full w-full p-4 md:p-8">
      
      {/* 1. 메인 히어로 섹션 */}
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-base-content tracking-tight">
          Dev.CS <span className="text-primary">Developer Tools</span> 🛠️
        </h1>
        <p className="text-lg text-base-content/70 max-w-2xl mx-auto leading-relaxed">
          개발 생산성을 높여주는 올인원 도구 모음입니다.<br className="hidden md:block"/>
          복잡한 설치 없이 브라우저에서 바로 사용하세요.
        </p>
      </div>

      {/* 2. 카테고리별 리스트 (반복문 렌더링) */}
      <div className="max-w-6xl mx-auto space-y-12">
        {toolSections.map((section, idx) => (
          <div key={idx} className="space-y-6">
            
            {/* 섹션 헤더 */}
            <div className="border-l-4 border-primary pl-4">
              <h2 className="text-2xl font-bold text-base-content">{section.title}</h2>
              <p className="text-base-content/60 mt-1">{section.description}</p>
            </div>

            {/* 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((item, itemIdx) => (
                <Link 
                  key={itemIdx} 
                  to={item.disabled ? "#" : item.path}
                  className={`card bg-base-100 shadow-md border border-base-200 transition-all duration-300 
                    ${item.disabled 
                      ? "opacity-60 cursor-not-allowed grayscale" 
                      : "hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 cursor-pointer"
                    }`}
                >
                  <div className="card-body">
                    <div className="flex items-start justify-between">
                      {/* 아이콘 박스 */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${item.color}`}>
                        {item.icon}
                      </div>
                      {/* 화살표 아이콘 (장식) */}
                      {!item.disabled && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                    
                    <h3 className="card-title mt-4 text-lg">{item.name}</h3>
                    <p className="text-base-content/70 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      
    </div>
  );
}