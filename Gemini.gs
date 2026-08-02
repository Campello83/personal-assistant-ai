// Gemini.gs — Interpretação de mensagens (texto ou áudio) usando o Gemini

function interpretarMensagem(texto, audioBase64, mimeType) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + apiKey;

  const promptInstrucao =
    'Voce e o interpretador de um assistente pessoal via WhatsApp. Leia a mensagem do usuario ' +
    '(texto ou audio) e devolva APENAS um JSON valido, sem nenhum texto adicional, neste formato:\n\n' +
    '{\n' +
    '  "intent": "agendar_compromisso" | "criar_tarefa" | "registrar_gasto" | "registrar_anotacao" | "gerar_relatorio" | "controle_financeiro" | "lembrete" | "desconhecido",\n' +
    '  "dados": { ... }\n' +
    '}\n\n' +
    'Campos esperados por intent:\n' +
    '- agendar_compromisso: titulo, data (YYYY-MM-DD), hora (HH:MM), duracao_minutos\n' +
    '- criar_tarefa: titulo, prazo (YYYY-MM-DD ou null)\n' +
    '- registrar_gasto: descricao, valor (numero), categoria\n' +
    '- registrar_anotacao: titulo, conteudo\n' +
    '- gerar_relatorio: periodo ("diario" | "semanal" | "mensal")\n' +
    '- controle_financeiro: acao ("consultar_saldo" | "consultar_gastos"), periodo\n' +
    '- lembrete: titulo, data, hora\n\n' +
    'Se nao conseguir identificar com clareza, use "intent": "desconhecido" e em "dados" coloque {"texto_original": "..."}.\n' +
    'Hoje e ' + Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd") + '.';

  const parts = [{ text: promptInstrucao }];

  if (audioBase64) {
    parts.push({ inline_data: { mime_type: mimeType, data: audioBase64 } });
  } else {
    parts.push({ text: "Mensagem do usuario: " + texto });
  }

  const payload = {
    contents: [{ parts: parts }],
    generationConfig: { responseMimeType: "application/json" }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const resposta = UrlFetchApp.fetch(url, options);

  try {
    const json = JSON.parse(resposta.getContentText());
    const textoResposta = json.candidates[0].content.parts[0].text;
    return JSON.parse(textoResposta);
  } catch (erro) {
    registrarLog("ERRO", "Gemini", "Falha ao interpretar resposta: " + resposta.getContentText(), "ERRO");
    return { intent: "desconhecido", dados: { texto_original: texto || "[audio]" } };
  }
}