# Guia de Replicação — Personal Assistant AI

Este documento é o passo a passo **oficial e definitivo** para configurar o projeto do zero. Ele é atualizado a cada etapa concluída (não só no final), então serve tanto para acompanhar a evolução do projeto quanto para, ao final, ser exportado em PDF para outras pessoas replicarem.

> Escrito para quem **não tem conhecimento técnico**. Siga na ordem, sem pular passos.

---

## Registro de Decisões e Evoluções do Projeto

Esta seção guarda mudanças de arquitetura, planejamento ou ferramentas ao longo do projeto — para ficar claro o "porquê" de cada escolha.

| Data | Mudança / Decisão | Motivo |
|---|---|---|
| 2026-08-02 | Interpretação de áudio: enviado direto ao Gemini (sem transcrição separada em 2 chamadas) | Reduz pela metade o consumo da cota gratuita diária do Gemini, mantendo a arquitetura mais simples |
| 2026-08-02 | Modelo trocado de `gemini-2.5-flash` para `gemini-3.5-flash-lite` | O modelo anterior foi descontinuado pelo Google; o novo é o mais econômico da geração atual |
| 2026-08-02 | Filtro de notificações de status de entrega (`statuses`) no `doPost` | Evitar poluir o log com eventos automáticos de "enviado/entregue/lido" |
| 2026-08-02 | Tarefas do Google Tasks criadas em lista dedicada ("Personal Assistant AI"), não na lista padrão | Manter as tarefas do assistente separadas das tarefas pessoais do usuário |
| 2026-08-02 | Sincronização do código com o GitHub passou a ser feita pelo botão "Push" nativo do Apps Script, em vez de upload manual pelo site | Agilidade e menos passos manuais repetitivos |
| 2026-08-02 | Criado este guia de replicação, atualizado incrementalmente a cada etapa | Evitar perda de contexto/retrabalho caso a conversa de desenvolvimento se torne muito longa |

*(Edição de compromissos por referência — ex: "altera essa reunião" — foi avaliada e adiada de propósito para a Etapa 10, quando o sistema de memória do assistente for implementado.)*

---

## Pré-requisitos gerais

- Uma conta Google (Gmail).
- Uma conta no Facebook/Meta (para criar o app do WhatsApp).
- Um número de celular com WhatsApp (para os testes, na fase de testes a Meta fornece um número de teste próprio).
- Uma conta no GitHub.
- (Opcional, mas recomendado) Uma conta no Postman.
- (Opcional, mas recomendado) Google Chrome ou Edge, para instalar a extensão de sincronização com o GitHub (ver seção abaixo).

---

## Ferramenta de Produtividade — Sincronização Apps Script ↔ GitHub

Em vez de copiar e colar cada arquivo `.gs` manualmente no site do GitHub, é possível sincronizar direto do editor do Apps Script usando a extensão gratuita **Google Apps Script GitHub Assistant**. Configure isso uma única vez, logo no início do projeto.

⚠️ **Importante:** a extensão **não detecta automaticamente o botão "Implantar"** nem roda em segundo plano — o Google não permite isso. O fluxo passa a ser rápido (2 cliques), mas continua manual: depois de alterar o código, clique em **Push** para enviar ao GitHub.

### 1 — Instalar a extensão

1. Acesse a **Chrome Web Store** e busque por **"Google Apps Script GitHub Assistant"**.
2. Clique em **"Usar no Chrome"** (ou "Adicionar ao Chrome").
3. Abra (ou recarregue) o editor do seu projeto no Apps Script — novos botões (**Repository**, **Branch**, **Push**, **Pull**) aparecem na barra de ferramentas.

### 2 — Ativar a API do Apps Script (obrigatório)

1. Acesse:
```
https://script.google.com/home/usersettings
```
2. Marque a opção **"Google Apps Script API"** como **Ativada**.

### 3 — Gerar um token de acesso do GitHub

