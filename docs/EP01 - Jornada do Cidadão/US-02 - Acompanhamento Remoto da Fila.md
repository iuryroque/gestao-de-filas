---
id: US-02
epic: EP01 - Jornada do Cidadão
status: Backlog
release: V2
story_points: 13
prioridade: Média
---

# US-02: Acompanhamento Remoto da Fila

## História de Usuário

- **Como um** cidadão que emitiu uma senha e está aguardando atendimento
- **Eu quero** acompanhar minha posição na fila e receber alertas de proximidade pelo celular
- **Para que** eu possa me ausentar fisicamente da sala de espera sem risco de perder minha vez

---

## Contexto e Motivação

A sala de espera de uma agência pública tem um custo humano que vai além do tempo perdido: é um ambiente de ansiedade contínua, onde o cidadão sente que não pode se ausentar nem por alguns minutos com medo de perder a vez. Idosos ficam em cadeiras desconfortáveis por horas, pessoas com crianças pequenas não conseguem atender necessidades básicas, e trabalhadores com hora marcada vivem em tensão constante. Esse estado de "prisão voluntária" é um dos maiores drivers de insatisfação com serviços públicos.

A liberação física — poder sair da sala de espera e retornar alguns minutos antes de ser chamado — é uma das funcionalidades de maior percepção de valor pelo cidadão, com alto impacto em NPS mesmo com pouca complexidade operacional. Experiências similares em bancos privados e restaurantes (sistema de buzzer ou SMS) demonstraram que a simples existência da opção, mesmo que nem todos a utilizem, reduz o estresse geral do ambiente de espera.

O sistema deve oferecer esta funcionalidade de forma completamente opcional — o cidadão que preferir aguardar presencialmente pode fazê-lo normalmente. Para os que optarem pelo acompanhamento remoto, o sistema deve coletar apenas o número de telefone celular, sem requerer cadastro prévio, e enviar notificações progressivas conforme a fila avança. O canal primário deve ser SMS (alcance universal, sem necessidade de internet) com WhatsApp como canal secundário opcional e mais rico.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Cadastro para acompanhamento remoto — Caminho Feliz**
- **Dado que** o cidadão acabou de emitir sua senha no totem
- **Quando** a tela pós-emissão exibe a opção "Quero acompanhar pelo celular"
- **E** o cidadão informa seu número de telefone e confirma
- **Então** o sistema deve vincular o número ao ticket emitido
- **E** deve enviar imediatamente uma mensagem de confirmação com o código da senha e a posição atual na fila

**Cenário 2: Envio de alerta de proximidade**
- **Dado que** o cidadão está cadastrado para acompanhamento remoto
- **Quando** a fila avançar e restar um número configurável de senhas antes da sua (padrão: 5 senhas)
- **Então** o sistema deve enviar uma notificação via SMS com a mensagem: "Sua senha [CÓDIGO] está a X posições. Dirija-se à agência."
- **E** deve enviar um segundo alerta quando restar 2 senhas antes da sua

**Cenário 3: Atualização de posição sob demanda**
- **Dado que** o cidadão recebeu o link de acompanhamento via SMS
- **Quando** ele acessa o link pelo navegador do celular
- **Então** deve ver uma página leve com: posição atual, estimativa de espera atualizada e um botão "Quero ser avisado quando estiver próximo" (caso ainda não esteja cadastrado)

**Cenário 4: Cidadão não retorna a tempo após o alerta — No-show remoto (edge case)**
- **Dado que** o sistema enviou o alerta de proximidade ao cidadão remoto
- **Quando** a senha do cidadão for chamada pelo atendente e ele não comparecer
- **Então** o fluxo de no-show padrão (US-05) deve ser aplicado normalmente
- **E** o sistema deve registrar na auditoria do ticket que o cidadão estava em modo remoto, para fins de análise

**Cenário 5: Número de telefone inválido ou não atingível (edge case)**
- **Dado que** o cidadão informou um número de telefone durante o cadastro remoto
- **Quando** a mensagem de confirmação retornar erro de entrega (número inválido, fora de área, bloqueado para SMS)
- **Então** o sistema deve registrar a falha de entrega no log do ticket
- **E** a senha deve continuar válida na fila normalmente, sem afetar o cidadão que optou pelo acompanhamento presencial
- **E** nenhuma nova tentativa automática de contato deve ser feita com aquele canal sem ação do cidadão

**Cenário 6: Fila paralisa por longo período (edge case)**
- **Dado que** o cidadão está em acompanhamento remoto
- **Quando** a fila não avançar por um período superior a 30 minutos (configurável pelo gestor)
- **Então** o sistema deve enviar uma notificação proativa informando o atraso e a nova estimativa atualizada

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Cadastro de número de telefone no fluxo pós-emissão implementado e funcionando sem requerer login ou cadastro prévio do cidadão
- [ ] Lógica de disparo de alertas validada: o alerta é enviado no limiar correto de posições, sem disparos duplicados ou prematuros
- [ ] Integração com gateway de SMS (canal primário) testada em ambiente de homologação com taxa de entrega registrada
- [ ] Página de acompanhamento via link (URL única por ticket) funcional em dispositivos móveis sem instalação de aplicativo
- [ ] Fluxo de falha de entrega de mensagem documentado e não afeta o ciclo de vida do ticket

---

## Dependências

- **US-01** (Emissão de Senha com Triagem Inteligente) — o ticket deve existir antes de ser vinculado ao celular
- **US-05** (Gestão de No-show) — o no-show de cidadão remoto segue o mesmo fluxo do no-show presencial

---

## Notas Técnicas e Restrições de Negócio

- **LGPD:** O número de telefone coletado é dado pessoal sensível. Deve ser armazenado apenas pelo tempo de vida do ticket (até finalização ou cancelamento) e nunca ser usado para outros fins além do acompanhamento da fila daquele dia. Deve haver aviso claro no totem sobre essa política antes de o cidadão informar o número.
- **Canal primário SMS:** Por ser universal e não exigir internet, o SMS é obrigatório como canal primário. WhatsApp Business API pode ser integrado como canal secundário opcional (ativação configurável por unidade).
- **Limiar de alerta configurável:** O número de senhas restantes antes do disparo do alerta deve ser configurável pelo gestor por fila (levando em conta o TMA médio do serviço — filas com TMA alto precisam de aviso mais antecipado).
- **Link de acompanhamento:** A URL deve ser um token de uso único, vinculado ao ticket, sem expor o número de telefone do cidadão.
