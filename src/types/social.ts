export interface Perfil {
  id: string;
  nome: string;
  foto_base64: string | null;
  steam_id: string | null;
  onboarding_completo: boolean;
  criado_em: string;
}

export interface Grupo {
  id: string;
  nome: string;
  criador_id: string;
  criado_em: string;
  criador?: Perfil;
  total_membros?: number;
}

export interface GrupoMembro {
  id: string;
  grupo_id: string;
  usuario_id: string;
  data_entrada: string;
  perfil?: Perfil;
}

export interface ConviteGrupo {
  id: string;
  token: string;
  grupo_id: string;
  data_expiracao: string | null;
  criado_em: string;
  grupo?: Grupo;
}

export interface ParticipanteTorneioSelecao {
  id: string; // ID único no contexto da seleção (usuario_id ou temp id)
  usuario_id?: string | null; // ID real do Supabase auth/perfis (null para convidados locais)
  nome: string;
  foto_base64?: string | null;
  isConvidado?: boolean;
}
