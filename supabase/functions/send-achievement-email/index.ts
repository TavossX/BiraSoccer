import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.13';
import { corsHeaders } from '../_shared/cors.ts';
import { gerarHtmlEmailConquista } from '../_shared/emailTemplate.ts';
import { LOGO_BASE64 } from '../_shared/logoBase64.ts';

interface WebhookPayload {
  type?: string;
  table?: string;
  record?: {
    id?: string;
    user_id: string;
    conquista_id: string;
    desbloqueado_em?: string;
  };
  // Suporte a chamada direta/manual
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
    let body: WebhookPayload;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Payload JSON inválido.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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

    // 5. Buscar detalhes da Conquista (ou auto-cadastrar se for nova)
    let { data: conquista, error: conquistaError } = await supabaseAdmin
      .from('conquistas')
      .select('*')
      .eq('id', conquistaId)
      .maybeSingle();

    if (!conquista && conquistaId === 'cui_do_birasoccer') {
      const { data: nova } = await supabaseAdmin
        .from('conquistas')
        .insert({
          id: 'cui_do_birasoccer',
          titulo: 'Cui do BiraSoccer',
          descricao: 'Primeiro cui a usar o BiraSoccer - conquista limitada.',
          icone: '💎',
          categoria: 'especial',
          pontos_xp: 100,
        })
        .select()
        .single();
      conquista = nova;
    }

    if (!conquista) {
      console.warn(`Conquista não encontrada no catálogo: ${conquistaId}`);
      return new Response(
        JSON.stringify({ error: `Conquista ${conquistaId} não encontrada.` }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Persistir o desbloqueio no banco e gerar notificação in-app
    await supabaseAdmin
      .from('usuario_conquistas')
      .upsert({ user_id: userId, conquista_id: conquista.id }, { onConflict: 'user_id,conquista_id' });

    await supabaseAdmin
      .from('notificacoes')
      .insert({
        user_id: userId,
        titulo: `🏆 Conquista Desbloqueada: ${conquista.titulo}!`,
        mensagem: `${conquista.icone || '🏆'} ${conquista.descricao} (+${conquista.pontos_xp} XP)`,
        tipo: 'conquista',
        link: '/dashboard',
        lida: false,
      });

    // 6. Gerar Template HTML
    const appUrl = Deno.env.get('APP_URL') || 'https://birasoccer.vercel.app';
    const htmlEmail = gerarHtmlEmailConquista({
      nomeUsuario,
      tituloConquista: conquista.titulo,
      descricaoConquista: conquista.descricao,
      iconeConquista: conquista.icone || '🏆',
      pontosXp: conquista.pontos_xp || 50,
      appUrl,
    });

    // 7. Envio do E-mail via Gmail SMTP com Nodemailer
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

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    const info = await transporter.sendMail({
      from: `"BiraSoccer" <${gmailUser}>`,
      to: userEmail,
      subject: `🏆 Nova Conquista: ${conquista.titulo} (+${conquista.pontos_xp} XP)`,
      text: `Fala, ${nomeUsuario}!\n\nVocê acabou de desbloquear a conquista "${conquista.titulo}" (+${conquista.pontos_xp} XP) no BiraSoccer.\n\nDescrição: ${conquista.descricao}\n\nAcesse seu mural de troféus: ${appUrl}/dashboard\n\n© 2026 BiraSoccer`,
      html: htmlEmail,
      attachments: [
        {
          filename: 'logo.png',
          content: LOGO_BASE64,
          encoding: 'base64',
          cid: 'birasoccer_logo',
        },
      ],
      headers: {
        'X-Entity-Ref-ID': `${userId}-${conquistaId}-${Date.now()}`,
        'List-Unsubscribe': `<${appUrl}/dashboard>`,
      },
    });

    console.log(
      `✅ E-mail de conquista enviado via Gmail SMTP para ${userEmail} (MessageId: ${info.messageId})`
    );

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
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
