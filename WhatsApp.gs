// WhatsApp.gs — Funções auxiliares de integração com a Meta Cloud API

function baixarMidiaWhatsApp(mediaId) {
  const token = PropertiesService.getScriptProperties().getProperty("WHATSAPP_TOKEN");

  const infoResp = UrlFetchApp.fetch("https://graph.facebook.com/v20.0/" + mediaId, {
    headers: { Authorization: "Bearer " + token }
  });
  const info = JSON.parse(infoResp.getContentText());

  const midiaResp = UrlFetchApp.fetch(info.url, {
    headers: { Authorization: "Bearer " + token }
  });
  const blob = midiaResp.getBlob();

  return {
    base64: Utilities.base64Encode(blob.getBytes()),
    mimeType: info.mime_type
  };
}

function enviarMensagemWhatsApp(numeroDestino, texto) {
  const token = PropertiesService.getScriptProperties().getProperty("WHATSAPP_TOKEN");
  const phoneNumberId = PropertiesService.getScriptProperties().getProperty("WHATSAPP_PHONE_NUMBER_ID");

  const url = "https://graph.facebook.com/v20.0/" + phoneNumberId + "/messages";

  const payload = {
    messaging_product: "whatsapp",
    to: numeroDestino,
    type: "text",
    text: { body: texto }
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + token },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const resposta = UrlFetchApp.fetch(url, options);

  if (resposta.getResponseCode() !== 200) {
    registrarLog("ERRO", "WhatsApp", "Falha ao enviar mensagem: " + resposta.getContentText(), "ERRO");
  }
}
