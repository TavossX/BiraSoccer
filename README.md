<div align="center">

  <img src="./src/assets/logos/LogoCompleta.png" alt="BiraSoccer Logo" width="420" />

  <p align="center">
    <strong>A plataforma definitiva para organização, sorteio e gestão multiplayer de torneios de EA Sports FC e futebol.</strong>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Chakra_UI-319795?style=for-the-badge&logo=chakraui&logoColor=white" alt="Chakra UI" />
    <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    <img src="https://img.shields.io/badge/Status-Produção_Pronta-F94A29?style=for-the-badge" alt="Status" />
  </p>

</div>

---

## Sobre o BiraSoccer

O **BiraSoccer** nasceu para transformar a tradicional "resenha" de videogame em uma experiência profissional de e-Sports. Ele substitui planilhas manuais e anotações improvisadas por um ecossistema completo em tempo real, onde os jogadores participam ativamente desde a fase de **Pick & Ban** dos times até a consagração no **Pódio dos Campeões**.

Desenvolvido com foco obsessivo em **UI/UX Mobile-First**, acessibilidade **WCAG AA** e arquitetura reativa moderna com **Supabase Realtime**.

---

## Funcionalidades em Destaque

### 1. Sala de Draft & Pick/Ban Multiplayer em Tempo Real
- **Escolha e Banimento Simultâneo:** Cada jogador conectado escolhe e bane seu clube diretamente pelo próprio smartphone/PC.
- **Exclusão Mútua Automática:** Clubes banidos ou já escolhidos ficam indisponíveis para os demais participantes da rodada.
- **Sorteio ou Reordenação Manual:** O Host pode embaralhar as posições ou **arrastar os cards (Drag & Drop)** para personalizar a fila de escolha.
- **Host Override para Convidados:** O anfitrião pode selecionar no lugar de amigos convidados ou ausentes sem travar o fluxo da sala.
- **Arquitetura Broadcast (RLS-Safe):** Comunicação *Peer-to-Host* via canais de Realtime Broadcast do Supabase, contornando travas de Row Level Security sem comprometer a segurança.

### 2. Formatos Competitivos Completos
- **Pontos Corridos (Liga Clássica):** Turno único ou Ida e Volta, com classificação atualizada automaticamente (Pontos &rarr; Saldo de Gols &rarr; Gols Pró &rarr; Confronto Direto).
- **Mata-Mata (Eliminação Simples):** Chaveamento com cruzamentos automáticos, suporte a agregados e mecanismo de **Lucky Loser** (balanceamento dinâmico de chaves ímpares).
- **Double Elimination (Repescagem):** Chave Superior (Upper Bracket), Chave Inferior (Lower Bracket), Grand Final e **Bracket Reset nativo**.
- **Liga + Playoffs (Híbrido):** Fase de grupos em pontos corridos que classifica automaticamente o Top 4 para as semifinais e finais.

### 3. Hub do Jogador & Sistema de Co-Administradores
- **Dashboard Pessoal:** Abas exclusivas para *"Meus Torneios"* e *"Torneios que Participo"*, exibindo time comandado e status em tempo real.
- **Co-Admins:** O anfitrião pode nomear administradores assistentes com permissão de lançar placares e avançar fases de jogo.
- **Perfil do Jogador:** Estatísticas globais (vitórias, gols, torneios disputados), medalhas acumuladas, Steam ID e upload de avatar com recorte circular (*crop*).

### 4. Grupos de Amigos & Histórico com Pódio
- **Mural do Grupo:** Criação de grupos com links de convite únicos para reunir a panela.
- **Histórico Oficial:** Registro permanente de todas as copas disputadas pelo grupo.
- **Pódio Visual:** Destaque automático dos 3 primeiros colocados (Campeão 🥇, Vice 🥈 e 3º Lugar 🥉).

