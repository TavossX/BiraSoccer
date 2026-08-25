export type TipoNotificacao = 'partida' | 'torneio' | 'conquista' | 'sistema';

export interface Notificacao {
  id: string;
  user_id: string;
  titulo: string;
  mensagem: string;
  tipo: TipoNotificacao;
  lida: boolean;
  link?: string | null;
  created_at: string;
}

export interface NotificacaoInput {
  userId: string;
  titulo: string;
  mensagem: string;
  tipo?: TipoNotificacao;
  link?: string | null;
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  categoria: string;
  pontos_xp: number;
  criado_em?: string;
}

export interface UsuarioConquista {
  id: string;
  user_id: string;
  conquista_id: string;
  desbloqueado_em: string;
  conquista?: Conquista;
}

export interface ConquistaComStatus extends Conquista {
  desbloqueada: boolean;
  desbloqueadaEm?: string;
}
