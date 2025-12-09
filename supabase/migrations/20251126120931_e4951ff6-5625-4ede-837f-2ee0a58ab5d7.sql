-- Adicionar novo status 'caducou' à tabela requisitions
-- Este status indica pedidos que não foram liberados/comprados

-- Não é possível alterar valores de enum diretamente, então vamos usar CHECK constraint
-- Primeiro, remover qualquer constraint anterior de status se existir
ALTER TABLE public.requisitions DROP CONSTRAINT IF EXISTS requisitions_status_check;

-- Adicionar constraint com o novo status 'caducou'
ALTER TABLE public.requisitions ADD CONSTRAINT requisitions_status_check 
CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'rejeitado', 'caducou'));

-- Adicionar coluna para motivo de rejeição se não existir
ALTER TABLE public.requisitions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Comentário explicativo
COMMENT ON COLUMN public.requisitions.rejection_reason IS 'Motivo informado quando a requisição é rejeitada ou caducou';