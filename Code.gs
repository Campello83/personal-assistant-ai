// Code.gs — Ponto de entrada do sistema (recebe mensagens do WhatsApp)

// Token que a Meta usa para validar o webhook (você escolhe esse valor)
const VERIFY_TOKEN = "personalassistantai2026";

// Responde à checagem de verificação do webhook (feita 1x quando você configura na Meta)
function doGet(e) {
  const mode = e.parameter["hub.mode"];
  const token = e.parameter["hub.verify_token"];
  const challenge = e.parameter["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    registrarLog("SISTEMA", "Webhook", "Verificação de webhook concluída com sucesso", "OK");
    return ContentService.createTextOutput(challenge);
  }
  registrarLog("ERRO", "Webhook", "Falha na verificação do webhook", "ERRO");
  return ContentService.createTextOutput("Erro de verificação");
}

// Recebe as mensagens reais enviadas pelo WhatsApp
function doPost(e) {
  try {
    const dados = JSON.parse(e.postData.contents);
    const entry = dados.entry && dados.entry[0];
    const change = entry && entry.changes && entry.changes[0];
    const mensagens = change && change.value && change.value.messages;

    if (mensagens && mensagens.length > 0) {
      const msg = mensagens[0];
      const numero = msg.from;
      const texto = msg.text ? msg.text.body : "[mensagem sem texto - ex: áudio]";

      registrarLog("MENSAGEM_RECEBIDA", numero, texto, "OK");
    } else {
      registrarLog("SISTEMA", "Webhook", "Requisição recebida sem mensagem (ex: status de entrega)", "IGNORADO");
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "recebido" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (erro) {
    registrarLog("ERRO", "doPost", erro.toString(), "ERRO");
    return ContentService.createTextOutput(JSON.stringify({ status: "erro" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
