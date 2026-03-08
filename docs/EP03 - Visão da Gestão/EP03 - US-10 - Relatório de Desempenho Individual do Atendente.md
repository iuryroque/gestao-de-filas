---
id: US-10
epic: EP03 - Visão da Gestão
status: Backlog
release: V2
story_points: 8
prioridade: Média
---

# US-10: Relatório de Desempenho Individual do Atendente

## História de Usuário

- **Como um** gestor de unidade
- **Eu quero** acessar relatórios de desempenho individual de cada atendente com métricas de volume, tempo de atendimento e pausas
- **Para que** eu possa dar feedbacks baseados em dados, identificar necessidades de treinamento e reconhecer alta performance de forma justa e objetiva

---

## Contexto e Motivação

A ausência de dados individuais de desempenho em sistemas de fila tradicionais cria dois problemas simétricos: o atendente de alta performance não é reconhecido objetivamente (sua eficiência fica invisível) e o atendente com dificuldades não recebe intervenção antes que isso se torne um problema crônico. A gestão opera na base da percepção subjetiva do supervisor — sujeita a vieses, favoritismos e simples falta de observação direta.

Um relatório de desempenho individual justo deve medir o que o atendente efetivamente controla: o volume de atendimentos realizados, o tempo dedicado a cada atendimento (TMA), o uso do tempo em estado produtivo versus pausa, e a taxa de no-show (como proxy de chamadas não efetivadas que podem indicar problemas de condução do chamado). O que não deve ser medido de forma isolada ou punitiva: filas com TMA naturalmente alto por complexidade do serviço precisam de normalização para comparação justa.

Os relatórios devem ser exportáveis para uso em sistemas de RH e gestão de desempenho, mas o acesso deve ser estritamente restrito ao perfil de gestor — os próprios atendentes não devem ter acesso aos dados numéricos individuais de colegas, apenas ao seu próprio resumo.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Geração de relatório individual — Caminho Feliz**
- **Dado que** o gestor está autenticado com perfil de Gestor
- **Quando** acessa o módulo de relatórios, seleciona um atendente específico e define o período de análise (data inicial e data final)
- **E** clica em "Gerar Relatório"
- **Então** o sistema deve exibir um relatório contendo: total de atendimentos realizados, TMA médio do período, tempo total em pausa (com breakdown por motivo de pausa), tempo total em atendimento produtivo, número de no-shows registrados e rate de no-show (no-shows / chamadas totais)

**Cenário 2: Comparação entre atendentes da mesma fila**
- **Dado que** o gestor está no módulo de relatórios
- **Quando** seleciona múltiplos atendentes que atuaram na mesma fila no mesmo período
- **Então** o sistema deve exibir uma tabela comparativa com os mesmos indicadores lado a lado
- **E** deve exibir uma nota informativa: "Atendentes com serviços de maior complexidade tendem a ter TMA mais alto. Compare com atendentes da mesma fila para análise justa."

**Cenário 3: Exportação do relatório**
- **Dado que** o gestor visualiza um relatório individual ou comparativo
- **Quando** clica em "Exportar"
- **Então** o sistema deve oferecer as opções de exportação em PDF e CSV
- **E** o arquivo exportado deve conter todos os dados exibidos na tela, incluindo o período de análise e a data/hora de geração do relatório no cabeçalho

**Cenário 4: Período sem dados disponíveis (edge case)**
- **Dado que** o gestor seleciona um período em que o atendente não trabalhou ou o sistema não estava ativo
- **Quando** o relatório é gerado
- **Então** o sistema deve exibir claramente: "Nenhum atendimento registrado para [NOME] no período selecionado."
- **E** não deve exibir valores zerados como se houvesse dados (ex: TMA = 0:00 pode ser confundido com dado real)

**Cenário 5: Atendente tenta acessar dados de colega (controle de acesso — edge case)**
- **Dado que** um usuário com perfil de Atendente tenta acessar a URL do relatório individual de outro atendente
- **Quando** a requisição é processada
- **Então** o sistema deve retornar erro 403 (Acesso Negado) sem exibir nenhum dado
- **E** o evento de tentativa de acesso não autorizado deve ser registrado no log de segurança

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Relatório individual gerado com todos os campos obrigatórios (volume, TMA, pausas por motivo, no-show rate) para qualquer atendente em qualquer período com dados disponíveis
- [ ] Exportação em PDF e CSV funcionando, com cabeçalho de identificação do período e data de geração
- [ ] Controle de acesso validado: perfil Atendente não consegue acessar dados de outros atendentes; teste básico de controle de acesso realizado
- [ ] Mensagem de "sem dados" exibida corretamente para períodos sem atendimentos, sem apresentar zeros como dados reais
- [ ] Aviso sobre contexto de comparação exibido em relatórios comparativos para prevenir uso indevido das métricas

---

## Dependências

- **US-04** (Interface de Guichê) — fonte dos dados de TMA, pausas e timestamps de atendimento
- **US-05** (Gestão de No-show) — fonte dos dados de no-show vinculados ao atendente
- **US-08** (Dashboard de Monitoramento) — compartilha a infraestrutura de coleta e armazenamento de métricas

---

## Notas Técnicas e Restrições de Negócio

- **LGPD — dados de funcionários:** Dados de desempenho individual de funcionários são dados pessoais sujeitos à LGPD. O acesso deve ser restrito ao gestor imediato e RH. O tempo de retenção dos dados de atendimento individual deve seguir a política de retenção de dados da instituição (mínimo recomendado: 2 anos para fins de auditoria trabalhista).
- **Normalização de TMA por serviço:** O relatório deve permitir ao gestor filtrar por tipo de serviço atendido, para que a comparação de TMA seja feita entre atendentes que realizaram o mesmo tipo de atendimento.
- **Integridade dos dados:** Pausas onde o motivo não foi informado (ex: encerramento abrupto de sessão) devem ser exibidas como "Pausa - Motivo não informado" no relatório, não como tempo produtivo.
- **Período de análise:** O sistema deve suportar períodos de análise de até 12 meses. Para períodos maiores, deve sugerir exportação e análise em ferramenta externa.
