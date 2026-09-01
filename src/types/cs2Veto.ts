// ─── Tipos e Modelos do Sistema de Veto de Mapas do CS2 ───────────────────

export type CS2MapId =
  | 'mirage'
  | 'inferno'
  | 'nuke'
  | 'overpass'
  | 'vertigo'
  | 'ancient'
  | 'anubis';

export interface CS2MapInfo {
  id: CS2MapId;
  nome: string;
  nomeCodigo: string;
  imagem: string;
  descricao: string;
  localizacao: string;
}

export const CS2_ACTIVE_DUTY_MAPS: CS2MapInfo[] = [
  {
    id: 'mirage',
    nome: 'Mirage',
    nomeCodigo: 'de_mirage',
    imagem:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=80',
    descricao: 'Clássico com controle de meio dinâmico, palácio e conexões rápidas.',
    localizacao: 'Oriente Médio',
  },
  {
    id: 'inferno',
    nome: 'Inferno',
    nomeCodigo: 'de_inferno',
    imagem:
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&auto=format&fit=crop&q=80',
    descricao: 'Bananas estreitas, tapetes e execuções explosivas no bombsite B.',
    localizacao: 'Itália',
  },
  {
    id: 'nuke',
    nome: 'Nuke',
    nomeCodigo: 'de_nuke',
    imagem:
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    descricao: 'Complexo nuclear vertical com bombsites A e B sobrepostos e duto.',
    localizacao: 'Estados Unidos',
  },
  {
    id: 'overpass',
    nome: 'Overpass',
    nomeCodigo: 'de_overpass',
    imagem:
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
    descricao: 'Parque e canais urbanos em Berlim com disputa de banheiros e esgoto.',
    localizacao: 'Alemanha',
  },
  {
    id: 'vertigo',
    nome: 'Vertigo',
    nomeCodigo: 'de_vertigo',
    imagem:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    descricao: 'Arranha-céu em construção de 51 andares com quedas letais e rampas.',
    localizacao: 'Estados Unidos',
  },
  {
    id: 'ancient',
    nome: 'Ancient',
    nomeCodigo: 'de_ancient',
    imagem:
      'https://images.unsplash.com/photo-1518709766631-a6a7f45921c3?w=800&auto=format&fit=crop&q=80',
    descricao: 'Ruínas arqueológicas na selva com controle do meio e templos maias.',
    localizacao: 'América Central',
  },
  {
    id: 'anubis',
    nome: 'Anubis',
    nomeCodigo: 'de_anubis',
    imagem:
      'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    descricao: 'Pirâmides e canais com águas rasas, pontes e múltiplas rotas no meio.',
    localizacao: 'Egito',
  },
];

export type FormatoVeto = 'BO1' | 'BO3';
export type VetoActionType = 'BAN' | 'PICK' | 'DECIDER';
export type StatusMapaVeto = 'disponivel' | 'banido' | 'escolhido' | 'decider';

export interface VetoPasso {
  indice: number;
  time: 'A' | 'B';
  acao: VetoActionType;
  mapaId?: string | null;
  mapaNome?: string | null;
  mapaOrdem?: number; // 1, 2 ou 3 para mapas que serão jogados
  descricao: string;
}

export interface MapVetoStatusInfo {
  status: StatusMapaVeto;
  acaoPor?: 'A' | 'B' | 'DECIDER';
  passoIndice?: number;
  mapaOrdem?: number; // 1, 2 ou 3
}

export interface MapaFinalJogo {
  mapaId: string;
  mapaNome: string;
  ordem: number; // 1, 2 ou 3
  escolhidoPor: 'A' | 'B' | 'DECIDER';
  tipo: 'PICK' | 'DECIDER';
}

export interface CS2VetoState {
  id: string;
  formato: FormatoVeto;
  timeA: {
    id: string;
    nome: string;
    avatar?: string | null;
    capitaoId?: string | null;
    capitaoNome?: string;
  };
  timeB: {
    id: string;
    nome: string;
    avatar?: string | null;
    capitaoId?: string | null;
    capitaoNome?: string;
  };
  passos: VetoPasso[];
  passoAtual: number;
  mapasStatus: Record<string, MapVetoStatusInfo>;
  concluido: boolean;
  mapasFinais: MapaFinalJogo[];
  hostUserId?: string | null;
}

/**
 * Gera a sequência oficial de passos de veto conforme o formato competitivo escolhido (BO1 ou BO3).
 */
export function gerarPassosVeto(
  formato: FormatoVeto,
  nomeTimeA = 'Time A',
  nomeTimeB = 'Time B'
): VetoPasso[] {
  if (formato === 'BO1') {
    return [
      { indice: 0, time: 'A', acao: 'BAN', descricao: `${nomeTimeA} Bane um Mapa` },
      { indice: 1, time: 'B', acao: 'BAN', descricao: `${nomeTimeB} Bane um Mapa` },
      { indice: 2, time: 'A', acao: 'BAN', descricao: `${nomeTimeA} Bane um Mapa` },
      { indice: 3, time: 'B', acao: 'BAN', descricao: `${nomeTimeB} Bane um Mapa` },
      { indice: 4, time: 'A', acao: 'BAN', descricao: `${nomeTimeA} Bane um Mapa` },
      { indice: 5, time: 'B', acao: 'BAN', descricao: `${nomeTimeB} Bane o Último Mapa` },
    ];
  }

  // BO3 Sequence
  return [
    { indice: 0, time: 'A', acao: 'BAN', descricao: `${nomeTimeA} Bane um Mapa` },
    { indice: 1, time: 'B', acao: 'BAN', descricao: `${nomeTimeB} Bane um Mapa` },
    { indice: 2, time: 'A', acao: 'PICK', mapaOrdem: 1, descricao: `${nomeTimeA} Escolhe o Mapa 1 (Pick)` },
    { indice: 3, time: 'B', acao: 'PICK', mapaOrdem: 2, descricao: `${nomeTimeB} Escolhe o Mapa 2 (Pick)` },
    { indice: 4, time: 'A', acao: 'BAN', descricao: `${nomeTimeA} Bane um Mapa` },
    { indice: 5, time: 'B', acao: 'BAN', descricao: `${nomeTimeB} Bane um Mapa` },
  ];
}
