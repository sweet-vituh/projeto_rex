-- Create categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

-- Only admins can manage categories
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE
USING (is_admin(auth.uid()));

-- Remove requisition_code and cost_center columns from catalog_items
ALTER TABLE public.catalog_items DROP COLUMN IF EXISTS requisition_code;
ALTER TABLE public.catalog_items DROP COLUMN IF EXISTS cost_center;

-- Add cost_center to requisitions table if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'requisitions' AND column_name = 'cost_center') THEN
    ALTER TABLE public.requisitions ADD COLUMN cost_center text;
  END IF;
END $$;