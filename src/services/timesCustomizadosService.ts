import { supabase } from '../lib/supabase';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface TimeCustomizado {
  id: string;
  user_id: string;
  nome: string;
  escudo_base64: string;
  created_at: string;
}

export interface TimeCustomizadoInput {
  nome: string;
  escudo_base64: string;
  user_id: string;
}

// ─── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Lista todos os times customizados do usuário logado.
 */
export async function listarMeusTimes(userId: string): Promise<TimeCustomizado[]> {
  const { data, error } = await supabase
    .from('times_customizados')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

/**
 * Cria um novo time customizado.
 */
export async function criarTime(
  input: TimeCustomizadoInput
): Promise<TimeCustomizado | null> {
  const { data, error } = await supabase
    .from('times_customizados')
    .insert({
      nome: input.nome,
      escudo_base64: input.escudo_base64,
      user_id: input.user_id,
    })
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Atualiza nome e/ou escudo de um time existente.
 */
export async function atualizarTime(
  id: string,
  updates: { nome?: string; escudo_base64?: string }
): Promise<TimeCustomizado | null> {
  const { data, error } = await supabase
    .from('times_customizados')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Exclui um time customizado pelo ID.
 */
export async function excluirTime(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('times_customizados')
    .delete()
    .eq('id', id);

  if (error) {
    return false;
  }

  return true;
}
