---
name: design-pdf-report
description: Especialista em design e geração de relatórios em PDF para análise de trading e performance. Ativado quando o usuário solicita criação, customização ou otimização de relatórios PDF, incluindo layout, tipografia, gráficos, tabelas e estilos visuais profissionais.
---

# Design de Relatórios PDF - Tactical Eye Intelligence

## Quando usar esta skill
- Ao criar relatórios de performance de trading.
- Ao customizar layouts existentes de relatórios.
- Ao adicionar gráficos, tabelas ou elementos visuais em PDFs.
- Ao otimizar a aparência profissional de documentos.
- Ao configurar geração de PDFs no frontend/backend.

## Estrutura do Relatório PDF

### 1. Header Profissional
- Logo da plataforma (ícone emoji + nome)
- Título do relatório ("Relatório de Performance")
- Período analisado
- Identificação do documento como confidencial

### 2. Resumo Executivo
- Grid de 4 métricas principais (Total Operações, Win Rate, Lucro Líquido, Expectativa)
- Destaque visual para valores positivos/negativos

### 3. Métricas Detalhadas
- Cards com 6 métricas principais (Total, Win Rate, Wins, Losses, BE, Payoff)
- Cores condicionais (verde para bom, vermelho para ruim)

### 4. Distribuição de Resultados
- Gráfico de pizza (donut chart) com WIN/LOSS/BE
- Legenda colorida
- Tabela de breakdown financeiro

### 5. Performance por Ativo
- Gráfico de barras horizontais
- Top 5 ativos mais lucrativos

### 6. Análise de Gatilhos
- Tabela com nome do gatilho, profit, win rate, operações
- Ordenada por profit descendente

### 7. Métricas de Risco
- Grid de 4 cards: Ganho Médio, Perda Média, Payoff, Drawdown
- Cores semânticas (verde=ganho, vermelho=perda)

### 8. Sessões & Eficiência
- Melhores horários de entrada/saída
- Melhor sessão por profit

### 9. Análise Psicológica
- Cards para estado dominante, melhor emoção, melhor sono
- Tabelas de performance por emoção e sono
- Win Rate e profit por categoria

### 10. Métricas Avançadas
- Expectativa matemática por operação
- Relação R:R (Payoff)
- Fator de Lucro
- Shade Ratio (indicador de edge)

### 11. Histórico de Operações
- Tabela com data, ativo, tipo, status, profit, emoção
- Limitado a 15 operações (com aviso de mais)
- Cores condicionais por status

### 12. Conclusão & Insights
- Background escuro para destaque
- Recomendações de execução e gestão
- Insights de hábitos e psicológico

### 13. Footer Profissional
- Logo da plataforma
- Aviso de confidencialidade
- Data e hora de geração
- Versão do sistema

## Bibliotecas Recomendadas
- **Frontend (React/Next.js)**: react-pdf, @react-pdf/renderer, jsPDF
- **Conversão HTML→PDF**: dom-to-image-more + jsPDF
- **Backend**: puppeteer, pdfkit, weasyprint
- **Gráficos**: recharts (embutidos em PDFs)

## Paleta de Cores (Tema Claro)
- **Primary (Header/Footer)**: #0f172a (slate-900)
- **Accent Blue**: #3b82f6 (blue-500)
- **Success**: #10b981 (emerald-500)
- **Danger**: #ef4444 (red-500)
- **Purple**: #8b5cf6 (violet-500)
- **Sky**: #0ea5e9 (sky-500)
- **Background Light**: #f8fafc (slate-50)
- **Border**: #e2e8f0 (slate-200)
- **Text Primary**: #0f172a (slate-900)
- **Text Muted**: #64748b (slate-500)

## Tipografia
- **H1 (Títulos de seção)**: 14px, Bold, uppercase, 0.08em letter-spacing
- **H2 (Subtítulos)**: 12px, Bold, uppercase
- **Métricas grandes**: 20-26px, 800 weight
- **Corpo**: 11-12px, regular
- **Legendas**: 9-10px, muted

## Componentes Reutilizáveis
- Cards de métrica com bordas arredondadas
- Tabelas com headers destacados
- Grids responsivos
- Badges coloridos para status

## Instruções de Implementação
1. Use `dom-to-image-more` para converter DOM em PNG
2. Use `jsPDF` para criar PDF a partir do PNG
3. Defina formato A4 para consistência
4. Use escala 2x para qualidade de impressão
5. Teste em diferentes tamanhos de papel

## Recursos
- [Templates de Relatórios](examples/pdf_templates/)
- [Componentes Reutilizáveis](components/pdf/)
- [Utilitários de Estilo](styles/pdf_styles.ts)