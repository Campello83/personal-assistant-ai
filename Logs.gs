// Logs.gs — Registro completo de cada movimentação do sistema

function registrarLog(tipo, origem, mensagem, status) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  const aba = planilha.getSheetByName("Logs");
  aba.appendRow([new Date(), tipo, origem, mensagem, status]);
}
