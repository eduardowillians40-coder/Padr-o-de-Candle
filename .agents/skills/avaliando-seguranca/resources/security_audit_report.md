# Relatório de Auditoria de Segurança - Padrão de Candle

## 🛡️ Resumo Executivo
Esta auditoria foi realizada pelo agente de segurança (DOE Framework). Foram identificadas vulnerabilidades críticas no banco de dados Supabase que podem expor dados de usuários se não forem corrigidas.

---

## 🔴 Nível de Risco: ALTO

### 1. RLS Desabilitado (Vulnerabilidade Crítica)
- **Tabela**: `public.leads`
- **Problema**: O Row Level Security (RLS) não está habilitado. Isso significa que qualquer pessoa com a `anon_key` pode ler, inserir ou deletar dados nesta tabela.
- **Recomendação**: Habilitar RLS e criar políticas restritivas.

### 2. Exposição de Funções SECURITY DEFINER
- **Função**: `public.handle_new_user()`
- **Problema**: A função é `SECURITY DEFINER` (roda com privilégios de superusuário) e está executável pela role `anon`. Isso permite que um atacante tente manipular a criação de usuários via RPC.
- **Recomendação**: Revogar `EXECUTE` da role `anon` para esta função:
  ```sql
  REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
  ```

### 3. Exposição via GraphQL
- **Tabelas**: `checklist_items`, `leads`, `profiles`, `strategies`, `trades`, `wallets`.
- **Problema**: Estas tabelas estão visíveis no esquema GraphQL para usuários não autenticados.
- **Recomendação**: Revogar `SELECT` da role `anon` para tabelas que exigem login.

### 4. Vazamento de Listagem em Storage
- **Bucket**: `avatars`
- **Problema**: A política permite listar todos os arquivos no bucket público.
- **Recomendação**: Ajustar a política para permitir apenas `SELECT` de objetos específicos, não a listagem do bucket.

---

## 🛠️ Plano de Ação (Checklist)
- [x] Ativar RLS na tabela `leads`.
- [x] Corrigir permissões da função `handle_new_user`.
- [x] Revisar políticas de GraphQL (Revogar SELECT anon).
- [ ] Ativar proteção contra senhas vazadas no Supabase Auth.

---
*Relatório gerado em: 14/05/2026*