A extensão precisa de um token do GitHub para poder salvar arquivos por você.

1. No GitHub, clique na sua foto de perfil (canto superior direito) → **Settings**.
2. Menu esquerdo → role até o final → **Developer settings**.
3. **Personal access tokens → Tokens (classic)**.
4. **Generate new token → Generate new token (classic)**.
5. Preencha:
   - **Note**:
```
Apps Script Extensao
```
   - **Expiration**: escolha `90 days` ou `No expiration`.
6. Em **Select scopes**, marque:
   - `repo` (marca a caixa principal, que seleciona as subcaixas automaticamente)
   - `gist`
7. Role até o final e clique em **Generate token**.
8. **Copie o token imediatamente** (ele só aparece uma vez).

### 4 — Conectar a extensão à sua conta do GitHub

1. No editor do Apps Script, clique no botão **"Login to SCM"**.
2. Preencha:
   - **Usuário**: seu nome de usuário do GitHub (ex: `campello83`)
   - **GitHub accessToken**: cole o token gerado no passo 3.
3. Clique em **Login/Save**.

💡 Se o botão "Repository" não reagir ao clicar, geralmente é pop-up bloqueado pelo navegador (libere pop-ups para `script.google.com`) ou múltiplas contas Google logadas ao mesmo tempo (nesse caso, use uma janela anônima só com a conta certa).

### 5 — Vincular o repositório do projeto

1. Clique no botão **Repository** (agora ativo) → selecione o repositório:
```
personal-assistant-ai
```
2. No botão **Branch**, escolha:
```
main
```
3. Na engrenagem ⚙️ ao lado das setas, confirme se a opção de incluir o `appsscript.json` (arquivo de manifesto) está marcada, se desejar versioná-lo também.

### 6 — Uso no dia a dia

Sempre que um arquivo `.gs` for alterado:

1. Clique na seta **Push ↑** (ao lado do botão Branch).
2. Digite a mensagem de commit (e descrição, quando o campo estiver disponível).
3. Confirme.

Se o repositório já tiver arquivos criados manualmente antes de configurar a extensão, o primeiro Push pode avisar sobre diferenças entre o código da nuvem (Apps Script) e o do GitHub — nesse caso, sendo o código do Apps Script o mais atual, prossiga com o Push normalmente.

---

## Etapa 1 — Recepção de Mensagens do WhatsApp

**Objetivo desta etapa:** fazer com que mensagens (texto e áudio) enviadas ao WhatsApp cheguem até um sistema nosso e fiquem registradas numa planilha.

### 1.1 — Criar o app no Meta for Developers

