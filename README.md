# DBV Coin — publicação online

## Estrutura

- `index.html` — aplicativo principal.
- `manifest.json` — configuração PWA.
- `sw.js` — Service Worker.
- `icon-192.png` e `icon-512.png` — ícones.
- `code.gs` — banco/API Google Apps Script.
- `README.md` — este guia.

## 1. Criar o banco online

1. Crie uma nova Planilha Google.
2. Abra **Extensões → Apps Script**.
3. Apague o conteúdo inicial.
4. Cole o conteúdo de `code.gs`.
5. Salve.
6. Execute a função `setupDatabase` uma vez.
7. Autorize o projeto quando o Google solicitar.

A função cria as abas `Units`, `Users`, `Transactions` e `Products`.

## 2. Publicar a API

No Apps Script:

1. Clique em **Implantar → Nova implantação**.
2. Tipo: **Aplicativo da Web**.
3. Executar como: **Eu**.
4. Quem tem acesso: **Qualquer pessoa**.
5. Clique em **Implantar**.
6. Copie a URL terminada em `/exec`.

## 3. Colocar a URL no site

Abra `index.html` e localize:

    const GOOGLE_SCRIPT_URL = "...";

Substitua pela URL `/exec` da sua implantação.

O HTML enviado originalmente já possui um endpoint configurado; mantenha-o somente se ele corresponder ao seu Apps Script atual.

## 4. Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `dbv-coin`.
2. Envie todos os arquivos desta pasta para o repositório.
3. Entre em **Settings → Pages**.
4. Em **Build and deployment**, escolha:
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
5. Salve.
6. O GitHub fornecerá um endereço parecido com:
   `https://SEU-USUARIO.github.io/dbv-coin/`

## 5. Teste

Use primeiro uma janela anônima do navegador e teste:

- login;
- cadastro;
- criação de unidade;
- cadastro de membro;
- lançamento de DBV;
- ajuste de saldo;
- criação de produto;
- resgate;
- estoque;
- ranking;
- acesso pelo celular.

## Importante sobre segurança

Este projeto usa Google Sheets como banco e o Apps Script como API. O arquivo original contém senhas no banco em texto simples e o navegador recebe os usuários no `get_all`. Isso é adequado apenas para um protótipo/uso interno controlado.

Para uma versão pública/produção, recomendo migrar a autenticação para um serviço próprio ou implementar no Apps Script:
- hash de senhas;
- sessão/token;
- autorização de cada operação no servidor;
- validação de administrador/conselheiro no servidor;
- não retornar senhas em `get_all`;
- logs/auditoria;
- proteção contra chamadas não autorizadas.

O frontend não deve ser considerado uma barreira de segurança.


API confirmada: a URL do Google Apps Script já está configurada no `index.html`.
