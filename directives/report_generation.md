# Diretriz de Geração de Relatórios de Performance

Este documento descreve o procedimento para a geração de relatórios de performance (Camada D) e como a camada de Execução deve se comportar.

## 1. Objetivo
Gerar um resumo detalhado da performance de trading de um usuário ou carteira específica em formato legível (Markdown/PDF).

## 2. Entradas (Inputs)
- `userId`: ID do usuário no Supabase.
- `walletId` (opcional): ID de uma carteira específica.
- `periodo`: (Ex: "últimos 30 dias", "mês atual").

## 3. Procedimento (Camada O)
1.  O Orquestrador deve chamar o script `execution/generate_report.ts`.
2.  O script deve:
    - Autenticar com o Supabase.
    - Buscar trades e carteiras relevantes.
    - Utilizar o `execution/metrics_engine.ts` para processar os dados.
    - Formatar um documento Markdown na pasta `.tmp/`.
3.  O Orquestrador deve apresentar o resumo ao usuário e informar o caminho do arquivo gerado.

## 4. Estrutura do Relatório
O relatório deve conter:
- Cabeçalho com data e escopo.
- Tabela de métricas principais (Win Rate, RR, Profit Líquido).
- Tabela dos últimos 10 trades.
- Análise sintética (IA) se solicitado.

## 5. Casos de Erro
- Se não houver trades no período, informar "Sem dados suficientes para o período selecionado".
- Se houver erro de conexão, tentar novamente uma vez antes de reportar falha.
