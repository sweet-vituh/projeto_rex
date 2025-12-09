-- Adicionar novos status ao enum existente
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pre_liberacao';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coleta_emitida';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'material_disponivel';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'encerrada_sem_liberacao';

COMMENT ON TYPE public.app_role IS 'Status possíveis para requisições: pendente, em_andamento, pre_liberacao, coleta_emitida, material_disponivel, concluido, encerrada_sem_liberacao, rejeitado, caducou';