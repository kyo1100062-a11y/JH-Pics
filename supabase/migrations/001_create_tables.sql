-- ============================================
-- 지혜로운 Pictures - 데이터베이스 스키마 생성
-- ============================================
-- 단계별 실행 가이드:
-- 1. Extensions 활성화
-- 2. projects 테이블 생성
-- 3. picture_sets 테이블 생성
-- 4. updated_at 자동 업데이트 트리거 설정
-- 5. 인덱스 생성
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
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  farmer_name TEXT DEFAULT '',
  manager_name TEXT DEFAULT '',
  pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. updated_at 자동 업데이트 트리거 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- picture_sets 테이블에 updated_at 트리거 적용
CREATE TRIGGER update_picture_sets_updated_at
  BEFORE UPDATE ON picture_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 인덱스 생성 (성능 최적화)
-- ============================================
-- projects 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- picture_sets 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_picture_sets_project_id ON picture_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_picture_sets_created_at ON picture_sets(created_at DESC);
-- pages JSONB 인덱스 (GIN 인덱스로 JSON 검색 최적화)
CREATE INDEX IF NOT EXISTS idx_picture_sets_pages ON picture_sets USING GIN (pages);

-- ============================================
-- 6. 코멘트 추가 (문서화)
-- ============================================
COMMENT ON TABLE projects IS '사업(프로젝트) 정보 테이블';
COMMENT ON COLUMN projects.name IS '사업명';

COMMENT ON TABLE picture_sets IS '사진 문서 세트 테이블';
COMMENT ON COLUMN picture_sets.project_id IS '사업 ID (projects 테이블 참조)';
COMMENT ON COLUMN picture_sets.title IS '문서 제목';
COMMENT ON COLUMN picture_sets.farmer_name IS '보조사업자명';
COMMENT ON COLUMN picture_sets.manager_name IS '담당자명';
COMMENT ON COLUMN picture_sets.pages IS '페이지별 슬롯 데이터 (JSONB 배열)';

