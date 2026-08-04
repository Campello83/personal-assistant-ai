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

## Ferramenta de Produtividade (avançado) — Deploy automático via GitHub Actions + clasp

Para quem quer eliminar até o clique manual no botão Push: é possível configurar um pipeline que implanta automaticamente no Apps Script sempre que o código for atualizado no GitHub (por qualquer meio — extensão, upload manual, ou API).

### 1 — Criar o workflow

Crie o arquivo `.github/workflows/deploy.yml` no repositório com o conteúdo abaixo. Ele instala o `clasp` e roda `clasp push` a cada push na branch `main`:

```yaml
name: Deploy para o Google Apps Script

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do codigo
        uses: actions/checkout@v4

      - name: Configurar Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Instalar o Clasp
        run: npm install -g @google/clasp

      - name: Criar arquivos de autenticacao
        env:
          CLASPRC_JSON: ${{ secrets.CLASPRC_JSON }}
          CLASP_JSON: ${{ secrets.CLASP_JSON }}
        run: |
          printf '%s' "$CLASPRC_JSON" > ~/.clasprc.json
          printf '%s' "$CLASP_JSON" > .clasp.json

      - name: Enviar codigo para o Apps Script
        run: clasp push --force
```

⚠️ **Nota de manutenção:** a forma de escrever os secrets em arquivo usa variáveis de ambiente + `printf` (não `echo` com aspas simples) — isso evita que aspas ou caracteres especiais dentro do JSON quebrem o arquivo gerado.

⚠️ **Escopo do token:** subir arquivos dentro de `.github/workflows/` exige que o token de acesso usado no push tenha o escopo `workflow` marcado (além de `repo`), ou o GitHub rejeita o push.

Crie também um `.claspignore` na raiz do repositório, para o clasp enviar só os arquivos certos:

```
**/**
!*.gs
!appsscript.json
```

### 2 — Gerar as credenciais do clasp (via GitHub Codespaces, sem instalar nada localmente)

1. No repositório GitHub, botão **Code → Codespaces → Create codespace on main**.
2. No terminal do Codespaces:
```
npm install -g @google/clasp
clasp login --no-localhost
```
3. Ao clicar no link gerado, autorizar a conta Google. O navegador vai tentar redirecionar para um endereço `localhost` e vai dar erro de "conexão recusada" — **isso é esperado** no Codespaces. Copie a **URL inteira** da barra de endereço (não só o código) e cole de volta no terminal, onde está esperando "Enter the code from that page".
4. Pegar o **Script ID** do projeto: Apps Script → engrenagem ⚙️ Configurações do projeto → "ID do script".
5. No terminal:
```
clasp clone SEU_SCRIPT_ID
```
Isso gera o arquivo `.clasp.json` na pasta do projeto.

### 3 — Salvar as credenciais como Secrets no repositório

Os arquivos gerados (`~/.clasprc.json` e `.clasp.json`) precisam virar dois *secrets* do repositório: `CLASPRC_JSON` e `CLASP_JSON`.

⚠️ **Problema comum:** colar o conteúdo manualmente na caixa de texto do GitHub (Settings → Secrets and variables → Actions) pode corromper o JSON, porque o terminal do navegador quebra linhas visualmente e isso vira quebra de linha real ao copiar — o `clasp push` então falha com erro tipo `Expected ',' or '}' after property value in JSON`.

**Soluções, em ordem de preferência:**
- Usar a CLI do GitHub direto no Codespaces: `gh secret set CLASPRC_JSON < ~/.clasprc.json` e `gh secret set CLASP_JSON < .clasp.json`. **Atenção:** o Codespaces às vezes bloqueia isso com erro `403 - Resource not accessible by integration`, mesmo após `gh auth login --with-token` — é um token automático do ambiente sobrepondo a autenticação manual, sem solução simples pelo próprio Codespaces.
- Alternativa mais confiável: configurar o secret via chamada direta à API do GitHub (`PUT /repos/{owner}/{repo}/actions/secrets/{nome}`), criptografando o valor com a chave pública do repositório (biblioteca `PyNaCl`, endpoint `GET .../actions/secrets/public-key`). Evita completamente problemas de copy-paste.

