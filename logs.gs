// Logs.gs — Registro completo de cada movimentação do sistema

function obterAbaLogs() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Logs");
  if (!aba) {
    aba = planilha.insertSheet("Logs");
    aba.appendRow(["Timestamp", "Tipo", "Origem", "Mensagem", "Status"]);
  }
  return aba;
}

function registrarLog(tipo, origem, mensagem, status) {
  try {
    const aba = obterAbaLogs();
    aba.appendRow([new Date(), tipo, origem, mensagem, status]);
  } catch (erroDeLog) {
    // Se o proprio registro de log falhar (ex: planilha indisponivel), nao
    // deixamos isso derrubar o fluxo principal — so registramos no log de
    // execucao nativo do Apps Script (Ver > Execucoes).
    console.error("Falha ao registrar log: " + erroDeLog.toString());
  }
}

// Registro de erro critico: alem de gravar na aba Logs (status "CRITICO"),
// avisa o dono do assistente por WhatsApp — usado em falhas que exigem
// atencao manual (ex: token expirado, cota estourada, servico fora do ar).
// numero e opcional: se nao vier, usa NUMERO_PROPRIETARIO (dono do sistema).
function registrarErro(origem, erro, contexto, numero) {
  const detalhe = (erro && erro.stack) ? erro.stack : String(erro);
  registrarLog("ERRO", origem, (contexto ? contexto + " | " : "") + detalhe, "CRITICO");

  try {
    const destino = numero || obterNumeroUsuario();
    if (destino) {
      enviarMensagemWhatsApp(destino,
        "⚠️ Ocorreu um erro no assistente.\nOrigem: " + origem +
        (contexto ? "\nContexto: " + contexto : "") +
        "\nDetalhe: " + String(erro));
    }
  } catch (erroAoAvisar) {
    // Evita loop: se o proprio envio do alerta falhar, so registramos.
    console.error("Falha ao notificar erro critico por WhatsApp: " + erroAoAvisar.toString());
  }
}
