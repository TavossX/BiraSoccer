import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import type {
  Torneio,
  Participante,
  Partida,
  ConfiguracaoTorneio,
  FaseMataMata,
  FormatoTorneio,
} from '../types/torneio';

// Fases que participam da progressao sequencial do bracket (terceiro_lugar e final sao paralelas ao fim)
const ORDEM_FASES_BRACKET: FaseMataMata[] = ['oitavas', 'quartas', 'semifinal', 'final'];
// Fases que NAO geram proxima fase ao serem concluidas
const FASES_TERMINAIS: FaseMataMata[] = ['final', 'terceiro_lugar'];

// Fisher-Yates shuffle
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Proxima potencia de 2
function proximaPotenciaDe2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Ordenacao de classificacao (pontos > saldo > GP > confronto direto)
export function ordenarParticipantes(
  lista: Participante[],
  partidas: Partida[]
): Participante[] {
  return [...lista].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    const sgA = a.golsPro - a.golsContra;
    const sgB = b.golsPro - b.golsContra;
    if (sgB !== sgA) return sgB - sgA;
    if (b.golsPro !== a.golsPro) return b.golsPro - a.golsPro;
    const confrontos = partidas.filter(
      (p) => p.finalizada &&
        ((p.participanteAId === a.id && p.participanteBId === b.id) ||
         (p.participanteAId === b.id && p.participanteBId === a.id))
    );
    let pontosA = 0, pontosB = 0;
    confrontos.forEach((p) => {
      const aJogouComoA = p.participanteAId === a.id;
      const ga = aJogouComoA ? (p.placarA ?? 0) : (p.placarB ?? 0);
      const gb = aJogouComoA ? (p.placarB ?? 0) : (p.placarA ?? 0);
      if (ga > gb) pontosA += 3;
      else if (ga < gb) pontosB += 3;
      else { pontosA += 1; pontosB += 1; }
    });
    return pontosB - pontosA;
  });
}

// Cria uma partida de liga (sem fase)
function criarPartidaLiga(torneioId: string, aId: string, bId: string, rodada: number): Partida {
  return {
    id: uuidv4(), torneioId, rodada, fase: null,
    participanteAId: aId, participanteBId: bId,
    placarA: null, placarB: null, finalizada: false,
    jogo: null, confrontoId: null, penaltisA: null, penaltisB: null,
    vencedorId: null, perdedorId: null,
  };
}

// Gera partidas Round-Robin
function gerarPartidasLiga(participantes: Participante[], torneioId: string, idaEVolta: boolean): Partida[] {
  const partidas: Partida[] = [];
  const n = participantes.length;
  const lista = n % 2 === 0 ? [...participantes] : [...participantes, null];
  const total = lista.length;
  const rodadas = total - 1;

  for (let r = 0; r < rodadas; r++) {
    for (let i = 0; i < total / 2; i++) {
      const a = lista[i];
      const b = lista[total - 1 - i];
      if (!a || !b) continue;
      partidas.push(criarPartidaLiga(torneioId, a.id, b.id, r + 1));
    }
    lista.splice(1, 0, lista.pop()!);
  }

  if (idaEVolta) {
    const idaPartidas = [...partidas];
    idaPartidas.forEach((p, idx) => {
      partidas.push(criarPartidaLiga(torneioId, p.participanteBId, p.participanteAId, rodadas + idx + 1));
    });
  }

  return partidas;
}

