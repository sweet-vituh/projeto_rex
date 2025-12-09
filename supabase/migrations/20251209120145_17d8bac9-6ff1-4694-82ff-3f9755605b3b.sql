-- Create table for catalog items that mechanics will select in dropdowns
CREATE TABLE public.catalog_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  item_description TEXT NOT NULL,
  system_description TEXT,
  requisition_code TEXT,
  cost_center TEXT,
  area TEXT NOT NULL,
  category TEXT NOT NULL,
  equipment TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.catalog_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read active items (for dropdowns)
CREATE POLICY "Anyone can view active catalog items"
ON public.catalog_items
FOR SELECT
USING (is_active = true);

-- Only admins can manage catalog items
CREATE POLICY "Admins can insert catalog items"
ON public.catalog_items
FOR INSERT
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update catalog items"
ON public.catalog_items
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete catalog items"
ON public.catalog_items
FOR DELETE
USING (is_admin(auth.uid()));

-- Admins need to see all items including inactive
CREATE POLICY "Admins can view all catalog items"
ON public.catalog_items
FOR SELECT
USING (is_admin(auth.uid()));

-- Add justification field to requisitions table
ALTER TABLE public.requisitions 
ADD COLUMN justification TEXT;

-- Create trigger for updated_at on catalog_items
CREATE TRIGGER update_catalog_items_updated_at
BEFORE UPDATE ON public.catalog_items
FOR EACH ROW
EXECUTE FUNCTION public.update_requisitions_updated_at();

-- Create index for common filters
CREATE INDEX idx_catalog_items_area ON public.catalog_items(area);
CREATE INDEX idx_catalog_items_category ON public.catalog_items(category);
CREATE INDEX idx_catalog_items_equipment ON public.catalog_items(equipment);