### 4 — Testar

Faça qualquer commit/push na branch `main` e acompanhe em:
```
https://github.com/<usuario>/<repositorio>/actions
```
A execução do workflow "Deploy para o Google Apps Script" deve terminar com ✅.

⚠️ **Cuidado importante:** o `clasp push --force` **sobrescreve o projeto inteiro** com o que está no repositório, incluindo o `appsscript.json`. Se algum serviço avançado (Calendar API, Tasks API, etc.) foi ativado **manualmente pela interface do Apps Script** e essa ativação nunca foi registrada no `appsscript.json` versionado no GitHub, o próximo deploy automático **remove essa ativação silenciosamente** — o sintoma é um erro tipo `ReferenceError: Calendar is not defined` depois de um deploy que antes funcionava. Sempre que ativar um serviço avançado pela interface, copie o bloco `enabledAdvancedServices` gerado no `appsscript.json` e leve para o repositório manualmente (ou peça para o assistente sincronizar esse arquivo).

💡 O único passo que continua manual (limitação do próprio Google, não tem como automatizar) é clicar em **"Nova versão"** na implantação do Apps Script quando quiser que as mudanças entrem no ar de fato — o `clasp push` atualiza o código do projeto, mas não cria uma nova versão de implantação automaticamente.

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

---

## Etapa 5 — Controle Financeiro

**Objetivo:** transformar `registrar_gasto`, `registrar_entrada` e `controle_financeiro` em movimentações reais numa aba própria da planilha, com cálculo de saldo.

**Decisões:** gastos/entradas ficam na aba `Financeiro` (criada automaticamente); saldo considera entradas e gastos, filtrável por período.

### Resumo da implementação

- `Financeiro.gs`: `obterAbaFinanceiro()` cria a aba na primeira vez; `registrarMovimentacao(tipo, dados)` grava uma linha ("Gasto" ou "Entrada"); `consultarFinanceiro(dados)` soma entradas/gastos por período e por categoria.
- `Gemini.gs`: adiciona os intents `registrar_entrada` e `controle_financeiro` ao prompt.
- `Code.gs`: `processarIntent` trata os três novos intents, confirmando cada ação por WhatsApp.

⚠️ **Problema comum:** erros `131005` ou `190` (Authentication Error) ao confirmar por WhatsApp indicam token de acesso temporário da Meta expirado (validade 24h) — gere um novo na tela "Configuração da API" e atualize a propriedade `WHATSAPP_TOKEN`.

✅ **Critério de conclusão:** gasto e entrada registrados na aba Financeiro + saldo calculado corretamente e confirmado por WhatsApp.

---

## Etapa 6 — Lembretes e Cobranças

**Objetivo:** avisos automáticos de compromissos (1h antes, com link do Meet se a mensagem citar "reunião online") e de tarefas (checklist diário às 8h, lembretes ajustáveis para tarefas sem horário, cobrança de conclusão para tarefas com horário).

### Resumo da implementação

- **Gatilho automático:** função `verificarLembretes()` rodando a cada 15 minutos (Triggers do Apps Script), cobrindo agenda e tarefas.
- **Agenda:** `verificarLembretesAgenda()` varre eventos entre 45-75min à frente; se a mensagem original citou "reunião online", o evento foi criado com `Calendar.Events.insert` (serviço avançado) gerando link do Google Meet automaticamente.
- **Tarefas sem horário:** checklist às 8h, lembrete padrão a cada 2h (ajustável por resposta do usuário, válido só para o dia).
- **Tarefas com horário:** aviso 1h antes, cobrança no horário, e novo lembrete de hora em hora até confirmação — horário guardado numa aba própria (`Tarefas_Horario`), já que o Google Tasks não suporta horário nativamente.
- **Formatação no WhatsApp:** concluída (`~riscado~`), em atraso (`_itálico_`).
- **Estado persistente:** aba `Lembretes_Estado` guarda o que já foi avisado e o próximo horário de lembrete, para o gatilho "lembrar" entre uma checagem e outra.
- **Deduplicação:** `CacheService` evita processar duas vezes a mesma mensagem (a Meta reenvia automaticamente se a resposta demorar).