// Gera partidas de mata-mata puro
function gerarPartidasMataMata(participantes: Participante[], torneioId: string, idaEVolta: boolean): Partida[] {
  const partidas: Partida[] = [];
  const totalSlots = proximaPotenciaDe2(participantes.length);
  const shuffled = shuffle(participantes);
  const slots: (Participante | null)[] = [...shuffled];
  while (slots.length < totalSlots) slots.push(null);

  const fases: FaseMataMata[] = ['oitavas', 'quartas', 'semifinal', 'final'];
  const faseIdx = Math.log2(totalSlots) - 1;
  const fase = fases[Math.max(0, faseIdx - 1)] ?? 'quartas';

  for (let i = 0; i < totalSlots; i += 2) {
    const a = slots[i];
    const b = slots[i + 1];
    if (!a) continue;
    if (!b) {
      const confrontoId = uuidv4();
      partidas.push({
        id: uuidv4(), torneioId, rodada: 0, fase,
        participanteAId: a.id, participanteBId: 'BYE',
        placarA: 1, placarB: 0, finalizada: true,
        jogo: idaEVolta ? 'ida' : null,
        confrontoId: idaEVolta ? confrontoId : null,
        penaltisA: null, penaltisB: null,
        vencedorId: a.id, perdedorId: null,
      });
      continue;
    }
    const confrontoId = uuidv4();
    if (idaEVolta) {
      partidas.push({
        id: uuidv4(), torneioId, rodada: 0, fase,
        participanteAId: a.id, participanteBId: b.id,
        placarA: null, placarB: null, finalizada: false,
        jogo: 'ida', confrontoId, penaltisA: null, penaltisB: null,
        vencedorId: null, perdedorId: null,
      });
      partidas.push({
        id: uuidv4(), torneioId, rodada: 0, fase,
        participanteAId: b.id, participanteBId: a.id,
        placarA: null, placarB: null, finalizada: false,
        jogo: 'volta', confrontoId, penaltisA: null, penaltisB: null,
        vencedorId: null, perdedorId: null,
      });
    } else {
      partidas.push({
        id: uuidv4(), torneioId, rodada: 0, fase,
        participanteAId: a.id, participanteBId: b.id,
        placarA: null, placarB: null, finalizada: false,
        jogo: null, confrontoId: null, penaltisA: null, penaltisB: null,
        vencedorId: null, perdedorId: null,
      });
    }
  }

  return partidas;
}

// Cria par de partidas de playoff (jogo unico ou ida+volta)
function criarParPlayoff(
  torneioId: string, aId: string, bId: string,
  fase: FaseMataMata, rodada: number, idaEVolta: boolean
): Partida[] {
  if (idaEVolta) {
    const confrontoId = uuidv4();
    return [
      {
        id: uuidv4(), torneioId, rodada, fase,
        participanteAId: aId, participanteBId: bId,
        placarA: null, placarB: null, finalizada: false,
        jogo: 'ida', confrontoId, penaltisA: null, penaltisB: null,
        vencedorId: null, perdedorId: null,
      },
      {
        id: uuidv4(), torneioId, rodada, fase,
        participanteAId: bId, participanteBId: aId,
        placarA: null, placarB: null, finalizada: false,
        jogo: 'volta', confrontoId, penaltisA: null, penaltisB: null,
        vencedorId: null, perdedorId: null,
      },
    ];
  }
  return [{
    id: uuidv4(), torneioId, rodada, fase,
    participanteAId: aId, participanteBId: bId,
    placarA: null, placarB: null, finalizada: false,
    jogo: null, confrontoId: null, penaltisA: null, penaltisB: null,
    vencedorId: null, perdedorId: null,
  }];
}

// Helper: cria proxima fase do bracket (mata-mata puro)
function criarProximaFaseSeNecessario(
  partidas: Partida[],
  faseAtual: FaseMataMata,
  torneioId: string,
  participantes: Participante[],
  idaEVolta: boolean
): Partida[] {
  // Fases terminais nao geram proxima fase
  if (FASES_TERMINAIS.includes(faseAtual)) return partidas;

  const confrontosDaFase = idaEVolta
    ? partidas.filter((p) => p.fase === faseAtual && p.jogo === 'volta')
    : partidas.filter((p) => p.fase === faseAtual && p.jogo === null);

  const todosResolvidos = confrontosDaFase.every((p) => p.vencedorId);
  if (!todosResolvidos) return partidas;

  const idxAtual = ORDEM_FASES_BRACKET.indexOf(faseAtual);
  if (idxAtual < 0 || idxAtual >= ORDEM_FASES_BRACKET.length - 1) return partidas;

  const proximaFase = ORDEM_FASES_BRACKET[idxAtual + 1];
  const jaExisteProximaFase = partidas.some((p) => p.fase === proximaFase);
  if (jaExisteProximaFase) return partidas;

  const vencedores = confrontosDaFase
    .map((p) => participantes.find((part) => part.id === p.vencedorId)!)
    .filter(Boolean);

  const novasPartidas: Partida[] = [];
  for (let i = 0; i < vencedores.length; i += 2) {
    const a = vencedores[i];
    const b = vencedores[i + 1];
    if (!a || !b) continue;
    novasPartidas.push(...criarParPlayoff(torneioId, a.id, b.id, proximaFase, idxAtual + 1, idaEVolta));
  }

  return [...partidas, ...novasPartidas];
}

