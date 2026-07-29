import { supabase } from '../lib/supabase';

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export interface TimeFutebol {
  id: number;
  nome: string;
  logo: string;
}

/** Estrutura de uma linha na tabela `times_api_cache` */
interface CacheRow {
  api_id: number;
  nome: string;
  logo_url: string;
  search_term: string;
}

// ─── Cache-Aside: searchTeams ──────────────────────────────────────────────────

/**
 * Busca times utilizando o padrão Cache-Aside:
 *  1. Tenta ler do cache (Supabase → `times_api_cache`)
 *  2. Se cache vazio, busca na API Football
 *  3. Popula o cache de forma assíncrona (fire-and-forget)
 *  4. Retorna os resultados normalizados como `TimeFutebol[]`
 *
 * Se o Supabase falhar na leitura, faz fallback silencioso para a API.
 */
export async function searchTeams(query: string): Promise<TimeFutebol[]> {
  if (!query || query.length < 4) return [];

  const termNormalized = query.trim().toLowerCase();

  // ── Passo 1: Cache Hit — consultar Supabase ──────────────────────────────
  try {
    const { data: cacheData, error } = await supabase
      .from('times_api_cache')
      .select('api_id, nome, logo_url')
      .eq('search_term', termNormalized);

    if (!error && cacheData && cacheData.length > 0) {
      // Cache Hit — retorna imediatamente
      return cacheData.map((row) => ({
        id: row.api_id,
        nome: row.nome,
        logo: row.logo_url,
      }));
    }
  } catch {
    // Se o cache falhar, seguimos silenciosamente para a API
    console.warn('[Cache-Aside] Erro ao ler cache, fallback para API.');
  }

  // ── Passo 2: Cache Miss — buscar na API Football ─────────────────────────
  const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
  if (!apiKey) {
    console.error('VITE_FOOTBALL_API_KEY não está definida no arquivo .env');
    return [];
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': apiKey,
        },
      }
    );

    const data = await res.json();

    if (data && data.response) {
      const results: TimeFutebol[] = data.response.map((item: any) => ({
        id: item.team.id,
        nome: item.team.name,
        logo: item.team.logo,
      }));

      // ── Passo 3: Popular Cache (fire-and-forget) ─────────────────────────
      if (results.length > 0) {
        const rows: CacheRow[] = results.map((t) => ({
          api_id: t.id,
          nome: t.nome,
          logo_url: t.logo,
          search_term: termNormalized,
        }));

        // Insert assíncrono — duplicatas são ignoradas silenciosamente
        supabase
          .from('times_api_cache')
          .upsert(rows, { onConflict: 'api_id,search_term', ignoreDuplicates: true })
          .then(({ error: insertError }) => {
            if (insertError) {
              console.warn('[Cache-Aside] Erro ao popular cache (silenciado):', insertError.message);
            }
          });
      }

      // ── Passo 4: Retorna os dados para a interface ───────────────────────
      return results;
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar times da API-Football:', error);
    return [];
  }
}
