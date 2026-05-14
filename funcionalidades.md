# Funcionalidades e Plano de Melhorias (Framework DOE)

Este documento detalha as funcionalidades atuais do app "Padrão de Candle" e o roadmap para implementação da metodologia DOE.

## 1. Funcionalidades Atuais

### 🛡️ Autenticação e Perfil
- Login e Cadastro via Supabase.
- Gerenciamento de preferências do usuário (Moeda, temas).

### 💰 Gestão de Carteiras (Wallets)
- Criação de múltiplas carteiras.
- Definição de saldo inicial e metas de lucro.
- Acompanhamento de progresso de metas.

### 📊 Diário de Trades
- Registro de operações (Ativos, Entrada, Saída, Lucro/Prejuízo).
- Categorização de status: WIN, LOSS, BE (Break Even).
- Cálculo automático de taxas e lucro líquido.

### 📈 Dashboard de Performance
- **Estatísticas Chave**: Win Rate, Fator de Lucro, Relação Risco/Retorno (RR), Drawdown Máximo.
- **Gráfico de Evolução**: Curva de patrimônio (Equity Curve) em tempo real.
- **Resumo por Período**: Filtros por data e carteira específica.

### 🛠️ Ferramentas Avançadas de Análise
- **Smart Money Concepts (SMC)**: Identificação de Order Blocks e Liquidez.
- **Teoria de Ondas de Elliott & Wyckoff**: Ferramentas para mapeamento de ciclos de mercado.
- **Simulador de Trading**: Ambiente para teste de estratégias.
- **Análise de Sessões**: Identificação de horários de mercado (London, NY, Asia).

---

## 2. Plano de Realização (Roadmap DOE)

### Etapa 1: Estruturação da Camada de Execução (E) [CONCLUÍDO]
- **Ação**: Mover a lógica de cálculo matemático do Dashboard para `execution/metrics_engine.ts`.
- **Resultado**: Lógica centralizada e desacoplada da UI.

### Etapa 2: Implementação de Relatórios Automatizados [CONCLUÍDO]
- **Ação**: Criar `execution/generate_report.ts` e `directives/report_generation.md`.
- **Resultado**: O sistema agora permite a geração autônoma de relatórios de auditoria em `.tmp/`.

### Etapa 3: Integração com Inteligência Artificial (O) [CONCLUÍDO]
- **Ação**: Criar `execution/analyze_compliance.ts` e `directives/strategy_advisor.md`.
- **Resultado**: O agente agora consegue analisar quais itens do checklist você está negligenciando e como isso afeta seu lucro.

---

## 3. Orientações para Melhorias

1.  **Separação de Preocupações**:
    - A UI (`app/`) deve apenas exibir dados.
    - O processamento de dados complexos deve viver em `execution/`.
    - As regras de negócio devem estar documentadas em `directives/`.

2.  **Validação de Estratégia**:
    - Implementar uma funcionalidade onde o usuário sobe o print de um trade, e o script em `execution/` usa Visão Computacional (GenAI) para validar se o trade seguiu a estratégia definida.

3.  **Segurança e Confiabilidade**:
    - Todos os scripts em `execution/` devem ter tratamento de erro robusto.
    - Variáveis sensíveis sempre no `.env`.

---
*Documento gerado e mantido pelo Agente Antigravity seguindo o Protocolo DOE.*
