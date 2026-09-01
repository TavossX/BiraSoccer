import { supabase } from '../lib/supabase';
import type { EloTierInfo, EloVariacaoResultado, GrupoMembro } from '../types/social';
import { criarNotificacao } from './notificacaoService';

export const DEFAULT_ELO = 1200;
export const DEFAULT_K_FACTOR = 32;

/**
 * Retorna as informações visuais e nome do Tier baseado na pontuação Elo.
 */
export function obterEloTier(elo: number): EloTierInfo {
  if (elo >= 1700) {
    return {
      nome: 'Elite',
      badge: '👑',
      minElo: 1700,
      maxElo: null,
      cor: 'purple.400',
      colorScheme: 'purple',
      bgGradient: 'linear(to-r, purple.500, pink.500)',
    };
  }
  if (elo >= 1500) {
    return {
      nome: 'Diamante',
      badge: '💎',
      minElo: 1500,
      maxElo: 1699,
      cor: 'cyan.400',
      colorScheme: 'cyan',
      bgGradient: 'linear(to-r, cyan.400, blue.500)',
    };
  }
  if (elo >= 1300) {
    return {
      nome: 'Ouro',
      badge: '🥇',
      minElo: 1300,
      maxElo: 1499,
      cor: 'yellow.400',
      colorScheme: 'yellow',
      bgGradient: 'linear(to-r, yellow.400, orange.400)',
    };
  }
  if (elo >= 1100) {
    return {
      nome: 'Prata',
      badge: '🥈',
      minElo: 1100,
      maxElo: 1299,
      cor: 'gray.300',
      colorScheme: 'gray',
      bgGradient: 'linear(to-r, gray.400, gray.600)',
    };
  }
  return {
    nome: 'Bronze',
    badge: '🥉',
    minElo: 0,
    maxElo: 1099,
    cor: 'orange.600',
    colorScheme: 'orange',
    bgGradient: 'linear(to-r, orange.600, orange.800)',
  };
}

/**
 * Realiza o cálculo matemático puro do sistema Elo Rating para dois jogadores.
 * Se jogador de Elo baixo vence um de Elo alto, ganha mais pontos.
 * Se houver empate, pontos são transferidos levemente do maior para o menor.
 */
export function calcularVariacaoElo({
  ratingA,
  ratingB,
  placarA,
  placarB,
  penaltisA,
  penaltisB,
  kFactor = DEFAULT_K_FACTOR,
}: {
  ratingA: number;
  ratingB: number;
  placarA: number;
  placarB: number;
  penaltisA?: number | null;
  penaltisB?: number | null;
  kFactor?: number;
}): EloVariacaoResultado {
  const rA = ratingA || DEFAULT_ELO;
  const rB = ratingB || DEFAULT_ELO;

  // 1. Expectativas de vitória (Expected Scores)
  const expA = 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const expB = 1 / (1 + Math.pow(10, (rA - rB) / 400));

  // 2. Pontuação real (Actual Score)
  let scoreA = 0.5;
  if (placarA > placarB) {
    scoreA = 1.0;
  } else if (placarB > placarA) {
    scoreA = 0.0;
  } else {
    // Empate no tempo regulamentar: avalia pênaltis se existirem
    if (
      penaltisA !== null &&
      penaltisA !== undefined &&
      penaltisB !== null &&
      penaltisB !== undefined &&
      penaltisA !== penaltisB
    ) {
      scoreA = penaltisA > penaltisB ? 1.0 : 0.0;
    } else {
      scoreA = 0.5;
    }
  }
  const scoreB = 1.0 - scoreA;

  // 3. Variação de pontos (Delta)
  const deltaA = Math.round(kFactor * (scoreA - expA));
  const deltaB = Math.round(kFactor * (scoreB - expB));

  // 4. Novos ratings (mínimo de 100 pontos)
  const novoEloA = Math.max(100, rA + deltaA);
  const novoEloB = Math.max(100, rB + deltaB);

  return {
    deltaA: novoEloA - rA,
    deltaB: novoEloB - rB,
    novoEloA,
    novoEloB,
    ratingAnteriorA: rA,
    ratingAnteriorB: rB,
  };
}

