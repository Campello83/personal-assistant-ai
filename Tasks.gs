// Tasks.gs — Gerenciamento de tarefas no Google Tasks

function obterListaTarefas() {
  const props = PropertiesService.getScriptProperties();
  let listaId = props.getProperty("TASKS_LIST_ID");

  if (!listaId) {
    const novaLista = Tasks.Tasklists.insert({ title: "Personal Assistant AI" });
    listaId = novaLista.id;
    props.setProperty("TASKS_LIST_ID", listaId);
    registrarLog("SISTEMA", "Tasks", "Lista de tarefas criada: " + listaId, "OK");
  }

  return listaId;
}

// O Google Tasks nao suporta horario (so data) e o campo "due" tem uma
// armadilha de fuso horario (grava meia-noite UTC, que ao converter para
// GMT-3 "recua" um dia). Por isso guardamos data E horario como texto puro
// numa aba propria, sem nenhuma conversao de fuso.

function obterAbaHorarios() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Tarefas_Horario");
  if (!aba) {
    aba = planilha.insertSheet("Tarefas_Horario");
    aba.appendRow(["TaskID", "DataPrazo", "Horario"]);
  }
  return aba;
}

function salvarHorarioTarefa(taskId, dataPrazo, horario) {
  const aba = obterAbaHorarios();
  const linha = aba.getLastRow() + 1;
  aba.getRange(linha, 1, 1, 3).setNumberFormat("@"); // forca texto puro (evita auto-conversao do Sheets)
  aba.getRange(linha, 1, 1, 3).setValues([[taskId, dataPrazo, horario]]);
}

function normalizarValorPlanilha(valor, formato) {
  // O Google Sheets pode auto-converter texto tipo "2026-08-03" ou "00:35"
  // para um objeto Date por conta propria. Isso normaliza de volta pra texto.
  if (valor instanceof Date) {
    return Utilities.formatDate(valor, "GMT-3", formato);
  }
  return valor;
}

function obterHorarioTarefa(taskId) {
  const aba = obterAbaHorarios();
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === taskId) return normalizarValorPlanilha(linhas[i][2], "HH:mm");
  }
  return null;
}

function obterDataPrazoTarefa(taskId) {
  const aba = obterAbaHorarios();
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === taskId) return normalizarValorPlanilha(linhas[i][1], "yyyy-MM-dd");
  }
  return null;
}

function obterVencimentoTarefa(taskId) {
  const data = obterDataPrazoTarefa(taskId);
  const hora = obterHorarioTarefa(taskId);
  if (!data || !hora) return null;
  return new Date(data + "T" + hora + ":00-03:00");
}

function criarTarefa(dados) {
  const listaId = obterListaTarefas();

  const tarefa = {
    title: dados.titulo,
    notes: "Criada via Personal Assistant AI"
  };

  if (dados.prazo) {
    tarefa.due = new Date(dados.prazo + "T00:00:00").toISOString();
  }

  const tarefaCriada = Tasks.Tasks.insert(tarefa, listaId);

  if (dados.hora && dados.prazo) {
    salvarHorarioTarefa(tarefaCriada.id, dados.prazo, dados.hora);
  }

  return {
    sucesso: true,
    titulo: tarefaCriada.title,
    prazo: dados.prazo || "sem prazo definido",
    hora: dados.hora || null
  };
}
