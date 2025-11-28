📘 PRD v4.0 — 지혜로운 Pictures (Final & Rebuild Version)

1. 프로젝트 개요
프로젝트명

지혜로운 Pictures (JH Pics)

프로젝트 목적

농업기술센터 보조사업 담당자가 현장사진 문서를 가장 빠르고 정확하게 만들도록 하는 웹 기반 시스템.

사진 업로드 →

템플릿 자동 배치 →

메타데이터 입력 →

A4 출력(PDF/JPEG) →

재확인 및 관리 가능

목표 사용자

농업기술센터 공무원

보조사업 현장확인서 작성자

PC 중심 / 모바일 대응 가능

서비스 성격

반복 문서 업무 자동화

행정/민원 제출용 문서 표준화

AI 없이도 즉시 활용 가능

실무 중심 설계 (속도·명확성 최우선)

2. 전체 시스템 구조 (최신 아키텍처)
Frontend

React + Vite

TailwindCSS

Zustand 상태관리

React Router

Print CSS 기반 출력 (html2canvas 제거)

/print-view 통해 새창에서 window.print() 실행

Backend

Supabase

Auth (email 기반)

Database (project_records)

Storage (image uploads)

Deployment

Vercel (Frontend)

Supabase Hosted Backend

3. 디자인 & UI 가이드
전체 톤

깔끔함 + 명확함

어두운 배경 + 발광 블루 포인트

문서(A4) 영역은 밝은 흰색

군더더기 없는 행정문서 스타일

컬러

Primary: Neon Blue (#6B8DD6 ~ #8FA8D9 계열)

Accent Mint (#B4C5E8)

Very Dark Background (#0D1117 계열)

A4 영역은 pure white #FFFFFF

폰트

SUIT 또는 Inter

Title = Bold

Body = Regular

숫자 강조 가능

공통 구조

모든 화면 상단: 고정 헤더

로고(JH Pics)

메뉴(Home, 사진올리기, 사업리스트, 사업관리, 관리자)

로그인 사용자 표시

Admin Badge + Logout

4. 핵심 기능 (Features)
4.1 템플릿 선택 화면
템플릿 8종

twoCut-portrait (1×2)

twoCut-landscape (2×1)

fourCut-portrait (2×2)

fourCut-landscape (2×2 동일)

sixCut-portrait (2×3)

sixCut-landscape (3×2)

custom-portrait

custom-landscape

UI

홈 화면 및 사진올리기 화면에서 동일 구성

각 템플릿 카드 → card 하단에 “세로형 / 가로형 버튼”

클릭 시 /edit/new?type=2cut&orientation=portrait 형태로 이동

4.2 사진편집 화면 (Editor)
🟦 기본 구조

A4Canvas (A4 고정 비율)
└── OuterFrame (15mm padding / 3px solid black)
├── Metadata
└── Image Slots (template별 동적 생성)

🟦 A4 렌더링

실제 A4 비율 그대로

Editor 화면과 PrintView 화면은 픽셀 단위까지 동일

Inner layout: 백색 바탕 + 점선 슬롯

🟦 이미지 업로드

슬롯 클릭 → 이미지 첨부

지원 기능:

이미지 교체

이미지 삭제

설명 입력(description)

회전(90° each)

확대/축소(scale)

❌ 제거된 기능

크롭

드래그 이동

html2canvas 렌더링

jsPDF

🟦 메타데이터

제목

사업명(dropdown + 직접입력 혼합)

보조사업자

담당자

※ 입력 안 해도 저장 가능

🟦 페이지 관리

페이지 추가

페이지 삭제

페이지 순서 유지

각 페이지 독립된 A4 레이아웃

🟦 저장(Supabase)

항상 INSERT only (문서 버전 관리됨)

Storage에 이미지 업로드 → URL 저장

page_data(JSON)에 모든 상태 기록:

template

orientation

metadata

slots (imageUrl, rotation, scale, description)

pages[]



4.3 출력 기능 (PrintView) – 페이지 번호 규칙 업데이트
페이지 번호 표시 규칙

문서가 1페이지인 경우 → 페이지 번호 표시 없음

문서가 2페이지 이상인 경우 → 각 페이지 하단 중앙에 “1 / N” 형식 표시

Page numbering 형태:

Page 1 → “1 / N”

Page 2 → “2 / N”

…

숫자 스타일: 작은 Gray 또는 Black 텍스트, 중앙 정렬

Editor 화면에는 표시되지 않음 (PrintView 전용)

4.4 사업리스트 (사업리스트.png) (수정 완료)
목적

사업명을 미리 관리하여 편집화면에서 쉽게 선택할 수 있도록 함.

기능

사업명 목록 조회

사업 추가(+) 버튼

클릭 시 모달 열림

사업명 입력 후 저장

사업명 수정

사업명 삭제

UI 요구사항

상단 우측에 “+ 사업 추가” 버튼 배치

테이블 UI 디자인은 기존과 동일

버튼 스타일도 기존 버튼 스타일 그대로 유지

4.5 사업관리 화면 (Project Records)
목적

저장된 문서를 조회하고, 개별 또는 일괄삭제하며, 문서를 다시 열어 출력/수정할 수 있도록 함.

기능 리스트

저장된 문서 목록 조회

각 row 왼쪽에 체크박스 추가

선택된 문서 일괄삭제 기능 추가 (Bulk Delete)

개별 “열기” 버튼 → 편집화면으로 이동

개별 “삭제” 버튼 → 단일 삭제

검색/필터(선택 기능)

테이블 컬럼

| 체크 | 생성일자 | 제목 | 사업명 | 보조사업자 | 담당자 | 작업(열기/삭제) |

Bulk Delete 동작

체크된 문서들 삭제

Supabase DB row 삭제

Storage 내부의 모든 이미지들 삭제

삭제 완료 시 Toast 표시

UI는 자동 새로고침

저장 방식

편집 후 저장하면 항상 새로운 문서 생성 (INSERT only)

UPDATE 미사용 (문서 버전 관리 개념)




4.6 관리자 화면 (관리자화면.png)

사용자 목록 표시

가입일

권한(Admin / 사용자)

권한 변경 기능

Supabase Auth 기반

5. DB 구조 (Supabase)
📌 Table: project_records
field	type	description
id	uuid	PK
user_id	uuid	Supabase Auth user id
created_at	timestamp	created time
updated_at	timestamp	auto-updated
title	text	제목
business_name	text	dropdown/입력
owner	text	보조사업자
manager	text	담당자
page_data	jsonb	전체 A4 페이지 정보
project_type	text	optional
📌 page_data 구조
{
  template: "2cut",
  orientation: "portrait",
  pages: [
    {
      metadata: {...},
      slots: [
        { imageUrl, rotation, scale, description },
        ...
      ]
    }
  ]
}

6. 기술 스택

React

Vite

TailwindCSS

Zustand

Supabase

React Router

Print CSS

❌ 제거

html2canvas

jsPDF

7. 기대 효과

출력 문서 생성까지 5분

반복 업무 자동화 → 과수·채소·축산 등 모든 보조사업 즉시 적용 가능

연도별 현장사진 문서 체계화

웹 기반이라 설치 필요 없음

출력물이 공문 제출 기준에 100% 맞춤