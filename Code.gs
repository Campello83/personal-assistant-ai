// Code.gs — Ponto de entrada do sistema (recebe mensagens do WhatsApp)

const VERIFY_TOKEN = "personalassistantai2026";

function doGet(e) {
  const mode = e.parameter["hub.mode"];
  const token = e.parameter["hub.verify_token"];
  const challenge = e.parameter["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    registrarLog("SISTEMA", "Webhook", "Verificacao de webhook concluida com sucesso", "OK");
    return ContentService.createTextOutput(challenge);
  }
  registrarLog("ERRO", "Webhook", "Falha na verificacao do webhook", "ERRO");
  return ContentService.createTextOutput("Erro de verificacao");
}

function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const entry = dados.entry && dados.entry[0];
    const change = entry && entry.changes && entry.changes[0];
    const valor = change && change.value;
    const mensagens = valor && valor.messages;

    if (mensagens && mensagens.length > 0) {
      const msg = mensagens[0];
      const numero = msg.from;
      let resultado;

      if (msg.type === "text") {
        const texto = msg.text.body;
        registrarLog("MENSAGEM_RECEBIDA", numero, texto, "OK");
        resultado = interpretarMensagem(texto, null, null);

      } else if (msg.type === "audio") {
        const audioInfo = baixarMidiaWhatsApp(msg.audio.id);
        registrarLog("MENSAGEM_RECEBIDA", numero, "[audio recebido]", "OK");
        resultado = interpretarMensagem(null, audioInfo.base64, audioInfo.mimeType);

      } else {
        registrarLog("SISTEMA", numero, "Tipo nao suportado: " + msg.type, "IGNORADO");
        return ContentService.createTextOutput(JSON.stringify({ status: "ignorado" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      registrarLog("INTERPRETACAO", numero, JSON.stringify(resultado), "OK");
      processarIntent(resultado, numero);

    } else if (valor && valor.statuses) {
      // Notificacao de status de entrega (enviado/entregue/lido) - ignorado silenciosamente
      return ContentService.createTextOutput(JSON.stringify({ status: "status_entrega" }))
        .setMimeType(ContentService.MimeType.JSON);

    } else {
      registrarLog("SISTEMA", "Webhook", "Requisicao sem mensagem nem status reconhecido", "IGNORADO");
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "recebido" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    registrarLog("ERRO", "doPost", erro.toString(), "ERRO");
    return ContentService.createTextOutput(JSON.stringify({ status: "erro" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function processarIntent(resultado, numero) {
  const intent = resultado.intent;
  const dados = resultado.dados;

  if (intent === "agendar_compromisso") {
    const evento = criarCompromisso(dados);
    const mensagem = "Compromisso agendado:\n" + evento.titulo + "\n" + evento.inicio + " as " + evento.fim;
    enviarMensagemWhatsApp(numero, mensagem);
    registrarLog("AGENDA", numero, JSON.stringify(evento), "OK");

  } else {
    enviarMensagemWhatsApp(numero, "Recebi sua mensagem, mas essa funcao ainda esta em construcao.");
    registrarLog("SISTEMA", numero, "Intent ainda nao implementado: " + intent, "IGNORADO");
  }
}
