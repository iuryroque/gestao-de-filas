---
id: US-08
epic: EP03 - Visão da Gestão
status: Backlog
release: MVP 1.0
story_points: 13
prioridade: Crítica
---

# US-08: Dashboard de Monitoramento em Tempo Real com Alertas de SLA

## História de Usuário

- **Como um** supervisor ou gestor de unidade
- **Eu quero** um dashboard que mostre em tempo real o estado de todas as filas com alertas visuais quando o SLA está em risco
- **Para que** eu possa intervir proativamente antes que a experiência do cidadão seja comprometida

---

## Contexto e Motivação

A gestão de filas em tempo real é, hoje, majoritariamente reativa: o supervisor percebe que a situação está crítica quando o cidadão já está reclamando, quando as filas já estouraram, ou quando recebe uma ligação de um atendente. Não há instrumento que permita antecipação. O resultado é que intervenções como abertura de novos guichês, chamado de atendentes em pausa, ou redirecionamento de fluxo sempre chegam tarde demais para evitar o problema — chegam apenas para amenizá-lo.

Um dashboard de monitoramento eficaz para este contexto deve entregar informação na granularidade certa: nem tão detalhada a ponto de sobrecarregar o supervisor com dados irrelevantes, nem tão agregada que esconda o problema iminente. O foco são os sinais de alarme: uma fila com TME batendo no limiar configurado do SLA é o sinal que deve saltar aos olhos imediatamente, não uma métrica que o supervisor precisa procurar em uma tabela.

A distinção entre TME (Tempo Médio de Espera — problema de gargalo operacional: falta de guichê ou fila mal dimensionada) e TMA (Tempo Médio de Atendimento — métrica de complexidade do serviço ou produtividade) é fundamental para que o gestor tome a ação correta. Se o TME está alto mas o TMA está normal, o problema é capacidade (abrir mais guichês). Se o TMA está alto mas o TME está normal, o problema pode ser formação do atendente ou complexidade do serviço. Misturar esses dois indicadores leva a diagnósticos errados e ações ineficazes.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Visualização geral de todas as filas — Caminho Feliz**
- **Dado que** o supervisor está autenticado no sistema com perfil de Gestor
- **Quando** acessa o dashboard de monitoramento
- **Então** deve ver um painel com um card por fila ativa, contendo: nome da fila, número de senhas aguardando, TME atual, TMA atual, número de guichês ativos e status de SLA (dentro do limite / em alerta / crítico)
- **E** os dados devem ser atualizados automaticamente sem necessidade de recarregar a página

**Cenário 2: Alerta de SLA — fila em estado de atenção**
- **Dado que** o TME de uma fila atinge 80% do limite de SLA configurado (ex: SLA de 30 min, TME atual = 24 min)
- **Quando** o dashboard está aberto
- **Então** o card da fila afetada deve mudar visualmente para o estado "Em Alerta" (cor amarela ou equivalente)
- **E** o supervisor deve receber uma notificação sonora discreta (opcional, configurável)
- **E** o card deve exibir o tempo restante antes de atingir o limite de SLA

**Cenário 3: Alerta de SLA — fila em estado crítico**
- **Dado que** o TME de uma fila atinge ou supera 100% do limite de SLA configurado
- **Quando** o dashboard está aberto
- **Então** o card da fila afetada deve mudar visualmente para o estado "Crítico" (cor vermelha ou equivalente)
- **E** deve ser exibida uma notificação pulsante proeminente que não pode ser ignorada sem ação do supervisor
- **E** o registro do breach de SLA deve ser salvo no log de eventos com timestamp

**Cenário 4: Distinção clara entre TME e TMA no dashboard**
- **Dado que** o supervisor visualiza um card de fila no dashboard
- **Quando** clica no card para expandir os detalhes
- **Então** deve ver TME e TMA exibidos separadamente, com suas respectivas médias das últimas 1 hora e 4 horas para comparação de tendência
- **E** deve haver uma legenda explicando o que cada métrica significa

**Cenário 5: Sem guichês ativos em uma fila com senhas aguardando (edge case)**
- **Dado que** uma fila possui senhas aguardando
- **Quando** todos os guichês daquela fila entram em pausa ou são desativados
- **Então** o dashboard deve exibir um alerta específico: "Fila [NOME] — NENHUM GUICHÊ ATIVO" com destaque máximo
- **E** o TME deve parar de ser calculado (congelado) e exibir o valor no momento da inatividade, com indicação de que o dado está congelado

**Cenário 6: Filtragem por fila ou serviço (edge case)**
- **Dado que** o gestor gerencia múltiplas unidades ou um grande volume de filas
- **Quando** ele aplica filtros no dashboard (por unidade, por tipo de serviço, por status de SLA)
- **Então** somente os cards das filas que atendem aos critérios selecionados devem ser exibidos
- **E** os alertas de SLA devem continuar funcionando para filas fora do filtro atual (o filtro não silencia alertas)

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Dashboard exibe todos os cards de fila com atualização em tempo real (latência ≤ 3 segundos)
- [ ] SLA configurável por fila pelo administrador, com os dois limiares (80% e 100%) implementados com comportamentos de alerta distintos
- [ ] TME e TMA exibidos separadamente, com histórico comparativo das últimas 1 e 4 horas
- [ ] Alerta de fila sem guichê ativo implementado e testado
- [ ] Log de breach de SLA persistido com timestamp, fila afetada e valor de TME no momento do breach

---

## Dependências

- **US-01** (Emissão de Senha) — os dados de TME partem do timestamp de emissão
- **US-04** (Interface de Guichê) — os dados de TMA partem do início e fim de atendimento registrados pelo atendente

---

## Notas Técnicas e Restrições de Negócio

- **Cálculo de TME:** Definido como a média aritmética simples do tempo decorrido entre a emissão da senha e o início do atendimento (acionamento do "Chamar Próximo") para todos os tickets finalizados na janela de cálculo. Tickets em no-show são excluídos da amostra.
- **Cálculo de TMA:** Definido como a média aritmética do tempo entre o início e a finalização do atendimento (US-04) para os tickets finalizados na janela de cálculo.
- **SLA padrão:** O sistema deve vir com um SLA padrão configurado de 30 minutos. O administrador pode configurar valores diferentes por fila/serviço.
- **Acesso:** O dashboard de monitoramento é exclusivo dos perfis Supervisor e Gestor. O atendente não tem acesso (sua visibilidade é coberta pela US-07).
- **Janela de cálculo de médias:** As médias de TME e TMA devem ser calculadas sobre a janela móvel das últimas 2 horas de atendimentos finalizados, para refletir a realidade operacional atual e não o histórico do dia inteiro.
