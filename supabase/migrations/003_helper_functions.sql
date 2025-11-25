-- ============================================
-- 지혜로운 Pictures - 헬퍼 함수 및 뷰
-- ============================================

-- ============================================
-- 1. picture_sets 조회 뷰 (메타데이터 포함)
-- ============================================
CREATE OR REPLACE VIEW picture_sets_with_metadata AS
SELECT
  ps.id,
  ps.user_id,
  ps.project_id,
  ps.title,
  ps.farmer_name,
  ps.manager_name,
  ps.layout_type,
  ps.pages,
  ps.is_archived,
  ps.created_at,
  ps.updated_at,
  p.name AS project_name,
  p.start_date AS project_start_date,
  p.end_date AS project_end_date,
  u.email AS user_email,
  -- 페이지 개수 계산
  jsonb_array_length(ps.pages) AS page_count,
  -- 총 슬롯 개수 계산
  (
    SELECT SUM(jsonb_array_length(page_item->'slots'))
    FROM jsonb_array_elements(ps.pages) AS page_item
  ) AS total_slot_count
FROM picture_sets ps
LEFT JOIN projects p ON ps.project_id = p.id
LEFT JOIN auth.users u ON ps.user_id = u.id;

-- 뷰에 대한 RLS 정책 (기본 테이블 정책 상속)
ALTER VIEW picture_sets_with_metadata SET (security_invoker = true);

-- ============================================
-- 2. 프로젝트별 picture_sets 개수 집계 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_project_picture_set_count(project_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM picture_sets
    WHERE project_id = project_uuid
    AND is_archived = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. 사용자별 picture_sets 통계 함수
-- ============================================
CREATE OR REPLACE FUNCTION get_user_picture_set_stats(user_uuid UUID)
RETURNS TABLE (
  total_count BIGINT,
  archived_count BIGINT,
  recent_updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_count,
    COUNT(*) FILTER (WHERE is_archived = TRUE)::BIGINT AS archived_count,
    MAX(updated_at) AS recent_updated_at
  FROM picture_sets
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. picture_set의 특정 페이지 슬롯 업데이트 함수
-- ============================================
CREATE OR REPLACE FUNCTION update_picture_set_slot(
  picture_set_uuid UUID,
  page_index INTEGER,
  slot_index INTEGER,
  slot_data JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_pages JSONB;
  page_item JSONB;
  slot_item JSONB;
  found_page BOOLEAN := FALSE;
  found_slot BOOLEAN := FALSE;
BEGIN
  -- 현재 pages 가져오기
  SELECT pages INTO updated_pages
  FROM picture_sets
  WHERE id = picture_set_uuid;

  -- 페이지 찾기 및 슬롯 업데이트
  FOR page_item IN SELECT * FROM jsonb_array_elements(updated_pages)
  LOOP
    IF (page_item->>'pageIndex')::INTEGER = page_index THEN
      found_page := TRUE;
      
      -- 슬롯 찾기 및 업데이트
      FOR slot_item IN SELECT * FROM jsonb_array_elements(page_item->'slots')
      LOOP
        IF (slot_item->>'slotIndex')::INTEGER = slot_index THEN
          found_slot := TRUE;
          -- 슬롯 업데이트
          updated_pages := jsonb_set(
            updated_pages,
            ARRAY[
              (SELECT ordinality::INTEGER - 1 FROM jsonb_array_elements(updated_pages) WITH ORDINALITY WHERE value = page_item),
              'slots',
              (SELECT ordinality::INTEGER - 1 FROM jsonb_array_elements(page_item->'slots') WITH ORDINALITY WHERE value = slot_item)
            ]::text[],
            slot_data
          );
          EXIT;
        END IF;
      END LOOP;
      
      EXIT;
    END IF;
  END LOOP;

  -- 업데이트 실행
  IF found_page AND found_slot THEN
    UPDATE picture_sets
    SET pages = updated_pages, updated_at = NOW()
    WHERE id = picture_set_uuid;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. picture_set의 특정 슬롯 삭제 함수
-- ============================================
CREATE OR REPLACE FUNCTION delete_picture_set_slot(
  picture_set_uuid UUID,
  page_index INTEGER,
  slot_index INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  updated_pages JSONB;
  page_item JSONB;
  slot_item JSONB;
  new_slots JSONB;
BEGIN
  -- 현재 pages 가져오기
  SELECT pages INTO updated_pages
  FROM picture_sets
  WHERE id = picture_set_uuid;

  -- 페이지 찾기 및 슬롯 삭제
  FOR page_item IN SELECT * FROM jsonb_array_elements(updated_pages)
  LOOP
    IF (page_item->>'pageIndex')::INTEGER = page_index THEN
      -- 슬롯 필터링 (삭제할 슬롯 제외)
      new_slots := (
        SELECT jsonb_agg(slot)
        FROM jsonb_array_elements(page_item->'slots') AS slot
        WHERE (slot->>'slotIndex')::INTEGER != slot_index
      );
      
      -- 페이지의 slots 업데이트
      updated_pages := jsonb_set(
        updated_pages,
        ARRAY[
          (SELECT ordinality::INTEGER - 1 FROM jsonb_array_elements(updated_pages) WITH ORDINALITY WHERE value = page_item),
          'slots'
        ]::text[],
        COALESCE(new_slots, '[]'::jsonb)
      );
      
      -- 업데이트 실행
      UPDATE picture_sets
      SET pages = updated_pages, updated_at = NOW()
      WHERE id = picture_set_uuid;
      
      RETURN TRUE;
    END IF;
  END LOOP;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 코멘트 추가
-- ============================================

COMMENT ON VIEW picture_sets_with_metadata IS 'picture_sets와 관련 메타데이터를 포함한 조회 뷰';
COMMENT ON FUNCTION get_project_picture_set_count IS '프로젝트별 활성 picture_sets 개수 반환';
COMMENT ON FUNCTION get_user_picture_set_stats IS '사용자별 picture_sets 통계 반환';
COMMENT ON FUNCTION update_picture_set_slot IS 'picture_set의 특정 슬롯 업데이트';
COMMENT ON FUNCTION delete_picture_set_slot IS 'picture_set의 특정 슬롯 삭제';

