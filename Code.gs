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

function jaProcessada(mensagemId) {
  const cache = CacheService.getScriptCache();
  if (!mensagemId) return false;
  if (cache.get(mensagemId)) return true;
  cache.put(mensagemId, "1", 21600); // 6 horas
  return false;
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

      if (jaProcessada(msg.id)) {
        registrarLog("SISTEMA", numero, "Mensagem duplicada ignorada (retry da Meta): " + msg.id, "IGNORADO");
        return ContentService.createTextOutput(JSON.stringify({ status: "duplicada" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      if (msg.type === "text") {
        const texto = msg.text.body;
        registrarLog("MENSAGEM_RECEBIDA", numero, texto, "OK");

        const pendente = obterPendente();
        if (pendente) {
          const respostaLembrete = interpretarRespostaLembrete(texto);
          if (respostaLembrete.relacionado) {
            processarRespostaLembrete(pendente, respostaLembrete, numero);
            return ContentService.createTextOutput(JSON.stringify({ status: "recebido" }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }

        const resultado = interpretarMensagem(texto, null, null);
        registrarLog("INTERPRETACAO", numero, JSON.stringify(resultado), "OK");
        processarIntent(resultado, numero);

      } else if (msg.type === "audio") {
        const audioInfo = baixarMidiaWhatsApp(msg.audio.id);
        registrarLog("MENSAGEM_RECEBIDA", numero, "[audio recebido]", "OK");
        const resultado = interpretarMensagem(null, audioInfo.base64, audioInfo.mimeType);
        registrarLog("INTERPRETACAO", numero, JSON.stringify(resultado), "OK");
        processarIntent(resultado, numero);

      } else {
        registrarLog("SISTEMA", numero, "Tipo nao suportado: " + msg.type, "IGNORADO");
        return ContentService.createTextOutput(JSON.stringify({ status: "ignorado" }))
          .setMimeType(ContentService.MimeType.JSON);
      }

    } else if (valor && valor.statuses) {
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
    let mensagem = "Compromisso agendado:\n" + evento.titulo + "\n" + evento.inicio + " as " + evento.fim;
    if (evento.linkReuniao) mensagem += "\nLink da reuniao: " + evento.linkReuniao;
    enviarMensagemWhatsApp(numero, mensagem);
    registrarLog("AGENDA", numero, JSON.stringify(evento), "OK");

  } else if (intent === "criar_tarefa") {
    const tarefa = criarTarefa(dados);
    let mensagem = "Tarefa criada:\n" + tarefa.titulo + "\nPrazo: " + tarefa.prazo;
    if (tarefa.hora) mensagem += " as " + tarefa.hora;
    enviarMensagemWhatsApp(numero, mensagem);
    registrarLog("TAREFA", numero, JSON.stringify(tarefa), "OK");

  } else if (intent === "registrar_gasto") {
    const gasto = registrarMovimentacao("Gasto", dados);
    enviarMensagemWhatsApp(numero, "Gasto registrado:\n" + gasto.descricao + "\nR$ " + gasto.valor.toFixed(2) + " (" + gasto.categoria + ")");
    registrarLog("FINANCEIRO", numero, JSON.stringify(gasto), "OK");

  } else if (intent === "registrar_entrada") {
    const entrada = registrarMovimentacao("Entrada", dados);
    enviarMensagemWhatsApp(numero, "Entrada registrada:\n" + entrada.descricao + "\nR$ " + entrada.valor.toFixed(2) + " (" + entrada.categoria + ")");
    registrarLog("FINANCEIRO", numero, JSON.stringify(entrada), "OK");

  } else if (intent === "controle_financeiro") {
    const resumo = consultarFinanceiro(dados);
    let mensagem = "Resumo financeiro (" + resumo.periodo + "):\n" +
      "Entradas: R$ " + resumo.totalEntradas.toFixed(2) + "\n" +
      "Gastos: R$ " + resumo.totalGastos.toFixed(2) + "\n" +
      "Saldo: R$ " + resumo.saldo.toFixed(2);
    const categorias = Object.keys(resumo.gastosPorCategoria);
    if (categorias.length > 0) {
      mensagem += "\n\nGastos por categoria:";
      categorias.forEach(function (cat) {
        mensagem += "\n- " + cat + ": R$ " + resumo.gastosPorCategoria[cat].toFixed(2);
      });
    }
    enviarMensagemWhatsApp(numero, mensagem);
    registrarLog("FINANCEIRO", numero, JSON.stringify(resumo), "OK");

  } else {
    enviarMensagemWhatsApp(numero, "Recebi sua mensagem, mas essa funcao ainda esta em construcao.");
    registrarLog("SISTEMA", numero, "Intent ainda nao implementado: " + intent, "IGNORADO");
  }
}
