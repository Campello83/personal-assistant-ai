// Lembretes.gs — Sistema de lembretes automaticos (agenda e tarefas)

function verificarLembretes() {
  verificarLembretesAgenda();
  verificarLembretesTarefas();
}

function obterAbaLembretes() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Lembretes_Estado");
  if (!aba) {
    aba = planilha.insertSheet("Lembretes_Estado");
    aba.appendRow(["Data", "Chave", "ProximoLembrete", "IntervaloMinutos", "Aguardando", "Enviado", "Info"]);
  }
  return aba;
}

function hojeString() {
  return Utilities.formatDate(new Date(), "GMT-3", "yyyy-MM-dd");
}

function obterNumeroUsuario() {
  return PropertiesService.getScriptProperties().getProperty("NUMERO_PROPRIETARIO");
}

function buscarEstado(chave) {
  const aba = obterAbaLembretes();
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][1] === chave) {
      return {
        linha: i + 1, data: linhas[i][0], chave: linhas[i][1],
        proximoLembrete: linhas[i][2], intervalo: linhas[i][3],
        aguardando: linhas[i][4], enviado: linhas[i][5], info: linhas[i][6]
      };
    }
  }
  return null;
}

function salvarEstado(chave, proximoLembrete, intervalo, aguardando, enviado, info) {
  const aba = obterAbaLembretes();
  const estado = buscarEstado(chave);
  const linha = [hojeString(), chave, proximoLembrete || "", intervalo || "", aguardando, enviado, info || ""];
  if (estado) {
    aba.getRange(estado.linha, 1, 1, 7).setValues([linha]);
  } else {
    aba.appendRow(linha);
  }
}

function definirPendente(chave) {
  PropertiesService.getScriptProperties().setProperty("LEMBRETE_PENDENTE_CHAVE", chave);
}
function obterPendente() {
  return PropertiesService.getScriptProperties().getProperty("LEMBRETE_PENDENTE_CHAVE");
}
function limparPendente() {
  PropertiesService.getScriptProperties().deleteProperty("LEMBRETE_PENDENTE_CHAVE");
}

// ---------- AGENDA ----------

function verificarLembretesAgenda() {
  const agora = new Date();
  const inicioJanela = new Date(agora.getTime() + 45 * 60000);
  const fimJanela = new Date(agora.getTime() + 75 * 60000);

  const eventos = CalendarApp.getDefaultCalendar().getEvents(inicioJanela, fimJanela);

  eventos.forEach(function (evento) {
    const chave = "AGENDA_" + evento.getId();
    const estado = buscarEstado(chave);
    if (estado && estado.enviado === true) return;

    let mensagem = "Lembrete: voce tem \"" + evento.getTitle() + "\" em 1h (" +
      Utilities.formatDate(evento.getStartTime(), "GMT-3", "HH:mm") + ").";

    const link = obterLinkReuniao(evento);
    if (link) mensagem += "\nLink da reuniao: " + link;

    enviarMensagemWhatsApp(obterNumeroUsuario(), mensagem);
    salvarEstado(chave, "", "", false, true, evento.getTitle());
    registrarLog("LEMBRETE", "Agenda", "Lembrete enviado: " + evento.getTitle(), "OK");
  });
}

function obterLinkReuniao(evento) {
  try {
    const idBruto = evento.getId().split("@")[0];
    const eventoAvancado = Calendar.Events.get("primary", idBruto);
    if (eventoAvancado.hangoutLink) return eventoAvancado.hangoutLink;
  } catch (erro) {
    // sem link de reuniao disponivel para este evento
  }
  return null;
}

// ---------- TAREFAS ----------

function verificarLembretesTarefas() {
  const agora = new Date();
  if (agora.getHours() === 8 && agora.getMinutes() < 15) {
    enviarChecklistDiario();
  }
  verificarTarefasSemHorario();
  verificarTarefasComHorario();
}

function listarTarefasDoDia() {
  const listaId = obterListaTarefas();
  return Tasks.Tasks.list(listaId, { showCompleted: true, showHidden: true }).items || [];
}

