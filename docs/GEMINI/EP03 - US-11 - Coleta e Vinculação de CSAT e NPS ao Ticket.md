---
id: US-11
epic: EP03 - Visão da Gestão
status: Backlog
release: V2
story_points: 8
prioridade: Média
---

# US-11: Coleta e Vinculação de CSAT/NPS ao Ticket

## História de Usuário

- **Como um** cidadão que finalizou seu atendimento
- **Eu quero** avaliar minha experiência de forma simples e rápida
- **Para que** minha opinião real contribua para a melhoria do serviço — e como gestor, eu quero que essa avaliação seja vinculada ao ticket, serviço e atendente específicos para ação gerencial precisa

---

## Contexto e Motivação

Pesquisas de satisfação de serviços públicos são historicamente imprecisas por um motivo estrutural: são desvinculadas do evento específico que geraram a opinião. Formulários físicos preenchidos na saída da agência ou pesquisas enviadas semanas depois capturam uma impressão geral difusa, não o feedback sobre aquele atendimento específico, naquele dia, naquele guichê. Quando um dado de satisfação ruim aparece no relatório mensal, não há como saber se o problema foi o longo tempo de espera, a qualidade do atendente, a complexidade burocrática do serviço, ou simplesmente o dia ruim do cidadão.

A vinculação da avaliação ao ticket resolve esse problema: cada nota de satisfação pode ser cruzada com o TME daquele ticket (o cidadão esperou muito?), com o TMA (o atendente foi rápido demais, parecendo descuidado?), com o atendente específico (aquele guichê recorre no quadrante de notas baixas?) e com o tipo de serviço (aquele serviço em particular gera insatisfação estrutural?). Isso transforma o CSAT e o NPS de métricas vanitosas em instrumentos de diagnóstico e ação.

A coleta deve ser feita imediatamente após o fim do atendimento — nesse momento, a experiência está fresca e o cidadão ainda está no espaço físico. A avaliação deve ser absolutamente voluntária, rápida (máximo 2 interações: nota e comentário opcional), e o cidadão deve ser informado de que sua resposta é anônima — ainda que vinculada ao ticket para fins de análise agregada pela gestão.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Cidadão avalia o atendimento — Caminho Feliz**
- **Dado que** o atendente finalizou o atendimento (US-04) e o sistema reconhece a finalização
- **Quando** a tela de avaliação é exibida (totem de saída ou tela do guichê rotacionada para o cidadão)
- **E** o cidadão seleciona uma nota de 1 a 5 estrelas (CSAT) e opcionalmente inclui um comentário de texto livre
- **E** clica em "Enviar"
- **Então** a avaliação deve ser registrada e vinculada ao ticket específico, contendo: nota CSAT, comentário (se houver), timestamp da avaliação, ID do ticket, ID do serviço e ID do atendente
- **E** o sistema deve exibir uma mensagem de agradecimento e retornar à tela inicial em 5 segundos

**Cenário 2: Cidadão não avalia (skip)**
- **Dado que** a tela de avaliação é exibida após o fim do atendimento
- **Quando** o cidadão pressiona "Pular" ou não interage por mais de 30 segundos (timeout)
- **Então** o sistema deve registrar que a avaliação foi "Não Respondida" para aquele ticket
- **E** deve retornar à tela inicial sem registrar nenhuma nota
- **E** a ausência de avaliação não deve impactar o fluxo do sistema nem o registro do ticket

**Cenário 3: Visualização de CSAT/NPS pelo gestor vinculado ao atendente**
- **Dado que** o gestor acessa o módulo de relatórios de satisfação
- **Quando** filtra por período e por atendente específico
- **Então** deve ver: média de CSAT do atendente no período, distribuição das notas (quantidade de 1, 2, 3, 4, 5 estrelas), taxa de resposta (avaliações recebidas / tickets finalizados) e os comentários textuais verbatim (anonimizados — sem identificar o cidadão)
- **E** deve poder cruzar esses dados com o TME e TMA dos tickets avaliados

**Cenário 4: NPS calculado a nível de serviço**
- **Dado que** o gestor acessa o relatório de satisfação por tipo de serviço
- **Quando** seleciona um período com pelo menos 10 avaliações para aquele serviço
- **Então** o sistema deve calcular e exibir o NPS do serviço: (% promotores [nota 4-5] - % detratores [nota 1-2]) × 100
- **E** deve exibir uma evolução temporal do NPS mês a mês (se houver dados suficientes)

**Cenário 5: Avaliação com conteúdo inadequado no comentário (edge case)**
- **Dado que** um cidadão insere um comentário de texto livre
- **Quando** o comentário contém palavras explicitamente ofensivas (verificadas contra uma lista de termos configurável)
- **Então** o sistema deve aceitar a nota numérica normalmente
- **E** deve marcar o comentário com flag "Requer Revisão" antes de exibi-lo nos relatórios
- **E** o gestor deve ser capaz de aprovar ou rejeitar o comentário antes de ele aparecer em relatórios consolidados

**Cenário 6: Garantia de anonimato do cidadão (edge case — privacidade)**
- **Dado que** uma avaliação foi registrada e vinculada ao ticket
- **Quando** qualquer usuário do sistema — incluindo o gestor — consulta as avaliações
- **Então** nenhum dado que identifique o cidadão (nome, CPF, número de telefone se coletado via US-02) deve ser exibido junto à avaliação
- **E** o vínculo ao ticket deve ser suficiente apenas para cruzamento de métricas operacionais, não para identificação pessoal

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Tela de avaliação disparada automaticamente após finalização do atendimento (US-04), sem ação manual do atendente
- [ ] Avaliação vinculada ao ticket com todos os campos obrigatórios (ID do ticket, ID do atendente, ID do serviço, timestamp, nota, comentário opcional)
- [ ] Anonimato do cidadão garantido: relatórios não exibem nenhum dado pessoal identificável
- [ ] Relatório de CSAT por atendente e NPS por serviço funcionando com filtros por período
- [ ] Mecanismo de flag de comentários inadequados implementado com revisão obrigatória pelo gestor antes da publicação

---

## Dependências

- **US-04** (Interface de Guichê) — a avaliação é disparada pelo evento de finalização do atendimento
- **US-10** (Relatório de Desempenho Individual) — o CSAT do atendente é uma métrica que complementa o relatório de desempenho
- **US-08** (Dashboard de Monitoramento) — o NPS por serviço pode ser integrado como KPI no dashboard de gestão em versão futura

---

## Notas Técnicas e Restrições de Negócio

- **Escala de avaliação:** O sistema usa escala de 1 a 5 estrelas para CSAT. O NPS é derivado dessa escala com mapeamento: 1-2 = Detratores, 3 = Neutros, 4-5 = Promotores. Não usar escala de 0-10 pois o contexto de atendimento público exige brevidade máxima na interação.
- **LGPD — anonimização:** O comentário de texto livre, por ser dado qualitativo não estruturado, não pode ser vinculado a nenhum dado pessoal do cidadão. O link entre a avaliação e o ticket deve existir apenas para cruzamento de métricas operacionais (TME, TMA, serviço, atendente), não para identificação do cidadão.
- **Taxa mínima para NPS:** O NPS por serviço ou atendente só deve ser calculado e exibido com um mínimo de 10 avaliações no período. Abaixo disso, o sistema deve exibir "Dados insuficientes para cálculo de NPS" para evitar distorções estatísticas.
- **Canais de coleta:** Canal primário: totem/tela de guichê no momento pós-atendimento. Futuras versões podem incluir link via SMS após atendimento (integração com US-02), mas isso está fora do escopo desta US.
