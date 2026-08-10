// ─── Tipos compartilhados do domínio Copa de Amigos ──────────────────────────

export type FormatoTorneio = 'liga' | 'matamata' | 'liga_com_playoffs';
export type StatusTorneio  = 'configurando' | 'em_andamento' | 'finalizado';
export type TipoJogo       = 'ida' | 'volta' | null;
export type FaseMataMata   = 'oitavas' | 'quartas' | 'semifinal' | 'final' | 'terceiro_lugar';

export interface Torneio {
  id: string;
  nome: string;
  formato: FormatoTorneio;
  status: StatusTorneio;
  criadoEm: string;
  idaEVolta: boolean;          // true = turno duplo / confronto dois jogos
  playoffsGerados: boolean;    // liga_com_playoffs: true após gerarPlayoffs()
}

export interface Participante {
  id: string;
  torneioId: string;
  usuarioId?: string | null;     // ID real do auth.users/perfis (opcional, null para convidados locais)
  fotoUsuario?: string | null;   // Foto de perfil do usuário
  nomeAmigo: string;
  timeSorteado: string;
  logoTime?: string;
  // Estatísticas (Liga)
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsPro: number;
  golsContra: number;
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
}

export interface ConfiguracaoTorneio {
  nome: string;
  formato: FormatoTorneio;
  idaEVolta: boolean;          // true = turno duplo / confronto dois jogos
  duplas: {
    amigo: string;
    time: string;
    logoTime?: string;
    usuarioId?: string | null;
    fotoUsuario?: string | null;
  }[];
}

