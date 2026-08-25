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
    co_admins UUID[] DEFAULT '{}'::UUID[],
    grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL,
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
    USING (auth.role() = 'authenticated');

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
DROP POLICY IF EXISTS "Criadores e Co-Admins atualizam torneios" ON public.torneios_publicos;
CREATE POLICY "Criadores e Co-Admins atualizam torneios"
    ON public.torneios_publicos FOR UPDATE
    USING (
        auth.uid() = user_id 
        OR auth.uid() = ANY(co_admins)
    );

DROP POLICY IF EXISTS "Usuários autenticados criam torneios" ON public.torneios_publicos;
CREATE POLICY "Usuários autenticados criam torneios"
    ON public.torneios_publicos FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Apenas criador deleta torneio" ON public.torneios_publicos;
CREATE POLICY "Apenas criador deleta torneio"
    ON public.torneios_publicos FOR DELETE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- PASSO 5: SISTEMA DE NOTIFICAÇÕES E GAMIFICAÇÃO (CONQUISTAS / TROFÉUS)
-- ==============================================================================

-- 5.1 Tabela: notificacoes
CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'info', -- 'partida', 'torneio', 'conquista', 'sistema'
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5.2 Tabela: conquistas (Catálogo de Troféus)
CREATE TABLE IF NOT EXISTS public.conquistas (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    icone TEXT NOT NULL,
    categoria TEXT DEFAULT 'geral',
    pontos_xp INTEGER DEFAULT 50,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5.3 Tabela: usuario_conquistas (Desbloqueios)
CREATE TABLE IF NOT EXISTS public.usuario_conquistas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conquista_id TEXT NOT NULL REFERENCES public.conquistas(id) ON DELETE CASCADE,
    desbloqueado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT usuario_conquista_unica UNIQUE (user_id, conquista_id)
);

-- 5.4 Habilitar RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conquistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario_conquistas ENABLE ROW LEVEL SECURITY;

-- 5.5 Políticas RLS: notificacoes
DROP POLICY IF EXISTS "Usuários leem suas próprias notificações" ON public.notificacoes;
CREATE POLICY "Usuários leem suas próprias notificações"
    ON public.notificacoes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários autenticados podem criar notificações" ON public.notificacoes;
CREATE POLICY "Usuários autenticados podem criar notificações"
    ON public.notificacoes FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Usuários atualizam suas notificações" ON public.notificacoes;
CREATE POLICY "Usuários atualizam suas notificações"
    ON public.notificacoes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários removem suas notificações" ON public.notificacoes;
CREATE POLICY "Usuários removem suas notificações"
    ON public.notificacoes FOR DELETE
    USING (auth.uid() = user_id);

-- 5.6 Políticas RLS: conquistas
DROP POLICY IF EXISTS "Conquistas são publicamente visíveis" ON public.conquistas;
CREATE POLICY "Conquistas são publicamente visíveis"
    ON public.conquistas FOR SELECT
    USING (true);

-- 5.7 Políticas RLS: usuario_conquistas
DROP POLICY IF EXISTS "Desbloqueios de conquistas são publicamente legíveis" ON public.usuario_conquistas;
CREATE POLICY "Desbloqueios de conquistas são publicamente legíveis"
    ON public.usuario_conquistas FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem registrar conquistas" ON public.usuario_conquistas;
CREATE POLICY "Usuários autenticados podem registrar conquistas"
    ON public.usuario_conquistas FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 5.8 Seed de Conquistas Padrão
INSERT INTO public.conquistas (id, titulo, descricao, icone, categoria, pontos_xp)
VALUES
    ('primeiro_gol', 'Primeiro Gol', 'Marcou seu primeiro gol em uma partida oficial.', '⚽', 'partidas', 50),
    ('levantou_taca', 'Levantou a Taça', 'Consagrou-se o grande campeão de um torneio.', '🏆', 'torneios', 150),
    ('estreia_de_fogo', 'Estreia de Fogo', 'Disputou sua primeira partida oficial na plataforma.', '🔥', 'partidas', 30),
    ('rei_do_draft', 'Rei do Draft', 'Participou de um torneio com sistema de Pick & Ban.', '👑', 'draft', 50),
    ('goleador', 'Goleador Nato', 'Marcou 5 ou mais gols em uma única partida.', '🎯', 'partidas', 100),
    ('paredao', 'Paredão / Clean Sheet', 'Venceu uma partida sem sofrer nenhum gol.', '🛡️', 'partidas', 100)
ON CONFLICT (id) DO NOTHING;

-- Habilitar Realtime para a tabela de notificações no Supabase
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notificacoes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes;
    END IF;
END $$;

-- ==============================================================================
-- PASSO 6: GATILHO DE BANCO (DATABASE TRIGGER & WEBHOOK) PARA EDGE FUNCTION
-- ==============================================================================

-- 6.1 Habilitar extensão pg_net (para chamadas HTTP assíncronas no Postgres)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 6.2 Função que invoca a Edge Function send-achievement-email
CREATE OR REPLACE FUNCTION public.trigger_enviar_email_conquista()
RETURNS TRIGGER AS $$
DECLARE
    v_supabase_url TEXT;
    v_anon_key TEXT;
BEGIN
    -- Substitua caso queira usar via pg_net direto no SQL:
    -- v_supabase_url := 'https://SEU_PROJETO.supabase.co/functions/v1/send-achievement-email';
    -- PERFORM net.http_post(
    --     url := v_supabase_url,
    --     headers := jsonb_build_object(
    --         'Content-Type', 'application/json',
    --         'Authorization', 'Bearer ' || v_anon_key
    --     ),
    --     body := jsonb_build_object(
    --         'type', TG_OP,
    --         'table', TG_TABLE_NAME,
    --         'record', row_to_json(NEW)
    --     )
    -- );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.3 Trigger na tabela usuario_conquistas
DROP TRIGGER IF EXISTS on_usuario_conquista_desbloqueada ON public.usuario_conquistas;
CREATE TRIGGER on_usuario_conquista_desbloqueada
    AFTER INSERT ON public.usuario_conquistas
    FOR EACH ROW EXECUTE FUNCTION public.trigger_enviar_email_conquista();


