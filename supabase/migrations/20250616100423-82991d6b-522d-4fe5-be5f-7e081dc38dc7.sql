
-- Fix database data consistency: update empty string subcategories to NULL
UPDATE public.required_items 
SET subcategory = NULL 
WHERE subcategory = '';

-- Verify the update worked
SELECT 
  id,
  item_name,
  subcategory,
  subcategory_1_initiator,
  subcategory_2_initiator,
  CASE 
    WHEN subcategory IS NULL THEN 'Main Question'
    WHEN subcategory_1_initiator = true OR subcategory_2_initiator = true THEN 'Initiator Question'
    ELSE 'Conditional Question'
  END as question_type
FROM public.required_items 
ORDER BY category_id, priority;
