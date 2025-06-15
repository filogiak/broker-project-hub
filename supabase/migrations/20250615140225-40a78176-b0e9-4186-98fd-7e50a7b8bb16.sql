
-- Rename the table from document_categories to items_categories
ALTER TABLE public.document_categories RENAME TO items_categories;

-- Update foreign key constraint name to match the new table name
ALTER TABLE public.required_items 
DROP CONSTRAINT IF EXISTS required_items_category_id_fkey;

ALTER TABLE public.required_items 
ADD CONSTRAINT required_items_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.items_categories(id);

-- Clear existing categories and add the new Italian categories
DELETE FROM public.items_categories;

-- Insert the new categories
INSERT INTO public.items_categories (name, display_order) VALUES
('Offerta', 1),
('Professione', 2),
('Redditi Secondari', 3),
('Finanziamenti', 4),
('Patrimonio', 5);
