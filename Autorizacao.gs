// Autorizacao.gs — arquivo temporário só para forçar a tela de permissões

function autorizarPermissoes() {
  Tasks.Tasklists.list();
  CalendarApp.getDefaultCalendar();
  UrlFetchApp.fetch("https://www.google.com");
}