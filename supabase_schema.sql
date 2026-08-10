-- ==============================================================================
-- SCRIPT SQL SUPABASE: SISTEMA DE GRUPOS, CONVITES, PERFIS E TRIGGER DE AUTH
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- PASSO 1: CRIAR TODAS AS TABELAS (SEM POLÍTICAS AINDA, EVITANDO ERRO DE DEPENDÊNCIA)
-- ==============================================================================

-- Tabela: perfis
CREATE TABLE IF NOT EXISTS public.perfis (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    foto_base64 TEXT,
    steam_id TEXT,
    onboarding_completo BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: grupos
CREATE TABLE IF NOT EXISTS public.grupos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    criador_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: grupo_membros
CREATE TABLE IF NOT EXISTS public.grupo_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES public.perfis(id) ON DELETE CASCADE,
    data_entrada TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT grupo_membros_unico UNIQUE (grupo_id, usuario_id)
);

-- Tabela: convites
CREATE TABLE IF NOT EXISTS public.convites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
    data_expiracao TIMESTAMPTZ,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: torneios_publicos
CREATE TABLE IF NOT EXISTS public.torneios_publicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    formato TEXT NOT NULL,
    status TEXT DEFAULT 'em_andamento',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    dados JSONB NOT NULL,
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- PASSO 2: HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
-- ==============================================================================

ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupo_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneios_publicos ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PASSO 3: TRIGGER & FUNCTION PARA AUTOMATIZAR CRIAÇÃO DE PERFIL VIA AUTH.USERS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfis (id, nome, onboarding_completo)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- PASSO 4: POLÍTICAS RLS (TUDO CRIADO DEPOIS DE TODAS AS TABELAS EXISTIREM)
-- ==============================================================================

-- 4.1 Políticas: perfis
DROP POLICY IF EXISTS "Perfis são publicamente legíveis" ON public.perfis;
CREATE POLICY "Perfis são publicamente legíveis"
    ON public.perfis FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.perfis;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.perfis FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.perfis;
CREATE POLICY "Usuários podem inserir seu próprio perfil"
    ON public.perfis FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4.2 Políticas: grupos
DROP POLICY IF EXISTS "Qualquer usuário autenticado pode ver grupos que participa ou criou" ON public.grupos;
CREATE POLICY "Qualquer usuário autenticado pode ver grupos que participa ou criou"
    ON public.grupos FOR SELECT
    USING (
        auth.uid() = criador_id OR
        EXISTS (
            SELECT 1 FROM public.grupo_membros
            WHERE grupo_id = public.grupos.id AND usuario_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários autenticados podem criar grupos" ON public.grupos;
CREATE POLICY "Usuários autenticados podem criar grupos"
    ON public.grupos FOR INSERT
    WITH CHECK (auth.uid() = criador_id);

DROP POLICY IF EXISTS "Criador pode atualizar seu grupo" ON public.grupos;
CREATE POLICY "Criador pode atualizar seu grupo"
    ON public.grupos FOR UPDATE
    USING (auth.uid() = criador_id);

DROP POLICY IF EXISTS "Criador pode deletar seu grupo" ON public.grupos;
CREATE POLICY "Criador pode deletar seu grupo"
    ON public.grupos FOR DELETE
    USING (auth.uid() = criador_id);

-- 4.3 Políticas: grupo_membros
DROP POLICY IF EXISTS "Membros e gestores podem visualizar os membros do grupo" ON public.grupo_membros;
CREATE POLICY "Membros e gestores podem visualizar os membros do grupo"
    ON public.grupo_membros FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.grupo_membros gm
            WHERE gm.grupo_id = public.grupo_membros.grupo_id AND gm.usuario_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.grupos g
            WHERE g.id = public.grupo_membros.grupo_id AND g.criador_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Usuários autenticados podem se inserir ou gestores inserirem membros" ON public.grupo_membros;
CREATE POLICY "Usuários autenticados podem se inserir ou gestores inserirem membros"
    ON public.grupo_membros FOR INSERT
    WITH CHECK (
        auth.uid() = usuario_id
        OR EXISTS (
            SELECT 1 FROM public.grupos g
            WHERE g.id = public.grupo_membros.grupo_id AND g.criador_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Gestor ou próprio membro pode remover da grupo_membros" ON public.grupo_membros;
CREATE POLICY "Gestor ou próprio membro pode remover da grupo_membros"
    ON public.grupo_membros FOR DELETE
    USING (
        auth.uid() = usuario_id
        OR EXISTS (
            SELECT 1 FROM public.grupos g
            WHERE g.id = public.grupo_membros.grupo_id AND g.criador_id = auth.uid()
        )
    );

-- 4.4 Políticas: convites
DROP POLICY IF EXISTS "Convites são publicamente legíveis via token" ON public.convites;
CREATE POLICY "Convites são publicamente legíveis via token"
    ON public.convites FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Apenas gestores de grupos podem criar convites" ON public.convites;
CREATE POLICY "Apenas gestores de grupos podem criar convites"
    ON public.convites FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.grupos g
            WHERE g.id = public.convites.grupo_id AND g.criador_id = auth.uid()
        )
    );

-- 4.5 Políticas: torneios_publicos
DROP POLICY IF EXISTS "Torneios são publicamente legíveis" ON public.torneios_publicos;
CREATE POLICY "Torneios são publicamente legíveis"
    ON public.torneios_publicos FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Usuários criadores gerenciam seus torneios" ON public.torneios_publicos;
CREATE POLICY "Usuários criadores gerenciam seus torneios"
    ON public.torneios_publicos FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
