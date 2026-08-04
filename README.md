# 🤖 Personal Assistant AI

Assistente pessoal de IA, acionado via WhatsApp (texto ou áudio), que organiza agenda, tarefas, finanças e anotações de forma automática — 100% online e 100% gratuito (dentro dos limites dos planos free).

> **Status do projeto:** 🟢 Etapa 10 — Configurações e Memória (v0.10.1, concluída)
> **Repositório:** https://github.com/campello83/personal-assistant-ai *(nome sugerido — ajustar se já existir outro)*

---

## 1. Visão Geral

O **Personal Assistant AI** recebe mensagens do usuário pelo **WhatsApp** (texto ou áudio), interpreta a intenção usando o **Google Gemini**, transforma isso em um **JSON estruturado** e executa a ação correspondente:

- 📅 Agendar compromissos
- ✅ Criar tarefas
- 💸 Registrar gastos
- 📝 Registrar anotações formatadas (estilo documentação)
- 📊 Gerar relatórios (diário, semanal, mensal)
- 💰 Controlar o financeiro
- ⏰ Lembrar de tarefas e compromissos pendentes

Tudo isso rodando sobre ferramentas gratuitas do Google (Apps Script, Sheets, Calendar, Tasks) integradas ao WhatsApp via Meta (Cloud API).

---

## 2. Princípios do Projeto

| Princípio | O que significa na prática |
|---|---|
| **Simples** | Sem camadas técnicas desnecessárias. Cada função resolve um problema direto. |
| **Prático** | Prioriza o que funciona rápido sobre o "perfeito". |
| **100% online** | Nenhuma instalação local. Tudo roda na nuvem (Google Apps Script). |
| **100% gratuito** | Uso restrito aos limites dos planos free (Google, Meta, GitHub). |
| **Fácil manutenção** | Código organizado em arquivos `.gs` pequenos e nomeados por função. |
| **Bem documentado** | Cada etapa registrada no GitHub, com este README como guia central. |

---

## 3. Regras do Projeto

1. **Nada de arquiteturas complexas** ou abstrações desnecessárias.
2. **Cada etapa é validada por um teste funcional** antes de avançar para a próxima.
3. **Toda melhoria de arquitetura é proposta antes de ser implementada** (nunca implementada por conta própria).
4. **A metodologia (princípios acima) é mantida do início ao fim.**
5. **Cada etapa é registrada no GitHub** (commit + atualização deste README).
6. **Este README.md é sempre consultado antes de iniciar uma nova etapa**, para manter o rumo do projeto.

---

## 4. Arquitetura (visão simples)

```
WhatsApp (Meta Cloud API)
        │
        ▼
Google Apps Script (Webhook / doPost)
        │
        ▼
   Gemini API  ──► Interpreta a mensagem e devolve um JSON
        │
        ▼
   Roteador (Code.gs) decide o que fazer com o JSON
        │
   ┌────┼─────────┬─────────────┬─────────────┬──────────────┐
   ▼    ▼         ▼             ▼             ▼              ▼
Agenda.gs  Tasks.gs   Financeiro.gs   Anotacoes.gs   Relatorios.gs   Lembretes.gs
   │          │            │               │               │             │
   └──────────┴────────────┴───────────────┴───────────────┴─────────────┘
                              │
                              ▼
                     Google Sheets (banco de dados)
                              │
                              ▼
                       Logs.gs (registro de tudo)
                       HealthCheck.gs (checagem de saúde)
```

**Por que essa arquitetura é simples:** cada "assunto" (agenda, tarefas, financeiro, anotações, relatórios, lembretes) tem seu próprio arquivo `.gs` isolado. O `Code.gs` só decide para qual arquivo mandar o pedido. Nada de banco de dados externo, nada de servidor próprio — tudo Google Apps Script + Google Sheets.

---

## 5. Estrutura de Arquivos do Projeto (Google Apps Script)

| Arquivo | Função |
|---|---|
| `Code.gs` | Ponto de entrada (webhook do WhatsApp) e roteador principal |
| `Agenda.gs` | Criação/edição de compromissos no Google Calendar |
| `Tasks.gs` | Criação/edição de tarefas no Google Tasks |
| `Financeiro.gs` | Registro de gastos, entradas e controle financeiro |
| `Anotacoes.gs` | Registro de anotações formatadas (documentação) |
| `Relatorios.gs` | Geração de relatórios diários, semanais e mensais |
| `Lembretes.gs` | Envio de lembretes e cobranças automáticas |
| `Dashboard.gs` / `Painel.html` | Painel visual (Web App) com indicadores principais |
| `Config.gs` | Configurações gerais e memória do assistente |
| `Logs.gs` | Registro completo (full log) de cada movimentação do sistema |
| `HealthCheck.gs` | Checagem periódica de saúde do sistema (APIs, cotas, falhas) |

---

## 6. Cenários do Projeto (Roadmap)

Cada cenário abaixo é uma **etapa** do projeto. Só avançamos para a próxima depois que a etapa atual passa por um **teste funcional**.

