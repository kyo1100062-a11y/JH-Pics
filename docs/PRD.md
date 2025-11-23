📘 PRD v2.1 – 지혜로운 Pictures (Simple Edition)
1. 프로젝트 개요
프로젝트명

지혜로운 Pictures

프로젝트 설명

농업기술센터 실무자가 현장 확인 시 촬영한 사진을 즉시 업로드, 편집, A4 문서(PDF/JPEG)로 출력할 수 있는
모바일/PC 겸용 반응형 웹 애플리케이션.

복잡한 AI 기능 없이, 사진 업로드 → 간단한 편집 → 출력 기능에 집중.

목표 사용자

보조사업 현장확인 문서 작성이 필요한 농업기술센터 직원(내부 전용).

2. 디자인 및 스타일 가이드 (Tech Startup Neoblue 기반)
전체 분위기

빠르고 직관적인 “사진 문서 생성 도구”

깔끔하고 심플하며 현대적 UI

어두운 바탕 + 네오블루 강조

컬러 팔레트

Primary: #4C6FFF

Deep Blue (배경): #10131A

Soft Blue: #A8B7F5

Accent Mint: #AEEAFF

폰트

국문/영문: SUIT / Inter

굵고 둥근 느낌, 명확한 가독성

UI 규칙

버튼: 모서리 12~16px, 약한 글로우

카드: Deep Blue 배경 + Soft Blue 테두리

히어로: 기하학적 도형 + 네오블루 강조

3. 핵심 기능 (Features)
3.1 공통 UI 구조
헤더

로고: JH Pics

메뉴: Home / 사진올리기 / 사업리스트 / 사업관리 / Login(아이콘)

히어로 섹션

배경: Deep Blue(#10131A)

텍스트(굵게):

“Easily manage field project photos”


푸터

2025 • Dream Bold, Capture Reality • For Han Ji-Hye

3.2 사진 올리기 메인 화면 (템플릿 선택)
템플릿 종류

Type 2컷 (1×2)

Type 4컷 (2×2)

Type 6컷 (3×2)

Type 커스텀 (rows/columns 직접 설정)

카드 UI

정사각형

가운데 아이콘

아래 Text: “Type 4컷” 등

Hover: 네오블루 글로우

카드 클릭 → A4 편집 화면 이동

3.3 A4 편집 화면 (Canvas)
Canvas 공통

A4 비율 유지 (210×297mm)

미리보기(흰 바탕) 제공

상단 입력 영역

제목 (기본값: 현장 확인 사진)

사업명 선택 (Dropdown)

보조사업자명 입력

포커스 시 Accent Mint 테두리 강조

사진 업로드

드래그 앤 드롭 업로드

또는 + 버튼 업로드

업로드 시 자동 리사이징 후 저장

사진 편집 모달

크롭

확대/축소

회전(90°)

교체

삭제
※ 마스킹 기능 없음 (삭제됨)

사진 설명

“내용 추가” 버튼 클릭 시 표시

글자수 최대 50자

페이지 관리

페이지 추가

페이지 삭제(2페이지부터 가능)

저장 기능

Supabase Storage → 이미지

Supabase DB → 메타데이터

자동 임시 저장(auto-save)

로컬 임시 저장(인터넷 불안 시 대비)

출력 기능

PDF 출력

JPEG 출력

고화질 옵션

3.4 사업 리스트 및 관리자 기능
사업 리스트 관리

사업명 추가 / 수정 / 삭제

사업 기간(선택) 입력 가능

편집 화면 Dropdown 연동

관리자(Admin) 페이지

모든 사진세트 목록 조회

항목: 제목 / 날짜 / 사업명 / 작성자

상세 페이지에서 수정, 삭제, 출력 지원

권한

user: 작성, 편집

admin: 전체 관리

4. 데이터베이스 구조
테이블: projects
필드	타입	설명
id	uuid (PK)	고유 ID
name	text	사업명
start_date	date	(선택)
end_date	date	(선택)
created_at	timestamp	생성일
테이블: picture_sets
필드	타입	설명
id	uuid (PK)	고유 ID
user_id	uuid	작성자
project_id	uuid	사업명(FK)
title	text	문서 제목
farmer_name	text	보조사업자명
layout_type	text	2cut / 4cut / 6cut / custom
images	jsonb	이미지 배열 {url, description, page, index}
is_archived	boolean	보관
created_at	timestamp	생성일
updated_at	timestamp	수정일
5. Storage 구조 (Supabase Storage)
/pictures/{project_id}/{picture_set_id}/page-1/
    1_20251123-120101.jpg
    2_20251123-120102.jpg


파일명 규칙
{page}_{index}_{timestamp}.jpg

6. 기술 스택
Frontend

React + Vite

TailwindCSS

Zustand

react-easy-crop

html2canvas + jsPDF (출력)

Backend

Supabase (Auth / DB / Storage)

Deployment

Render

7. 기대 효과

현장 사진 → 문서 출력까지 5분 내 처리 가능

복잡한 기능 없이 누구나 바로 사용 가능

사업별·연도별 문서 관리가 쉬워짐

직원 업무 속도 향상 및 실수 감소