### 5. Times Customizados & Cache-Aside Inteligente
- **Criação de Clubes:** Criação de times personalizados com upload de escudos locais.
- **Cache-Aside da API-Football:** Consultas à base de dados mundial com cache local no Supabase, economizando requisições e garantindo alta performance de busca.

### 6. Design System & Responsividade Mobile
- **Menu Hambúrguer (Drawer):** Navegação lateral ergonômica e fluida para smartphones.
- **Tabelas Adaptativas em Cards Verticais:** As tabelas de pontos se convertem automaticamente em cards empilhados no mobile, eliminando rolagens laterais desconfortáveis.
- **Dark & Light Mode:** Suporte nativo a temas com paleta de contraste premium (`#F94A29` Brand Orange, `#FDBB00` Mustard).
- **Ícones Padronizados:** 100% livre de emojis no sistema, utilizando tipografia e ícones vetoriais do `react-icons`.

---

## Arquitetura e Tecnologias

```mermaid
graph TD
    A[React 18 + Vite SPA] -->|Estado Global| B[Zustand Store]
    A -->|Design System & UI| C[Chakra UI + Emotion]
    A -->|Roteamento| D[React Router 7]
    A -->|Realtime & Auth| E[Supabase Client]
    
    subgraph Backend / Cloud
        E -->|Autenticação| F[Supabase Auth]
        E -->|Banco de Dados| G[PostgreSQL + RLS]
        E -->|WebSocket| H[Supabase Realtime Broadcast]
        A -->|Fallback & Cache-Aside| I[API-Football REST]
    end
```

| Camada | Tecnologia | Propósito |
| :--- | :--- | :--- |
| **Core** | React 18 & TypeScript | Tipagem estrita e reatividade |
| **Build Tool** | Vite 4 | Hot Module Replacement (HMR) ultrarrápido |
| **UI Library** | Chakra UI 2 | Componentização flexível e acessível |
| **State Management** | Zustand 5 | Gerenciamento de estado global com persistência |
| **Database & Auth** | Supabase (PostgreSQL) | Armazenamento de dados, RLS e autenticação |
| **Realtime** | Supabase Broadcast Channels | Sincronização peer-to-peer de Draft sem conflito de RLS |
| **Image Cropping** | react-easy-crop | Enquadramento e compressão de avatares em Base64 |
| **Bracket Rendering** | @g-loot/react-tournament-brackets | Visualização de chaves de mata-mata |
| **Icons** | React Icons (Feather / Ionicons) | Iconografia vetorial limpa |

---

## Estrutura do Projeto

```text
EAFC26-CUP/
├── public/                     # Assets públicos e favicons
├── src/
│   ├── assets/                 # Logotipos e identidades visuais
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Chaveamento.tsx            # Árvore de chaves e visualização de mata-mata
│   │   ├── DraftLobby.tsx             # Sala de Pick & Ban multiplayer em tempo real
│   │   ├── ModalEditarPerfil.tsx      # Modal de edição de perfil com crop de foto
│   │   ├── ModalConfiguracoesTorneio.tsx # Gestão de Co-Admins e vínculos
│   │   ├── Navbar.tsx                 # Header com Menu Hambúrguer (Drawer mobile)
│   │   ├── TabelaClassificacao.tsx    # Tabela com modo responsivo em cards
│   │   └── ...
│   ├── pages/                  # Telas e rotas da aplicação
│   │   ├── Dashboard.tsx              # Hub do Jogador e painel de torneios
│   │   ├── ConfigurarTorneio.tsx      # Wizard de criação de campeonatos
│   │   ├── TorneioLiga.tsx            # Painel de Pontos Corridos e Playoffs
│   │   ├── TorneioMataMata.tsx        # Painel de Eliminação Simples e Dupla
│   │   ├── DetalhesGrupo.tsx          # Gestão de membros e histórico com pódio
│   │   ├── MeusGrupos.tsx             # Listagem e criação de grupos
│   │   ├── MeusTimes.tsx              # CRUD de times customizados
│   │   ├── PerfilJogador.tsx          # Estatísticas individuais e conquistas
│   │   └── ...
│   ├── services/               # Camada de comunicação de rede
│   │   ├── apiFutebol.ts              # Cache-Aside integrado à API-Football
│   │   ├── gruposService.ts           # Operações de grupos e convites
│   │   ├── perfisService.ts           # Gestão de perfis no Supabase
│   │   └── timesCustomizadosService.ts # Gestão de clubes locais
│   ├── store/                  # Store global do Zustand
│   │   └── torneioStore.ts            # Lógica central de torneios, sorteios e regras
│   ├── types/                  # Definições de tipos TypeScript
│   │   ├── torneio.ts                 # Interfaces de torneios, partidas e podio
│   │   └── social.ts                  # Interfaces de grupos, perfis e membros
│   ├── theme.ts                # Design Tokens e tema Chakra UI
│   ├── App.tsx                 # Roteamento central e Protected Routes
│   └── main.tsx                # Bootstrap da aplicação
├── supabase_schema.sql         # Schema SQL completo e políticas RLS
├── .env.example                # Template das variáveis de ambiente
└── package.json
```

