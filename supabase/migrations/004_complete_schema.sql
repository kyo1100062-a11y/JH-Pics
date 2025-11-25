-- ============================================
-- 지혜로운 Pictures - 완전한 데이터베이스 스키마
-- ============================================
-- 이 파일은 요구사항에 맞춘 완전한 스키마입니다.
-- Supabase SQL Editor에서 순서대로 실행하세요.
-- ============================================

-- ============================================
-- 1. Extensions 활성화
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. projects 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. picture_sets 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS picture_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  title TEXT NOT NULL,
  farmer_name TEXT DEFAULT '',
  manager_name TEXT DEFAULT '',
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. Foreign Key 설정
-- ============================================
-- project_id → projects.id 외래키 설정
ALTER TABLE picture_sets
  ADD CONSTRAINT fk_picture_sets_project_id
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE RESTRICT;

-- ============================================
-- 5. updated_at 자동 업데이트 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- picture_sets 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_picture_sets_updated_at ON picture_sets;
CREATE TRIGGER update_picture_sets_updated_at
  BEFORE UPDATE ON picture_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 인덱스 생성 (성능 최적화)
-- ============================================
-- projects 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- picture_sets 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_picture_sets_project_id ON picture_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_picture_sets_created_at ON picture_sets(created_at DESC);
-- pages JSONB 인덱스 (GIN 인덱스로 JSON 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_picture_sets_pages ON picture_sets USING GIN (pages);

-- ============================================
-- 7. 코멘트 추가 (문서화)
-- ============================================
COMMENT ON TABLE projects IS '사업(프로젝트) 정보 테이블';
COMMENT ON COLUMN projects.name IS '사업명';

COMMENT ON TABLE picture_sets IS '사진 문서 세트 테이블';
COMMENT ON COLUMN picture_sets.project_id IS '사업 ID (projects 테이블 참조)';
COMMENT ON COLUMN picture_sets.title IS '문서 제목';
COMMENT ON COLUMN picture_sets.farmer_name IS '보조사업자명';
COMMENT ON COLUMN picture_sets.manager_name IS '담당자명';
COMMENT ON COLUMN picture_sets.pages IS '페이지별 슬롯 데이터 (JSONB 배열). 구조: [{"pageIndex": 0, "slots": [{"slotIndex": 0, "url": "", "description": ""}]}]';

-- ============================================
-- 8. RLS (Row Level Security) 활성화
-- ============================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE picture_sets ENABLE ROW LEVEL SECURITY;