/**
 * Processa a atualização do Elo de uma partida disputada dentro de um grupo,
 * persistindo as novas pontuações no banco e enviando notificações.
 */
export async function processarEloPartida({
  grupoId,
  usuarioIdA,
  usuarioIdB,
  placarA,
  placarB,
  penaltisA,
  penaltisB,
  torneioNome = 'Torneio',
}: {
  grupoId?: string | null;
  usuarioIdA?: string | null;
  usuarioIdB?: string | null;
  placarA: number;
  placarB: number;
  penaltisA?: number | null;
  penaltisB?: number | null;
  torneioNome?: string;
}): Promise<EloVariacaoResultado | null> {
  if (!grupoId || !usuarioIdA || !usuarioIdB || usuarioIdA === usuarioIdB) {
    return null;
  }

  try {
    // 1. Buscar os membros no grupo
    const { data: membros, error } = await supabase
      .from('grupo_membros')
      .select('id, usuario_id, elo_rating')
      .eq('grupo_id', grupoId)
      .in('usuario_id', [usuarioIdA, usuarioIdB]);

    if (error || !membros || membros.length < 2) {
      return null;
    }

    const membroA = membros.find((m) => m.usuario_id === usuarioIdA);
    const membroB = membros.find((m) => m.usuario_id === usuarioIdB);

    if (!membroA || !membroB) {
      return null;
    }

    const ratingA = membroA.elo_rating ?? DEFAULT_ELO;
    const ratingB = membroB.elo_rating ?? DEFAULT_ELO;

    // 2. Calcular variação
    const resultado = calcularVariacaoElo({
      ratingA,
      ratingB,
      placarA,
      placarB,
      penaltisA,
      penaltisB,
    });

    // 3. Atualizar no banco Supabase
    await Promise.all([
      supabase
        .from('grupo_membros')
        .update({ elo_rating: resultado.novoEloA })
        .eq('id', membroA.id),
      supabase
        .from('grupo_membros')
        .update({ elo_rating: resultado.novoEloB })
        .eq('id', membroB.id),
    ]);

    // 4. Notificar os participantes sobre o ganho/perda de Elo
    const sinalA = resultado.deltaA >= 0 ? `+${resultado.deltaA}` : `${resultado.deltaA}`;
    const sinalB = resultado.deltaB >= 0 ? `+${resultado.deltaB}` : `${resultado.deltaB}`;

    await Promise.all([
      criarNotificacao({
        userId: usuarioIdA,
        titulo: `📊 Ranking Elo Atualizado (${sinalA} pts)`,
        mensagem: `Partida finalizada no torneio "${torneioNome}". Seu novo Elo no grupo é ${resultado.novoEloA} pts.`,
        tipo: 'torneio',
        link: `/grupos/${grupoId}`,
      }),
      criarNotificacao({
        userId: usuarioIdB,
        titulo: `📊 Ranking Elo Atualizado (${sinalB} pts)`,
        mensagem: `Partida finalizada no torneio "${torneioNome}". Seu novo Elo no grupo é ${resultado.novoEloB} pts.`,
        tipo: 'torneio',
        link: `/grupos/${grupoId}`,
      }),
    ]);

    return resultado;
  } catch (err) {
    console.error('Falha ao processar Elo da partida:', err);
    return null;
  }
}

/**
 * Retorna todos os membros do grupo ordenados por Elo Rating em ordem decrescente.
 */
export async function obterRankingGrupo(grupoId: string): Promise<GrupoMembro[]> {
  try {
    const { data, error } = await supabase
      .from('grupo_membros')
      .select('*, perfil:perfis!usuario_id(*)')
      .eq('grupo_id', grupoId)
      .order('elo_rating', { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as GrupoMembro[];
  } catch (err) {
    console.error('Erro ao buscar ranking do grupo:', err);
    return [];
  }
}
