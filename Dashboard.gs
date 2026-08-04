// Dashboard.gs — Painel visual com indicadores principais (Etapa 8)
//
// Reaproveita gerarRelatorio() (Relatorios.gs), que ja consolida financeiro,
// agenda e tarefas por periodo. Este arquivo so cuida da apresentacao (HTML).
//
// Acesso: mesma URL do Web App (doGet), acrescentando "?painel=1", ex:
//   https://script.google.com/macros/s/SEU_ID/exec?painel=1
// Link unico, sem senha (decisao da Etapa 8) — nao compartilhar publicamente.

function exibirDashboard(e) {
  const periodo = (e.parameter["periodo"] || "diario");
  const relatorio = gerarRelatorio({ periodo: periodo });

  const template = HtmlService.createTemplateFromFile("Painel");
  template.relatorio = relatorio;
  template.periodo = periodo;
  template.dadosJson = JSON.stringify(relatorio);

  return template.evaluate()
    .setTitle("Personal Assistant AI — Painel")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