// Helper: gera final + 3o lugar apos semifinais concluidas (liga_com_playoffs)
function criarFinalE3oLugarSeNecessario(
  partidas: Partida[],
  torneioId: string,
  participantes: Participante[],
  idaEVolta: boolean
): Partida[] {
  // Verifica se todas as semis estao resolvidas
  const semis = idaEVolta
    ? partidas.filter((p) => p.fase === 'semifinal' && p.jogo === 'volta')
    : partidas.filter((p) => p.fase === 'semifinal' && p.jogo === null);

  if (semis.length < 2) return partidas;
  const todasSemisResolvidas = semis.every((p) => p.vencedorId && p.perdedorId);
  if (!todasSemisResolvidas) return partidas;

  // Evitar duplicar
  const jaExisteFinal = partidas.some((p) => p.fase === 'final');
  if (jaExisteFinal) return partidas;

  const vencedores = semis.map((p) => participantes.find((part) => part.id === p.vencedorId)!).filter(Boolean);
  const perdedores = semis.map((p) => participantes.find((part) => part.id === p.perdedorId)!).filter(Boolean);

  if (vencedores.length < 2 || perdedores.length < 2) return partidas;

  const novasPartidas: Partida[] = [
    // Final: vencedor SF1 x vencedor SF2
    ...criarParPlayoff(torneioId, vencedores[0].id, vencedores[1].id, 'final', 2, idaEVolta),
    // Disputa de 3o: perdedor SF1 x perdedor SF2 (sempre jogo unico)
    {
      id: uuidv4(), torneioId, rodada: 2, fase: 'terceiro_lugar',
      participanteAId: perdedores[0].id, participanteBId: perdedores[1].id,
      placarA: null, placarB: null, finalizada: false,
      jogo: null, confrontoId: null, penaltisA: null, penaltisB: null,
      vencedorId: null, perdedorId: null,
    },
  ];

  return [...partidas, ...novasPartidas];
}

// Tipos da store
interface TorneioState {
  torneio: Torneio | null;
  participantes: Participante[];
  partidas: Partida[];

  criarTorneio: (config: ConfiguracaoTorneio) => void;
  sortearTudo: (config: {
    nome: string;
    formato: FormatoTorneio;
    idaEVolta: boolean;
    amigos: string[];
    times: { nome: string; logo?: string }[];
  }) => void;
  gerarPlayoffs: () => void;
  registrarPlacarLiga: (partidaId: string, placarA: number, placarB: number) => void;
  registrarPlacarMataMata: (
    partidaId: string, placarA: number, placarB: number,
    penaltisA?: number, penaltisB?: number
  ) => void;
  publicarTorneio: () => Promise<string | null>;
  carregarTorneioPublico: (id: string) => Promise<{ user_id: string } | null>;
  resetarTorneio: () => void;
}

