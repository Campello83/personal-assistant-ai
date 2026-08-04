// Agenda.gs — Gerenciamento de compromissos no Google Calendar

function criarCompromisso(dados) {
  const dataHoraInicio = new Date(dados.data + "T" + dados.hora + ":00");
  const duracao = dados.duracao_minutos || 60;
  const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60000);

  let linkReuniao = null;
  let eventId;

  if (dados.reuniao_online) {
    const eventoCriado = Calendar.Events.insert({
      summary: dados.titulo,
      start: { dateTime: dataHoraInicio.toISOString() },
      end: { dateTime: dataHoraFim.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: Utilities.getUuid(),
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      }
    }, "primary", { conferenceDataVersion: 1 });

    linkReuniao = eventoCriado.hangoutLink;
    eventId = eventoCriado.id;
  } else {
    const evento = CalendarApp.getDefaultCalendar().createEvent(dados.titulo, dataHoraInicio, dataHoraFim);
    eventId = evento.getId();
  }

  return {
    sucesso: true,
    eventId: eventId,
    titulo: dados.titulo,
    data: dados.data,
    hora: dados.hora,
    inicio: Utilities.formatDate(dataHoraInicio, "GMT-3", "dd/MM/yyyy HH:mm"),
    fim: Utilities.formatDate(dataHoraFim, "GMT-3", "HH:mm"),
    linkReuniao: linkReuniao
  };
}

// Localiza o compromisso alvo de uma edicao/cancelamento:
// 1) Se houver uma referencia indireta ("essa reuniao", "aquele compromisso")
//    e existir um compromisso recente na memoria do usuario, usa o eventId
//    guardado.
// 2) Caso contrario, procura por titulo (busca parcial, sem acentuar) numa
//    janela de +/- 30 dias, opcionalmente restrita a uma data especifica.
function localizarCompromisso(dados, numero) {
  if (!dados.titulo_busca || dados.titulo_busca.trim() === "") {
    const memoria = buscarMemoria(numero, "ultimo_compromisso");
    if (memoria && memoria.eventId) {
      const evento = CalendarApp.getDefaultCalendar().getEventById(memoria.eventId);
      if (evento) return evento;
    }
    throw new Error("Nao encontrei um compromisso recente para referenciar. Diga o titulo ou o dia do compromisso.");
  }

  const agora = new Date();
  let inicioBusca = new Date(agora.getTime() - 30 * 24 * 60 * 60000);
  let fimBusca = new Date(agora.getTime() + 30 * 24 * 60 * 60000);

  if (dados.data_busca) {
    inicioBusca = new Date(dados.data_busca + "T00:00:00");
    fimBusca = new Date(dados.data_busca + "T23:59:59");
  }

  const eventos = CalendarApp.getDefaultCalendar().getEvents(inicioBusca, fimBusca);
  const alvo = dados.titulo_busca.toLowerCase();
  const encontrado = eventos.find(function (e) {
    return e.getTitle().toLowerCase().indexOf(alvo) !== -1;
  });

  if (!encontrado) {
    throw new Error("Nao encontrei nenhum compromisso com esse titulo" + (dados.data_busca ? " na data informada" : "") + ".");
  }
  return encontrado;
}

function editarCompromisso(dados, numero) {
  const evento = localizarCompromisso(dados, numero);

  if (dados.acao === "cancelar") {
    const tituloOriginal = evento.getTitle();
    evento.deleteEvent();
    return { sucesso: true, acao: "cancelar", titulo: tituloOriginal };
  }

  if (dados.titulo_novo) evento.setTitle(dados.titulo_novo);

  if (dados.data_nova || dados.hora_nova) {
    const dataBase = dados.data_nova || Utilities.formatDate(evento.getStartTime(), "GMT-3", "yyyy-MM-dd");
    const horaBase = dados.hora_nova || Utilities.formatDate(evento.getStartTime(), "GMT-3", "HH:mm");
    const duracaoMs = evento.getEndTime().getTime() - evento.getStartTime().getTime();
    const duracaoMinutos = dados.duracao_minutos_nova || Math.round(duracaoMs / 60000);

    const novoInicio = new Date(dataBase + "T" + horaBase + ":00");
    const novoFim = new Date(novoInicio.getTime() + duracaoMinutos * 60000);
    evento.setTime(novoInicio, novoFim);
  } else if (dados.duracao_minutos_nova) {
    const novoFim = new Date(evento.getStartTime().getTime() + dados.duracao_minutos_nova * 60000);
    evento.setTime(evento.getStartTime(), novoFim);
  }

  return {
    sucesso: true,
    acao: "alterar",
    eventId: evento.getId(),
    titulo: evento.getTitle(),
    inicio: Utilities.formatDate(evento.getStartTime(), "GMT-3", "dd/MM/yyyy HH:mm"),
    fim: Utilities.formatDate(evento.getEndTime(), "GMT-3", "HH:mm")
  };
}
