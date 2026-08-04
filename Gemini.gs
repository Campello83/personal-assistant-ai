// Gemini.gs — Interpretação de mensagens (texto ou áudio) usando o Gemini

function interpretarMensagem(texto, audioBase64, mimeType) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + apiKey;

  const promptInstrucao =
    'Voce e o interpretador de um assistente pessoal via WhatsApp. Leia a mensagem do usuario ' +
    '(texto ou audio) e devolva APENAS um JSON valido, sem nenhum texto adicional, neste formato:\n\n' +
    '{\n' +
    '  "intent": "agendar_compromisso" | "editar_compromisso" | "criar_tarefa" | "registrar_gasto" | "registrar_entrada" | "registrar_anotacao" | "gerar_relatorio" | "controle_financeiro" | "lembrete" | "desconhecido",\n' +
    '  "dados": { ... }\n' +
    '}\n\n' +
    'Campos esperados por intent:\n' +
    '- agendar_compromisso: titulo, data (YYYY-MM-DD), hora (HH:MM), duracao_minutos, reuniao_online (true SOMENTE se a mensagem citar explicitamente "reuniao online" ou "reunião online")\n' +
    '- editar_compromisso: usado quando o usuario quer ALTERAR ou CANCELAR um compromisso ja existente (ex: "muda a reuniao com o cliente pra 16h", "cancela essa reuniao", "adianta o compromisso de amanha pra hoje"). Campos:\n' +
    '  - acao: "alterar" ou "cancelar"\n' +
    '  - titulo_busca: palavras do titulo do compromisso a alterar, PARA IDENTIFICA-LO (ex: "reuniao com o cliente"). Deixe null/vazio se o usuario se referir de forma indireta ao ultimo compromisso mencionado na conversa (ex: "essa reuniao", "esse compromisso", "aquele evento")\n' +
    '  - data_busca: data (YYYY-MM-DD) do compromisso a alterar, APENAS se o usuario mencionar quando ele e/era, para ajudar a localizar (senao null)\n' +
    '  - titulo_novo: novo titulo, apenas se o usuario pedir para mudar o titulo (senao null)\n' +
    '  - data_nova: nova data (YYYY-MM-DD), apenas se for alterada (senao null)\n' +
    '  - hora_nova: nova hora (HH:MM), apenas se for alterada (senao null)\n' +
    '  - duracao_minutos_nova: nova duracao, apenas se for alterada (senao null)\n' +
    '- criar_tarefa: titulo, prazo (YYYY-MM-DD ou null), hora (HH:MM ou null - so preencher se a mensagem citar um horario especifico)\n' +
    '- registrar_gasto: descricao, valor (numero), categoria\n' +
    '- registrar_entrada: descricao, valor (numero), categoria\n' +
    '- registrar_anotacao: titulo, conteudo\n' +
    '- gerar_relatorio: periodo ("diario" | "semanal" | "mensal")\n' +
    '- controle_financeiro: acao ("consultar_saldo" | "consultar_gastos"), periodo ("diario" | "semanal" | "mensal" | "total")\n' +
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
