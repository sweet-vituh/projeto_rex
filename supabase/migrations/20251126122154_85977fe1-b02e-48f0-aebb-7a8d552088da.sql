-- Permitir que PCMs vejam outros PCMs para transferência de requisições
-- Isso é necessário para o dropdown de transferência mostrar outros PCMs disponíveis

CREATE POLICY "PCM can view other PCM users" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  -- PCMs podem ver outros PCMs
  has_role(auth.uid(), 'pcm'::app_role) AND role = 'pcm'::app_role
);

-- Comentário explicativo
COMMENT ON POLICY "PCM can view other PCM users" ON public.user_roles IS 'Permite que usuários PCM vejam outros usuários PCM para transferência de requisições';