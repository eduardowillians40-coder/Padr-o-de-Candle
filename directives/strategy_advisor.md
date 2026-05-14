# Diretriz de Consultor de Estratégia (Compliance Audit)

Este documento orienta o agente sobre como realizar a análise de conformidade das estratégias de trading do usuário.

## 1. Objetivo
Identificar padrões de comportamento onde o usuário negligencia itens específicos de suas estratégias, fornecendo insights acionáveis para melhorar a disciplina.

## 2. Coleta de Dados
O Orquestrador deve utilizar o script `execution/analyze_compliance.ts` para:
- Mapear todos os trades vinculados a uma estratégia.
- Extrair as respostas do checklist associadas a cada trade na tabela `trade_checklist_responses`.

## 3. Lógica de Análise
1.  **Frequência de Uso**: Calcular quantas vezes a estratégia foi utilizada no período.
2.  **Taxa de Conformidade (Compliance Rate)**: Porcentagem de itens marcados como `true` vs total de itens do checklist.
3.  **Identificação de Pontos Cegos (Blind Spots)**:
    - Listar itens que são marcados como `false` em mais de 30% dos trades vencedores (WIN).
    - Listar itens que são marcados como `false` em trades perdedores (LOSS).
4.  **Correlação de Performance**: Verificar se a ausência de um item específico no checklist correlaciona com um aumento na taxa de LOSS.

## 4. Formato do Insight
O agente deve comunicar os resultados seguindo este tom:
- "Você está seguindo bem o item X, mas notei que em 40% dos seus trades perdedores, você não validou o item Y."
- "Sua taxa de acerto sobe de 45% para 70% quando você segue rigorosamente o passo Z."

## 5. Próximos Passos
Sugerir ajustes na estratégia (simplificação de itens complexos) ou reforço na disciplina se os dados mostrarem que a falta de conformidade é a causa principal das perdas.