export const useTorneioStore = create<TorneioState>()(
  devtools(
    persist(
      (set, get) => ({
      torneio: null,
      participantes: [],
      partidas: [],

      // Criar torneio
      criarTorneio: (config) => {
        const torneioId = uuidv4();
        const torneio: Torneio = {
          id: torneioId,
          nome: config.nome,
          formato: config.formato,
          idaEVolta: config.idaEVolta,
          status: 'em_andamento',
          criadoEm: new Date().toISOString(),
          playoffsGerados: false,
        };

        const participantes: Participante[] = config.duplas.map((dupla) => ({
          id: uuidv4(), torneioId: torneioId,
          nomeAmigo: dupla.amigo,
          timeSorteado: dupla.time,
          logoTime: dupla.logoTime,
          pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0,
          golsPro: 0, golsContra: 0,
        }));

        // liga e liga_com_playoffs: geram apenas as partidas de liga
        const partidas =
          config.formato === 'matamata'
            ? gerarPartidasMataMata(participantes, torneioId, config.idaEVolta)
            : gerarPartidasLiga(participantes, torneioId, config.idaEVolta);

        set({ torneio, participantes, partidas });
        get().publicarTorneio();
      },

      // Sorteio automatico rapido
      sortearTudo: ({ nome, formato, idaEVolta, amigos, times }) => {
        const amigosEmbaralhados = shuffle([...amigos]);
        const timesEmbaralhados  = shuffle([...times]);
        const duplas = amigosEmbaralhados.map((amigo, i) => ({ 
          amigo, 
          time: timesEmbaralhados[i]?.nome || '',
          logoTime: timesEmbaralhados[i]?.logo
        }));
        get().criarTorneio({ nome, formato, idaEVolta, duplas });
      },

      // Gera playoffs para liga_com_playoffs
      gerarPlayoffs: () => {
        const { torneio, participantes, partidas } = get();
        if (!torneio || torneio.formato !== 'liga_com_playoffs' || torneio.playoffsGerados) return;

        // Verifica que todas as partidas de liga estao finalizadas
        const partidasLiga = partidas.filter((p) => p.fase === null);
        if (!partidasLiga.every((p) => p.finalizada)) return;

        // Classifica e pega top 4
        const classificacao = ordenarParticipantes(participantes, partidas);
        const top4 = classificacao.slice(0, 4);
        if (top4.length < 4) return;

        // Chaveamento cruzado: 1o x 4o | 2o x 3o
        const sf1 = criarParPlayoff(torneio.id, top4[0].id, top4[3].id, 'semifinal', 1, torneio.idaEVolta);
        const sf2 = criarParPlayoff(torneio.id, top4[1].id, top4[2].id, 'semifinal', 1, torneio.idaEVolta);

        set({
          torneio: { ...torneio, playoffsGerados: true },
          partidas: [...partidas, ...sf1, ...sf2],
        });
        get().publicarTorneio();
      },

      // Registrar placar (Liga)
      registrarPlacarLiga: (partidaId, placarA, placarB) => {
        const { partidas, participantes } = get();
        const partida = partidas.find((p) => p.id === partidaId);
        if (!partida || partida.finalizada) return;

        const novasPartidas = partidas.map((p) =>
          p.id === partidaId
            ? { ...p, placarA, placarB, finalizada: true,
                vencedorId: placarA > placarB ? p.participanteAId
                           : placarB > placarA ? p.participanteBId : null,
                perdedorId: placarA > placarB ? p.participanteBId
                           : placarB > placarA ? p.participanteAId : null }
            : p
        );

        // Recalcula estatisticas
        const stats = new Map(
          participantes.map((p) => [
            p.id,
            { pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0 },
          ])
        );

        novasPartidas
          .filter((p) => p.finalizada && p.placarA !== null && p.placarB !== null && p.fase === null)
          .forEach((p) => {
            const sa = stats.get(p.participanteAId);
            const sb = stats.get(p.participanteBId);
            if (!sa || !sb) return;
            sa.jogos++; sb.jogos++;
            sa.golsPro += p.placarA!; sb.golsContra += p.placarA!;
            sb.golsPro += p.placarB!; sa.golsContra += p.placarB!;
            if (p.placarA! > p.placarB!) { sa.vitorias++; sa.pontos += 3; sb.derrotas++; }
            else if (p.placarA! < p.placarB!) { sb.vitorias++; sb.pontos += 3; sa.derrotas++; }
            else { sa.empates++; sa.pontos++; sb.empates++; sb.pontos++; }
          });

        const novosParticipantes = participantes.map((p) => ({ ...p, ...stats.get(p.id) }));
        set({ partidas: novasPartidas, participantes: novosParticipantes });
        get().publicarTorneio();
      },

      // Registrar placar (Mata-mata / Playoffs)
      registrarPlacarMataMata: (partidaId, placarA, placarB, penaltisA, penaltisB) => {
        const { torneio, partidas, participantes } = get();
        const partida = partidas.find((p) => p.id === partidaId);
        if (!partida || partida.finalizada) return;

        let novasPartidas = partidas.map((p) =>
          p.id === partidaId
            ? { ...p, placarA, placarB, finalizada: true,
                penaltisA: penaltisA ?? null, penaltisB: penaltisB ?? null }
            : p
        );

        // Jogo Unico (jogo: null, sem confrontoId)
        if (partida.jogo === null && !partida.confrontoId) {
          let vencedorId: string | null = null;
          let perdedorId: string | null = null;

          if (placarA !== placarB) {
            vencedorId = placarA > placarB ? partida.participanteAId : partida.participanteBId;
            perdedorId = placarA > placarB ? partida.participanteBId : partida.participanteAId;
          } else if (penaltisA !== undefined && penaltisB !== undefined && penaltisA !== penaltisB) {
            vencedorId = penaltisA > penaltisB ? partida.participanteAId : partida.participanteBId;
            perdedorId = penaltisA > penaltisB ? partida.participanteBId : partida.participanteAId;
          }

          if (vencedorId && partida.fase !== 'terceiro_lugar') {
            novasPartidas = novasPartidas.map((p) =>
              p.id === partidaId ? { ...p, vencedorId, perdedorId } : p
            );

            if (partida.fase === 'semifinal' && torneio?.formato === 'liga_com_playoffs') {
              novasPartidas = criarFinalE3oLugarSeNecessario(
                novasPartidas, partida.torneioId, participantes, torneio.idaEVolta
              );
            } else if (partida.fase) {
              novasPartidas = criarProximaFaseSeNecessario(
                novasPartidas, partida.fase, partida.torneioId, participantes, false
              );
            }
          } else if (vencedorId && partida.fase === 'terceiro_lugar') {
            novasPartidas = novasPartidas.map((p) =>
              p.id === partidaId ? { ...p, vencedorId, perdedorId } : p
            );
          }

          set({ partidas: novasPartidas });
          get().publicarTorneio();
          return;
        }

        // Ida e Volta
        if (partida.jogo === 'volta' && partida.confrontoId) {
          const confronto = novasPartidas.filter((p) => p.confrontoId === partida.confrontoId);
          const idaPartida  = confronto.find((p) => p.jogo === 'ida');
          const voltaPartida = confronto.find((p) => p.jogo === 'volta');

          if (idaPartida?.finalizada && voltaPartida?.finalizada) {
            const aId = idaPartida.participanteAId;
            const bId = idaPartida.participanteBId;
            const golsA_total = (idaPartida.placarA ?? 0) + (voltaPartida.placarB ?? 0);
            const golsB_total = (idaPartida.placarB ?? 0) + (voltaPartida.placarA ?? 0);

            let vencedorId: string | null = null;
            let perdedorId: string | null = null;

            if (golsA_total !== golsB_total) {
              vencedorId = golsA_total > golsB_total ? aId : bId;
              perdedorId = golsA_total > golsB_total ? bId : aId;
            } else if (penaltisA !== undefined && penaltisB !== undefined) {
              vencedorId = penaltisA > penaltisB ? aId : bId;
              perdedorId = penaltisA > penaltisB ? bId : aId;
            }

            if (vencedorId) {
              novasPartidas = novasPartidas.map((p) =>
                p.confrontoId === partida.confrontoId ? { ...p, vencedorId, perdedorId } : p
              );

              if (partida.fase === 'semifinal' && torneio?.formato === 'liga_com_playoffs') {
                novasPartidas = criarFinalE3oLugarSeNecessario(
                  novasPartidas, partida.torneioId, participantes, torneio.idaEVolta
                );
              } else if (partida.fase) {
                novasPartidas = criarProximaFaseSeNecessario(
                  novasPartidas, partida.fase!, partida.torneioId, participantes, true
                );
              }
            }
          }
        }

        set({ partidas: novasPartidas });
        get().publicarTorneio();
      },

      // Publicar no Supabase
      publicarTorneio: async () => {
        const { torneio, participantes, partidas } = get();
        if (!torneio) return null;

        const payload = {
          id: torneio.id, nome: torneio.nome, formato: torneio.formato,
          status: torneio.status,
          dados: { torneio, participantes, partidas },
          atualizado_em: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('torneios_publicos')
          .upsert(payload, { onConflict: 'id' });

        if (error) { console.error('Erro ao publicar torneio:', error.message); return null; }
        return `${window.location.origin}/convite/${torneio.id}`;
      },

      // Carregar do Supabase
      carregarTorneioPublico: async (id: string) => {
        const { data, error } = await supabase
          .from('torneios_publicos').select('dados, user_id').eq('id', id).single();
        if (error || !data?.dados) return null;
        const { torneio, participantes, partidas } = data.dados as TorneioState;
        set({ torneio, participantes, partidas });
        return { user_id: data.user_id };
      },

      // Resetar
      resetarTorneio: () => set({ torneio: null, participantes: [], partidas: [] }),
      }),
      { name: 'torneio-storage' }
    ),
    { name: 'copa-de-amigos' }
  )
);