---

## Destaques de Engenharia & Desafios Técnicos

### 1. Sincronização Multiplayer Peer-to-Host (RLS-Safe Broadcast)
- **O Desafio:** Em um banco relacional seguro com Row Level Security (RLS), apenas o criador do torneio tem permissão de `UPDATE` na linha da tabela `torneios_publicos`. Permitir que múltiplos participantes anônimos ou autenticados fizessem escrita direta violaria as políticas de segurança.
- **A Solução:** Implementou-se uma arquitetura baseada em canais de **Broadcast via WebSockets (`supabase.channel`)**. Quando um participante confirma seu Pick/Ban, o cliente emite um evento de broadcast. O cliente do Host captura a mensagem, valida a integridade da escolha e executa o `UPDATE` oficial no banco de dados, transmitindo o novo estado sincronizado para todos os presentes na sala em milissegundos.

### 2. Padrão Cache-Aside de Baixa Latência (API Football)
- **O Desafio:** As cotas de consultas em APIs esportivas são limitadas e requisições externas frequentes causam lentidão na busca assíncrona (`AsyncSelect`).
- **A Solução:** Toda pesquisa passa primeiro pelo cache relacional indexado no Supabase (`times_api_cache`). Em caso de *Cache Miss*, a requisição consulta a API Football externa e popula o banco de forma assíncrona e não bloqueante (*fire-and-forget*), garantindo respostas instantâneas para buscas futuras e consumo mínimo da cota da API.

### 3. Motor de Torneios e Algoritmo de Mata-Mata
- **Double Elimination & Bracket Reset:** Gerenciamento nativo de chave superior (Upper Bracket) e repescagem (Lower Bracket). Se o campeão da chave inferior vencer o campeão invicto na Grand Final, o sistema aciona dinamicamente a rodada decisiva de *Bracket Reset*.
- **Mecanismo de Lucky Loser:** Balanceamento automático de chaves ímpares através da repescagem estatística do melhor derrotado da fase anterior.

### 4. Responsividade Mobile e Arquitetura de Componentes
- **Navegação em Drawer Lateral:** Menus horizontais densos foram substituídos por um Drawer ergonômico ativado por menu hambúrguer em resoluções mobile (`base` e `md`).
- **Tabelas Adaptativas:** Em viewports reduzidas, a visualização tabular clássica é convertida automaticamente em cards verticais empilhados com destaque visual para posições e métricas de desempenho.

---

## Licença

Este projeto é desenvolvido para fins de portfólio, inovação e uso recreativo. Distribuído sob a licença **MIT**.

---

<div align="center">
  <img src="./src/assets/logos/LogoBola.png" alt="BiraSoccer Icon" width="48" />
  <p><strong>BiraSoccer</strong> — Feito para quem respira futebol e videogame.</p>
</div>
