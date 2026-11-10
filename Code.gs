/**
 * ប្រព័ន្ធតាមដានទិន្នន័យបណ្តាញសាលារៀន (Google Apps Script Backend API)
 * បម្រើការជា Web App ផង និងជា REST API សម្រាប់ GitHub Pages ផងដែរ
 */

/**
 * Handle GET Requests
 * - បើបើកផ្ទាល់ក្នុង Browser (doGet): បង្ហាញផ្ទាំង Web App HTML
 * - បើហៅតាម API (?action=getData): បញ្ជូនទិន្នន័យ JSON ទៅឱ្យ GitHub Pages
 */
function doGet(e) {
  // ប្រសិនបើហៅ API ពី GitHub Pages ដើម្បីទាញទិន្នន័យ
  if (e && e.parameter && e.parameter.action === 'getData') {
    const data = getInitialDashboardData();
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // បង្ហាញផ្ទាំង Web App ធម្មតាពេលបើកក្នុង Apps Script
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('ប្រព័ន្ធតាមដានទិន្នន័យបណ្តាញសាលារៀន')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Handle POST Requests
 * ទទួលទិន្នន័យពី GitHub Pages សម្រាប់ការរក្សាទុក (Upload) ឬសម្អាតទិន្នន័យ (Clear)
 */
function doPost(e) {
  try {
    const contents = e.postData ? e.postData.contents : '';
    const payload = JSON.parse(contents);
    let result = { status: 'error', message: 'No valid action provided' };

    if (payload.action === 'saveData') {
      result = saveSchoolData(payload);
    } else if (payload.action === 'clearData') {
      result = clearSchoolData(payload.schoolName, payload.passCode);
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ទាញយកទិន្នន័យទាំងអស់ពី Google Sheets មកបង្ហាញពេលបើក Web App
 */
function getInitialDashboardData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initRequiredSheets(ss);

    let metaSheet = ss.getSheetByName('_Meta');
    let lastUpdated = metaSheet ? metaSheet.getRange('A1').getValue() : new Date().getTime();

    return {
      status: 'success',
      timestamp: String(lastUpdated || ''),
      staff: readSheetRows(ss, 'បុគ្គលិកសរុប'),
      classes: readSheetRows(ss, 'ថ្នាក់រៀនសរុប'),
      students: readSheetRows(ss, 'សិស្សសរុប')
    };
  } catch (err) {
    return {
      status: 'error',
      message: err.toString(),
      staff: [],
      classes: [],
      students: []
    };
  }
}

/**
 * អានទិន្នន័យពី Sheet ដោយបំប្លែងតម្លៃទាំងអស់ជា String សុទ្ធ ១០០% ជៀសវាង Serialization Error
 */
function readSheetRows(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(row => row.map(cell => {
    if (cell === null || cell === undefined) return '';
    if (cell instanceof Date) {
      return Utilities.formatDate(cell, Session.getScriptTimeZone() || "Asia/Phnom_Penh", "dd/MM/yyyy");
    }
    return String(cell).trim();
  }));
}

/**
 * បង្កើត Sheets មូលដ្ឋានករណីជា Sheet ទើបបង្កើតថ្មី
 */
function initRequiredSheets(ss) {
  if (!ss.getSheetByName('បុគ្គលិកសរុប')) {
    const s = ss.insertSheet('បុគ្គលិកសរុប');
    s.appendRow(['សាលារៀន', 'ឈ្មោះ', 'ភេទ', 'ថ្ងៃខែឆ្នាំកំណើត', 'មុខតំណែង', 'លេខទូរស័ព្ទ', 'ប្រភេទការងារ']);
    s.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e2e8f0');
  }
  if (!ss.getSheetByName('ថ្នាក់រៀនសរុប')) {
    const c = ss.insertSheet('ថ្នាក់រៀនសរុប');
    c.appendRow(['សាលារៀន', 'ឈ្មោះថ្នាក់', 'ឆ្នាំសិក្សា', 'គ្រូបន្ទុកថ្នាក់', 'សិស្សសរុប', 'សិស្សស្រី']);
    c.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#e2e8f0');
  }
  if (!ss.getSheetByName('សិស្សសរុប')) {
    const st = ss.insertSheet('សិស្សសរុប');
    st.appendRow(['សាលារៀន', 'ឈ្មោះសិស្ស', 'ភេទ', 'ថ្ងៃកំណើត', 'ថ្នាក់', 'BMI', 'ស្ថានភាព BMI', 'ពិនិត្យភ្នែក', 'ពិនិត្យត្រចៀក']);
    st.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#e2e8f0');
  }
}

/**
 * រក្សាទុកទិន្នន័យពី Upload Excel
 */
function saveSchoolData(payload) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initRequiredSheets(ss);
    const nowTime = new Date().getTime();

    // ១. បុគ្គលិក
    if (payload.staff && payload.staff.length > 0) {
      const sheetStaff = ss.getSheetByName('បុគ្គលិកសរុប');
      const staffRows = payload.staff.map(s => [
        String(payload.schoolName || ''),
        String(s.name || ''),
        String(s.gender || ''),
        String(s.dob || ''),
        String(s.role || ''),
        String(s.phone || ''),
        String(s.type || '')
      ]);
      sheetStaff.getRange(sheetStaff.getLastRow() + 1, 1, staffRows.length, 7).setValues(staffRows);
    }

    // ២. ថ្នាក់រៀន
    if (payload.classes && payload.classes.length > 0) {
      const sheetClasses = ss.getSheetByName('ថ្នាក់រៀនសរុប');
      const classRows = payload.classes.map(c => [
        String(payload.schoolName || ''),
        String(c.name || ''),
        String(c.year || ''),
        String(c.teacher || ''),
        Number(c.total) || 0,
        Number(c.female) || 0
      ]);
      sheetClasses.getRange(sheetClasses.getLastRow() + 1, 1, classRows.length, 6).setValues(classRows);
    }

    // ៣. សិស្ស
    if (payload.students && payload.students.length > 0) {
      const sheetStudents = ss.getSheetByName('សិស្សសរុប');
      const studentRows = payload.students.map(st => [
        String(payload.schoolName || ''),
        String(st.name || ''),
        String(st.gender || ''),
        String(st.dob || ''),
        String(st.grade || ''),
        String(st.bmi || ''),
        String(st.bmiStatus || ''),
        String(st.eyeTest || ''),
        String(st.earTest || '')
      ]);
      sheetStudents.getRange(sheetStudents.getLastRow() + 1, 1, studentRows.length, 9).setValues(studentRows);
    }

    // Update Timestamp
    let metaSheet = ss.getSheetByName('_Meta');
    if (!metaSheet) {
      metaSheet = ss.insertSheet('_Meta');
      metaSheet.hideSheet();
    }
    metaSheet.getRange('A1').setValue(nowTime);

    return { status: 'success', timestamp: String(nowTime) };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}

/**
 * មុខងារសម្អាតទិន្នន័យក្នុង Google Sheets (ផ្ទៀងផ្ទាត់លេខកូដសម្ងាត់ 168)
 */
function clearSchoolData(schoolName, passCode) {
  try {
    // ត្រួតពិនិត្យលេខកូដសម្ងាត់ ១៦៨
    if (String(passCode || '').trim() !== '168') {
      return { status: 'error', message: 'លេខកូដបញ្ជាក់មិនត្រឹមត្រូវទេ (Invalid Code)!' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initRequiredSheets(ss);
    const sheetNames = ['បុគ្គលិកសរុប', 'ថ្នាក់រៀនសរុប', 'សិស្សសរុប'];

    sheetNames.forEach(name => {
      const sheet = ss.getSheetByName(name);
      if (!sheet) return;
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return;

      if (!schoolName || schoolName === 'ALL') {
        // លុបទិន្នន័យទាំងអស់ ដោយរក្សាទុក Header ជួរទី១
        sheet.deleteRows(2, lastRow - 1);
      } else {
        // លុបតែជួរណាដែលមានឈ្មោះសាលាដែលបានជ្រើសរើស
        const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (let r = values.length - 1; r >= 0; r--) {
          if (String(values[r][0]).trim() === String(schoolName).trim()) {
            sheet.deleteRow(r + 2);
          }
        }
      }
    });

    // Update Timestamp ក្នុង _Meta ដើម្បីឱ្យ Web App Live Sync
    let metaSheet = ss.getSheetByName('_Meta');
    if (!metaSheet) {
      metaSheet = ss.insertSheet('_Meta');
      metaSheet.hideSheet();
    }
    const nowTime = new Date().getTime();
    metaSheet.getRange('A1').setValue(nowTime);

    return { status: 'success', timestamp: String(nowTime) };
  } catch (err) {
    return { status: 'error', message: err.toString() };
  }
}
