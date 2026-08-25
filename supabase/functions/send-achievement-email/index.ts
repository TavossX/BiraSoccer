import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { gerarHtmlEmailConquista } from '../_shared/emailTemplate.ts';

interface WebhookPayload {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    user_id: string;
    conquista_id: string;
    desbloqueado_em?: string;
  };
  // Suporte a chamada direta
  user_id?: string;
  conquista_id?: string;
}

serve(async (req: Request) => {
  // 1. Tratamento de CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Extração do payload do Webhook
    const body: WebhookPayload = await req.json();
    const userId = body.record?.user_id || body.user_id;
    const conquistaId = body.record?.conquista_id || body.conquista_id;

    if (!userId || !conquistaId) {
      return new Response(
        JSON.stringify({
          error: 'user_id e conquista_id são obrigatórios no payload.',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Inicialização do Cliente Supabase com Service Role Key (Admin)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        'Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas.'
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 4. Buscar dados do usuário (auth.users e perfis)
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authUser?.user) {
      console.warn(`Usuário não encontrado em auth.users: ${userId}`);
      return new Response(
        JSON.stringify({ error: `Usuário ${userId} não encontrado.` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const userEmail = authUser.user.email;
    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'Usuário não possui e-mail cadastrado.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Buscar nome de exibição no perfil
    const { data: perfil } = await supabaseAdmin
      .from('perfis')
      .select('nome')
      .eq('id', userId)
      .maybeSingle();

    const nomeUsuario =
      perfil?.nome ||
      authUser.user.user_metadata?.nome ||
      userEmail.split('@')[0] ||
      'Craque';

    // 5. Buscar detalhes da Conquista
    const { data: conquista, error: conquistaError } = await supabaseAdmin
      .from('conquistas')
      .select('*')
      .eq('id', conquistaId)
      .maybeSingle();

    if (conquistaError || !conquista) {
      console.warn(`Conquista não encontrada no catálogo: ${conquistaId}`);
      return new Response(
        JSON.stringify({ error: `Conquista ${conquistaId} não encontrada.` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 6. Gerar Template HTML
    const appUrl = Deno.env.get('APP_URL') || 'https://biranosoccer.vercel.app';
    const htmlEmail = gerarHtmlEmailConquista({
      nomeUsuario,
      tituloConquista: conquista.titulo,
      descricaoConquista: conquista.descricao,
      iconeConquista: conquista.icone || '🏆',
      pontosXp: conquista.pontos_xp || 50,
      appUrl,
    });

    // 7. Envio do E-mail via Gmail SMTP (porta 465 TLS)
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');

    if (!gmailUser || !gmailPassword) {
      console.log(
        '⚠️ GMAIL_USER ou GMAIL_APP_PASSWORD não configuradas. Simulando envio (modo dev):'
      );
      console.log(`Para: ${userEmail} | Conquista: ${conquista.titulo}`);

      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message:
            'E-mail simulado com sucesso. Configure GMAIL_USER e GMAIL_APP_PASSWORD para disparo real.',
          recipient: userEmail,
          conquista: conquista.titulo,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const client = new SmtpClient();

    try {
      // Conectar via TLS direto na porta 465 (padrão Gmail seguro)
      await client.connectTLS({
        hostname: 'smtp.gmail.com',
        port: 465,
        username: gmailUser,
        password: gmailPassword,
      });

      // Disparar o e-mail formatado
      await client.send({
        from: `BiraSoccer <${gmailUser}>`,
        to: userEmail,
        subject: `🏆 Nova Conquista: ${conquista.titulo} (+${conquista.pontos_xp} XP)`,
        html: htmlEmail,
      });

      console.log(`✅ E-mail de conquista enviado via Gmail SMTP para ${userEmail}`);
    } finally {
      try {
        await client.close();
      } catch {
        // Ignora erro ao fechar socket
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recipient: userEmail,
        conquista: conquista.titulo,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erro inesperado na Edge Function send-achievement-email (Gmail SMTP):', error);
    return new Response(
      JSON.stringify({
        error: 'Erro interno ao processar e-mail de conquista via Gmail SMTP.',
        message: (error as Error).message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
