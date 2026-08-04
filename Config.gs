// Config.gs — Configuracoes gerais e memoria do assistente (Etapa 10)
//
// Duas responsabilidades separadas:
// 1) Preferencias: pares chave/valor persistentes, editaveis manualmente na
//    aba "Config" da planilha (ex: ajustes futuros de comportamento).
// 2) Memoria de curto prazo: guarda o ultimo compromisso mencionado por
//    cada usuario, para permitir referencias indiretas do tipo "muda essa
//    reuniao para as 16h" ou "cancela aquele compromisso" — decisao que
//    havia sido adiada da Etapa 3 (ver CHANGELOG v0.3.0 / GUIA-REPLICACAO).

// ---------- PREFERENCIAS ----------

function obterAbaConfig() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Config");
  if (!aba) {
    aba = planilha.insertSheet("Config");
    aba.appendRow(["Chave", "Valor"]);
  }
  return aba;
}

function obterPreferencia(chave, padrao) {
  const aba = obterAbaConfig();
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === chave) return linhas[i][1];
  }
  return padrao;
}

function definirPreferencia(chave, valor) {
  const aba = obterAbaConfig();
  const linhas = aba.getDataRange().getValues();
  for (let i = 1; i < linhas.length; i++) {
    if (linhas[i][0] === chave) {
      aba.getRange(i + 1, 2).setValue(valor);
      return;
    }
  }
  aba.appendRow([chave, valor]);
}

// ---------- MEMORIA DE CURTO PRAZO (por usuario) ----------

function obterAbaMemoria() {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Memoria_Contexto");
  if (!aba) {
    aba = planilha.insertSheet("Memoria_Contexto");
    aba.appendRow(["Numero", "Chave", "Valor", "AtualizadoEm"]);
  }
  return aba;
}

// Guarda um objeto (sera serializado em JSON) associado a um usuario e uma
// chave (ex: "ultimo_compromisso"). Sobrescreve o valor anterior da mesma
// chave para o mesmo usuario.
function salvarMemoria(numero, chave, valorObjeto) {
  const aba = obterAbaMemoria();
  const linhas = aba.getDataRange().getValues();
  const agora = new Date();
  const numeroTexto = String(numero);

  for (let i = 1; i < linhas.length; i++) {
    if (String(linhas[i][0]) === numeroTexto && linhas[i][1] === chave) {
      aba.getRange(i + 1, 3, 1, 2).setValues([[JSON.stringify(valorObjeto), agora]]);
      return;
    }
  }

  // O numero de telefone e so digitos — sem forcar formato de texto (@), o
  // Google Sheets converte automaticamente para numero, o que quebra a
  // comparacao de igualdade na busca (mesma armadilha ja vista com datas
  // em Tasks.gs). Por isso a celula da coluna "Numero" e escrita como texto
  // puro, em vez de usar appendRow direto.
  const linha = aba.getLastRow() + 1;
  aba.getRange(linha, 1).setNumberFormat("@");
  aba.getRange(linha, 1, 1, 4).setValues([[numeroTexto, chave, JSON.stringify(valorObjeto), agora]]);
}

// Busca o valor salvo para um usuario/chave. validoPorHoras limita ha quanto
// tempo a memoria ainda e considerada valida (padrao 6h) — evita que o
// assistente aplique uma referencia indireta a algo mencionado dias atras.
function buscarMemoria(numero, chave, validoPorHoras) {
  const aba = obterAbaMemoria();
  const linhas = aba.getDataRange().getValues();
  const limiteMs = (validoPorHoras || 6) * 60 * 60000;
  const numeroTexto = String(numero);

  for (let i = 1; i < linhas.length; i++) {
    if (String(linhas[i][0]) === numeroTexto && linhas[i][1] === chave) {
      const atualizadoEm = new Date(linhas[i][3]);
      if (new Date().getTime() - atualizadoEm.getTime() > limiteMs) return null;
      try {
        return JSON.parse(linhas[i][2]);
      } catch (erro) {
        return null;
      }
    }
  }
  return null;
}
