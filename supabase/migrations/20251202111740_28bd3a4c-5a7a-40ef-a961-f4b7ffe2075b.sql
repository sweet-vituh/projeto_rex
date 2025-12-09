-- Remove a constraint antiga
ALTER TABLE public.requisitions DROP CONSTRAINT IF EXISTS requisitions_status_check;

-- Adiciona a nova constraint com todos os status permitidos
ALTER TABLE public.requisitions ADD CONSTRAINT requisitions_status_check 
CHECK (status IN (
  'pendente',
  'em_andamento', 
  'pre_liberacao',
  'coleta_emitida',
  'material_disponivel',
  'concluido',
  'rejeitado',
  'caducou',
  'encerrada_sem_liberacao'
));