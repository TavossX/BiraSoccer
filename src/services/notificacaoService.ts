import { supabase } from '../lib/supabase';
import type { Notificacao, NotificacaoInput } from '../types/gamificacao';

/**
 * Cria e insere uma nova notificação para um usuário específico.
 */
export async function criarNotificacao({
  userId,
  titulo,
  mensagem,
  tipo = 'info',
  link = null,
}: NotificacaoInput): Promise<Notificacao | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .insert({
        user_id: userId,
        titulo,
        mensagem,
        tipo,
        link,
        lida: false,
      })
      .select('*')
      .single();

    if (error) {
      console.warn('Erro ao criar notificação:', error.message);
      return null;
    }

    return data as Notificacao;
  } catch (err) {
    console.error('Falha inesperada ao criar notificação:', err);
    return null;
  }
}

/**
 * Insere múltiplas notificações de uma vez (ex: aviso para todos os jogadores do torneio).
 */
export async function criarNotificacoesEmLote(
  notificacoes: NotificacaoInput[]
): Promise<boolean> {
  const validas = notificacoes.filter((n) => Boolean(n.userId));
  if (validas.length === 0) return true;

  try {
    const payload = validas.map((n) => ({
      user_id: n.userId,
      titulo: n.titulo,
      mensagem: n.mensagem,
      tipo: n.tipo || 'info',
      link: n.link || null,
      lida: false,
    }));

    const { error } = await supabase.from('notificacoes').insert(payload);
    if (error) {
      console.warn('Erro ao criar notificações em lote:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Falha ao criar notificações em lote:', err);
    return false;
  }
}

/**
 * Lista as notificações mais recentes de um usuário ordenadas por data desc.
 */
export async function listarNotificacoes(
  userId: string,
  limite = 30
): Promise<Notificacao[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error || !data) {
      return [];
    }

    return data as Notificacao[];
  } catch (err) {
    console.error('Erro ao listar notificações:', err);
    return [];
  }
}

/**
 * Obtém a contagem de notificações não lidas.
 */
export async function obterContadorNaoLidas(userId: string): Promise<number> {
  if (!userId) return 0;

  try {
    const { count, error } = await supabase
      .from('notificacoes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('lida', false);

    if (error || count === null) return 0;
    return count;
  } catch {
    return 0;
  }
}

/**
 * Marca uma notificação individual como lida.
 */
export async function marcarComoLida(notificacaoId: string): Promise<boolean> {
  if (!notificacaoId) return false;

  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('id', notificacaoId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Marca todas as notificações pendentes do usuário como lidas.
 */
export async function marcarTodasComoLidas(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', userId)
      .eq('lida', false);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Exclui uma notificação específica.
 */
export async function excluirNotificacao(notificacaoId: string): Promise<boolean> {
  if (!notificacaoId) return false;

  try {
    const { error } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', notificacaoId);

    return !error;
  } catch {
    return false;
  }
}