| # | Etapa | Descrição | Status |
|---|---|---|---|
| 0 | Documentação inicial | README.md, visão geral, estrutura do repositório | 🟢 Concluído |
| 1 | Recepção de mensagens | Webhook do WhatsApp recebendo texto e áudio (Meta Cloud API) | 🟢 Concluído |
| 2 | Interpretação com Gemini | Transformar mensagem em JSON estruturado | 🟢 Concluído |
| 3 | Gerenciamento da Agenda | Criar/editar/consultar compromissos no Google Calendar | 🟢 Concluído |
| 4 | Gerenciamento do Google Tasks | Criar/editar/consultar tarefas | 🟢 Concluído |
| 5 | Controle Financeiro | Registro de gastos e entradas na planilha | 🟢 Concluído |
| 6 | Lembretes e cobranças | Envio automático de lembretes via WhatsApp | 🟢 Concluído |
| 7 | Relatórios | Relatórios diário, semanal e mensal | 🟢 Concluída |
| 8 | Dashboard e indicadores | Painel visual com indicadores principais | 🟢 Concluído |
| 9 | Tratamento de erros e logs | Logs.gs registrando cada movimentação + HealthCheck.gs | 🟢 Concluído |
| 10 | Configurações e memória | Config.gs com preferências e memória do assistente | 🟢 Concluído |
| 11 | Documento final (PDF) | Passo a passo para replicar a configuração do zero | ⚪ Não iniciado |

**Legenda:** 🟢 Concluído · 🟡 Em andamento · ⚪ Não iniciado

---

## 7. Stack Técnica

| Camada | Ferramenta | Custo |
|---|---|---|
| Automação/Backend | Google Apps Script | Gratuito |
| Banco de dados | Google Sheets | Gratuito |
| Agenda | Google Calendar | Gratuito |
| Tarefas | Google Tasks | Gratuito |
| Interpretação de linguagem | Google Gemini API | Gratuito (dentro do limite free) |
| Canal de mensagens | Meta WhatsApp Cloud API | Gratuito (dentro do limite free) |
| Versionamento | GitHub ([@campello83](https://github.com/campello83/)) | Gratuito |
| Teste de API | graph.facebook.com | — |
| Teste de requisições | Postman | Gratuito |

---

## 8. Ferramentas de Teste

- **Meta Graph API Explorer:** `https://graph.facebook.com/`
- **Postman (workspace do projeto):** `https://campello83-9519944.postman.co/home`

---

## 9. Logs e Monitoramento

- **`logs.gs`**: registra em uma aba própria da planilha **cada movimentação** do sistema (mensagem recebida, ação executada, sucesso/erro, timestamp).
- **`HealthCheck.gs`**: roda periodicamente para checar se as integrações (Gemini, WhatsApp, Calendar, Tasks) estão respondendo corretamente, alertando o usuário em caso de falha.

---

## 10. Entrega Final

Ao final do projeto será gerado um **PDF com passo a passo minucioso**, escrito para uma pessoa **sem conhecimento técnico**, permitindo replicar toda a configuração (contas, chaves de API, planilhas, scripts) do zero.

---

## 11. Como este projeto é conduzido

1. Este `README.md` é sempre consultado **antes de iniciar qualquer etapa nova**.
2. Cada etapa é implementada de forma isolada e simples.
3. Cada etapa é **testada de forma funcional** antes de seguir adiante.
4. Qualquer melhoria de arquitetura é **proposta e explicada antes** de ser implementada — nunca aplicada por conta própria.
5. Ao final de cada etapa, este README é atualizado (tabela de status na seção 6) e um commit é feito no GitHub.

---

## 12. Histórico de Atualizações

| Data | Etapa | O que foi feito |
|---|---|---|
| 2026-08-01 | Etapa 0 | Criação da visão geral do projeto e deste README.md |
| 2026-08-01 | Etapa 1 | Recepção de mensagens do WhatsApp (webhook, texto e áudio) |
| 2026-08-01 | Etapa 2 | Interpretação de mensagens com o Gemini (JSON estruturado) |
| 2026-08-01 | Etapa 3 | Agendamento de compromissos no Google Calendar |
| 2026-08-02 | Etapa 4 | Criação de tarefas no Google Tasks |
| 2026-08-02 | Etapa 5 | Controle financeiro (gastos, entradas, saldo) |
| 2026-08-02 | Etapa 6 | Lembretes automáticos de agenda e tarefas (em teste final) |
| 2026-08-02 | — | Automação de deploy: GitHub Actions + clasp, e assistente com push direto ao repositório |
| 2026-08-03 | Etapa 7 | Relatórios (diário/semanal/mensal) — teste funcional OK, concluída (v0.7.0) |
| 2026-08-04 | Etapa 8 | Dashboard e indicadores — painel visual (Web App), concluída (v0.8.0) |
| 2026-08-04 | Etapa 9 | Tratamento de erros e logs — erros por intent protegidos, HealthCheck.gs, alerta automático ao dono, concluída (v0.9.0) |
| 2026-08-04 | Etapa 10 | Configurações e memória — Config.gs (preferências + memória de curto prazo), edição/cancelamento de compromissos por referência ("essa reunião"), concluída (v0.10.0) |
