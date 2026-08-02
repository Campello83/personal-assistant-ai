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

  return {
    sucesso: true,
    titulo: tarefaCriada.title,
    prazo: dados.prazo || "sem prazo definido"
  };
}