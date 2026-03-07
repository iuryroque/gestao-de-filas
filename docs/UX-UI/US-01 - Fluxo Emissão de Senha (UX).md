# US-01 — Fluxo UX/UI: Emissão de Senha com Triagem Inteligente

Objetivo: descrever telas, interações e regras para o totem de autoatendimento (US-01). Fornece especificação para UX e para devs front/back.

Visão geral do fluxo (passo a passo):
1. Tela Inicial
   - Elementos: logo, botão grande "Emitir Senha", botão "Informações" (pequeno), botão "Acessibilidade" (ícone com opções de contraste e leitura em voz)
   - Comportamento: timeout de inatividade configurável (60s) que exibe tela de demonstração/rotatividade. Toque em "Emitir Senha" inicia o fluxo.

2. Seletor de Categoria (máx 3 níveis)
   - Mostra categorias com ícones e textos curtos (ex: "Cobrança", "Atendimento Geral", "Emissão de Documentos").
   - Ao tocar numa categoria, expande para subcategorias (se houver). O processo deve ser projetado para 3 toques no máximo até identificar serviço.
   - UX: grandes cartões em grid 2x2 ou 3x2 conforme resolução, texto de 18-24pt, contraste >= 4.5:1.

3. Perguntas de Triagem (quando necessário)
   - Ex.: "Você tem comprovante de pagamento?" — respostas em botões Sim/Não.
   - Cada pergunta reduz o conjunto de serviços.
   - Se a triagem não consegue identificar com segurança, exibir tela "Precisa de ajuda?" com opção de chamar atendente presencial (botão) ou direcionar para tela de confirmação de serviço manual.

4. Declaração de Prioridade
   - Tela de confirmação pergunta: "Precisa de atendimento preferencial?" com opções: Idoso (60+), Gestante, PCD, Criança de colo, Não.
   - Nota: esta é autodeclaração; exibir texto curto sobre responsabilidade legal.

5. Tela de Confirmação do Serviço
   - Exibe: ícone do serviço, título, resumo de 1 linha, botão "Confirmar" grande, botão "Corrigir" menor.
   - Estimativa de espera calculada e exibida (ex: "Estimativa: ~35 min"). Indicar base da estimativa (TMA últimos 2h).

6. Emissão e Comprovante
   - Ao confirmar: emitir senha (ex: `00123` ou `P-0042`) e imprimir comprovante.
   - Comprovante contém: código da senha, serviço, posição atual na fila, estimativa de espera, QR code/URL curto para acompanhamento remoto, instruções de acessibilidade (se aplicável).
   - Se impressora falhar, exibir o código na tela por 30s e oferecer enviar por SMS (se o cidadão optar) — não forçar coleta de número.

7. Pós-Emissão (opções rápidas)
   - Botões na tela do comprovante: "Quero acompanhar por celular" (abre campo para número), "Voltar para início".
   - Se o cidadão selecionar acompanhamento, validar formato do celular e enviar confirmação por SMS (integração com US-02).

Regras de usabilidade e acessibilidade:
- Fonte mínima 18pt, espaçamento e contrastes conforme WCAG AA.
- Botões com área de toque >= 44x44px.
- Modo leitura por voz: botão que lê texto principal e instruções essenciais.
- Suporte a teclado físico e navegação por tecla/tab para totens adaptáveis.

Estados e mensagens de erro:
- Impressora sem papel: exibir alerta detalhado e mostrar código na tela com opção de envio por SMS.
- Serviço sem guichê ativo: exibir mensagem clara e oferecer alternativas (agendamento online, retorno em X horas) — não emitir senha.
- Timeout de inatividade: contagem regressiva 15s antes de cancelar fluxo.

Mapeamento para critérios de aceite (BDD):
- Cada passo do fluxo corresponde aos cenários BDD de US-01; a tela de confirmação implementa o Cenário de confirmação; opção de prioridade implementa cenário de prioridade.

Entregáveis para design/dev:
- Assets: ícones de categorias (32/64/128px), fonte e tokens de cores, snippets de voz para TTS (PT-BR).
- Endpoints necessários (sugestão): `GET /services?category=`, `POST /tickets` (gera senha), `POST /notifications/sms` (opcional).
- Componentes reusáveis: `CategoryCard`, `QuestionStep`, `ConfirmationPanel`, `TicketReceipt`.

Notas de implementação:
- Calcular estimativa no backend e retornar ao frontend no passo de confirmação. Evitar cálculo client-side que pode divergir.
- Toda escolha deve ser tratada como transacional: somente após `POST /tickets` persistir com sucesso emitir comprovante.

Wireframe rápido (layout):
- Header: logo | idioma
- Body: grid de cards / perguntas / confirmação
- Footer: acessibilidade | informações | contato

Tempo estimado para protótipo de baixa fidelidade: 1 dia UI + 1 dia integração mínima com backend para `POST /tickets`.
