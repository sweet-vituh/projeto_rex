-- Adicionar campo para rastrear transferências
ALTER TABLE public.requisitions 
ADD COLUMN transferred_from uuid REFERENCES auth.users(id);

COMMENT ON COLUMN public.requisitions.transferred_from IS 'ID do PCM que transferiu esta requisição para o responsável atual';