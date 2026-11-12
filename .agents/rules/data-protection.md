# Diretrizes e Regras de Proteção de Dados do Projeto Hangout Club

> [!CRITICAL]
> **REGRA DE OURO - IMUTABILIDADE E PROTEÇÃO INTEGRAL DE DADOS EM PRODUÇÃO**
> Esta regra é mandatória, permanente e se sobrepõe a qualquer ação automatizada de correção de bugs, refatoração ou atualização do sistema.

---

## 1. Escopo Abrangente de Proteção
A proteção de dados abrange **TODAS as entidades, tabelas e mídias** do projeto Hangout Club no Supabase:
- **Financeiro**: Transações (`transactions`), despesas fixas (`fixed_expenses`), categorias orçamentárias e anexos/extratos bancários.
- **Alunos e Famílias**: Cadastros de alunos (`students`), dados de responsáveis, condições, bolsas e matrículas.
- **Turmas e Pedagógico**: Turmas (`classes`), modalidades, notas, avaliações e histórico de frequência.
- **Inventário e Suprimentos**: Itens de estoque (`inventory`), categorias e histórico de movimentações (`stock_movements`).
- **Pessoas e Agenda**: Usuários (`users`), perfis (`profiles`), eventos do calendário (`events`, `manual_events`) e modelos de comunicação.
- **Arquivos e Storage**: Fotos de perfil, imagens de produtos, comprovantes e PDFs no Supabase Storage.

---

## 2. Proibições Absolutas para Agentes e Modelos de IA
1. **NUNCA executar scripts de exclusão ou modificação direta no Banco de Dados**:
   - É terminantemente proibido rodar scripts (Node.js, Python, SQL, REST API, cURL, etc.) que executem `DELETE`, `TRUNCATE`, `DROP` ou `UPDATE` em massa no banco de dados de produção.
2. **NUNCA realizar limpezas ou deduplicações automatizadas diretas no Banco**:
   - A IA **NÃO** deve tentar deduplicar ou "limpar" registros diretamente no banco via scripts backend. Se houver divergências ou duplicidades, a IA deve apenas auditar em modo somente-leitura e relatar ao usuário.
3. **NUNCA apagar ou alterar dados para corrigir bugs de sistema**:
   - Falhas de visualização, ordenação, paginação, filtros ou regras de negócio devem ser tratadas **estritamente no código-fonte da aplicação (`src/`)**, preservando a integridade dos dados persistidos.

---

## 3. Diretriz para Correções de Bugs e Novas Funcionalidades
- **Solução no Código**: Toda manutenção deve ser resolvida na camada de frontend/serviços (`src/`), tratando inconsistências ou formatações sem alterar os registros gravados no Supabase.
- **Operações pelo Usuário**: O banco de dados só deve receber lançamentos ou exclusões através da própria interface do sistema, mediante ações voluntárias do usuário (formulários, importador com conferência prévia, exclusão em massa com confirmação).

---

## 4. Exceção Única (Sob Consentimento Explícito e Prévio)
Qualquer operação direta sobre dados no banco só poderá ocorrer se:
1. O usuário solicitar expressamente em sua mensagem (ex: *"autorizo apagar o mês X"*).
2. For gerado um **backup preventivo completo obrigatório** em arquivo local antes de executar a ação.
3. A operação se restringir exclusivamente aos registros autorizados pelo usuário, sem afetar nenhuma outra tabela ou período.
