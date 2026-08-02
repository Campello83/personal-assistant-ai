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

// O Google Tasks nao suporta horario (so data) no campo "due".
// Por isso guardamos o horario desejado numa aba propria da planilha.

function obterAbaHorarios() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Tarefas_Horario");
  if (!aba) {
    aba = planilha.insertSheet("Tarefas_Horario");
    aba.appendRow(["TaskID", "Horario"]);
  }
  return aba;
}

function salvarHorarioTarefa(taskId, horario) {
  const aba = obterAbaHorarios();
  aba.appendRow([taskId, horario]);
}

function obterHorarioTarefa(taskId) {
  const aba = obterAbaHorarios();
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === taskId) return linhas[i][1];
  }
  return null;
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

  if (dados.hora) {
    salvarHorarioTarefa(tarefaCriada.id, dados.hora);
  }

  return {
    sucesso: true,
    titulo: tarefaCriada.title,
    prazo: dados.prazo || "sem prazo definido",
    hora: dados.hora || null
  };
}
