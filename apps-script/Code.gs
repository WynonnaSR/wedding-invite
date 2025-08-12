// Google Apps Script (привязан к таблице)
const SHEET_NAME = 'RSVP';

function doPost(e) {
  const out = obj => ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

  try {
    const ct = e?.postData?.type || '';
    let data = {};
    if (ct.indexOf('application/json') === 0) {
      data = JSON.parse(e.postData.contents || '{}');
    } else {
      data = e.parameter || {};
    }

    const attendMap = { yes: 'Приду', no: 'Не приду' };
    const ts = new Date(); // Timestamp в A
    const row = [
      ts,
      (data.firstName || '').toString().trim(),
      (data.lastName  || '').toString().trim(),
      attendMap[(data.attend || '').toLowerCase()] || (data.attend || ''),
      (data.note      || '').toString().trim()
    ];

    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
    const nextRow = sh.getLastRow() + 1;
    sh.getRange(nextRow, 1, 1, 5).setValues([row]);
    // Формат времени для A (опционально)
    sh.getRange(nextRow, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");

    return out({ ok: true });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  }
}