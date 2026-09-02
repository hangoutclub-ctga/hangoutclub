# Guia de Publicação da Aplicação (Deploy)

Parabéns! Sua aplicação está funcional e pronta para ser publicada na internet. Este guia irá te orientar nos passos finais para colocar seu sistema no ar.

## Passo 1: Publicar a Aplicação com Firebase App Hosting

Sua aplicação está pré-configurada para ser publicada facilmente com o Firebase. Primeiro, vamos colocar a aplicação no ar.

1.  **Instale as Ferramentas do Firebase:** Se você ainda não tem, instale a Firebase CLI no seu computador. Abra o terminal e execute:
    ```bash
    npm install -g firebase-tools
    ```

2.  **Faça Login no Firebase:** No terminal, execute o comando abaixo e siga as instruções para fazer login com sua conta Google:
    ```bash
    firebase login
    ```

3.  **Inicialize o App Hosting:** Dentro da pasta do seu projeto no terminal, execute:
    ```bash
    firebase apphosting:backends:create
    ```
    *   Siga as instruções, selecionando o projeto Firebase correto quando solicitado. Ele irá configurar a conexão entre seu código e o Firebase.

4.  **Faça o Deploy:** Este é o comando que envia seu código para a nuvem e o publica. Execute no terminal:
    ```bash
    firebase deploy --only apphosting
    ```

O processo pode levar alguns minutos. Ao final, o terminal mostrará a URL onde sua aplicação está ativa (algo como `https://SEU_PROJETO.web.app`). **Acesse essa URL para continuar a configuração.**

## Passo 2: Configuração Final das Credenciais

Após o primeiro deploy, você precisa configurar as credenciais do Google para permitir que o sistema envie e-mails.

1.  **Crie as Credenciais no Google Cloud:**
    *   Acesse o [Google Cloud Console](https://console.cloud.google.com/).
    *   No menu, vá para **"APIs e Serviços" > "Credenciais"**.
    *   Clique em **"+ CRIAR CREDENCIAIS"** e escolha **"ID do cliente OAuth 2.0"**.
    *   Selecione **"Aplicativo da Web"** como tipo de aplicativo.
    *   Em **"URIs de redirecionamento autorizados"**, clique em **"ADICIONAR URI"** e cole a URL da sua aplicação fornecida pelo Firebase, adicionando `/api/auth/callback/google` no final.
        *   Exemplo: `https://seu-projeto.web.app/api/auth/callback/google`
    *   Clique em **"CRIAR"**. Copie o **ID do Cliente** e o **Segredo do Cliente**.

2.  **Abra o arquivo `.env`:** Este arquivo na raiz do seu projeto armazena suas "variáveis de ambiente" e segredos.

3.  **Atualize o arquivo `.env`:**
    *   Cole o **ID do Cliente** no valor de `GOOGLE_CLIENT_ID`.
    *   Cole o **Segredo do Cliente** no valor de `GOOGLE_CLIENT_SECRET`.
    *   Para o `NEXTAUTH_SECRET`, gere uma chave segura executando `openssl rand -base64 32` no seu terminal e cole o resultado.

Seu arquivo `.env` deverá ficar parecido com isto (com seus valores reais):

```env
GOOGLE_CLIENT_ID=SEU_ID_DO_CLIENTE_AQUI.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=SEU_SEGREDO_DO_CLIENTE_AQUI
NEXTAUTH_SECRET=SUA_CHAVE_ALEATORIA_E_LONGA_AQUI
```

4.  **Faça o Deploy Novamente:** Para que as novas variáveis de ambiente entrem em vigor, publique a aplicação mais uma vez:
    ```bash
    firebase deploy --only apphosting
    ```

## Passo 3 (Opcional): Conectar um Domínio Customizado

Após o deploy, você pode acessar as configurações do **Firebase Hosting** no console do Firebase para adicionar um domínio próprio (ex: `www.seuclube.com`) à sua aplicação. O Firebase fornecerá todas as instruções para configurar o seu provedor de domínio.

---

E é isso! Sua aplicação estará no ar, funcionando com suas próprias chaves de segurança e pronta para ser usada.
