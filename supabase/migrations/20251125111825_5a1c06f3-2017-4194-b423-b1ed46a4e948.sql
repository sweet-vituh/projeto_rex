-- Permitir que mecânicos possam atualizar suas próprias requisições enquanto estão pendentes
CREATE POLICY "Mechanics can update their pending requisitions"
ON public.requisitions
FOR UPDATE
USING (
  auth.uid() = created_by 
  AND status = 'pendente'
);

-- Permitir que mecânicos possam excluir suas próprias requisições enquanto estão pendentes
CREATE POLICY "Mechanics can delete their pending requisitions"
ON public.requisitions
FOR DELETE
USING (
  auth.uid() = created_by 
  AND status = 'pendente'
);
