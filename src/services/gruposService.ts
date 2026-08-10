import { supabase } from '../lib/supabase';
import type { Grupo, GrupoMembro, ConviteGrupo } from '../types/social';

/** Lista todos os grupos dos quais o usuário é membro ou criador */
export async function listarMeusGrupos(usuarioId: string): Promise<Grupo[]> {
  // Busca IDs de grupos nos quais o usuário está em grupo_membros
  const { data: membroRows, error: membroErr } = await supabase
    .from('grupo_membros')
    .select('grupo_id')
    .eq('usuario_id', usuarioId);

  if (membroErr) {
    console.error('Erro ao buscar grupos do usuário:', membroErr.message);
    return [];
  }

  const grupoIds = membroRows ? membroRows.map((m) => m.grupo_id) : [];

  if (grupoIds.length === 0) return [];

  const { data, error } = await supabase
    .from('grupos')
    .select('*, criador:perfis!criador_id(*)')
    .in('id', grupoIds)
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('Erro ao listar grupos:', error.message);
    return [];
  }

  return data || [];
}

/** Obtém detalhes de um grupo por ID com seus membros */
export async function obterGrupo(grupoId: string): Promise<{
  grupo: Grupo | null;
  membros: GrupoMembro[];
}> {
  const { data: grupo, error: grupoErr } = await supabase
    .from('grupos')
    .select('*, criador:perfis!criador_id(*)')
    .eq('id', grupoId)
    .single();

  if (grupoErr || !grupo) {
    console.error('Erro ao buscar grupo:', grupoErr?.message);
    return { grupo: null, membros: [] };
  }

  const { data: membros, error: membrosErr } = await supabase
    .from('grupo_membros')
    .select('*, perfil:perfis!usuario_id(*)')
    .eq('grupo_id', grupoId)
    .order('data_entrada', { ascending: true });

  if (membrosErr) {
    console.error('Erro ao buscar membros do grupo:', membrosErr.message);
  }

  return {
    grupo,
    membros: membros || [],
  };
}

/** Cria um novo grupo e adiciona o criador como primeiro membro */
export async function criarGrupo(nome: string, criadorId: string): Promise<Grupo> {
  const { data: novoGrupo, error: grupoErr } = await supabase
    .from('grupos')
    .insert({ nome, criador_id: criadorId })
    .select('*')
    .single();

  if (grupoErr || !novoGrupo) {
    console.error('Erro ao criar grupo:', grupoErr?.message);
    throw grupoErr;
  }

  // Adiciona criador à grupo_membros
  const { error: membroErr } = await supabase.from('grupo_membros').insert({
    grupo_id: novoGrupo.id,
    usuario_id: criadorId,
  });

  if (membroErr) {
    console.error('Erro ao adicionar criador ao grupo_membros:', membroErr.message);
  }

  return novoGrupo;
}

/** Gera um token de convite único para o grupo */
export async function gerarConviteGrupo(grupoId: string): Promise<ConviteGrupo> {
  const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
  
  const { data, error } = await supabase
    .from('convites')
    .insert({
      token,
      grupo_id: grupoId,
    })
    .select('*, grupo:grupos(*)')
    .single();

  if (error || !data) {
    console.error('Erro ao gerar convite:', error?.message);
    throw error;
  }

  return data;
}

/** Obtém informações de um convite pelo token */
export async function obterConvitePorToken(token: string): Promise<ConviteGrupo | null> {
  const { data, error } = await supabase
    .from('convites')
    .select('*, grupo:grupos(*)')
    .eq('token', token)
    .single();

  if (error || !data) {
    console.error('Erro ao validar convite:', error?.message);
    return null;
  }

  return data;
}

/** Adiciona um usuário como membro de um grupo usando um token de convite */
export async function entrarNoGrupoPorToken(
  token: string,
  usuarioId: string
): Promise<{ sucesso: boolean; grupoId?: string; mensagem?: string }> {
  const convite = await obterConvitePorToken(token);
  if (!convite) {
    return { sucesso: false, mensagem: 'Convite inválido ou expirado.' };
  }

  // Verifica se já é membro
  const { data: existente } = await supabase
    .from('grupo_membros')
    .select('id')
    .eq('grupo_id', convite.grupo_id)
    .eq('usuario_id', usuarioId)
    .maybeSingle();

  if (existente) {
    return {
      sucesso: true,
      grupoId: convite.grupo_id,
      mensagem: 'Você já faz parte deste grupo!',
    };
  }

  const { error } = await supabase.from('grupo_membros').insert({
    grupo_id: convite.grupo_id,
    usuario_id: usuarioId,
  });

  if (error) {
    console.error('Erro ao entrar no grupo:', error.message);
    return { sucesso: false, mensagem: 'Erro ao entrar no grupo: ' + error.message };
  }

  return {
    sucesso: true,
    grupoId: convite.grupo_id,
    mensagem: 'Você entrou no grupo com sucesso!',
  };
}
