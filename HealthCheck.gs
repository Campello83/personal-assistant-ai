// HealthCheck.gs — Checagem periodica de saude do sistema (Etapa 9)
//
// Testa, de forma leve, se cada integracao externa esta respondendo:
// Gemini, WhatsApp (Meta), Calendar e Tasks. Se algo falhar, o dono do
// sistema (NUMERO_PROPRIETARIO) recebe um alerta por WhatsApp — os mesmos
// tipos de problema ja vistos no projeto (token da Meta expirado, modelo do
// Gemini descontinuado) sao detectados aqui antes que o usuario perceba.
//
// Precisa de um gatilho de tempo apontando para verificarSaudeSistema()
// (ex: 1x por dia) — criado manualmente no menu Gatilhos do Apps Script,
// mesmo padrao usado para verificarLembretes() na Etapa 6.

function verificarGemini() {
  try {
    const resultado = interpretarMensagem("teste de saude do sistema", null, null);
    if (!resultado || !resultado.intent) {
      return { servico: "Gemini", ok: false, detalhe: "Resposta sem campo 'intent'" };
    }
    return { servico: "Gemini", ok: true, detalhe: "" };
  } catch (erro) {
    return { servico: "Gemini", ok: false, detalhe: erro.toString() };
  }
}

function verificarWhatsApp() {
  try {
    const token = PropertiesService.getScriptProperties().getProperty("WHATSAPP_TOKEN");
    const phoneNumberId = PropertiesService.getScriptProperties().getProperty("WHATSAPP_PHONE_NUMBER_ID");
    if (!token || !phoneNumberId) {
      return { servico: "WhatsApp", ok: false, detalhe: "Propriedades WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID ausentes" };
    }
    const resposta = UrlFetchApp.fetch(
      "https://graph.facebook.com/v20.0/" + phoneNumberId + "?fields=id",
      { headers: { Authorization: "Bearer " + token }, muteHttpExceptions: true }
    );
    if (resposta.getResponseCode() !== 200) {
      return { servico: "WhatsApp", ok: false, detalhe: "HTTP " + resposta.getResponseCode() + " - " + resposta.getContentText() };
    }
    return { servico: "WhatsApp", ok: true, detalhe: "" };
  } catch (erro) {
    return { servico: "WhatsApp", ok: false, detalhe: erro.toString() };
  }
}

function verificarCalendar() {
  try {
    CalendarApp.getDefaultCalendar().getName();
    return { servico: "Calendar", ok: true, detalhe: "" };
  } catch (erro) {
    return { servico: "Calendar", ok: false, detalhe: erro.toString() };
  }
}

function verificarTasks() {
  try {
    obterListaTarefas();
    return { servico: "Tasks", ok: true, detalhe: "" };
  } catch (erro) {
    return { servico: "Tasks", ok: false, detalhe: erro.toString() };
  }
}

function verificarSaudeSistema() {
  const resultados = [
    verificarGemini(),
    verificarWhatsApp(),
    verificarCalendar(),
    verificarTasks()
  ];

  const falhas = resultados.filter(function (r) { return !r.ok; });

  resultados.forEach(function (r) {
    registrarLog("HEALTHCHECK", r.servico, r.detalhe || "Servico respondendo normalmente", r.ok ? "OK" : "ERRO");
  });

  if (falhas.length > 0) {
    const numero = obterNumeroUsuario();
    if (numero) {
      let mensagem = "⚠️ Checagem de saude do sistema encontrou " + falhas.length + " problema(s):\n\n";
      falhas.forEach(function (f) {
        mensagem += "- " + f.servico + ": " + f.detalhe + "\n";
      });
      enviarMensagemWhatsApp(numero, mensagem);
    }
  }

  return { total: resultados.length, falhas: falhas.length, resultados: resultados };
}
