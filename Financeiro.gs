// Financeiro.gs — Controle financeiro (gastos, entradas e saldo)

function obterAbaFinanceiro() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Financeiro");

  if (!aba) {
    aba = planilha.insertSheet("Financeiro");
    aba.appendRow(["Timestamp", "Tipo", "Descricao", "Valor", "Categoria"]);
    registrarLog("SISTEMA", "Financeiro", "Aba Financeiro criada", "OK");
  }

  return aba;
}

function registrarMovimentacao(tipo, dados) {
  const aba = obterAbaFinanceiro();
  const valor = Number(dados.valor) || 0;

  aba.appendRow([new Date(), tipo, dados.descricao || "", valor, dados.categoria || "Sem categoria"]);

  return {
    sucesso: true,
    tipo: tipo,
    descricao: dados.descricao || "",
    valor: valor,
    categoria: dados.categoria || "Sem categoria"
  };
}

function obterDataInicioPeriodo(periodo) {
  const agora = new Date();
  const inicio = new Date(agora);

  if (periodo === "diario") {
    inicio.setHours(0, 0, 0, 0);
  } else if (periodo === "semanal") {
    inicio.setDate(agora.getDate() - 7);
  } else if (periodo === "mensal") {
    inicio.setDate(agora.getDate() - 30);
  } else {
    return null; // "total" - sem filtro de data
  }

  return inicio;
}

function consultarFinanceiro(dados) {
  const aba = obterAbaFinanceiro();
  const linhas = aba.getDataRange().getValues();
  const dataInicio = obterDataInicioPeriodo(dados.periodo);

  let totalEntradas = 0;
  let totalGastos = 0;
  const gastosPorCategoria = {};

  for (let i = 1; i < linhas.length; i++) {
    const timestamp = linhas[i][0];
    const tipo = linhas[i][1];
    const valor = linhas[i][3];
    const categoria = linhas[i][4];

    if (dataInicio && new Date(timestamp) < dataInicio) continue;

    if (tipo === "Entrada") {
      totalEntradas += valor;
    } else if (tipo === "Gasto") {
      totalGastos += valor;
      gastosPorCategoria[categoria] = (gastosPorCategoria[categoria] || 0) + valor;
    }
  }

  return {
    periodo: dados.periodo || "total",
    totalEntradas: totalEntradas,
    totalGastos: totalGastos,
    saldo: totalEntradas - totalGastos,
    gastosPorCategoria: gastosPorCategoria
  };
}