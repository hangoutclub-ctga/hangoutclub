# Documentação Técnica do Sistema - NeoAcademic

Este documento serve como um guia para desenvolvedores, detalhando a arquitetura, as tecnologias e os padrões utilizados na construção da aplicação NeoAcademic. O objetivo é facilitar a manutenção e a replicação de funcionalidades em projetos futuros.

---

## 1. Visão Geral da Arquitetura e Tecnologias

O sistema foi construído sobre uma base moderna de JavaScript, priorizando a produtividade do desenvolvedor e uma experiência de usuário robusta.

-   **Frontend:**
    -   **Framework:** [Next.js](https://nextjs.org/) com App Router. Foi escolhido pela sua estrutura de renderização híbrida (Server e Client Components), otimização de performance e roteamento baseado em arquivos.
    -   **Linguagem:** TypeScript.
    -   **UI Library:** [React](https://react.dev/).
    -   **Componentes:** [Shadcn/UI](https://ui.shadcn.com/). É uma coleção de componentes reutilizáveis construídos sobre Radix UI e Tailwind CSS. Os componentes base estão em `src/components/ui` e os componentes de negócio (mais complexos) estão em `src/components`.
    -   **Estilização:** [Tailwind CSS](https://tailwindcss.com/). Utilizado para estilização utilitária rápida e consistente. As configurações de tema (cores, fontes) estão em `src/app/globals.css` e `tailwind.config.ts`.

-   **Backend e Banco de Dados:**
    -   **Banco de Dados:** [Cloud Firestore (Firebase)](https://firebase.google.com/docs/firestore). Um banco de dados NoSQL, flexível e escalável, utilizado para armazenar todos os dados da aplicação (alunos, turmas, finanças, etc.). A configuração de conexão está em `src/lib/firebase.ts`.
    -   **Autenticação:** Uma combinação de um fluxo customizado (usuário/senha) e [NextAuth.js](https://next-auth.js.org/) para integração com provedores OAuth (Google).

-   **Inteligência Artificial:**
    -   **Framework de IA:** [Genkit (Firebase)](https://firebase.google.com/docs/genai/node/genkit-get-started). Utilizado para criar e gerenciar os fluxos de IA que se comunicam com os modelos do Google (Gemini). Todos os fluxos de IA residem em `src/ai/flows`.

---

## 2. Estrutura de Pastas (Principais Diretórios)

-   `src/app/dashboard/`: Contém as páginas principais da aplicação, seguindo o roteamento do Next.js. Cada pasta corresponde a uma rota (ex: `/dashboard/students`).
-   `src/components/`: Contém os componentes React reutilizáveis e mais complexos da aplicação (ex: `StudentForm`, `ClassProfile`).
    -   `src/components/ui/`: Componentes base da biblioteca Shadcn/UI (Button, Card, Input, etc.).
-   `src/hooks/`: Contém os React Hooks customizados que encapsulam lógicas de negócio e acesso a dados (ex: `useAuth`, `useAgenda`, `useData`).
-   `src/lib/`: Funções utilitárias, configuração do Firebase (`firebase.ts`) e o script de seed (`seed.ts`).
-   `src/ai/`: Lógica relacionada à Inteligência Artificial.
    -   `src/ai/flows/`: Definição dos fluxos do Genkit (ex: `tutorial-flow.ts` para o assistente de ajuda).
-   `src/types/`: Definições de tipos TypeScript usadas em toda a aplicação (`index.ts`).

---

## 3. Fluxo de Dados e Estado Global

A aplicação utiliza uma abordagem mista para gerenciamento de estado.

-   **Dados Globais (Context API):**
    -   `src/components/data-provider.tsx`: Este componente (`<DataProvider>`) utiliza o Context API do React para buscar e fornecer dados que são usados em múltiplas partes da aplicação, como a lista de **usuários** e as **categorias** do sistema (cargos, modalidades, etc.).
    -   `src/hooks/use-data.ts`: Hook para consumir facilmente os dados fornecidos pelo `DataProvider`.
    -   **Por quê?** Isso evita a necessidade de buscar os mesmos dados repetidamente em diferentes páginas, otimizando as leituras do Firestore.

-   **Dados de Página (Estado Local):**
    -   A maioria das páginas (ex: Alunos, Turmas) busca seus próprios dados principais dentro do componente usando `useState` e `useEffect`.
    -   **Exemplo:** A página de Alunos (`src/app/dashboard/students/page.tsx`) é responsável por buscar a lista paginada de alunos.
    -   **Por quê?** Isso mantém a lógica de cada página contida nela mesma e permite implementar funcionalidades específicas como paginação e filtros de forma isolada.

-   **Interação com o Firestore:**
    -   Todas as interações (leitura, escrita, atualização) são feitas usando o SDK do Firebase para a web (`firebase/firestore`).
    -   As operações de escrita (ex: salvar um aluno, criar uma turma) geralmente seguem o padrão:
        1.  O formulário (`<StudentForm>`) chama uma função de salvar na página pai (`students/page.tsx`).
        2.  A página pai monta o objeto de dados e usa as funções do Firestore (`addDoc`, `updateDoc`, `writeBatch`) para persistir a alteração.
        3.  Após a escrita, a função `refetchData()` ou a função de busca local é chamada para atualizar a UI com os novos dados.

---

## 4. Autenticação e Permissões

O sistema possui dois mecanismos de autenticação.

-   **Login de Perfil (Usuário/Senha):**
    -   A tela de login (`src/app/login/page.tsx`) busca todos os usuários do Firestore.
    -   Ao selecionar um perfil e digitar a senha, a função `login` do `useAuth` é chamada.
    -   Essa função invoca o fluxo de IA `validatePasswordFlow` (`src/ai/flows/validate-password-flow.ts`), que executa no backend para comparar a senha fornecida com o hash de senha armazenado no Firestore usando `bcrypt.js`. **A senha nunca trafega em texto plano para o backend.**
    -   Se a validação for bem-sucedida, os dados do usuário são salvos no `localStorage` e no estado do `AuthProvider`.

-   **Conexão com Google (NextAuth.js):**
    -   Usado exclusivamente para obter um `accessToken` que permite o envio de e-mails via Gmail API.
    -   A configuração está em `src/app/api/auth/[...nextauth]/route.ts`.
    -   O componente `AccountConnections` em `src/app/dashboard/settings/page.tsx` gerencia o fluxo de `signIn` e `signOut` do Google.
    -   O `accessToken` é passado para o fluxo `sendEmailFlow` para autorizar os envios.

-   **Gerenciamento de Permissões:**
    -   O hook `useAuth` expõe a função `hasPermission('permission:name')`.
    -   O `AuthProvider` verifica se o usuário tem a role `Admin` (que concede acesso a tudo) ou se a permissão específica existe no array `permissions` do seu documento no Firestore.
    -   Isso permite controlar a visibilidade de menus e a habilitação de botões de forma granular em toda a UI.

---

## 5. Fluxos de IA com Genkit

Os fluxos de IA são funções de backend que podem ser chamadas de forma segura a partir do frontend.

-   **Assistente de Ajuda (`tutorial-flow.ts`):**
    -   Recebe a pergunta do usuário e o seu `userRole`.
    -   Usa um *prompt template* que instrui a IA a se comportar como um especialista no sistema.
    -   O conteúdo do manual (`manual-content.ts`) é injetado no prompt, servindo como a única fonte de conhecimento.
    -   A IA é instruída a verificar a permissão do usuário antes de explicar uma funcionalidade.

-   **Melhorar Mensagem (`communication-flow.ts`):**
    -   Recebe um rascunho de texto.
    -   Usa um prompt que define o tom (secretária escolar, formal, amigável) e as regras para reescrever a mensagem.
    -   Retorna o texto aprimorado, que é então inserido de volta no formulário.

-   **Validação e Troca de Senha (`validate-password-flow.ts`, `change-password-flow.ts`):**
    -   Esses fluxos lidam com lógica de segurança no backend. Eles recebem dados do frontend, interagem diretamente com o Firestore e usam a biblioteca `bcrypt` para lidar com as senhas de forma segura.

---

## 6. Como Replicar Funcionalidades

-   **Para criar uma nova Seção (ex: "Fornecedores"):**
    1.  Crie uma nova pasta em `src/app/dashboard/suppliers`.
    2.  Crie o arquivo `page.tsx` dentro dela. Você pode copiar a estrutura de `students/page.tsx` ou `classes/page.tsx` como base.
    3.  Defina o tipo de dados em `src/types/index.ts` (ex: `Supplier`).
    4.  Implemente a lógica de busca (`fetch`), salvamento (`handleSave`) e exclusão (`handleDelete`) de fornecedores dentro da `page.tsx`, similar ao que foi feito para alunos.
    5.  Crie os componentes de formulário (`SupplierForm`) e tabela (`columns.tsx`, `data-table.tsx`, etc.) em uma nova pasta `src/app/dashboard/suppliers/`.
    6.  Adicione o link de navegação no `src/app/dashboard/layout.tsx`.
    7.  Adicione as permissões (`nav:suppliers`, `suppliers:create`, etc.) no `src/app/dashboard/settings/page.tsx` se necessário.
