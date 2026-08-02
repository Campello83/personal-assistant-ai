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
