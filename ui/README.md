# 지혜로운 Pictures (Wise Pictures)

농업기술센터 실무자를 위한 현장 확인 사진 관리 웹 애플리케이션

## 기술 스택

- **React 18** + **Vite 5**
- **TailwindCSS 3**
- **Zustand** (상태 관리)
- **React Router** (라우팅)
- **react-easy-crop** (이미지 크롭)
- **html2canvas** + **jsPDF** (출력)
- **Supabase** (Backend)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 Supabase 정보를 입력하세요:

```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

### 4. 빌드

```bash
npm run build
```

## 프로젝트 구조

```
ui/
├── src/
│   ├── components/     # 공통 컴포넌트
│   │   ├── Header.jsx
│   │   ├── Footer.jsx
│   │   └── Layout.jsx
│   ├── pages/          # 페이지 컴포넌트
│   │   ├── Home.jsx
│   │   ├── Upload.jsx
│   │   ├── Edit.jsx
│   │   ├── Projects.jsx
│   │   └── Admin.jsx
│   ├── store/          # Zustand 스토어
│   │   └── useStore.js
│   ├── lib/            # 유틸리티
│   │   └── supabaseClient.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## 주요 기능

- 📸 사진 업로드 및 편집
- 🖼️ 템플릿 선택 (2컷, 4컷, 6컷, 커스텀)
- 📄 A4 문서 출력 (PDF/JPEG)
- 📋 사업 관리 및 리스트 조회
- 👤 관리자 페이지
