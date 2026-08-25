import { supabase } from '../lib/supabase';
import type { Conquista, ConquistaComStatus, UsuarioConquista } from '../types/gamificacao';
import { criarNotificacao } from './notificacaoService';
import type { Torneio, PodioTorneio } from '../types/torneio';

export const CONQUISTAS_FALLBACK: Conquista[] = [
  {
    id: 'primeiro_gol',
    titulo: 'Primeiro Gol',
    descricao: 'Marcou seu primeiro gol em uma partida oficial.',
    icone: '⚽',
    categoria: 'partidas',
    pontos_xp: 50,
  },
  {
    id: 'levantou_taca',
    titulo: 'Levantou a Taça',
    descricao: 'Consagrou-se o grande campeão de um torneio.',
    icone: '🏆',
    categoria: 'torneios',
    pontos_xp: 150,
  },
  {
    id: 'estreia_de_fogo',
    titulo: 'Estreia de Fogo',
    descricao: 'Disputou sua primeira partida oficial na plataforma.',
    icone: '🔥',
    categoria: 'partidas',
    pontos_xp: 30,
  },
  {
    id: 'rei_do_draft',
    titulo: 'Rei do Draft',
    descricao: 'Participou de um torneio com sistema de Pick & Ban.',
    icone: '👑',
    categoria: 'draft',
    pontos_xp: 50,
  },
  {
    id: 'goleador',
    titulo: 'Goleador Nato',
    descricao: 'Marcou 5 ou mais gols em uma única partida.',
    icone: '🎯',
    categoria: 'partidas',
    pontos_xp: 100,
  },
  {
    id: 'paredao',
    titulo: 'Paredão / Clean Sheet',
    descricao: 'Venceu uma partida sem sofrer nenhum gol.',
    icone: '🛡️',
    categoria: 'partidas',
    pontos_xp: 100,
  },
];

/**
 * Lista todas as conquistas disponíveis no catálogo do jogo.
 */
export async function listarCatalogoConquistas(): Promise<Conquista[]> {
  try {
    const { data, error } = await supabase
      .from('conquistas')
      .select('*')
      .order('pontos_xp', { ascending: true });

    if (error || !data || data.length === 0) {
      return CONQUISTAS_FALLBACK;
    }
    return data as Conquista[];
  } catch {
    return CONQUISTAS_FALLBACK;
  }
}

/**
 * Lista as conquistas que um usuário específico já desbloqueou.
 */
export async function listarConquistasUsuario(userId: string): Promise<UsuarioConquista[]> {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('usuario_conquistas')
      .select('id, user_id, conquista_id, desbloqueado_em, conquistas (*)')
      .eq('user_id', userId);

    if (error || !data) return [];

    return data.map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      conquista_id: item.conquista_id,
      desbloqueado_em: item.desbloqueado_em,
      conquista: item.conquistas || undefined,
    }));
  } catch (err) {
    console.error('Erro ao buscar conquistas do usuário:', err);
    return [];
  }
}

/**
 * Retorna o catálogo completo de troféus com a indicação de quais estão desbloqueados pelo usuário.
 */
export async function obterMuralConquistas(userId: string | null): Promise<ConquistaComStatus[]> {
  const catalogo = await listarCatalogoConquistas();
  if (!userId) {
    return catalogo.map((c) => ({ ...c, desbloqueada: false }));
  }

  const desbloqueadas = await listarConquistasUsuario(userId);
  const mapDesbloqueadas = new Map<string, string>();
  desbloqueadas.forEach((u) => mapDesbloqueadas.set(u.conquista_id, u.desbloqueado_em));

  return catalogo.map((c) => ({
    ...c,
    desbloqueada: mapDesbloqueadas.has(c.id),
    desbloqueadaEm: mapDesbloqueadas.get(c.id),
  }));
}

/**
 * Desbloqueia uma conquista para um usuário e dispara notificação in-app em tempo real.
 */
export async function desbloquearConquista(
  userId: string,
  conquistaId: string
): Promise<boolean> {
  if (!userId || !conquistaId) return false;

  try {
    // 1. Verificar se o usuário já possui a conquista
    const { data: existente } = await supabase
      .from('usuario_conquistas')
      .select('id')
      .eq('user_id', userId)
      .eq('conquista_id', conquistaId)
      .maybeSingle();

    if (existente) {
      // Já conquistou anteriormente
      return false;
    }

    // 2. Inserir o registro de desbloqueio
    const { error: insertError } = await supabase.from('usuario_conquistas').insert({
      user_id: userId,
      conquista_id: conquistaId,
      desbloqueado_em: new Date().toISOString(),
    });

    if (insertError) {
      console.warn('Erro ao inserir conquista do usuário:', insertError.message);
      return false;
    }

    // 3. Obter dados da conquista para notificação
    const catalogo = await listarCatalogoConquistas();
    const meta = catalogo.find((c) => c.id === conquistaId) || CONQUISTAS_FALLBACK.find((c) => c.id === conquistaId);

    // 4. Disparar notificação in-app para o usuário
    await criarNotificacao({
      userId,
      titulo: `🏆 Conquista Desbloqueada: ${meta?.titulo || 'Novo Troféu'}!`,
      mensagem: `${meta?.icone || '🎖️'} ${meta?.descricao || 'Parabéns pela conquista!'} (+${meta?.pontos_xp || 50} XP)`,
      tipo: 'conquista',
      link: '/dashboard',
    });

    return true;
  } catch (err) {
    console.error('Falha ao processar desbloqueio de conquista:', err);
    return false;
  }
}

