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
  elo_rating?: number;
  data_entrada: string;
  perfil?: Perfil;
}

export type EloTierName = 'Bronze' | 'Prata' | 'Ouro' | 'Diamante' | 'Elite';

export interface EloTierInfo {
  nome: EloTierName;
  badge: string;
  minElo: number;
  maxElo: number | null;
  cor: string;
  colorScheme: string;
  bgGradient: string;
}

export interface EloVariacaoResultado {
  deltaA: number;
  deltaB: number;
  novoEloA: number;
  novoEloB: number;
  ratingAnteriorA: number;
  ratingAnteriorB: number;
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

export interface PartidaH2H {
  partidaId: string;
  torneioId: string;
  torneioNome: string;
  formato: string;
  fase: string | null;
  data: string;
  timeA: string;
  logoTimeA?: string;
  placarA: number;
  penaltisA?: number | null;
  timeB: string;
  logoTimeB?: string;
  placarB: number;
  penaltisB?: number | null;
  vencedorUsuarioId: string | null; // null em caso de empate
}

export interface EstatisticasH2H {
  usuarioIdA: string;
  usuarioIdB: string;
  totalJogos: number;
  vitoriasA: number;
  vitoriasB: number;
  empates: number;
  golsA: number;
  golsB: number;
  saldoA: number;
  saldoB: number;
  aproveitamentoA: number;
  aproveitamentoB: number;
  partidas: PartidaH2H[];
}

