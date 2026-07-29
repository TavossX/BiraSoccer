-- ============================================================================
-- SCRIPT SQL: Tabela times_customizados + RLS + Policies
-- Execute este script no SQL Editor do Supabase.
-- ============================================================================

-- 1. Criação da tabela
CREATE TABLE IF NOT EXISTS public.times_customizados (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  escudo_base64 TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Ativar Row Level Security
ALTER TABLE public.times_customizados ENABLE ROW LEVEL SECURITY;

-- 3. Policies: o usuário autenticado só acessa seus próprios registros

-- SELECT: listar apenas os seus times
CREATE POLICY "Usuários podem ver seus próprios times"
  ON public.times_customizados
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: criar times vinculados ao seu user_id
CREATE POLICY "Usuários podem criar seus próprios times"
  ON public.times_customizados
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: editar apenas os seus times
CREATE POLICY "Usuários podem editar seus próprios times"
  ON public.times_customizados
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: excluir apenas os seus times
CREATE POLICY "Usuários podem excluir seus próprios times"
  ON public.times_customizados
  FOR DELETE
  USING (auth.uid() = user_id);
