---
name: avaliando-seguranca
description: Avalia vulnerabilidades de segurança em aplicações web, focando em Next.js, Supabase e exposição de chaves sensíveis. Ativado quando o usuário solicita uma auditoria de segurança ou revisão de vulnerabilidades.
---

# Avaliando Segurança

## Quando usar esta skill
- Quando for solicitado uma auditoria de segurança.
- Ao adicionar novas integrações de API.
- Antes de realizar deploy ou commit de mudanças significativas.

## Fluxo de Trabalho (Workflow)
1.  **Revisão de Exposição**: Verificar se `.env` e pastas sensíveis estão no `.gitignore`.
2.  **Auditoria de Chaves**: Localizar chaves codificadas no frontend (hardcoded).
3.  **Verificação de RLS**: Analisar as políticas de Row Level Security no Supabase.
4.  **Análise de Dependências**: Checar por pacotes desatualizados ou vulneráveis.
5.  **Relatório de Riscos**: Gerar um sumário com Nível de Risco (Baixo, Médio, Alto) e recomendações.

## Instruções
- Utilize `grep_search` para encontrar padrões como `AIza`, `sb_`, `SECRET`, `KEY`.
- Verifique a configuração de RLS usando as ferramentas do `supabase-mcp-server`.
- Certifique-se de que o `.gitignore` contém `.env`, `node_modules`, `.next`, e `credentials.json`.

## Recursos
- [Relatório de Segurança Exemplo](examples/security_report_template.md)
- [Script de Scanner de Chaves](scripts/scan_keys.py)
