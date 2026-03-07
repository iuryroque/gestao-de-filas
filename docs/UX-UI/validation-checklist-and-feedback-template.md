# Checklist de Validação — Protótipos Totem & Guichê

Objetivo: validar hipóteses do MVP (US-01, US-03, US-04, US-05, US-08) com 1 PO, 1 atendente e 1 supervisor em sessão de 20–30 minutos.

Preparação (antes da sessão)
- [ ] Compartilhar link dos protótipos: `prototypes/totem.html` e `prototypes/guiche.html` com participantes
- [ ] Ambiente: navegador Chrome/Edge, tela com som ativado (para painéis) e impressora não requerida
- [ ] Documentar data/hora e participantes (nome e papel)
- [ ] Preparar cronômetro e ferramenta de gravação opcional (peça consentimento)

Agenda (20–30 minutos)
1. Boas-vindas e objetivo (2 minutos)
   - Explicar objetivo: validar usabilidade e fluxo mínimo (emissão → chamada → atendimento → no-show).
2. Totem — Fluxo de Emissão (8 minutes)
   - Tarefas (métricas a observar):
     - Emitir uma senha para um serviço simples. (Observação: tempo até confirmação, erros, clareza da linguagem)
     - Declarar prioridade (ex: selecionar "Idoso"). (Observação: facilidade de declaração e feedback visual)
     - Optar por acompanhamento por celular (se disponível). (Observação: intenção e fricção)
   - Perguntas guiadas para PO/Atendente: o fluxo foi claro? Alguma opção confusa?
3. Guichê — Operação do Atendente (8 minutes)
   - Tarefas (métricas a observar):
     - Chamar próximo (F2 ou botão). (Observação: tempo de resposta, clareza do ticket exibido)
     - Simular não-comparecimento e usar "Não Compareceu" / "Reconvocar". (Observação: facilidade de registrar no-show)
     - Finalizar atendimento e observar retorno ao estado pronto.
   - Perguntas guiadas: as ações principais estão acessíveis e óbvias? Algum clique extra?
4. Painel e Gestão — Cenário rápido (5 minutes)
   - Mostrar como o painel (simulado) receberia chamadas e alertas de SLA (apresentação pelo PO).
   - Perguntas: a informação apresentada ajuda a decidir abrir mais guichês?
5. Encerramento e feedback rápido (2–5 minutes)
   - Coletar respostas do template (a seguir) e comentários abertos

Observações de observador (use anotações rápidas)
- Tempo total por tarefa (cronômetro)
- Fricções encontradas (ex.: botão pequeno, linguagem ambígua)
- Erros ou hesitações do usuário
- Sugestões espontâneas

---

# Template de Feedback (usar com cada participante)

Identificação
- Nome (opcional):
- Papel: (PO / Atendente / Supervisor)
- Data:

Sessão (marcar uma opção)
- Totalmente concluiu as tarefas? [Sim / Parcial / Não]
- Houve barreira crítica? [Sim / Não] — se sim, descreva:

Avaliação rápida (1–5, 5 = ótimo)
- Emissão de senha (totem): 1 2 3 4 5
- Claridade das opções no totem: 1 2 3 4 5
- Facilidade de declaração de prioridade: 1 2 3 4 5
- Operação de guichê (chamar/finalizar): 1 2 3 4 5
- Gestão (visibilidade de filas / alertas): 1 2 3 4 5

Comentários (respostas abertas)
- O que você mais gostou?
- O que gerou mais fricção?
- Alguma funcionalidade crítica faltando para operar no dia a dia?
- Pequenas melhorias sugeridas (UI/labels/actions):

Ações recomendadas após sessão (checks)
- [ ] Atualizar texto do botão/label (especificar)
- [ ] Aumentar tamanho do botão X no totem
- [ ] Ajustar sequência de triagem para reduzir passos
- [ ] Implementar envio de SMS opcional no fluxo pós-emissão

Consentimento e registro
- Aceita gravação da sessão? [Sim / Não]
- Observações finais do moderador:

---

Formato de entrega
- Registrar os feedbacks em um único documento (sugestão: `docs/UX-UI/validation-logs.md`) e priorizar correções em backlog (tag `usability` e `mvp`).
