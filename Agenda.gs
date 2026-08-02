// Agenda.gs — Gerenciamento de compromissos no Google Calendar

function criarCompromisso(dados) {
  const dataHoraInicio = new Date(dados.data + "T" + dados.hora + ":00");
  const duracao = dados.duracao_minutos || 60;
  const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60000);

  let linkReuniao = null;

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
  } else {
    CalendarApp.getDefaultCalendar().createEvent(dados.titulo, dataHoraInicio, dataHoraFim);
  }

  return {
    sucesso: true,
    titulo: dados.titulo,
    inicio: Utilities.formatDate(dataHoraInicio, "GMT-3", "dd/MM/yyyy HH:mm"),
    fim: Utilities.formatDate(dataHoraFim, "GMT-3", "HH:mm"),
    linkReuniao: linkReuniao
  };
}
