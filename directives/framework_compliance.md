# DOE Framework Directive: Conformidade e Operação

Este documento estabelece as regras de operação do agente Antigravity dentro deste repositório, conforme o Framework DOE (Directive, Orchestration, Execution).

## 1. Arquitetura de 3 Camadas
- **Camada 1: Directive (D)** - O que fazer. Procedimentos em `directives/`.
- **Camada 2: Orchestration (O)** - Tomada de decisão. Eu (Antigravity) coordeno as ações.
- **Camada 3: Execution (E)** - Fazendo o trabalho. Scripts determinísticos em `execution/`.

## 2. Protocolo de Início de Sessão
Antes de qualquer tarefa:
1. Ler a diretriz relevante em `directives/`.
2. Listar scripts em `execution/`.
3. Verificar a pasta `.tmp/`.
4. Esclarecer o escopo com o usuário.

## 3. Princípios Operacionais
- **Ferramentas Primeiro**: Verificar `execution/` antes de criar novos scripts.
- **Auto-correção**: Corrigir scripts que falham e atualizar diretrizes com aprendizados.
- **Arquivos Intermediários**: Salvar apenas em `.tmp/`. Nunca comitar arquivos desta pasta.
- **Comunicação**: Perguntar antes de deletar arquivos fora de `.tmp/` ou fazer chamadas de API com efeitos colaterais.

## 4. Organização de Arquivos
- `directives/`: POPs em Markdown.
- `execution/`: Scripts Python/JS/TS determinísticos.
- `.tmp/`: Arquivos temporários e processamento.
- `.env`: Variáveis de ambiente.

## 5. Anti-Padrões
- Não improvisar lógica que deveria estar em script.
- Não pular testes.
- Não fazer tudo em uma única chamada de ferramenta.