function formatarTarefa(tarefa) {
  const concluida = tarefa.status === "completed";
  if (concluida) return "~" + tarefa.title + "~";

  const vencimento = obterVencimentoTarefa(tarefa.id);
  let atrasada = false;

  if (vencimento) {
    atrasada = new Date() > vencimento;
  } else if (tarefa.due) {
    const dataDue = Utilities.formatDate(new Date(tarefa.due), "GMT-3", "yyyy-MM-dd");
    atrasada = dataDue < hojeString();
  }

  return atrasada ? "_" + tarefa.title + "_" : tarefa.title;
}

function enviarChecklistDiario() {
  const chaveChecklist = "CHECKLIST_" + hojeString();
  if (buscarEstado(chaveChecklist)) return;

  const tarefas = listarTarefasDoDia();
  const semHorario = tarefas.filter(function (t) { return !obterHorarioTarefa(t.id); });
  const comHorario = tarefas.filter(function (t) { return !!obterHorarioTarefa(t.id); });

  let mensagem = "Suas tarefas de hoje:\n\n";

  if (semHorario.length > 0) {
    mensagem += "Sem horario definido:\n";
    semHorario.forEach(function (t) { mensagem += "- " + formatarTarefa(t) + "\n"; });
    mensagem += "\n";
  }
  if (comHorario.length > 0) {
    mensagem += "Com horario definido:\n";
    comHorario.forEach(function (t) {
      mensagem += "- " + obterHorarioTarefa(t.id) + " - " + formatarTarefa(t) + "\n";
    });
  }
  if (semHorario.length === 0 && comHorario.length === 0) {
    mensagem += "Nenhuma tarefa pendente hoje. 🎉";
  }

  enviarMensagemWhatsApp(obterNumeroUsuario(), mensagem);
  salvarEstado(chaveChecklist, "", "", false, true, "");

  const proximo = new Date();
  proximo.setHours(10, 0, 0, 0);
  salvarEstado("SEM_HORARIO_" + hojeString(), proximo, 120, false, false, "");

  registrarLog("LEMBRETE", "Tarefas", "Checklist diario enviado", "OK");
}

function verificarTarefasSemHorario() {
  const chave = "SEM_HORARIO_" + hojeString();
  const estado = buscarEstado(chave);
  if (!estado || !estado.proximoLembrete) return;

  const agora = new Date();
  if (agora < new Date(estado.proximoLembrete)) return;

  const tarefas = listarTarefasDoDia().filter(function (t) { return !obterHorarioTarefa(t.id) && t.status !== "completed"; });
  if (tarefas.length === 0) return;

  let mensagem = "Lembrete das suas tarefas sem horario:\n\n";
  tarefas.forEach(function (t) { mensagem += "- " + formatarTarefa(t) + "\n"; });
  mensagem += "\nMantem o lembrete a cada " + estado.intervalo + " min? Se nao responder, eu mantenho. Se quiser mudar, me diz o novo intervalo ou peca pra desativar por hoje.";

  enviarMensagemWhatsApp(obterNumeroUsuario(), mensagem);

  const proximo = new Date(agora.getTime() + estado.intervalo * 60000);
  salvarEstado(chave, proximo, estado.intervalo, true, true, "");
  definirPendente(chave);

  registrarLog("LEMBRETE", "Tarefas", "Lembrete sem horario enviado", "OK");
}

function verificarTarefasComHorario() {
  const agora = new Date();
  const tarefas = listarTarefasDoDia().filter(function (t) { return t.status !== "completed" && !!obterHorarioTarefa(t.id); });

  tarefas.forEach(function (tarefa) {
    const vencimento = obterVencimentoTarefa(tarefa.id);
    if (!vencimento) return;

    const chave1h = "TAREFA_1H_" + tarefa.id;
    const chaveVencimento = "TAREFA_VENC_" + tarefa.id;
    const chaveSeguimento = "TAREFA_SEG_" + tarefa.id;

    if (!buscarEstado(chave1h) && agora >= new Date(vencimento.getTime() - 60 * 60000) && agora < vencimento) {
      enviarMensagemWhatsApp(obterNumeroUsuario(), "Lembrete: \"" + tarefa.title + "\" vence em 1h (" + Utilities.formatDate(vencimento, "GMT-3", "HH:mm") + ").");
      salvarEstado(chave1h, "", "", false, true, tarefa.title);
    }

    if (!buscarEstado(chaveVencimento) && agora >= vencimento) {
      enviarMensagemWhatsApp(obterNumeroUsuario(), "Hora da tarefa \"" + tarefa.title + "\". Voce concluiu? (sim/nao)");
      salvarEstado(chaveVencimento, "", "", true, true, tarefa.title);
      const proximo = new Date(agora.getTime() + 60 * 60000);
      salvarEstado(chaveSeguimento, proximo, 60, true, false, tarefa.id);
      definirPendente(chaveSeguimento);
    }

    const estadoSeguimento = buscarEstado(chaveSeguimento);
    if (estadoSeguimento && estadoSeguimento.proximoLembrete && agora >= new Date(estadoSeguimento.proximoLembrete)) {
      enviarMensagemWhatsApp(obterNumeroUsuario(), "Ainda pendente: \"" + tarefa.title + "\". Ja concluiu? (sim/nao)");
      const proximo = new Date(agora.getTime() + estadoSeguimento.intervalo * 60000);
      salvarEstado(chaveSeguimento, proximo, estadoSeguimento.intervalo, true, true, tarefa.id);
      definirPendente(chaveSeguimento);
    }
  });
}

