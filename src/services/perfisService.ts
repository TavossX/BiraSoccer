import { supabase } from '../lib/supabase';
import type { Perfil } from '../types/social';

export async function obterPerfil(usuarioId: string): Promise<Perfil | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', usuarioId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao obter perfil:', error.message);
    return null;
  }
  return data;
}

export async function atualizarPerfil(
  usuarioId: string,
  dados: {
    nome: string;
    steam_id?: string | null;
    foto_base64?: string | null;
    onboarding_completo?: boolean;
  }
): Promise<Perfil | null> {
  const payload = {
    id: usuarioId,
    nome: dados.nome,
    steam_id: dados.steam_id ?? null,
    foto_base64: dados.foto_base64 ?? null,
    onboarding_completo: dados.onboarding_completo ?? true,
  };

  const { data, error } = await supabase
    .from('perfis')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao atualizar perfil:', error.message);
    throw error;
  }
  return data;
}
