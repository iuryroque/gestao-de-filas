# US-04 — Fluxo UX/UI: Interface de Guichê com Ações Rápidas

Objetivo: detalhar telas e interações para a interface do atendente (guichê) usada para operar o atendimento diário.

Fluxo principal (passo a passo):

1. Tela de Login / Identificação do Atendente
   - Campos: seleção de guichê (se aplicável), login rápido (cartão RFID, PIN ou credencial), botão "Entrar".
   - Após autenticação, guichê entra em estado "Pronto" automaticamente.

2. Tela Principal do Guichê (estado principal)
   Layout sugerido (alta prioridade de visibilidade):
   - Painel superior: identificação do atendente e do guichê, status atual (Pronto / Em Pausa / Em Atendimento), relógio/timer de sessão.
   - Área central (esquerda): cartão do ticket atual — exibe `Senha`, `Serviço`, `Prioridade`, `Tempo na fila` e observações relevantes.
   - Área central (direita): ações grandes (botões) em coluna vertical: `Chamar Próximo` (verde), `Reconvocar` (laranja), `Finalizar` (azul), `Não Compareceu` (vermelho), `Transferir` (ícone de pasta) — ordem e tamanho otimizados.
   - Rodapé: mini-painel lateral com `Visão da Fila` (contador total, prioritários, estimativa) e acesso rápido ao `Histórico`.

3. Chamar Próximo
   - Ação: ao clicar `Chamar Próximo`, chamar backend `POST /queues/{queueId}/call`.
   - UX: mostrar loading breve (splash) se fila vazia, exibir mensagem "Fila vazia" se sem tickets.
   - Após sucesso: preencher cartão do ticket atual com informações retornadas e tocar sinal discreto no cliente (não no painel público).

4. Em Atendimento
   - Ao iniciar atendimento, o campo de tempo de atendimento (timer) começa automaticamente.
   - O atendente pode registrar observações rápidas (campo livre curto — max 200 chars) durante o atendimento.

5. Finalizar Atendimento
   - Botão `Finalizar` grava `endTime` e registra TMA. Sem confirmação padrão (para não bloquear fluxo), mas permite reabertura pelo supervisor.
   - Ao finalizar: limpar cartão atual e voltar ao estado pronto para `Chamar Próximo`.

6. Não Compareceu / Reconvocar
   - `Não Compareceu` inicia sequência de no-show (US-05): registra tentativa e apresenta opções `Reconvocar Agora` ou `Registrar Não Compareceu Definitivo` se excedeu tentativas.
   - `Reconvocar` envia nova chamada ao painel e toca som conforme configuração.

7. Transferir Ticket
   - Ao acionar `Transferir`, abrir modal com dropdown de filas de destino já filtradas por permissões do guichê.
   - Exibir aviso se fila de destino tem espera longa com opção de confirmar/Cancelar.
   - Ao confirmar, realizar `POST /tickets/{ticketId}/transfer` e encerrar ticket atual com status `Transferido`.

Acessibilidade e usabilidade:
- Botões principais com alto contraste e tamanho mínimo de toque 44x44px.
- Suporte a atalhos de teclado: F2 = Chamar Próximo, F3 = Finalizar, F4 = Não Compareceu.
- Tema de alto contraste e fonte aumentada acessível via toggle rápido.

Estados e mensagens críticas:
- Sessão expirada: sobrepor modal de re-autenticação sem perder o ticket atual em atendimento.
- Conflito de chamada (dois guichês tentando chamar o mesmo ticket): backend resolve pelo lock e retorna mensagem clara ao guichê que falhou.
- Erro de rede: exibir banner amarelado "Conectando..." e desabilitar ações que envolvam criação/alteração de tickets até reconexão.

Mapeamento para critérios de aceite (BDD):
- `Chamar Próximo` implementa Cenário 1 do US-04; `Finalizar` mapeia para Cenário 2; `Pausar` e `Retomar` mapeiam para Cenário 3.

Componentes e endpoints sugeridos:
- Componentes: `TicketCard`, `ActionButtonLarge`, `QueueSidebar`, `TransferModal`, `NoShowModal`.
- Endpoints sugeridos: `POST /queues/{id}/call`, `POST /tickets/{id}/finalize`, `POST /tickets/{id}/noshow`, `POST /tickets/{id}/transfer`, `GET /queues/{id}/stats`.

Entregáveis para design/dev:
- Wireframes: 3 variantes (desktop touchscreen 1366x768, tablet 1024x768, kiosk 768x1024 rotacionado)
- Arquivos: tokens de design (cores, tipografia), ícones de ação, specs de TTS para alertas locais

Observações de implementação:
- Toda ação crítica deve ser idempotente ou ter tratamento de retries no cliente.
- Priorizar latência baixa para `POST /queues/{id}/call` (≤200ms típico). Use WebSocket para atualizações em tempo real.

Tempo estimado para protótipo: 1-2 dias UI + 1 dia integração com backend mínimo.
