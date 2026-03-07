---
id: US-07
epic: EP02 - Operação do Atendente
status: Backlog
release: V1.1
story_points: 3
prioridade: Alta
---

# US-07: Visibilidade da Fila Própria pelo Atendente

## História de Usuário

- **Como um** atendente de guichê
- **Eu quero** visualizar em tempo real o estado da fila que estou atendendo (quantidade de pessoas, estimativa, prioridades)
- **Para que** eu possa autogerenciar meu ritmo de trabalho e comunicar expectativas realistas ao cidadão à minha frente

---

## Contexto e Motivação

Sem visibilidade sobre o volume da própria fila, o atendente opera em um vacuum informacional que prejudica de duas formas: a autogestão do ritmo (ele não sabe se pode ser mais detalhado neste atendimento ou precisa acelerar) e a gestão de expectativas com o cidadão atual (não consegue responder com precisão "quantas pessoas ainda estão esperando?").

Esta falta de transparência cria um gatilho recorrente de insatisfação: o cidadão que ficou 90 minutos esperando chega ao guichê, e o atendente — sem saber disso — tem uma postura que não reconhece esse esforço. Com a informação visível, o atendente pode fazer um reconhecimento simples ("Obrigado pela sua paciência, você foi o 43º atendimento hoje") que tem alto impacto percebido.

A visibilidade da fila também é relevante para o comportamento de pausas. Se o atendente vê que há 0 pessoas na fila, pode iniciar uma pausa com tranquilidade. Se vê 20 pessoas, pode optar por finalizá-la antes. Essa autonomia — guiada por dados — é mais eficaz e mais justa do que regras rígidas de pausa impostas sem contexto.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Visualização da fila em tempo real — Caminho Feliz**
- **Dado que** o atendente está logado e com o guichê ativo
- **Quando** a tela principal da interface do guichê é exibida
- **Então** deve ser visível um painel lateral ou rodapé com: número total de senhas aguardando na fila, número de senhas prioritárias (P-) na fila e estimativa de tempo para zerar a fila com o ritmo atual
- **E** esses dados devem se atualizar em tempo real, sem necessidade de recarregar a página

**Cenário 2: Atendente gerencia guichê polivalente (múltiplas filas)**
- **Dado que** o guichê do atendente está configurado para atender mais de uma fila
- **Quando** o atendente visualiza o painel de fila
- **Então** o sistema deve exibir os contadores de forma separada por fila (ex: "Fila A: 12 | Fila B: 4")
- **E** o total combinado deve ser exibido em destaque

**Cenário 3: Fila vazia**
- **Dado que** não há nenhuma senha aguardando na fila do atendente
- **Quando** o atendente visualiza o painel
- **Então** o sistema deve exibir "Fila vazia" de forma clara e não exibir estimativa de espera (campo N/A)
- **E** o botão "Chamar Próximo" deve estar desabilitado ou exibir a mensagem de fila vazia ao ser pressionado

**Cenário 4: Conexão intermitente — dados desatualizados (edge case)**
- **Dado que** a conexão do sistema foi temporariamente interrompida
- **Quando** a conexão é restaurada
- **Então** o painel de fila deve ser atualizado imediatamente com os dados atuais do servidor
- **E** durante o período de desconexão, o painel deve exibir indicação visual de "Dados desatualizados — reconectando..." ao invés de manter os últimos números como se fossem válidos

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Painel de fila exibido na tela principal do atendente, sem necessidade de navegação adicional
- [ ] Atualização em tempo real (latência máxima de 3 segundos após evento de emissão ou chamada)
- [ ] Exibição separada por fila para guichês polivalentes implementada e testada
- [ ] Indicação de dados desatualizados durante perda de conexão implementada para evitar decisões com informação obsoleta
- [ ] Validado com atendentes reais: os campos exibidos são suficientes e não geram sobrecarga de informação

---

## Dependências

- **US-04** (Interface de Guichê) — o painel de fila é um componente integrado à interface do atendente
- **US-01** (Emissão de Senha) — os dados exibidos refletem os tickets emitidos

---

## Notas Técnicas e Restrições de Negócio

- **Performance:** O painel deve usar a mesma conexão persistente (WebSocket) utilizada pelo painel de chamada (US-03) para não multiplicar conexões abertas por cliente.
- **Estimativa de tempo:** Calculada com base no TMA médio das últimas 2 horas do próprio guichê (ou do serviço, se o histórico do guichê for insuficiente — menos de 5 atendimentos). Deve ser exibida como intervalo (ex: "~35 min") e não como valor exato.
- **Privacidade:** O atendente deve ver apenas os dados agregados de sua própria fila. Não deve ter acesso às métricas de outros guichês ou atendentes através desta interface (isso é escopo do EP03 - Gestão).
