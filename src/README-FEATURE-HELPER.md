# Prompt de Funcionalidade: Widget de Assistente de Ajuda Flutuante com IA

## Objetivo

Criar um widget de ajuda flutuante e interativo, acessível em todas as páginas de um painel de controle (dashboard). Este widget deve permitir que os usuários façam perguntas em linguagem natural para uma IA, que responderá com base em um manual do sistema pré-definido. Ele também deve oferecer um acesso rápido a uma lista de Perguntas Frequentes (FAQ).

## Requisitos Funcionais

1.  **Botão Flutuante (Trigger):**
    *   O widget deve ser acionado por um botão flutuante posicionado no canto inferior direito da tela.
    *   Este botão deve ser visível em todas as páginas dentro do layout do dashboard.
    *   Em vez de um ícone padrão, o botão deve usar a logo da aplicação (o componente `NewLogo`).
    *   O botão deve ter um estilo circular, com sombra (efeito de elevação) e uma animação sutil de `hover` (ex: `hover:scale-110`).

2.  **Janela de Diálogo (Popup):**
    *   Ao clicar no botão flutuante, uma janela de diálogo (modal) deve ser aberta.
    *   O diálogo deve ter um cabeçalho claro e acessível, com um título (ex: "Assistente de Ajuda") e uma descrição.
    *   O conteúdo do diálogo será dividido em duas seções principais, dispostas verticalmente.

3.  **Seção 1: Assistente de IA ("Qual sua dúvida?"):**
    *   **Entrada do Usuário:**
        *   Deve haver uma área de texto (`Textarea`) para o usuário digitar sua pergunta.
        *   Um botão com o texto "Perguntar ao Assistente" e um ícone de "Enviar" (`Send`) aciona a busca.
        *   A funcionalidade de envio também deve ser ativada ao pressionar a tecla "Enter" no campo de texto (sem a tecla Shift).
    *   **Comunicação com a IA:**
        *   A pergunta do usuário, juntamente com o seu nível de permissão (ex: 'Admin', 'Professor'), deve ser enviada para um fluxo de IA (`answerQuestionFromManual`).
        *   Este fluxo de IA consulta um manual do sistema pré-definido para formular a resposta. A IA deve ser instruída a considerar o cargo do usuário, informando se ele não tem permissão para acessar uma funcionalidade, em vez de explicá-la.
    *   **Feedback Visual:**
        *   Enquanto a resposta da IA está sendo carregada, um ícone de `Loader` deve ser exibido no lugar do botão de envio ou em uma área de resposta designada.
        *   A resposta da IA deve ser exibida dentro de um componente `Alert`, com um ícone de `Bot` e um título claro (ex: "Resposta do Assistente").
    *   **Tratamento de Erros:**
        *   O sistema deve tratar erros da API, especialmente o erro `503 (Model Overloaded)`. Se esse erro ocorrer, deve ser exibida uma notificação amigável (`toast`) informando ao usuário que o serviço está ocupado e para tentar novamente mais tarde.

4.  **Seção 2: Perguntas Frequentes (FAQ):**
    *   Logo abaixo do assistente de IA, deve haver uma seção de "Perguntas Frequentes".
    *   Esta seção deve usar um componente do tipo "acordeão" (`Accordion`). Inicialmente, ela deve estar recolhida, mostrando apenas o título "Perguntas Frequentes".
    *   Ao clicar no título, o acordeão se expande para revelar uma lista de perguntas comuns.
    *   Cada pergunta na lista é, por sua vez, um item de acordeão aninhado. Ao clicar em uma pergunta, a resposta correspondente é exibida.
    *   O texto das perguntas deve ser alinhado à esquerda para facilitar a leitura.

## Requisitos Técnicos e de Estilo

*   **Componentes:** Utilizar componentes da biblioteca `shadcn/ui` (ou similar) para `Dialog`, `Button`, `Textarea`, `Accordion`, `Alert`, `Card`, `Loader2` (de `lucide-react`) e `toast`.
*   **Layout:** A funcionalidade deve ser implementada no arquivo de layout principal do dashboard (ex: `src/app/dashboard/layout.tsx`) para garantir sua presença em todas as páginas.
*   **Estado:** O estado do diálogo (aberto/fechado), da pergunta, da resposta e do carregamento deve ser gerenciado com `React.useState`.
*   **Estilo:** Manter a consistência com o tema de cores e estilo geral da aplicação.
