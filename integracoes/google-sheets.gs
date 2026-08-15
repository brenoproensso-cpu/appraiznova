/**
 * Protocolo Raiz Nova — recebedor de leads
 *
 * Cole este arquivo em um projeto do Google Apps Script vinculado à sua planilha
 * (Extensões > Apps Script) e publique como app da web. O passo a passo completo
 * está em integracoes/README.md.
 *
 * O que ele faz:
 *   1. grava uma linha na planilha com os dados do lead;
 *   2. se o app pedir, envia para a pessoa o resumo do plano por e-mail.
 *
 * O conteúdo do e-mail é montado no app (app.js > buildResumo) e chega pronto
 * aqui. Assim o texto tem uma fonte só: melhorou no app, o e-mail acompanha.
 */

// Nome da aba da planilha onde as linhas são gravadas.
var ABA = 'Leads';

// Nome que aparece como remetente do e-mail.
var REMETENTE = 'Protocolo Raiz Nova';

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);

    if (!dados.email || dados.email.indexOf('@') === -1) {
      return resposta({ ok: false, erro: 'e-mail ausente ou inválido' });
    }

    gravarLinha(dados);

    if (dados.enviarEmail) {
      MailApp.sendEmail({
        to: dados.email,
        subject: dados.assunto || 'Seu plano — Protocolo Raiz Nova',
        body: dados.corpoTexto || '',
        htmlBody: dados.corpoHtml || '',
        name: REMETENTE
      });
    }

    return resposta({ ok: true });
  } catch (erro) {
    // O app não trava se isto falhar, mas o log ajuda a diagnosticar depois.
    console.error(erro);
    return resposta({ ok: false, erro: String(erro) });
  }
}

function gravarLinha(dados) {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA);

  if (!aba) {
    aba = planilha.insertSheet(ABA);
  }

  if (aba.getLastRow() === 0) {
    aba.appendRow([
      'Data', 'Nome', 'E-mail', 'Sexo', 'Perfil',
      'Restrições alimentares', 'Respostas do quiz', 'Origem'
    ]);
    aba.setFrozenRows(1);
  }

  // Evita duplicar o mesmo e-mail se a pessoa refizer o quiz.
  var emails = aba.getRange(2, 3, Math.max(aba.getLastRow() - 1, 1), 1).getValues();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).toLowerCase() === String(dados.email).toLowerCase()) {
      aba.getRange(i + 2, 1).setValue(new Date());
      aba.getRange(i + 2, 5).setValue(dados.perfil || '');
      aba.getRange(i + 2, 6).setValue(dados.restricoes || '');
      aba.getRange(i + 2, 7).setValue(dados.respostas || '');
      return;
    }
  }

  aba.appendRow([
    new Date(),
    dados.nome || '',
    dados.email,
    dados.sexo || '',
    dados.perfil || '',
    dados.restricoes || '',
    dados.respostas || '',
    dados.origem || ''
  ]);
}

function resposta(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Rode esta função uma vez, direto no editor, para testar sem depender do app.
 * Troque o e-mail antes: ele vai receber a mensagem de verdade.
 */
function testar() {
  doPost({
    postData: {
      contents: JSON.stringify({
        nome: 'Teste',
        email: 'troque-pelo-seu@email.com',
        sexo: 'feminino',
        perfil: 'Eflúvio Nutricional',
        restricoes: 'Alergia a peixe',
        respostas: '{"sexo":"f"}',
        origem: 'teste manual',
        enviarEmail: true,
        assunto: 'Teste — Protocolo Raiz Nova',
        corpoTexto: 'Se você recebeu isto, a integração está funcionando.',
        corpoHtml: '<p>Se você recebeu isto, a integração está funcionando.</p>'
      })
    }
  });
}