⚠️ **Bugs encontrados e corrigidos no caminho (ver CHANGELOG v0.6.1 a v0.6.3 para detalhes):**
1. `ReferenceError: Calendar is not defined` — o `clasp push --force` sobrescreve o `appsscript.json`; serviços avançados ativados manualmente pela interface precisam estar registrados nesse arquivo, senão um deploy automático os remove.
2. Cálculo de vencimento de tarefas incorreto — evitar derivar data/hora do campo `due` do Google Tasks (armadilha de fuso: grava meia-noite UTC, que "recua" um dia ao converter pra GMT-3). Guardar data e hora como texto puro, numa aba própria.
3. Google Sheets **auto-converte** texto que parece data/hora (ex: `"2026-08-03"`, `"00:35"`) para um objeto de Data por conta própria, quebrando o cálculo silenciosamente. Corrigido forçando formato de texto puro (`setNumberFormat("@")`) na gravação e normalizando na leitura.

✅ **Critério de conclusão:** lembrete de compromisso (1h antes, com link do Meet) e lembrete de tarefa com horário (1h antes) chegando corretamente por WhatsApp.

---

## Etapa 8 — Dashboard e Indicadores

**Objetivo:** um painel visual (link único) mostrando os indicadores principais: saldo financeiro, gastos por categoria, tarefas concluídas/pendentes e compromissos do período.

**Decisões desta etapa:**
- Acesso via a mesma URL do Web App do projeto, acrescentando `?painel=1` (ex: `https://script.google.com/macros/s/SEU_ID/exec?painel=1`).
- Sem senha/login nesta etapa — é um link único (quem tiver o link acessa). **Não compartilhe esse link publicamente**, pois expõe dados financeiros.
- Reaproveita `gerarRelatorio()` (Etapa 7) como fonte dos dados — nenhuma aba nova na planilha foi necessária.

### Resumo da implementação

- `Dashboard.gs`: função `exibirDashboard(e)`, lê o parâmetro `periodo` (`diario`/`semanal`/`mensal`, padrão `diario`), monta os dados com `gerarRelatorio()` e renderiza o template `Painel.html`.
- `Painel.html`: página com cartões de indicadores (saldo, entradas, gastos, tarefas, compromissos), gráfico de pizza de gastos por categoria (biblioteca **Google Charts**, carregada via `https://www.gstatic.com/charts/loader.js`) e lista de compromissos do período. Botões no topo trocam o período (recarregam a página com `?periodo=...`).
- `Code.gs`: `doGet` passou a checar o parâmetro `painel` **antes** da lógica de verificação do webhook da Meta — se presente, retorna o painel; caso contrário, segue o fluxo normal (verificação do webhook).
- `.claspignore`: liberado o envio de arquivos `.html` (antes só `.gs` e `appsscript.json` eram sincronizados).

### 8.1 — Reimplantar

Como o `doGet` mudou, é necessária uma **nova versão da implantação** (mesmo processo da Etapa 2.7): **Implantar → Gerenciar implantações → editar (lápis) → "Nova versão"** → descrição:

```
Etapa 8 - Dashboard e indicadores (painel visual via Web App)
```

→ **Implantar**. A URL do Web App não muda.

### 8.2 — Teste funcional

1. Abra no navegador: `SUA_URL_DO_WEB_APP?painel=1`
2. Confira se aparecem os cartões (saldo, entradas, gastos, tarefas, compromissos) e o gráfico de gastos por categoria.
3. Clique nos filtros "Hoje" / "7 dias" / "30 dias" e confirme que os números mudam.

✅ **Critério de conclusão da Etapa 8:** painel abre pelo link, mostra os indicadores corretos e os filtros de período funcionam.

---

## Etapa 7 — Relatórios (diário, semanal, mensal)

**Objetivo:** gerar um resumo (agenda + tarefas + financeiro) sob demanda, pelo WhatsApp, e também de forma automática em horários fixos.

