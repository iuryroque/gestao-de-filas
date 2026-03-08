Title: US-01 — Emissão de Senha com Triagem Inteligente
Labels: epic/EP01, mvp, priority/high, frontend, ux
Assignee: @TODO

Descrição:
Como um cidadão que precisa ser atendido em uma agência pública
Eu quero ser guiado por um fluxo de triagem inteligente ao emitir minha senha
Para que eu seja direcionado ao guichê e à fila corretos desde o início, sem precisar de intervenção humana

Contexto resumido:
Totem de autoatendimento com fluxo de categorias + triagem, declaração de prioridade, confirmação e comprovante com QR/URL para acompanhamento remoto.

Critérios de Aceite (tester):
- [ ] Totem apresenta categorias (máx 3 níveis) e identifica serviço em ≤ 3 interações
- [ ] Declaração de prioridade possível e refletida no ticket (prefixo `P-`)
- [ ] Comprovante impresso (ou exibido) com código, serviço, posição, estimativa e QR/URL
- [ ] Se serviço estiver sem guichê ativo, não emite senha e exibe alternativa
- [ ] Timeout de inatividade cancela fluxo (60s) com contagem regressiva de 15s

Definição de Pronto (DoD):
- [ ] Frontend do totem implementado com acessibilidade WCAG AA
- [ ] Endpoint `POST /tickets` criado e integrado
- [ ] Impressão tratada com fallback (exibir código na tela)
- [ ] Testes de usabilidade com 3 usuários representativos realizados

Notas/Tarefas técnicas:
- Endpoint sugerido: `POST /tickets {serviceId, priorityFlag, followupPhone?}` -> responde {ticketId, code, position, estWait, followUrl}
- Guardar número telefônico apenas pelo tempo de vida do ticket (LGPD)
