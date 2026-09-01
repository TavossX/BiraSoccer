// ─── Tipos compartilhados do domínio Copa de Amigos ──────────────────────────

export type ModalidadeJogo = 'eafc' | 'cs2';
export type FormatoTorneio = 'liga' | 'matamata' | 'liga_com_playoffs';
export type StatusTorneio  = 'aguardando_draft' | 'em_andamento' | 'finalizado' | 'configurando';
export type ModoSorteio    = 'pick_ban' | 'sorteio_interativo' | 'sorteio_automatico' | 'manual';
export type TipoJogo       = 'ida' | 'volta' | null;
export type FaseMataMata   = 'oitavas' | 'quartas' | 'semifinal' | 'final' | 'terceiro_lugar' | 'grand_final' | 'bracket_reset';
export type BracketSide    = 'UPPER' | 'LOWER';

export interface Torneio {
  id: string;
  nome: string;
  modalidade?: ModalidadeJogo; // 'eafc' (padrão) ou 'cs2'
  formato: FormatoTorneio;
  status: StatusTorneio;
  criadoEm: string;
  idaEVolta: boolean;          // true = turno duplo / confronto dois jogos
  playoffsGerados: boolean;    // liga_com_playoffs: true após gerarPlayoffs()
  isDoubleElimination: boolean;   // true = Lower Bracket ativo
  modoSorteio?: ModoSorteio;
  turnoDraftAtual?: number;    // Índice do participante da vez no Draft (0 a N-1)
  userId?: string | null;      // ID do criador/Host
  coAdmins?: string[];         // IDs dos usuários co-administradores
  grupoId?: string | null;     // ID do grupo vinculado (se houver)
}

export interface Participante {
  id: string;
  torneioId: string;
  usuarioId?: string | null;     // ID real do auth.users/perfis (opcional, null para convidados locais)
  fotoUsuario?: string | null;   // Foto de perfil do usuário
  nomeAmigo: string;
  timeSorteado: string;
  logoTime?: string;
  // Pick & Ban Multiplayer
  timeBanido?: string;
  logoTimeBanido?: string;
  pickConfirmado?: boolean;
  isConvidado?: boolean;
  // Estatísticas (Liga)
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
}

export interface PlacarFragmentadoCS2 {
  half1A: number;
  half1B: number;
  half2A: number;
  half2B: number;
  otA?: number | null;
  otB?: number | null;
}

export interface EstatisticasAvancadasPartida {
  posseBolaA?: number | null;
  posseBolaB?: number | null;
  chutesA?: number | null;
  chutesB?: number | null;
  amarelosA?: number | null;
  amarelosB?: number | null;
  vermelhosA?: number | null;
  vermelhosB?: number | null;
  placarCS2?: PlacarFragmentadoCS2 | null;
}

export interface Partida {
  id: string;
  torneioId: string;
  rodada: number;                      // Liga: número da rodada | Mata-mata: índice de fase
  fase: FaseMataMata | null;           // null = fase de liga | Playoffs: 'semifinal' | 'final' | 'terceiro_lugar'
  participanteAId: string;
  participanteBId: string;
  placarA: number | null;
  placarB: number | null;
  finalizada: boolean;
  // Mata-mata extra
  jogo: TipoJogo;                      // 'ida' | 'volta' | null (liga / jogo único)
  confrontoId: string | null;          // agrupa ida+volta do mesmo par
  penaltisA: number | null;            // só preenchido em caso de empate agregado
  penaltisB: number | null;
  vencedorId: string | null;           // calculado automaticamente
  perdedorId: string | null;           // calculado automaticamente (usado para 3º lugar)
  // Double Elimination / Lucky Loser
  bracket?: BracketSide;               // undefined = single elimination
  loserNextMatchId?: string | null;    // link para o slot na lower bracket
  isLuckyLoser?: boolean;              // marcação visual "Melhor Perdedor"
  // Estatísticas Avançadas Opcionais
  posseBolaA?: number | null;
  posseBolaB?: number | null;
  chutesA?: number | null;
  chutesB?: number | null;
  amarelosA?: number | null;
  amarelosB?: number | null;
  vermelhosA?: number | null;
  vermelhosB?: number | null;
  placarCS2?: PlacarFragmentadoCS2 | null;
}

export interface ConfiguracaoTorneio {
  nome: string;
  modalidade?: ModalidadeJogo;
  formato: FormatoTorneio;
  idaEVolta: boolean;          // true = turno duplo / confronto dois jogos
  isDoubleElimination?: boolean;   // opcional, default false
  modoSorteio?: ModoSorteio;
  grupoId?: string | null;
  coAdmins?: string[];
  duplas: {
    amigo: string;
    time: string;
    logoTime?: string;
    usuarioId?: string | null;
    fotoUsuario?: string | null;
    isConvidado?: boolean;
  }[];
}

export interface ConfiguracaoDraftTorneio {
  nome: string;
  formato: FormatoTorneio;
  idaEVolta: boolean;
  isDoubleElimination?: boolean;
  grupoId?: string | null;
  coAdmins?: string[];
  participantes: {
    nome: string;
    usuarioId?: string | null;
    fotoUsuario?: string | null;
    isConvidado?: boolean;
  }[];
}

export interface PodioTorneio {
  campeao: Participante | null;
  vice: Participante | null;
  terceiro: Participante | null;
}
