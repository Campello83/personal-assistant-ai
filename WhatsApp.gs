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
