/**
 * Protocolo Raiz Nova — acompanhamento dos compradores
 *
 * Cole este arquivo em um projeto do Google Apps Script vinculado à sua planilha
 * (Extensões > Apps Script) e publique como app da web. Passo a passo completo
 * em integracoes/README.md.
 *
 * O app envia o progresso de cada pessoa e este script mantém UMA linha por
 * e-mail, sempre atualizada. Assim a planilha responde a pergunta que interessa:
 * quem está seguindo o plano e quem parou.
 *
 * O que NUNCA chega aqui: o humor e as anotações do diário. Ficam no aparelho
 * da pessoa, por decisão de projeto. Não adicione esses campos.
 */

var ABA = 'Acompanhamento';

var COLUNAS = [
  'E-mail', 'Nome', 'Sexo', 'Perfil', 'Restrições alimentares',
  'Início', 'Última atividade', 'Dias parada', 'Dias concluídos (de 90)',
  'Fase atual', 'Fotos registradas', 'Respostas do quiz'
];

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (!d.email || d.email.indexOf('@') === -1) {
      return resposta({ ok: false, erro: 'e-mail ausente ou inválido' });
    }
    salvar(d);
    return resposta({ ok: true });
  } catch (erro) {
    console.error(erro);
    return resposta({ ok: false, erro: String(erro) });
  }
}

function salvar(d) {
  var aba = abaDestino();
  var linha = [
    String(d.email).toLowerCase(),
    d.nome || '',
    d.sexo || '',
    d.perfil || '',
    d.restricoes || '',
    data(d.inicio),
    data(d.ultimaAtividade),
    '', // "Dias parada" entra como fórmula logo abaixo
    d.diasConcluidos || 0,
    d.fase || '',
    d.fotos || '',
    d.respostas || ''
  ];

  var alvo = procurarLinha(aba, linha[0]);
  if (alvo === -1) {
    aba.appendRow(linha);
    alvo = aba.getLastRow();
  } else {
    aba.getRange(alvo, 1, 1, linha.length).setValues([linha]);
  }

  // quantos dias a pessoa está sem abrir o app — a coluna que você vai olhar
  aba.getRange(alvo, 8).setFormula('=IF(G' + alvo + '="";"";INT(NOW()-G' + alvo + '))');
  aba.getRange(alvo, 6, 1, 2).setNumberFormat('dd/mm/yyyy hh:mm');
}

function abaDestino() {
  var planilha = SpreadsheetApp.getActiveSpreadsheet();
  var aba = planilha.getSheetByName(ABA);
  if (!aba) aba = planilha.insertSheet(ABA);
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.setFrozenRows(1);
    aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
  }
  return aba;
}

function procurarLinha(aba, email) {
  if (aba.getLastRow() < 2) return -1;
  var emails = aba.getRange(2, 1, aba.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).toLowerCase() === email) return i + 2;
  }
  return -1;
}

function data(iso) {
  if (!iso) return '';
  var d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d;
}

function resposta(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Rode uma vez no editor para testar sem depender do app. */
function testar() {
  doPost({
    postData: {
      contents: JSON.stringify({
        email: 'teste@exemplo.com',
        nome: 'Teste',
        sexo: 'feminino',
        perfil: 'Eflúvio Nutricional',
        restricoes: 'Alergia a peixe',
        inicio: new Date().toISOString(),
        ultimaAtividade: new Date().toISOString(),
        diasConcluidos: 7,
        fase: '1 · Fundação',
        fotos: 'Dia 1',
        respostas: '{"sexo":"f"}'
      })
    }
  });
}