**Decisões desta etapa:**
- Relatório = revisão do período **passado**, na mesma convenção já usada pelo controle financeiro (Etapa 5): "diário" = hoje, "semanal" = últimos 7 dias, "mensal" = últimos 30 dias.
- Envio automático reaproveita o **mesmo gatilho de 15 em 15 minutos** já criado na Etapa 6 (`verificarLembretes`), em vez de criar um trigger novo — mantém a arquitetura simples.
- Deduplicação do envio automático reaproveita a aba `Lembretes_Estado` e as funções `buscarEstado`/`salvarEstado` já existentes, em vez de criar uma aba nova só para isso.

### Resumo da implementação

- `Relatorios.gs` (novo arquivo): `gerarRelatorio(dados)` combina `consultarFinanceiro()` (Financeiro.gs), eventos do `CalendarApp` no período e tarefas do Google Tasks (concluídas no período + pendentes no total). `formatarRelatorio()` monta a mensagem para o WhatsApp.
- `Code.gs`: `processarIntent` passa a tratar o intent `gerar_relatorio` (já existia no prompt do Gemini desde a Etapa 2, mas não estava implementado) — permite pedir relatório a qualquer momento pelo WhatsApp.
- `Lembretes.gs`: `verificarLembretes()` passa a chamar também `verificarRelatoriosAutomaticos()`. Envio automático às 21h: relatório diário todo dia, semanal aos domingos, mensal no último dia do mês.

### Teste funcional

✅ Confirmado — relatório sob demanda (diário/semanal/mensal) chegando corretamente por WhatsApp, com dados coerentes de agenda, tarefas e financeiro.

✅ **Critério de conclusão da Etapa 7:** relatório sob demanda (diário/semanal/mensal) chegando corretamente por WhatsApp, com dados coerentes de agenda, tarefas e financeiro.

---

## Etapa 9 — Tratamento de Erros e Logs

**Objetivo desta etapa:** garantir que nenhuma falha do sistema passe despercebida — nem para o usuário (que recebe uma mensagem de erro amigável em vez de silêncio), nem para o dono do sistema (que é avisado por WhatsApp em falhas críticas).

**Decisões desta etapa:**
- Erros por intent (agendar, criar tarefa, financeiro, relatório) são isolados: uma falha em um deles não derruba o processamento do restante da mensagem.
- Alertas críticos vão para `NUMERO_PROPRIETARIO` (mesma propriedade já usada pelos lembretes), sem criar uma nova configuração.
- Checagem de saúde das integrações (Gemini, WhatsApp, Calendar, Tasks) roda por gatilho de tempo separado, não a cada 15 min junto dos lembretes — health check é mais pesado e não precisa dessa frequência.

### Resumo da implementação

- `Logs.gs`: `obterAbaLogs()` cria a aba "Logs" automaticamente se não existir; `registrarErro(origem, erro, contexto, numero)` grava um log com status `CRITICO` e avisa o dono do sistema por WhatsApp.
- `Code.gs`: `executarComSeguranca(origemLog, numero, mensagemFalhaUsuario, funcao)` envolve cada intent — em caso de erro, o usuário recebe uma mensagem amigável e o erro completo é registrado e notificado.
- `Lembretes.gs`: `verificarLembretes()` (gatilho automático a cada 15 min) agora isola cada sub-verificação (agenda, tarefas, relatórios automáticos) em seu próprio `try/catch`, evitando que uma falha pontual pare as próximas execuções silenciosamente.
- `HealthCheck.gs` (novo arquivo): `verificarSaudeSistema()` testa Gemini, WhatsApp, Calendar e Tasks; registra cada resultado na aba Logs (`HEALTHCHECK`) e, se houver falha, envia um resumo por WhatsApp ao dono do sistema.

### 9.1 — Criar o gatilho de checagem de saúde