/**
 * Gatilho executado ao salvar o placar de uma partida.
 * Avalia 'primeiro_gol', 'estreia_de_fogo', 'goleador' e 'paredao'.
 */
export async function verificarGatilhosPartida({
  usuarioIdA,
  usuarioIdB,
  placarA,
  placarB,
  nomeAmigoA,
  nomeAmigoB,
  timeA,
  timeB,
  torneioId,
  torneioNome,
}: {
  usuarioIdA?: string | null;
  usuarioIdB?: string | null;
  placarA: number;
  placarB: number;
  nomeAmigoA: string;
  nomeAmigoB: string;
  timeA: string;
  timeB: string;
  torneioId: string;
  torneioNome: string;
}): Promise<void> {
  const linkTorneio = `/convite/${torneioId}`;

  // 1. Notificações de partida para os dois jogadores
  if (usuarioIdA) {
    await criarNotificacao({
      userId: usuarioIdA,
      titulo: '⚽ Placar Atualizado!',
      mensagem: `Partida finalizada: ${timeA} ${placarA} x ${placarB} ${timeB} (${torneioNome})`,
      tipo: 'partida',
      link: linkTorneio,
    });
  }

  if (usuarioIdB) {
    await criarNotificacao({
      userId: usuarioIdB,
      titulo: '⚽ Placar Atualizado!',
      mensagem: `Partida finalizada: ${timeA} ${placarA} x ${placarB} ${timeB} (${torneioNome})`,
      tipo: 'partida',
      link: linkTorneio,
    });
  }

  // 2. Conquistas para Jogador A
  if (usuarioIdA) {
    // Estreia de Fogo
    await desbloquearConquista(usuarioIdA, 'estreia_de_fogo');

    // Primeiro Gol
    if (placarA > 0) {
      await desbloquearConquista(usuarioIdA, 'primeiro_gol');
    }

    // Goleador Nato (5+ gols em um jogo)
    if (placarA >= 5) {
      await desbloquearConquista(usuarioIdA, 'goleador');
    }

    // Paredão / Clean Sheet (venceu sem levar gols)
    if (placarA > placarB && placarB === 0) {
      await desbloquearConquista(usuarioIdA, 'paredao');
    }
  }

  // 3. Conquistas para Jogador B
  if (usuarioIdB) {
    // Estreia de Fogo
    await desbloquearConquista(usuarioIdB, 'estreia_de_fogo');

    // Primeiro Gol
    if (placarB > 0) {
      await desbloquearConquista(usuarioIdB, 'primeiro_gol');
    }

    // Goleador Nato (5+ gols em um jogo)
    if (placarB >= 5) {
      await desbloquearConquista(usuarioIdB, 'goleador');
    }

    // Paredão / Clean Sheet (venceu sem levar gols)
    if (placarB > placarA && placarA === 0) {
      await desbloquearConquista(usuarioIdB, 'paredao');
    }
  }
}

/**
 * Gatilho executado ao finalizar um torneio.
 * Notifica os participantes e libera a conquista "Levantou a Taça" para o campeão.
 */
export async function verificarGatilhosTorneioFinalizado(
  torneio: Torneio,
  podio: PodioTorneio,
  todosParticipantes: { usuarioId?: string | null; nomeAmigo: string }[]
): Promise<void> {
  if (!podio.campeao) return;

  const campeao = podio.campeao;
  const linkTorneio = `/convite/${torneio.id}`;

  // 1. Se o campeão tiver conta vinculada, conceder "Levantou a Taça" e notificar
  if (campeao.usuarioId) {
    await desbloquearConquista(campeao.usuarioId, 'levantou_taca');
    await criarNotificacao({
      userId: campeao.usuarioId,
      titulo: '🏆 É CAMPEÃO! Você levantou a taça!',
      mensagem: `Parabéns! Você conquistou o título do torneio "${torneio.nome}" com ${campeao.timeSorteado}.`,
      tipo: 'conquista',
      link: linkTorneio,
    });
  }

  // 2. Notificar demais participantes sobre o fim do torneio
  const outrosParticipantes = todosParticipantes.filter(
    (p) => p.usuarioId && p.usuarioId !== campeao.usuarioId
  );

  for (const participante of outrosParticipantes) {
    if (participante.usuarioId) {
      await criarNotificacao({
        userId: participante.usuarioId,
        titulo: '🏁 Torneio Finalizado!',
        mensagem: `O torneio "${torneio.nome}" chegou ao fim. Campeão: ${campeao.nomeAmigo} (${campeao.timeSorteado}).`,
        tipo: 'torneio',
        link: linkTorneio,
      });
    }
  }
}
