
export const manualContent = `
# Manual do Sistema de Gestão - NeoAcademic

Bem-vindo ao manual do sistema de gestão da NeoAcademic. Este documento serve como um guia completo para utilizar todas as funcionalidades da plataforma, desde o acesso inicial até a gestão detalhada de alunos, finanças e configurações avançadas.

## 1. Acesso ao Sistema (Login)

Para começar, acesse a tela de login.

-   **Seleção de Perfil**: Escolha seu nome de usuário na lista de perfis disponíveis.
-   **Senha**: Digite sua senha de acesso.
-   **Entrar**: Clique no botão "Entrar" para acessar o painel principal (Dashboard).

---

## 2. Navegação Principal e Ajuda

O sistema possui uma barra de navegação lateral e um assistente de ajuda flutuante.

-   **Barra de Navegação**: A barra lateral fica recolhida, mostrando apenas os ícones. Ao passar o mouse sobre ela, ela se expande automaticamente para exibir os nomes de cada módulo, otimizando o espaço de tela.
-   **Assistente de Ajuda**: Um botão com a logo da NeoAcademic fica no canto inferior direito de todas as telas. Ao clicar, um pop-up se abre, permitindo que você faça perguntas sobre o sistema para uma IA ou consulte as perguntas mais frequentes (FAQ).

---

## 3. Painel Inicial (Dashboard)

O painel oferece uma visão geral e acesso rápido às principais áreas.

-   **Sua Agenda do Dia**: Visualize seus compromissos do dia (aulas, tarefas) e os aniversariantes. Você pode navegar entre as datas ou adicionar novos eventos.
-   **Resumo Geral**: Cards que mostram o total de alunos, turmas ativas e o faturamento mensal (visível para perfis com permissão).
-   **Resumo do Inventário (Admin/Secretaria)**: Cards com alertas de estoque baixo, itens mais usados e um resumo por categorias.
-   **Ações Rápidas**: Atalhos para as seções principais.

---

## 4. Agenda

Gerencie todos os seus eventos, aulas e tarefas.

-   **Calendário Interativo**: Clique em um dia para ver os eventos agendados.
-   **Filtro por Usuário (Admin/Secretaria)**: Filtre a agenda para ver os compromissos de um usuário específico ou de todos.
-   **Adicionar Novo Evento**: Clique no botão para cadastrar aulas, tarefas ou reuniões.
-   **Ações do Evento**: Para aulas, é possível visualizar o perfil da turma. Para tarefas, é possível editar, reagendar ou apagar.

---

## 5. Alunos

Gerencie o cadastro completo dos alunos.

-   **Listagem de Alunos**: A tabela principal exibe todos os alunos com informações como foto, nome, turma, condição e status. A busca permite encontrar alunos por nome ou responsável.
-   **Paginação**: Navegue entre as páginas de alunos usando os botões "Anterior" e "Próxima".
-   **Ações em Massa**: Selecione múltiplos alunos para mudar de turma, alterar status ou apagar em conjunto.
-   **Novo Aluno**: Clique em "Novo Aluno" para abrir o formulário de cadastro. Você pode cadastrar um aluno sem vinculá-lo a uma turma, escolhendo a opção "Não vincular a nenhuma turma".
-   **Ficha do Aluno**: Ao clicar em "Ver ficha", um pop-up exibe o perfil detalhado do aluno, com dados pessoais, histórico de notas, pagamentos, frequência e a opção de imprimir.

---

## 6. Turmas

Organize suas aulas criando e gerenciando turmas.

-   **Listagem de Turmas**: Veja todas as turmas, professores, número de alunos, horários e status.
-   **Busca e Paginação**: Encontre turmas pelo nome e navegue entre as páginas.
-   **Criar Nova Turma**: Clique para definir nome, professor, modalidade, dias da semana, horário e adicionar alunos disponíveis (que ainda não estão em nenhuma turma).
-   **Perfil da Turma**: Ao visualizar uma turma, um pop-up exibe a lista de alunos e uma aba de "Frequência" para realizar a chamada do dia, marcando como presente, ausente ou justificado.

---

## 7. Notas

Realize o lançamento e a consulta de notas.

1.  **Filtros**: Selecione a **Turma** e, em seguida, clique no botão de seleção para escolher o **Aluno** em um pop-up.
2.  **Lançamento**: Escolha o **período de avaliação** e insira as notas. O sistema calculará a média de aproveitamento automaticamente.
3.  **Histórico do Aluno**: Na mesma tela, visualize todas as notas já lançadas para o aluno selecionado, com a opção de editar ou apagar notas individuais.

---

## 8. Financeiro

Controle todas as finanças.

-   **Resumo Mensal**: Cards mostram o total de entradas, saídas variáveis, despesas fixas e o lucro do período.
-   **Filtros**: Selecione mês e ano para visualizar o resumo financeiro correspondente. É possível também filtrar a tabela por tipo de transação (Entradas, Saídas, Despesas Fixas).
-   **Pendências do Mês**: Lista de alunos com mensalidades em aberto, com atalho para "Registrar Pagamento".
-   **Transações Detalhadas**: Tabela unificada com todas as movimentações.
-   **Gerenciamento de Despesas Fixas**: Cadastre, edite, apague e registre o pagamento de despesas recorrentes (visível ao filtrar por "Despesas Fixas").

---

## 9. Inventário

Controle os materiais do clube.

-   **Listagem de Itens**: Tabela com todos os itens, foto, estoque atual e mínimo.
-   **Busca e Filtros**: Encontre itens pelo nome ou filtre por categoria.
-   **Alertas de Estoque**: Itens com estoque baixo são destacados visualmente.
-   **Movimentação Rápida**: Botões de "Entrada" e "Saída" na própria linha para registrar movimentações de forma ágil.
-   **Ações do Item**: Visualize o perfil completo com histórico de movimentações, edite ou apague um item.

---

## 10. Comunicação

Envie comunicados para os responsáveis.

-   **Seleção de Destinatários**: Escolha turmas ou alunos específicos.
-   **Modelos Prontos (Templates)**: Use modelos pré-configurados ou comece do zero.
-   **Assistente de IA**: Escreva um rascunho e clique em "Melhorar com IA" para aprimorar o texto.
-   **Envio**: A plataforma utiliza a conta Google conectada nas configurações para enviar os comunicados por e-mail.

---

## 11. Configurações

Gerencie seu perfil e as configurações do sistema.

-   **Meu Perfil**: Altere sua foto de perfil, nome de exibição e senha. Nesta aba, também é possível conectar sua conta do Google para habilitar o envio de e-mails.
-   **Permissões (Admin)**: Ative ou desative o acesso a cada módulo para os diferentes perfis de usuário.
-   **Funcionários (Admin)**: Adicione, edite e remova os funcionários que podem acessar o sistema.
-   **Categorias (Admin)**: Adicione ou remova as categorias usadas no sistema (Condições de Aluno, Modalidades de Turma, Categorias do Inventário, Cargos de Funcionários e Modelos de Comunicação).

---

## 12. Lixeira

Acesse pelo menu do seu avatar. A lixeira armazena itens apagados (alunos, turmas, etc.) e permite que você os restaure ou os exclua permanentemente (ação que exige uma senha mestra).
`;

    