1. Acesse [developers.facebook.com](https://developers.facebook.com/) e clique em **"Meus Apps"**.
2. Clique em **"Criar App"**.
3. Na tela **"Casos de uso"**, escolha a opção com o ícone do WhatsApp (ex: **"Conectar-se com os clientes pelo WhatsApp"**) e clique em **Avançar**.
4. Se pedir um **Portfólio Comercial (Business Portfolio)**: crie um novo, preenchendo nome do portfólio, seu nome e e-mail comercial. Confirme o e-mail se solicitado.
5. Na tela de **"Requisitos"**, revise (geralmente não há pendências) e clique em **Avançar**.
6. Na tela de **"Visão geral"**, confira as informações e clique em **"Criar aplicativo"**. Pode pedir sua senha novamente.

### 1.2 — Pegar as credenciais iniciais

1. No painel do app, vá em **Casos de uso → Conectar-se com os clientes pelo WhatsApp**.
2. Na tela **"Configuração da API"**, anote (não precisam ser compartilhados publicamente):
   - **Token de acesso temporário** (válido por 24h — mais adiante trocamos por um permanente).
   - **Phone Number ID**.
   - O **número de telefone de teste** fornecido pela Meta.

⚠️ **Restrição de país conhecida:** o número de teste padrão da Meta é registrado nos EUA. Desde set/2025, mensagens *dos EUA* para números do **Brasil ou Indonésia** são bloqueadas (erro `130497 - Business account is restricted from messaging users in this country`). Isso não afeta o recebimento de mensagens enviadas por você para o número de teste — só o envio de mensagens do número de teste para números BR/ID via API teria essa restrição contornada apenas registrando um número de telefone próprio (brasileiro) como remetente, quando chegar a hora de produção.

### 1.3 — Criar a planilha (banco de dados)

1. Acesse [sheets.google.com](https://sheets.google.com) → **Planilha em branco**.
2. Renomeie a planilha para `Personal Assistant AI - DB`.
3. Renomeie a aba "Página1" para `Logs`.
4. Na linha 1, preencha as colunas: `Timestamp | Tipo | Origem | Mensagem | Status`.

### 1.4 — Criar o projeto Google Apps Script

1. Na planilha: **Extensões → Apps Script**.
2. Renomeie o projeto para `Personal Assistant AI`.
3. Crie o arquivo `Code.gs` com as funções `doGet` (verificação de webhook) e `doPost` (recepção de mensagens).
4. Crie o arquivo `Logs.gs` com a função `registrarLog`, que grava cada evento na aba Logs.
5. Salve.

### 1.5 — Publicar como Web App

1. **Implantar → Nova implantação → engrenagem ⚙️ → "App da Web"**.
2. Descrição: `Webhook v1 - recepcao de mensagens do WhatsApp`.
3. Executar como: `Eu`. Quem pode acessar: `Qualquer pessoa`.
4. **Implantar** → autorizar acesso (Avançado → Acessar app → Permitir).
5. Copie a **URL do app da Web** (Callback URL).

### 1.6 — Configurar o Webhook na Meta

1. WhatsApp → Configuração → seção **Webhook** → **Editar**.
2. **URL de callback**: a URL da Etapa 1.5.
3. **Token de verificação**: `personalassistantai2026` (deve ser idêntico à constante `VERIFY_TOKEN` no `Code.gs`).
4. **Verificar e salvar**.
5. No campo **"messages"**, clique em **"Assinar"**.

⚠️ **Problema comum:** mesmo com tudo assinado, os webhooks podem não chegar se o app não estiver "inscrito" (subscribed) na Conta do WhatsApp Business (WABA). Para checar/corrigir via Postman:
- `GET https://graph.facebook.com/v20.0/{WABA_ID}/subscribed_apps` (Bearer Token = seu WHATSAPP_TOKEN) — se vier vazio ou com o app errado, rode a mesma URL com `POST` para inscrever o app correto.
- O WABA ID pode ser diferente do Phone Number ID — se dermos `GET .../{PHONE_NUMBER_ID}?fields=whatsapp_business_account`, a resposta traz o WABA ID correto.

### 1.7 — Teste funcional

- Envie uma mensagem de teste pelo seu WhatsApp para o número de teste da Meta.
- Confirme que apareceu uma linha nova na aba **Logs** da planilha.
- Alternativas de teste sem depender do WhatsApp real: botão **"Testar"** ao lado do campo `messages` no painel de Webhook da Meta, ou uma requisição `POST` simulando o payload via Postman.

✅ **Critério de conclusão da Etapa 1:** mensagem de teste aparece registrada na planilha.

---

## Etapa 2 — Interpretação com Gemini (texto e áudio → JSON)

**Objetivo desta etapa:** transformar a mensagem recebida (texto ou áudio) em um JSON estruturado dizendo o que o usuário quer fazer.

**Decisão de arquitetura:** áudio é enviado direto ao Gemini (que transcreve e interpreta numa única chamada), em vez de transcrever separadamente. Isso reduz pela metade o consumo da cota gratuita.

### 2.1 — Gerar a chave de API do Gemini

1. Acesse [aistudio.google.com](https://aistudio.google.com/) e faça login.
2. Menu esquerdo → **"Get API key"** → **"Create API key"** → **"Create API key in new project"**.
3. Copie a chave gerada.

### 2.2 — Guardar credenciais no Apps Script

1. No editor do Apps Script → engrenagem ⚙️ **"Configurações do projeto"** → **"Propriedades do script"** → **"Adicionar propriedade do script"**.
2. Adicione:
   - `GEMINI_API_KEY` → a chave da Etapa 2.1
   - `WHATSAPP_TOKEN` → o token de acesso da Meta (Etapa 1.2)
3. Salve.

### 2.3 — Criar `Gemini.gs`

Cria a função `interpretarMensagem(texto, audioBase64, mimeType)`, que monta um prompt de instrução (definindo o formato do JSON de saída e os `intents` possíveis: `agendar_compromisso`, `criar_tarefa`, `registrar_gasto`, `registrar_anotacao`, `gerar_relatorio`, `controle_financeiro`, `lembrete`, `desconhecido`) e chama a API do Gemini via `UrlFetchApp.fetch`.

⚠️ **Nota de manutenção:** o Google descontinua modelos do Gemini periodicamente. Se aparecer erro `404 - model is no longer available`, é só trocar o nome do modelo na URL da chamada pelo modelo atual recomendado (checar `ai.google.dev`). Modelo em uso atualmente: `gemini-3.5-flash-lite` (mais econômico da geração atual).

### 2.4 — Criar `WhatsApp.gs`

Cria a função `baixarMidiaWhatsApp(mediaId)`, que busca a URL do arquivo de áudio na Meta e devolve o conteúdo em base64, pronto para enviar ao Gemini.

### 2.5 — Atualizar `Code.gs`

O `doPost` passa a identificar o tipo da mensagem (`text` ou `audio`), chamar `interpretarMensagem` com os dados corretos, e registrar o resultado (JSON) na planilha com o tipo `INTERPRETACAO`.

### 2.6 — Reautorizar permissões

Como passamos a usar `UrlFetchApp.fetch` para serviços externos, é necessária uma nova autorização do script (permissão `script.external_request`). Método: criar uma função temporária que chama `UrlFetchApp.fetch("https://www.google.com")`, executá-la manualmente pelo editor, aceitar a tela de permissões, depois apagar a função.

### 2.7 — Reimplantar

Toda vez que o código de qualquer arquivo `.gs` muda, é necessário gerar uma **nova versão** da implantação (Implantar → Gerenciar implantações → editar → "Nova versão" → preencher descrição → Implantar). A URL do Web App não muda.

### 2.8 — Teste funcional

Envie uma mensagem de texto e depois um áudio pelo WhatsApp, cada um pedindo uma ação diferente (ex: agendar um compromisso, registrar um gasto). Confirme na aba **Logs** que aparece uma linha `INTERPRETACAO` com um JSON coerente para cada uma.

⚠️ **Problema comum:** se o áudio não gerar nenhum registro (nem na planilha, nem em Execuções do Apps Script), veja a nota sobre inscrição do app na WABA (`subscribed_apps`) na Etapa 1.6 — é a causa mais provável.

✅ **Critério de conclusão da Etapa 2:** texto e áudio geram um JSON de interpretação coerente na planilha.

---

## Etapa 3 — Gerenciamento da Agenda (Google Calendar)

**Objetivo desta etapa:** transformar o intent `agendar_compromisso` num evento real no Google Calendar, com confirmação automática por WhatsApp.

**Decisões desta etapa:**
- Agenda usada: a agenda principal da conta Google do usuário.
- O assistente sempre confirma por WhatsApp após criar o compromisso.
- Edição de compromisso por referência (ex: "altera essa reunião") foi avaliada e **adiada para a Etapa 10** (sistema de memória do assistente) — hoje cada mensagem é interpretada isoladamente, sem contexto do que foi dito antes.

### 3.1 — Adicionar propriedade de envio

Adicionar a propriedade `WHATSAPP_PHONE_NUMBER_ID` nas Propriedades do Script (o mesmo Phone Number ID da Etapa 1.2) — necessário para o assistente conseguir **enviar** mensagens, não só receber.

### 3.2 — Criar `Agenda.gs`

Cria a função `criarCompromisso(dados)`, que usa `CalendarApp.getDefaultCalendar()` para criar o evento com título, data/hora de início e duração (padrão: 60 minutos se não especificado).

### 3.3 — Atualizar `WhatsApp.gs`

Adiciona a função `enviarMensagemWhatsApp(numeroDestino, texto)`, que envia mensagens de texto via API da Meta (`POST /{PHONE_NUMBER_ID}/messages`).

### 3.4 — Atualizar `Code.gs`

Cria a função `processarIntent(resultado, numero)`, chamada após a interpretação do Gemini — hoje trata o intent `agendar_compromisso` (cria o evento e confirma por WhatsApp) e responde com mensagem genérica para intents ainda não implementados.

**Melhoria aplicada:** o `doPost` passou a identificar e ignorar silenciosamente (sem gerar log) as notificações de status de entrega que a própria Meta envia de volta (enviado/entregue/lido) após cada mensagem enviada pelo assistente — evita poluir a planilha de Logs.

### 3.5 — Reautorizar permissões (Calendar)

Mesmo processo da Etapa 2.6, mas chamando `CalendarApp.getDefaultCalendar()` na função temporária de autorização.

### 3.6 — Reimplantar e testar

Nova versão da implantação → enviar mensagem tipo "Marca uma reunião com o cliente amanhã às 15h" → confirmar: (1) resposta de confirmação no WhatsApp, (2) evento aparece no Google Calendar, (3) linha `AGENDA` na planilha com status `OK`.

✅ **Critério de conclusão da Etapa 3:** compromisso criado no Calendar + confirmação por WhatsApp + log limpo (sem ruído de status de entrega).

---

## Etapa 4 — Gerenciamento do Google Tasks

**Objetivo desta etapa:** transformar o intent `criar_tarefa` numa tarefa real no Google Tasks, com confirmação por WhatsApp.

**Decisões desta etapa:**
- Tarefas são criadas numa **lista dedicada** ("Personal Assistant AI"), separada da lista padrão de tarefas pessoais do usuário.
- Confirmação por WhatsApp, no mesmo padrão da Etapa 3.

### 4.1 — Ativar o serviço do Google Tasks

No editor do Apps Script: menu **"Serviços" → "+"** → localizar **"Tasks API"** → **Adicionar**.

### 4.2 — Criar `Tasks.gs`

Cria a função `obterListaTarefas()`, que cria (na primeira vez) ou reaproveita (nas próximas) a lista dedicada do Google Tasks, guardando o ID dela numa propriedade do script (`TASKS_LIST_ID`). Cria a função `criarTarefa(dados)`, que insere a tarefa nessa lista com título e prazo opcional.

### 4.3 — Atualizar `Code.gs`

`processarIntent` passa a tratar também o intent `criar_tarefa`, criando a tarefa e confirmando por WhatsApp.

### 4.4 — Reautorizar permissões (Tasks)

Mesmo processo das etapas anteriores, incluindo `Tasks.Tasklists.list()` na função temporária de autorização.

### 4.5 — Reimplantar e testar

Nova versão da implantação → enviar mensagem tipo "Cria uma tarefa para revisar o contrato até sexta-feira" → confirmar: (1) resposta de confirmação no WhatsApp, (2) tarefa aparece em tasks.google.com dentro da lista "Personal Assistant AI", (3) linha `TAREFA` na planilha com status `OK`.

✅ **Critério de conclusão da Etapa 4:** tarefa criada na lista dedicada do Google Tasks + confirmação por WhatsApp.
