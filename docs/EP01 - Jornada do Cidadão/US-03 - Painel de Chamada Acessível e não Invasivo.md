---
id: US-03
epic: EP01 - Jornada do Cidadão
status: Backlog
release: MVP 1.0
story_points: 5
prioridade: Crítica
---

# US-03: Painel de Chamada Acessível e não Invasivo

## História de Usuário

- **Como um** cidadão aguardando atendimento na sala de espera
- **Eu quero** visualizar as senhas sendo chamadas em um painel claro e ouvir um aviso sonoro discreto
- **Para que** eu saiba exatamente quando e para qual guichê me dirigir, sem ansiedade ou confusão

---

## Contexto e Motivação

O painel de chamada é o ponto de contato mais constante entre o sistema e o cidadão durante a espera, e é frequentemente subestimado em seu impacto na experiência. Painéis mal projetados com fontes pequenas, contraste inadequado, textos piscando rapidamente, ou avisos sonoros em volume elevado e repetitivos são fontes diretas de estresse, exclusão de PCDs visuais e auditivos, e erros de leitura (cidadão vai ao guichê errado porque leu apressadamente o número).

Em ambientes públicos, onde a diversidade do público é máxima — analfabetos funcionais, idosos com baixa acuidade visual, pessoas com deficiência auditiva, falantes de outras línguas — o painel não pode ser apenas um "display de números". Ele precisa comunicar de forma redundante (visual e sonora), com linguagem simples, tempo de exibição suficiente para que quem está do outro lado da sala possa ler e reagir, e sem criar poluição sonora que torne o ambiente insuportável.

O painel deve exibir simultaneamente as chamadas em andamento (senha + guichê) e as duas ou três últimas chamadas (para quem piscou os olhos ou estava em outra área), com destaque visual progressivo para a chamada mais recente. O aviso sonoro deve ser um sinal neutro, seguido de anúncio por voz clara com o número da senha e o guichê destino.

---

## Critérios de Aceite (Formato BDD)

**Cenário 1: Exibição de nova chamada — Caminho Feliz**
- **Dado que** um atendente chama a próxima senha pelo sistema (US-04)
- **Quando** a chamada é processada
- **Então** o painel deve atualizar em até 2 segundos exibindo a senha chamada e o número do guichê em destaque
- **E** deve reproduzir um sinal sonoro seguido de anúncio por voz sintetizada: "Senha [CÓDIGO], guichê [NÚMERO]"
- **E** a chamada anterior deve ser movida para a área de "últimas chamadas" com menor destaque visual

**Cenário 2: Senha prioritária recebe destaque visual diferenciado**
- **Dado que** um atendente chama uma senha com marcação de prioridade (prefixo P-)
- **Quando** a chamada é exibida no painel
- **Então** a senha deve aparecer com uma cor ou ícone diferenciador (ex: borda colorida, ícone de prioridade) além do código da senha
- **E** o anúncio sonoro deve incluir a indicação: "Atendimento preferencial, senha [CÓDIGO], guichê [NÚMERO]"

**Cenário 3: Histórico de últimas chamadas visível**
- **Dado que** o painel está em operação normal
- **Quando** uma nova senha é chamada
- **Então** o painel deve exibir simultaneamente as últimas 3 chamadas anteriores em área dedicada, com menor destaque visual, mantendo senha e guichê legíveis
- **E** chamadas com mais de 10 minutos devem ser removidas da área de histórico automaticamente

**Cenário 4: Reconvocação da mesma senha pelo atendente (edge case)**
- **Dado que** uma senha foi chamada e o cidadão não compareceu (no-show iniciado)
- **Quando** o atendente aciona a reconvocação antes de declarar no-show definitivo
- **Então** o painel deve exibir novamente a mesma senha com indicação visual de "SEGUNDA CHAMADA"
- **E** o aviso sonoro deve ser repetido

**Cenário 5: Perda de conexão com o servidor (edge case)**
- **Dado que** o painel está exibindo chamadas normalmente
- **Quando** a conexão com o servidor do sistema é interrompida
- **Então** o painel deve exibir uma mensagem de status indicando "Conexão temporariamente indisponível — aguarde"
- **E** não deve exibir chamadas antigas como se fossem novas
- **E** ao restaurar a conexão, deve sincronizar e exibir o estado atual sem exibir chamadas que já foram processadas na indisponibilidade

**Cenário 6: Múltiplos guichês chamando simultaneamente (edge case)**
- **Dado que** dois ou mais atendentes chamam senhas com menos de 3 segundos de diferença
- **Quando** as chamadas são processadas
- **Então** cada chamada deve ser exibida e anunciada de forma sequencial, não simultânea
- **E** a ordem de exibição deve seguir a ordem de registro no servidor

---

## Definição de Pronto (DoD — Definition of Done)

- [ ] Painel exibe chamada ativa e histórico das 3 últimas chamadas, com distinção visual clara entre elas
- [ ] Aviso sonoro e anúncio por voz testados com volume calibrado para o ambiente (sem distorção e sem exceder 70 dB a 2 metros)
- [ ] Destaque visual de senhas prioritárias implementado e validado com o critério de contraste WCAG AA (mínimo 4.5:1)
- [ ] Comportamento de reconexão testado: painel se recupera corretamente após queda de rede sem exibir estados inconsistentes
- [ ] Tempo de atualização do painel após chamada validado como ≤ 2 segundos em condições normais de rede

---

## Dependências

- **US-01** (Emissão de Senha com Triagem Inteligente) — as senhas exibidas no painel são as emitidas via triagem
- **US-04** (Interface de Guichê com Ações Rápidas) — a chamada é disparada pelo atendente na interface do guichê

---

## Notas Técnicas e Restrições de Negócio

- **Protocolo de exibição:** O painel deve operar via conexão persistente (WebSocket ou equivalente) para garantir latência mínima de atualização. Polling HTTP não é aceitável para este caso de uso.
- **Acessibilidade de hardware:** O painel deve ser testado em monitores com resolução mínima de 1080p e distância de leitura de até 10 metros. O tamanho mínimo do texto da senha principal é 120pt.
- **Volume configurável:** O administrador deve poder ajustar o volume do aviso sonoro via painel de configuração, sem precisar acesso ao sistema operacional do dispositivo.
- **Modo silencioso:** O gestor deve poder ativar um "modo silencioso" (apenas visual, sem áudio) para horários específicos ou ambientes que exijam silêncio, com aviso visível no painel para que os cidadãos saibam monitorar ativamente.
- **Independência operacional:** O painel não deve depender da mesma máquina do totem de emissão. Deve ser um cliente leve (browser ou aplicativo dedicado) conectado ao servidor central.
