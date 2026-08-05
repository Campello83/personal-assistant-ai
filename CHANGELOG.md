# Changelog — Personal Assistant AI

Todas as mudanças relevantes do projeto são documentadas aqui, seguindo [Versionamento Semântico](https://semver.org/lang/pt-BR/):

- **MAJOR** (`1.0.0`): reservado para a primeira versão estável e completa do assistente (todas as etapas do roadmap concluídas).
- **MINOR** (`0.X.0`): incrementado a cada **etapa do roadmap concluída** (nova funcionalidade).
- **PATCH** (`0.X.Y`): incrementado a cada **correção ou ajuste** dentro de uma etapa já concluída.

Enquanto o projeto estiver em desenvolvimento (antes da v1.0.0), a versão `0.X.0` indica quantas etapas do roadmap já estão funcionalmente prontas.

---

## [1.0.0] - 2026-08-04
### Adicionado
- Primeira versão estável: todas as etapas do roadmap (0 a 11) concluídas.
- `docs/Personal Assistant AI - Guia de Uso com IA.pdf`: documento complementar explicando como replicar o projeto com apoio de um assistente de IA (prompt inicial sugerido, boas práticas de segurança para tokens, limites do que dá para automatizar).

### Alterado
- `GUIA-REPLICACAO.md` reorganizado em ordem cronológica de configuração (em vez de ordem de desenvolvimento por etapa), com seções novas: pré-requisitos (obrigatórios/opcionais), dicas de uso, decisões de projeto a serem tomadas, troca detalhada para número de WhatsApp real, estrutura de referência, problemas comuns consolidados e glossário.
- Removidas informações pessoais (usuário do GitHub, link de workspace do Postman) dos documentos voltados à replicação por terceiros (`GUIA-REPLICACAO.md` e PDFs em `docs/`).
- `README.md`: removida a funcionalidade "registrar anotações" e o arquivo `Anotacoes.gs` da lista de recursos e da estrutura de arquivos — nunca foram implementados (ver "Corrigido" abaixo).

### Corrigido (achado em checkup pré-release)
- O prompt do Gemini (`Gemini.gs`) ainda lista as intenções `registrar_anotacao` e `lembrete`, mas `Code.gs` nunca implementou o tratamento delas — mensagens desse tipo caem na resposta genérica de "função em construção". Documentado como limitação conhecida da v1.0.0; decisão de implementar de fato ou remover essas intenções do prompt fica em aberto para a próxima versão.

---

## [0.11.0] - 2026-08-04
### Adicionado
- `docs/Personal Assistant AI - Guia de Replicacao.pdf`: documento final consolidado (Etapa 11), reorganizando todo o conteúdo de `GUIA-REPLICACAO.md` em ordem cronológica de configuração (em vez de ordem de desenvolvimento), escrito para quem não tem conhecimento técnico — cobre contas, credenciais, código, deploy, webhook, gatilhos, teste geral e um apêndice de problemas comuns.

### Decidido
- Roadmap do projeto (README, seção 6) concluído com esta etapa.

---

## [0.10.1] - 2026-08-04
### Corrigido
- `Config.gs`: número de telefone salvo na aba "Memoria_Contexto" era convertido automaticamente para número pelo Google Sheets (mesma armadilha de tipo já vista com datas em `Tasks.gs`), quebrando a comparação de igualdade e fazendo o assistente não reconhecer referências indiretas ("essa reunião") logo após criar o compromisso. Corrigido forçando formato de texto na coluna "Numero" e comparando com `String()` em `salvarMemoria`/`buscarMemoria`.

---

## [0.10.0] - 2026-08-04
### Adicionado
- `Config.gs`: aba "Config" para preferências chave/valor persistentes (`obterPreferencia`/`definirPreferencia`) e aba "Memoria_Contexto" para memória de curto prazo por usuário (`salvarMemoria`/`buscarMemoria`, com validade padrão de 6h).
- Intent `editar_compromisso`: permite alterar (título, data, hora, duração) ou cancelar um compromisso já existente, inclusive por referência indireta ("essa reunião", "aquele compromisso") usando a memória do último compromisso mencionado.
- `Agenda.gs`: `localizarCompromisso` (resolve o compromisso alvo por referência de memória ou busca por título/data) e `editarCompromisso`.
- Toda vez que um compromisso é criado ou alterado, o assistente guarda o `eventId` na memória do usuário (`ultimo_compromisso`), habilitando a próxima referência indireta.

### Decidido
- Implementa a decisão registrada na Etapa 3 (CHANGELOG v0.3.0): edição de compromissos por referência, que dependia de um sistema de memória, agora está pronta.
- Memória de curto prazo expira em 6h por padrão, para evitar que o assistente aplique "essa reunião" a algo mencionado dias atrás.
- Escopo desta etapa ficou restrito a compromissos (conforme decisão original); edição de tarefas e financeiro por referência fica para quando houver demanda, reaproveitando a mesma infraestrutura de memória.

---

## [0.9.0] - 2026-08-04
### Adicionado
- `HealthCheck.gs`: checagem de saúde das integrações externas (Gemini, WhatsApp, Calendar, Tasks); se alguma falhar, envia alerta automático por WhatsApp ao dono do sistema, além de registrar na aba Logs (`HEALTHCHECK`).
- `registrarErro` em `Logs.gs`: log de erro crítico (status `CRITICO`) com aviso automático por WhatsApp ao dono, usado nas falhas que exigem atenção manual.
- `executarComSeguranca` em `Code.gs`: cada intent (`agendar_compromisso`, `criar_tarefa`, `registrar_gasto`, `registrar_entrada`, `controle_financeiro`, `gerar_relatorio`) agora roda protegido — se falhar, o usuário recebe um aviso amigável no WhatsApp em vez de silêncio, e o erro completo fica registrado.
- `verificarLembretes()` (gatilho automático a cada 15 min) protegido por `try/catch` em cada etapa (agenda, tarefas, relatórios automáticos), evitando que uma falha pontual interrompa silenciosamente as próximas checagens.
- `obterAbaLogs()`: aba "Logs" criada automaticamente se não existir, em vez de o registro falhar.

### Decidido
- Alertas críticos são enviados para `NUMERO_PROPRIETARIO` (mesma propriedade usada nos lembretes), evitando criar uma nova configuração só para isso.
- Checagem de saúde do sistema (`verificarSaudeSistema`) precisa de um gatilho de tempo próprio (ex: 1x/dia), configurado manualmente — mesmo padrão do gatilho de 15 em 15 min da Etapa 6.

---

## [0.7.0] - 2026-08-03
### Adicionado
- Relatórios (diário, semanal, mensal): resumo de agenda, tarefas e financeiro do período.
- Intent `gerar_relatorio` implementado no roteador (já existia no prompt do Gemini desde a Etapa 2).
- Envio automático às 21h (diário todo dia, semanal aos domingos, mensal no último dia do mês), reaproveitando o gatilho de 15 em 15 min da Etapa 6.
- Arquivo `Relatorios.gs`.

### Decidido
- Período do relatório segue a mesma convenção do controle financeiro (Etapa 5): olhar para trás (hoje / últimos 7 dias / últimos 30 dias), não para frente.
- Estado de deduplicação do envio automático reaproveita a aba `Lembretes_Estado` já existente, em vez de criar uma aba nova.

### Testado
- Relatório sob demanda (diário/semanal/mensal) validado via WhatsApp.

---

## [0.8.0] - 2026-08-04
### Adicionado
- Painel visual (dashboard) via Web App do Apps Script, acessado pela mesma URL do webhook acrescentando `?painel=1` (link único, sem senha).
- Cartões de indicadores: saldo, entradas, gastos, tarefas concluídas/pendentes e total de compromissos no período.
- Gráfico de pizza de gastos por categoria (Google Charts) e lista de compromissos do período.
- Filtro de período (hoje / 7 dias / 30 dias) direto na página, reaproveitando `gerarRelatorio()` (Etapa 7).
- Arquivos `Dashboard.gs` e `Painel.html`.

### Decidido
- Sem autenticação por senha nesta etapa — o link do painel não deve ser compartilhado publicamente. Reavaliar proteção por senha/token se o projeto sair da fase de uso pessoal.

---

## [0.5.0] - 2026-08-02
### Adicionado
- Controle financeiro: aba dedicada "Financeiro" na planilha, registrando gastos e entradas.
- Intent `registrar_entrada` (receitas) e `controle_financeiro` (consulta de saldo/gastos por periodo).
- Resumo de gastos por categoria na resposta do WhatsApp.
- Arquivo `Financeiro.gs`.

### Corrigido
- Token de acesso temporario da Meta expirado durante os testes — necessario gerar um novo token e atualizar a propriedade `WHATSAPP_TOKEN` (decisao pendente: migrar para token permanente via Usuario do Sistema, adiada por enquanto).

---

## [0.6.3] - 2026-08-02
### Corrigido
- Google Sheets auto-convertia as células de `DataPrazo`/`Horario` (gravadas como texto) para objetos de Data, quebrando silenciosamente o cálculo de vencimento das tarefas (sem gerar erro visível). Corrigido forçando formato de texto puro na gravação e normalizando na leitura.

## [0.6.2] - 2026-08-02
### Corrigido
- Cálculo de vencimento de tarefas com horário estava incorreto (herdava o mesmo bug de fuso horário do campo `due` do Google Tasks, tratando toda tarefa como vencida há quase 24h e pulando o lembrete de "1h antes"). Data e horário agora são guardados juntos, como texto puro, na aba `Tarefas_Horario` (nova coluna `DataPrazo`), sem depender de conversão de fuso a partir do Google Tasks.

## [0.6.1] - 2026-08-02
### Corrigido
- `ReferenceError: Calendar is not defined` — o serviço avançado Calendar API havia sido ativado manualmente pela interface do Apps Script, mas nunca fora registrado no `appsscript.json` versionado; o deploy automático via clasp sobrescreveu o manifesto e removeu essa ativação. Corrigido registrando `enabledAdvancedServices` no `appsscript.json`.

## [0.6.0] - 2026-08-02
### Adicionado
- Lembretes automáticos de agenda: aviso 1h antes de compromissos (próprios ou aceitos de convites), com link do Google Meet quando a mensagem citar "reunião online".
- Lembretes automáticos de tarefas: checklist diário às 8h, lembrete a cada 2h para tarefas sem horário (ajustável por resposta do usuário), lembrete 1h antes e cobrança de conclusão para tarefas com horário definido.
- Formatação de tarefas no WhatsApp: concluída (~riscado~), em atraso (_itálico_).
- Arquivo `Lembretes.gs` e gatilho automático (`verificarLembretes`, a cada 15 minutos).
- Aba `Lembretes_Estado` e `Tarefas_Horario` na planilha.
- Automação dos commits no GitHub feita diretamente pelo assistente (Claude), via terminal com acesso ao repositório.

### Corrigido
- Mensagens duplicadas (reenvio automático da Meta) causando compromissos e tarefas duplicados — implementado controle de deduplicação por ID da mensagem (`CacheService`).
- Horário de tarefas exibido incorretamente — Google Tasks não suporta horário nativamente; horário agora é guardado numa aba própria da planilha.

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


