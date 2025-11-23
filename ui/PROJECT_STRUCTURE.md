# 프로젝트 폴더 구조

```
ui/
├── .eslintrc.cjs          # ESLint 설정
├── .gitignore             # Git 제외 파일 목록
├── index.html             # HTML 진입점
├── package.json           # 의존성 및 스크립트
├── postcss.config.js      # PostCSS 설정 (TailwindCSS)
├── vite.config.js         # Vite 설정
├── tailwind.config.js     # TailwindCSS 설정
├── README.md              # 프로젝트 문서
│
└── src/
    ├── main.jsx           # React 진입점
    ├── App.jsx            # 메인 App 컴포넌트 (라우팅)
    ├── index.css          # 전역 스타일 (TailwindCSS 포함)
    │
    ├── components/        # 공통 컴포넌트
    │   ├── Header.jsx     # 헤더 컴포넌트
    │   ├── Footer.jsx     # 푸터 컴포넌트
    │   └── Layout.jsx     # 레이아웃 컴포넌트
    │
    ├── pages/             # 페이지 컴포넌트
    │   ├── Home.jsx       # 홈 페이지 (/)
    │   ├── Upload.jsx     # 템플릿 선택 페이지 (/upload)
    │   ├── Edit.jsx       # A4 편집 화면 (/edit/:id)
    │   ├── Projects.jsx   # 사업 리스트 (/projects)
    │   └── Admin.jsx      # 관리자 페이지 (/admin)
    │
    ├── store/             # Zustand 상태 관리
    │   └── useStore.js    # 전역 스토어
    │
    └── lib/               # 유틸리티 및 외부 라이브러리
        └── supabaseClient.js  # Supabase 클라이언트
```
