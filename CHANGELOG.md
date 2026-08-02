# Changelog — Personal Assistant AI

Todas as mudanças relevantes do projeto são documentadas aqui, seguindo [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** (`1.0.0`): reservado para a primeira versão estável e completa do assistente (todas as etapas do roadmap concluídas).
- **MINOR** (`0.X.0`): incrementado a cada **etapa do roadmap concluída** (nova funcionalidade).
- **PATCH** (`0.X.Y`): incrementado a cada **correção ou ajuste** dentro de uma etapa já concluída.

Enquanto o projeto estiver em desenvolvimento (antes da v1.0.0), a versão `0.X.0` indica quantas etapas do roadmap já estão funcionalmente prontas.

---

## [0.4.0] - 2026-08-02
### Adicionado
- Gerenciamento do Google Tasks: intent `criar_tarefa` cria tarefas numa lista dedicada ("Personal Assistant AI"), com confirmação por WhatsApp.
- Arquivo `Tasks.gs`.

---

## [0.3.1] - 2026-08-01
### Corrigido
- `doPost` passa a identificar e ignorar silenciosamente notificações de status de entrega (`statuses`) enviadas pela Meta, evitando poluir a planilha de Logs.

## [0.3.0] - 2026-08-01
### Adicionado
- Gerenciamento da Agenda: intent `agendar_compromisso` cria eventos na agenda principal do Google Calendar, com confirmação por WhatsApp.
- Arquivo `Agenda.gs`.
- Função `enviarMensagemWhatsApp` em `WhatsApp.gs`.
- Função `processarIntent` em `Code.gs`, roteando os intents interpretados para a ação correspondente.

### Decidido
- Edição de compromissos por referência (ex: "altera essa reunião") adiada para a Etapa 10 (memória do assistente).

---

## [0.2.2] - 2026-08-01
### Corrigido
- App não estava inscrito (`subscribed_apps`) na Conta do WhatsApp Business (WABA) correta — mensagens chegavam à Meta mas não eram encaminhadas ao nosso webhook.

## [0.2.1] - 2026-08-01
### Corrigido
- Modelo `gemini-2.5-flash` descontinuado pelo Google → substituído por `gemini-3.5-flash-lite` (mais econômico da geração atual).

## [0.2.0] - 2026-08-01
### Adicionado
- Interpretação de mensagens (texto e áudio) com o Gemini, retornando JSON estruturado com `intent` e `dados`.
- Arquivo `Gemini.gs`.
- Função `baixarMidiaWhatsApp` em `WhatsApp.gs`.

### Decidido
- Áudio é enviado direto ao Gemini (transcrição + interpretação numa única chamada), em vez de duas chamadas separadas — reduz o consumo da cota gratuita pela metade.

---

## [0.1.0] - 2026-08-01
### Adicionado
- Recepção de mensagens do WhatsApp (texto e áudio) via Meta Cloud API.
- Arquivos `Code.gs` (webhook) e `Logs.gs` (registro de eventos).
- Planilha `Personal Assistant AI - DB` com aba `Logs`.

---

## [0.0.1] - 2026-08-01
### Adicionado
- Documentação inicial do projeto (`README.md`): visão geral, princípios, regras, arquitetura, roadmap e stack técnica.
