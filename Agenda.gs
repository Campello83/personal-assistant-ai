// Agenda.gs — Gerenciamento de compromissos no Google Calendar

function criarCompromisso(dados) {
  const calendario = CalendarApp.getDefaultCalendar();

  const dataHoraInicio = new Date(dados.data + "T" + dados.hora + ":00");
  const duracao = dados.duracao_minutos || 60;
  const dataHoraFim = new Date(dataHoraInicio.getTime() + duracao * 60000);

  calendario.createEvent(dados.titulo, dataHoraInicio, dataHoraFim);

  return {
    sucesso: true,
    titulo: dados.titulo,
    inicio: Utilities.formatDate(dataHoraInicio, "GMT-3", "dd/MM/yyyy HH:mm"),
    fim: Utilities.formatDate(dataHoraFim, "GMT-3", "HH:mm")
  };
}