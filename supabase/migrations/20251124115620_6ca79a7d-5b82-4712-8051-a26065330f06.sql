-- Create requisitions table
CREATE TABLE public.requisitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  equipment TEXT NOT NULL,
  item_description TEXT NOT NULL,
  item_code TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  priority TEXT NOT NULL CHECK (priority IN ('Baixa', 'Normal', 'Urgente')),
  problem_description TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'rejeitado')),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

-- Policies for mechanics (can view their own requisitions)
CREATE POLICY "Mechanics can view their own requisitions"
ON public.requisitions
FOR SELECT
USING (
  auth.uid() = created_by
);

CREATE POLICY "Mechanics can create requisitions"
ON public.requisitions
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Policies for PCM (can view and manage all requisitions)
CREATE POLICY "PCM can view all requisitions"
ON public.requisitions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'pcm')
);

CREATE POLICY "PCM can update requisitions"
ON public.requisitions
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'pcm')
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_requisitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requisitions_updated_at
BEFORE UPDATE ON public.requisitions
FOR EACH ROW
EXECUTE FUNCTION public.update_requisitions_updated_at();