// ---------- RESPOSTAS DO USUARIO A LEMBRETES ----------

function interpretarRespostaLembrete(texto) {
  const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=" + apiKey;

  const prompt =
    'O assistente acabou de perguntar ao usuario sobre um lembrete pendente (se concluiu uma tarefa, ou se deseja manter/mudar o intervalo de lembretes). ' +
    'Leia a resposta do usuario e devolva APENAS um JSON neste formato:\n' +
    '{ "relacionado": true|false, "concluida": true|false|null, "acao": "manter"|"adiar"|"desativar"|null, "minutos": numero|null }\n' +
    'Se a mensagem nao parecer uma resposta a essa pergunta (ex: for um pedido novo, tipo agendar algo ou registrar um gasto), retorne "relacionado": false.\n' +
    'Mensagem do usuario: "' + texto + '"';

  const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
  const options = { method: "post", contentType: "application/json", payload: JSON.stringify(payload), muteHttpExceptions: true };
  const resposta = UrlFetchApp.fetch(url, options);

  try {
    const json = JSON.parse(resposta.getContentText());
    return JSON.parse(json.candidates[0].content.parts[0].text);
  } catch (erro) {
    return { relacionado: false };
  }
}

function processarRespostaLembrete(chave, resposta, numero) {
  limparPendente();

  if (chave.indexOf("SEM_HORARIO_") === 0) {
    const estado = buscarEstado(chave);
    if (resposta.acao === "desativar") {
      salvarEstado(chave, "", estado.intervalo, false, true, "desativado");
      enviarMensagemWhatsApp(numero, "Ok, sem mais lembretes de tarefas sem horario por hoje.");
    } else if (resposta.acao === "adiar" && resposta.minutos) {
      const proximo = new Date(new Date().getTime() + resposta.minutos * 60000);
      salvarEstado(chave, proximo, resposta.minutos, false, true, "");
      enviarMensagemWhatsApp(numero, "Combinado, novo lembrete em " + resposta.minutos + " minutos.");
    } else {
      enviarMensagemWhatsApp(numero, "Ok, mantendo o padrao.");
    }
    registrarLog("LEMBRETE", numero, "Resposta (sem horario): " + JSON.stringify(resposta), "OK");

  } else if (chave.indexOf("TAREFA_SEG_") === 0) {
    const taskId = chave.replace("TAREFA_SEG_", "");
    if (resposta.concluida === true) {
      const listaId = obterListaTarefas();
      Tasks.Tasks.patch({ status: "completed" }, listaId, taskId);
      salvarEstado(chave, "", "", false, true, "concluida");
      enviarMensagemWhatsApp(numero, "Tarefa marcada como concluida.");
    } else if (resposta.acao === "adiar" && resposta.minutos) {
      const proximo = new Date(new Date().getTime() + resposta.minutos * 60000);
      salvarEstado(chave, proximo, resposta.minutos, true, false, taskId);
      enviarMensagemWhatsApp(numero, "Ok, proximo lembrete em " + resposta.minutos + " minutos.");
    } else {
      enviarMensagemWhatsApp(numero, "Ok, sigo lembrando de hora em hora.");
    }
    registrarLog("LEMBRETE", numero, "Resposta (tarefa com horario): " + JSON.stringify(resposta), "OK");
  }
}