1. No editor do Apps Script → ícone de **relógio (Gatilhos)** no menu lateral → **"+ Adicionar gatilho"**.
2. Preencha:
   - **Função a ser executada**: `verificarSaudeSistema`
   - **Fonte do evento**: `Baseado em tempo`
   - **Tipo de gatilho de tempo**: `Timer diário`
   - **Horário**: escolha uma janela tranquila, ex: `7h às 8h da manhã`.
3. **Salvar**.

### 9.2 — Teste funcional

- Envie uma mensagem normal (ex: "cria uma tarefa para amanhã") e confirme que continua funcionando normalmente.
- Simule uma falha controlada (opcional, mais técnico): trocar temporariamente uma propriedade do script (ex: `WHATSAPP_PHONE_NUMBER_ID`) por um valor inválido, enviar uma mensagem que dependa dela, confirmar que chega um aviso de erro, e depois desfazer a alteração.
- Rode `verificarSaudeSistema` manualmente pelo editor do Apps Script (selecionar a função → Executar) e confirme que aparecem 4 linhas novas na aba Logs (`HEALTHCHECK`), uma por serviço.

✅ **Critério de conclusão da Etapa 9:** erro em qualquer intent gera aviso amigável ao usuário + registro completo na aba Logs; `verificarSaudeSistema` roda automaticamente todo dia e avisa o dono do sistema caso alguma integração esteja fora do ar.

---

## Etapa 10 — Configurações e Memória

**Objetivo desta etapa:** guardar preferências gerais do assistente e dar a ele uma memória de curto prazo, permitindo referências indiretas como "muda essa reunião pra 16h" ou "cancela esse compromisso" — decisão que havia sido adiada lá na Etapa 3 (ver GUIA, seção da Etapa 3, e CHANGELOG v0.3.0).

**Decisões desta etapa:**
- Memória de curto prazo guardada por usuário (número do WhatsApp) numa aba própria (`Memoria_Contexto`), com validade padrão de 6h — evita aplicar "essa reunião" a algo mencionado dias atrás.
- Escopo restrito a compromissos por enquanto (era o caso pendente desde a Etapa 3). Edição de tarefas ou financeiro por referência pode reaproveitar a mesma infraestrutura, se/quando fizer sentido.
- Preferências gerais (aba "Config") ficam prontas como infraestrutura para ajustes futuros de comportamento — hoje nenhuma tela ou intent altera preferências ainda, mas qualquer parte do código pode ler/gravar via `obterPreferencia`/`definirPreferencia`.

### Resumo da implementação

- `Config.gs` (novo arquivo): `obterPreferencia(chave, padrao)` / `definirPreferencia(chave, valor)` (aba "Config"); `salvarMemoria(numero, chave, valorObjeto)` / `buscarMemoria(numero, chave, validoPorHoras)` (aba "Memoria_Contexto").
- `Gemini.gs`: novo intent `editar_compromisso` no prompt, com campos `acao` ("alterar"/"cancelar"), `titulo_busca`, `data_busca`, `titulo_novo`, `data_nova`, `hora_nova`, `duracao_minutos_nova`.
- `Agenda.gs`: `localizarCompromisso(dados, numero)` resolve o compromisso alvo — por referência indireta (usa a memória) ou por busca de título numa janela de +/- 30 dias; `editarCompromisso(dados, numero)` aplica a alteração ou cancela.
- `Code.gs`: `processarIntent` trata `editar_compromisso`; toda criação ou alteração de compromisso atualiza a memória (`ultimo_compromisso`) para a próxima referência indireta funcionar.

### Teste funcional

1. Envie "Marca uma reunião com o cliente amanhã às 15h" (cria o compromisso e guarda na memória).
2. Em seguida, envie "muda essa reunião pra 16h" — sem repetir o título. Confirme que o assistente reconhece o compromisso certo e envia a confirmação com o novo horário.
3. Envie "cancela essa reunião" e confirme que o evento some do Google Calendar.
4. Teste também a busca por título direto (sem depender da memória): "cancela a reunião com o cliente".

✅ **Critério de conclusão da Etapa 10:** compromisso criado, depois alterado e cancelado por referência indireta ("essa reunião"), tudo confirmado por WhatsApp e sem precisar repetir o título.
