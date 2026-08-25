export interface EmailConquistaProps {
  nomeUsuario: string;
  tituloConquista: string;
  descricaoConquista: string;
  iconeConquista: string;
  pontosXp: number;
  appUrl?: string;
}

/**
 * Gera o corpo HTML/CSS responsivo com suporte a Dark Mode para o e-mail de conquista do BiraSoccer.
 */
export function gerarHtmlEmailConquista({
  nomeUsuario,
  tituloConquista,
  descricaoConquista,
  iconeConquista,
  pontosXp,
  appUrl = 'https://biranosoccer.vercel.app',
}: EmailConquistaProps): string {
  const urlMural = `${appUrl.replace(/\/$/, '')}/dashboard`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🏆 Nova Conquista Desbloqueada - BiraSoccer</title>
  <style>
    /* Reset & Base */
    body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #f8fafc;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b0f19;
      padding: 40px 12px;
    }
    .main-card {
      max-width: 540px;
      margin: 0 auto;
      background-color: #131b2e;
      border-radius: 20px;
      border: 1px solid #23314e;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      overflow: hidden;
    }
    /* Barra degradê topo */
    .top-gradient {
      height: 6px;
      background: linear-gradient(90deg, #C80000 0%, #F94A29 50%, #FDBB00 100%);
    }
    /* Header */
    .header {
      padding: 32px 24px 20px 24px;
      text-align: center;
      background: linear-gradient(180deg, #18233c 0%, #131b2e 100%);
      border-bottom: 1px solid #1e293b;
    }
    .brand-title {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin: 0;
      background: linear-gradient(90deg, #F94A29, #FDBB00);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      display: inline-block;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 4px;
    }
    /* Conteúdo */
    .content {
      padding: 36px 32px;
      text-align: center;
    }
    /* Box do Troféu */
    .trophy-badge {
      width: 88px;
      height: 88px;
      margin: 0 auto 20px auto;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(253, 187, 0, 0.25) 0%, rgba(249, 74, 41, 0.1) 70%, transparent 100%);
      border: 2px solid #FDBB00;
      box-shadow: 0 0 25px rgba(253, 187, 0, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 42px;
      line-height: 88px;
    }
    .tag-conquista {
      display: inline-block;
      background: rgba(253, 187, 0, 0.15);
      color: #FDBB00;
      border: 1px solid rgba(253, 187, 0, 0.4);
      padding: 4px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 12px;
    }
    h2 {
      color: #ffffff;
      font-size: 24px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .user-greeting {
      color: #cbd5e1;
      font-size: 15px;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    /* Cartão interno de detalhes da conquista */
    .achievement-card {
      background-color: #0b0f19;
      border-radius: 14px;
      border: 1px solid #1e293b;
      padding: 20px;
      margin: 24px 0;
      text-align: center;
    }
    .achievement-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 800;
      margin: 0 0 6px 0;
    }
    .achievement-desc {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.5;
      margin: 0 0 14px 0;
    }
    .xp-badge {
      display: inline-block;
      background: linear-gradient(135deg, #F94A29, #FDBB00);
      color: #ffffff;
      font-size: 13px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 8px;
    }
    /* Botão CTA */
    .btn-container {
      margin: 32px 0 16px 0;
    }
    .btn {
      display: inline-block;
      padding: 15px 36px;
      background: linear-gradient(135deg, #F94A29 0%, #d83416 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      border-radius: 12px;
      box-shadow: 0 6px 20px rgba(249, 74, 41, 0.45);
      letter-spacing: 0.3px;
    }
    /* Rodapé */
    .footer {
      padding: 24px;
      text-align: center;
      background-color: #0b0f19;
      border-top: 1px solid #1e293b;
    }
    .footer p {
      color: #64748b;
      font-size: 12px;
      margin: 0 0 6px 0;
      line-height: 1.4;
    }
    .footer a {
      color: #94a3b8;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main-card">
      <!-- Tarja topo degradê BiraSoccer -->
      <div class="top-gradient"></div>

      <!-- Header -->
      <div class="header">
        <div class="brand-title">BIRASOCCER</div>
        <div class="brand-subtitle">Campeonatos de EAFC & Amigos</div>
      </div>

      <!-- Conteúdo Principal -->
      <div class="content">
        <!-- Ícone do Troféu com Brilho -->
        <div class="trophy-badge">
          ${iconeConquista || '🏆'}
        </div>

        <div>
          <span class="tag-conquista">🏆 Conquista Desbloqueada</span>
        </div>

        <h2>Mandou bem no campo!</h2>
        <p class="user-greeting">
          Fala, <strong>${nomeUsuario}</strong>! Você acabou de desbloquear um novo marco na sua carreira no BiraSoccer.
        </p>

        <!-- Cartão da Conquista -->
        <div class="achievement-card">
          <div class="achievement-title">${tituloConquista}</div>
          <div class="achievement-desc">${descricaoConquista}</div>
          <div>
            <span class="xp-badge">+${pontosXp} XP Adicionado</span>
          </div>
        </div>

        <!-- Botão CTA -->
        <div class="btn-container">
          <a href="${urlMural}" class="btn" target="_blank">
            Ver meu Mural de Troféus
          </a>
        </div>
      </div>

      <!-- Rodapé -->
      <div class="footer">
        <p>© 2026 BiraSoccer. Todos os direitos reservados.</p>
        <p>Você recebeu este e-mail porque possui notificações de conquistas ativadas na sua conta.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
