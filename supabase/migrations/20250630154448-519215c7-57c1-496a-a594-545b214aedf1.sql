
-- Create the optimized RPC function for batch category completion queries
CREATE OR REPLACE FUNCTION public.get_categories_completion_batch(
  p_project_id uuid,
  p_category_ids uuid[],
  p_participant_designation participant_designation DEFAULT NULL
)
RETURNS TABLE(
  category_id uuid,
  total_items bigint,
  completed_items bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH completion_data AS (
    SELECT 
      ri.category_id,
      ri.id as item_id,
      CASE 
        WHEN (pci.id IS NOT NULL AND pci.status IN ('submitted', 'approved')) 
          OR pd.id IS NOT NULL 
        THEN 1 
        ELSE 0 
      END as is_completed
    FROM required_items ri
    LEFT JOIN project_checklist_items pci ON ri.id = pci.item_id 
      AND pci.project_id = p_project_id
      AND (p_participant_designation IS NULL OR pci.participant_designation = p_participant_designation)
    LEFT JOIN project_documents pd ON ri.id = pd.item_id 
      AND pd.project_id = p_project_id
      AND (p_participant_designation IS NULL OR pd.participant_designation = p_participant_designation)
    WHERE ri.category_id = ANY(p_category_ids)
      AND ri.category_id IS NOT NULL
  )
  SELECT 
    cd.category_id,
    COUNT(*) as total_items,
    SUM(cd.is_completed) as completed_items
  FROM completion_data cd
  GROUP BY cd.category_id;
END;
$$;
