// Relatorios.gs — Geração de relatórios (diário, semanal, mensal)
//
// Reaproveita o que já existe:
// - consultarFinanceiro (Financeiro.gs) e obterDataInicioPeriodo (Financeiro.gs)
//   para o bloco financeiro e para definir o inicio do periodo ("diario" = hoje,
//   "semanal" = ultimos 7 dias, "mensal" = ultimos 30 dias).
// - obterListaTarefas (Tasks.gs) para ler as tarefas.
// - obterNumeroUsuario, buscarEstado, salvarEstado, hojeString (Lembretes.gs)
//   para o envio automatico, evitando criar uma aba e um trigger novos so pra isso.

function obterPeriodoRotulo(periodo) {
  if (periodo === "diario") return "hoje";
  if (periodo === "semanal") return "ultimos 7 dias";
  if (periodo === "mensal") return "ultimos 30 dias";
  return periodo;
}

function listarEventosPeriodo(dataInicio) {
  const agora = new Date();
  const inicio = dataInicio || new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const eventos = CalendarApp.getDefaultCalendar().getEvents(inicio, agora);

  return eventos.map(function (evento) {
    return Utilities.formatDate(evento.getStartTime(), "GMT-3", "dd/MM HH:mm") + " - " + evento.getTitle();
  });
}

function resumirTarefasPeriodo(dataInicio) {
  const listaId = obterListaTarefas();
  const tarefas = Tasks.Tasks.list(listaId, { showCompleted: true, showHidden: true }).items || [];

  const pendentes = tarefas.filter(function (t) { return t.status !== "completed"; });

  const concluidasNoPeriodo = tarefas.filter(function (t) {
    if (t.status !== "completed" || !t.completed) return false;
    if (!dataInicio) return true;
    return new Date(t.completed) >= dataInicio;
  });

  return {
    pendentes: pendentes.length,
    concluidasNoPeriodo: concluidasNoPeriodo.length,
    listaPendentes: pendentes.map(function (t) { return t.title; })
  };
}

function gerarRelatorio(dados) {
  const periodo = (dados && dados.periodo) || "diario";
  const dataInicio = obterDataInicioPeriodo(periodo);

  return {
    periodo: periodo,
    rotuloPeriodo: obterPeriodoRotulo(periodo),
    financeiro: consultarFinanceiro({ periodo: periodo }),
    eventos: listarEventosPeriodo(dataInicio),
    tarefas: resumirTarefasPeriodo(dataInicio)
  };
}

function formatarRelatorio(relatorio) {
  let mensagem = "📊 Relatorio (" + relatorio.rotuloPeriodo + ")\n\n";

  mensagem += "📅 Agenda: " + relatorio.eventos.length + " compromisso(s)";
  if (relatorio.eventos.length > 0) {
    mensagem += "\n" + relatorio.eventos.map(function (e) { return "- " + e; }).join("\n");
  }

  mensagem += "\n\n✅ Tarefas: " + relatorio.tarefas.concluidasNoPeriodo + " concluida(s) no periodo, " +
    relatorio.tarefas.pendentes + " pendente(s) no total";

  mensagem += "\n\n💰 Financeiro:\nEntradas: R$ " + relatorio.financeiro.totalEntradas.toFixed(2) +
    "\nGastos: R$ " + relatorio.financeiro.totalGastos.toFixed(2) +
    "\nSaldo: R$ " + relatorio.financeiro.saldo.toFixed(2);

  return mensagem;
}

// ---------- ENVIO AUTOMATICO ----------
// Chamada a partir de verificarLembretes() (Lembretes.gs), que ja roda a cada
// 15 minutos — evita criar um novo trigger so pra isso.

function verificarRelatoriosAutomaticos() {
  const agora = new Date();
  const dentroDaJanelaDas21h = agora.getHours() === 21 && agora.getMinutes() < 15;
  if (!dentroDaJanelaDas21h) return;

  enviarRelatorioAutomatico("diario", "RELATORIO_DIARIO_" + hojeString());

  if (agora.getDay() === 0) { // domingo
    enviarRelatorioAutomatico("semanal", "RELATORIO_SEMANAL_" + hojeString());
  }

  const amanha = new Date(agora.getTime() + 24 * 60 * 60000);
  if (amanha.getDate() === 1) { // hoje e o ultimo dia do mes
    enviarRelatorioAutomatico("mensal", "RELATORIO_MENSAL_" + hojeString());
  }
}

function enviarRelatorioAutomatico(periodo, chave) {
  if (buscarEstado(chave)) return; // ja enviado hoje, evita duplicar

  const relatorio = gerarRelatorio({ periodo: periodo });
  enviarMensagemWhatsApp(obterNumeroUsuario(), formatarRelatorio(relatorio));
  salvarEstado(chave, "", "", false, true, "");

  registrarLog("RELATORIO", "Automatico", "Relatorio " + periodo + " enviado", "OK");
}
