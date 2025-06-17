
-- Fix the document item in required_items table to ensure it passes the generation filter
-- Either set subcategory to NULL or set subcategory_1_initiator to true
UPDATE public.required_items 
SET subcategory = NULL 
WHERE item_type = 'document' 
AND subcategory = '';

-- Alternative approach: set subcategory_1_initiator to true instead
-- UPDATE public.required_items 
-- SET subcategory_1_initiator = true 
-- WHERE item_type = 'document' 
-- AND subcategory = '' 
-- AND subcategory_1_initiator = false;

-- Regenerate checklist items for all existing projects to include the document items
-- This will call the generation function for each project that has been generated
DO $$
DECLARE
    project_record RECORD;
BEGIN
    FOR project_record IN 
        SELECT id FROM public.projects 
        WHERE checklist_generated_at IS NOT NULL
    LOOP
        -- Clear existing items and regenerate
        DELETE FROM public.project_checklist_items 
        WHERE project_id = project_record.id;
        
        -- Reset generation timestamp
        UPDATE public.projects 
        SET checklist_generated_at = NULL 
        WHERE id = project_record.id;
        
        -- Regenerate checklist
        PERFORM public.generate_project_checklist_items(project_record.id);
    END LOOP;
END $$;
