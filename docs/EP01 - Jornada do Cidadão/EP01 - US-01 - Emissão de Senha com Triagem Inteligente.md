---
id: US-01
epic: EP01 - Jornada do Cidadão
status: Backlog
release: MVP 1.0
story_points: 8
prioridade: Crítica
---

# US-01: Emissão de Senha com Triagem Inteligente

## História de Usuário

- **Como um** cidadão que precisa ser atendido em uma agência pública
- **Eu quero** ser guiado por um fluxo de triagem inteligente ao emitir minha senha
- **Para que** eu seja direcionado ao guichê e à fila corretos desde o início, sem precisar de intervenção humana

---

## Contexto e Motivação

Em ambientes de atendimento público, um dos maiores geradores de retrabalho e insatisfação é o que os operadores chamam de "errante de fila": o cidadão que pega a senha errada — seja por confusão das placas, por não entender a diferença entre os serviços ofertados, ou por simplesmente não saber ao certo o que precisa. Ao chegar ao guichê após 40 minutos de espera, é informado que está na fila errada, precisando retirar nova senha e reiniciar o processo. O impacto é duplo: frustrante para o cidadão e ineficiente para a operação, pois esse atendimento não gera valor algum.

Um segundo problema crítico é a gestão das prioridades legais. A Lei Federal 10.048/2000 garante atendimento preferencial a idosos acima de 60 anos, gestantes, lactantes, pessoas com crianças de colo e PCDs. Quando a triagem não captura essa condição no momento da emissão, cria-se um cenário de constrangimento social no guichê ou, pior, de violação legal da instituição. A triagem deve perguntar ativamente sobre a condição de prioridade.

O totem de autoatendimento deve funcionar como um atendente virtual inteligente: apresentar os serviços disponíveis de forma clara, com linguagem simples e sem jargão técnico, conduzir o cidadão por perguntas progressivas para identificar o serviço exato, confirmar a escolha antes de emitir a senha, imprimir o comprovante com informações úteis (posição na fila, estimativa de espera e serviço selecionado), e oferecer interface acessível com fonte ampliada, contraste alto e sintetizador de voz opcional.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Emissão bem-sucedida para serviço não-prioritário — Caminho Feliz**
- **Dado que** o cidadão está na tela inicial do totem de autoatendimento
- **Quando** ele navega pelo fluxo de triagem e seleciona corretamente o serviço desejado
- **Então** o sistema deve emitir uma senha única e sequencial para a fila correspondente
- **E** o comprovante impresso deve conter: código da senha, nome do serviço selecionado, posição atual na fila, estimativa média de espera e data/hora de emissão
- **E** a senha deve ser adicionada ao final da fila regular do serviço selecionado

**Cenário 2: Emissão com declaração de prioridade legal**
- **Dado que** o cidadão está no fluxo de triagem inteligente
- **Quando** ele declara ter uma condição de prioridade (idoso 60+, gestante, lactante, PCD, pessoa com criança de colo)
- **Então** o sistema deve emitir uma senha com prefixo e marcação visual diferenciada (ex: `P-0042`)
- **E** essa senha deve ser inserida na fila prioritária, respeitando a ordem de chegada entre os demais prioritários
- **E** o comprovante deve exibir claramente a indicação "ATENDIMENTO PREFERENCIAL"

**Cenário 3: Confirmação antes da emissão**
- **Dado que** o cidadão concluiu a triagem e o sistema identificou o serviço
- **Quando** a tela de confirmação é exibida com o resumo do serviço selecionado
- **E** o cidadão pressiona "Confirmar"
- **Então** a senha é emitida e o comprovante é impresso
- **E** o sistema retorna à tela inicial em até 5 segundos após a impressão

**Cenário 4: Cidadão solicita correção antes da emissão (edge case)**
- **Dado que** a tela de confirmação está sendo exibida com o resumo da triagem
- **Quando** o cidadão pressiona "Voltar" ou "Corrigir"
- **Então** o sistema deve retornar ao passo anterior do fluxo de triagem sem emitir senha
- **E** nenhuma senha deve ser criada ou reservada no sistema

**Cenário 5: Serviço indisponível no momento da emissão (edge case)**
- **Dado que** o cidadão conclui a triagem e seleciona um serviço
- **Quando** esse serviço está temporariamente suspenso (sem guichês ativos) naquele momento
- **Então** o sistema deve exibir uma mensagem clara informando que o serviço está temporariamente indisponível
- **E** deve sugerir os canais alternativos (agendamento online, retorno em outro horário) configurados pelo gestor
- **E** não deve emitir senha para uma fila sem atendente ativo

**Cenário 6: Timeout por inatividade (edge case)**
- **Dado que** o cidadão iniciou o fluxo de triagem no totem
- **Quando** não há nenhuma interação por mais de 60 segundos (tempo configurável)
- **Então** o sistema deve exibir um aviso de contagem regressiva de 15 segundos
- **E** se não houver interação, deve cancelar o fluxo e retornar à tela inicial sem emitir senha

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Fluxo de triagem cobre 100% dos serviços cadastrados na agência, sem deixar "beco sem saída" navegacional
- [ ] Lógica de prioridade aplicada corretamente: senhas P-xxxx sempre precedem senhas regulares na chamada
- [ ] Comprovante impresso validado com todos os campos obrigatórios (senha, serviço, posição, estimativa, data/hora)
- [ ] Timeout de inatividade implementado e testado com o valor padrão de 60 segundos
- [ ] Fluxo completo testado com usuários representativos de grupos de acessibilidade (idosos, baixa escolaridade) em sessão de usabilidade

---

## Dependências

- Nenhuma. US-01 é o item de entrada do sistema e não possui pré-requisito de outra US.
- É pré-requisito para: US-02, US-03, US-04, US-05, US-06, US-07, US-08, US-09, US-10, US-11

---

## Notas Técnicas e Restrições de Negócio

- **Regra de prioridade legal:** O sistema deve suportar os cinco grupos previstos na Lei 10.048/2000. A declaração é feita pelo próprio cidadão (autodeclaração), sem validação documental no totem — a responsabilidade é do declarante.
- **Acessibilidade:** A tela de confirmação e todas as telas do fluxo devem atingir nível AA do WCAG 2.1 (contraste mínimo 4.5:1, fonte mínima 18pt em modo acessível, sintetizador de voz ativável por botão físico ou de tela).
- **Impressora térmica:** O sistema deve tratar falhas de impressora (papel acabado, impressora offline) e, nesses casos, exibir o código da senha na tela por 30 segundos para que o cidadão possa fotografar.
- **Sessão isolada:** Cada sessão de triagem deve ser completamente isolada. Dados de um cidadão não podem vazar para a sessão seguinte.
- **Estimativa de espera:** Exibida no comprovante deve ser calculada em tempo real com base na quantidade de pessoas na fila e no TMA histórico do serviço (média móvel das últimas 2 horas).
