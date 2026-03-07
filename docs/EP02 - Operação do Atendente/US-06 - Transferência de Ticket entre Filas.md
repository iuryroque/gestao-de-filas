---
id: US-06
epic: EP02 - Operação do Atendente
status: Backlog
release: V1.1
story_points: 8
prioridade: Alta
---

# US-06: Transferência de Ticket entre Filas

## História de Usuário

- **Como um** atendente de guichê
- **Eu quero** transferir o ticket de um cidadão para outra fila sem precisar refazer seu cadastro ou emitir nova senha
- **Para que** o cidadão não perca o tempo já esperado e seja direcionado ao serviço correto sem atrito adicional

---

## Contexto e Motivação

Mesmo com um sistema de triagem inteligente (US-01), haverá casos em que o cidadão chega ao guichê com o ticket errado. Isso pode ocorrer porque o cidadão não soube descrever sua necessidade no totem, escolheu o serviço errado por confusão, ou sua demanda real abrange dois serviços e ele escolheu o menor. O atendente, ao identificar que não é o guichê responsável por aquela solicitação, precisa de um mecanismo rápido para corrigir isso.

Sem a funcionalidade de transferência, o processo atual em muitas agências é: o atendente orienta verbalmente o cidadão a voltar ao totem, pegar nova senha para a fila correta e aguardar novamente do início. Isso significa que o cidadão perde todo o tempo já esperado — o que gera conflitos, reclamações e, nas piores situações, situações de tensão. Para o sistema de filas, essa duplicidade também gera ruído nos dados (ticket original fica "abandonado" sem finalização adequada).

A transferência deve ser realizada em até 2 cliques pelo atendente: selecionar fila de destino e confirmar. O ticket original deve ser encerrado com motivo "Transferido" e um novo ticket deve ser criado na fila destino, mantendo as informações de prioridade do original e usando o timestamp de emissão original como referência para posicionamento (regra de negócio: o cidadão não deve ser penalizado em posição por ter chegado ao guichê errado).

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Transferência bem-sucedida — Caminho Feliz**
- **Dado que** o atendente está com um ticket em atendimento e identificou que o cidadão precisa de outra fila
- **Quando** o atendente acessa "Transferir para outra fila" e seleciona a fila de destino
- **E** confirma a transferência
- **Então** o ticket original deve ser encerrado com status "Transferido" e motivo registrado
- **E** um novo ticket deve ser criado na fila de destino com o timestamp de emissão original preservado
- **E** o novo ticket deve manter o status de prioridade do ticket original (P- se era prioritário)
- **E** o cidadão deve ser posicionado na fila de destino baseado no timestamp original, não no horário da transferência

**Cenário 2: Transferência com destino com longa espera (aviso ao atendente)**
- **Dado que** o atendente seleciona a fila de destino para transferência
- **Quando** a fila de destino possui espera superior a 1 hora no momento da transferência
- **Então** o sistema deve exibir um aviso ao atendente: "A fila [NOME] possui [X] pessoas na espera. Estimativa: [Y] minutos."
- **E** o atendente deve poder confirmar ou cancelar a transferência após ver o aviso

**Cenário 3: Transferência entre unidades/agências diferentes (edge case)**
- **Dado que** o serviço correto é prestado em outra unidade da instituição, não naquela agência
- **Quando** o atendente tenta transferir para uma fila de outra unidade
- **Então** o sistema deve informar que a transferência entre unidades distintas não é suportada
- **E** deve sugerir ao atendente que oriente o cidadão a buscar a agência correta, fornecendo endereço e horário de funcionamento da unidade adequada (se cadastrado)

**Cenário 4: Atendente tenta transferir sem ter ticket ativo (edge case)**
- **Dado que** o atendente não possui nenhum ticket em status "Em Atendimento"
- **Quando** ele acessa a opção de transferência
- **Então** o sistema deve retornar uma mensagem: "Nenhum atendimento ativo para transferir."

**Cenário 5: Fila de destino sem atendentes ativos no momento (edge case)**
- **Dado que** o atendente seleciona uma fila de destino
- **Quando** essa fila não possui nenhum guichê ativo no momento
- **Então** o sistema deve exibir aviso claro: "A fila [NOME] não possui atendentes ativos agora. O ticket ficará aguardando até que um guichê seja ativado."
- **E** o atendente deve poder confirmar ou cancelar com essa informação

**Cenário 6: Auditoria da transferência**
- **Dado que** uma transferência foi realizada com sucesso
- **Quando** o supervisor consulta o histórico do ticket original ou do ticket gerado
- **Então** ambos devem exibir o vínculo entre si (ID do ticket original → ID do ticket gerado)
- **E** o log deve conter: atendente que realizou a transferência, fila de origem, fila de destino e timestamp da transferência

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Transferência completa em no máximo 2 cliques após identificar a fila de destino
- [ ] Timestamp original do ticket preservado e utilizado como critério de posicionamento na fila de destino
- [ ] Prioridade do ticket original mantida no ticket gerado pela transferência
- [ ] Vínculo bidirecional entre ticket original e ticket transferido registrado e consultável pelo supervisor
- [ ] Aviso de fila com longa espera implementado e exibido antes da confirmação da transferência

---

## Dependências

- **US-04** (Interface de Guichê) — a transferência é acionada a partir da interface do atendente
- **US-01** (Emissão de Senha) — os tickets transferidos são originados da triagem
- **US-05** (Gestão de No-show) — o encerramento do ticket original com status "Transferido" segue lógica similar ao encerramento por no-show

---

## Notas Técnicas e Restrições de Negócio

- **Posicionamento na fila de destino:** O ticket transferido deve ser inserido na fila de destino usando o timestamp original de emissão como chave de ordenação. Isso pode resultar em o ticket ocupar uma posição intermediária na fila (não necessariamente o final), o que é intencional e correto.
- **Limite de transferências por ticket:** Um ticket deve poder ser transferido no máximo 2 vezes. Na segunda transferência, o sistema deve alertar o atendente; na tentativa de uma terceira, deve bloquear e exigir aprovação do supervisor.
- **Transferência entre unidades:** Fora do escopo para V1.1. A funcionalidade se limita a filas dentro da mesma unidade/agência.
- **Status do guichê após transferência:** Após confirmar a transferência, o guichê do atendente deve retornar ao estado "Pronto para chamar próximo" automaticamente.
