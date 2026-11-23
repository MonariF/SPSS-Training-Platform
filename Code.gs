/**
 * SPSS Training by Dr. Fred Monari
 * Google Apps Script backend — IBM SPSS Statistics Version 27
 *
 * IMPORTANT:
 * - Keep this file as Code.gs.
 * - Keep the HTML file named exactly Index.html (Apps Script file name: Index).
 * - Run setupMonitoringSheet() once, if the monitoring workbook has not already
 *   been created. This function reuses the existing workbook when possible.
 * - Deploy > Manage deployments > Edit > New version.
 * - Execute as: Me. Access: Anyone.
 *
 * Students do not need a Google account or password to view the website.
 * They enter their name, registration number and email to associate progress
 * records with themselves. This is not identity verification: students can
 * enter inaccurate details. Every quiz attempt is retained; there is no limit.
 */

const APP_TITLE = 'SPSS Training by Dr. Fred Monari';
const TRACKING_PROPERTY = 'SPSS_TRAINING_TRACKING_SHEET_ID';

const SHEET_HEADERS = {
  'Progress Log': [
    'Timestamp', 'Student Name', 'Registration Number', 'Email',
    'Module ID', 'Module Name', 'Lesson ID', 'Lesson Title',
    'Activity', 'Status', 'Score', 'Maximum Score', 'Percentage',
    'Attempt Number', 'Notes'
  ],
  'Quiz Attempts': [
    'Timestamp', 'Student Name', 'Registration Number', 'Email',
    'Module ID', 'Module Name', 'Attempt Number', 'Score',
    'Maximum Score', 'Percentage', 'Answers JSON'
  ],
  'Practical Submissions': [
    'Timestamp', 'Student Name', 'Registration Number', 'Email',
    'Module ID', 'Module Name', 'Practical Title',
    'Dataset', 'SPSS 27 Procedure', 'Student Findings',
    'Lecturer Status', 'Lecturer Feedback', 'Lecturer Score'
  ]
};

/**
 * Serves the student website.
 * The HTML file in Apps Script must be named Index.
 */
function doGet() {
  try {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle(APP_TITLE)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (error) {
    // A readable diagnostic page is more helpful than a blank browser window
    // if the HTML file has been renamed or is missing.
    const message = escapeHtml_(error && error.message ? error.message : error);
    return HtmlService.createHtmlOutput(
      '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + APP_TITLE + '</title></head><body style="font-family:Arial,sans-serif;padding:30px">' +
      '<h2>SPSS Training website setup problem</h2>' +
      '<p>Google Apps Script could not load the HTML file named <b>Index</b>.</p>' +
      '<p>In the Apps Script Files panel, check that the HTML file is named exactly <b>Index</b>.</p>' +
      '<p><small>Technical detail: ' + message + '</small></p>' +
      '</body></html>'
    ).setTitle(APP_TITLE + ' — Setup message');
  }
}

/**
 * Run manually once from the Apps Script editor.
 * Creates the monitoring spreadsheet, or reuses the existing spreadsheet ID
 * stored in Script Properties. It does not create a new workbook on every run.
 */
function setupMonitoringSheet() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty(TRACKING_PROPERTY);

  if (savedId) {
    try {
      const existing = SpreadsheetApp.openById(savedId);
      ensureMonitoringTabs_(existing);
      Logger.log('Existing monitoring spreadsheet: ' + existing.getUrl());
      return {
        success: true,
        message: 'Existing monitoring spreadsheet found and checked.',
        url: existing.getUrl()
      };
    } catch (error) {
      Logger.log('Saved monitoring spreadsheet could not be opened. A new one will be created. ' + error);
    }
  }

  const spreadsheet = SpreadsheetApp.create(
    'SPSS Training by Dr. Fred Monari - Student Monitoring'
  );
  spreadsheet.setSpreadsheetTimeZone(Session.getScriptTimeZone());

  ensureMonitoringTabs_(spreadsheet);
  props.setProperty(TRACKING_PROPERTY, spreadsheet.getId());

  Logger.log('Monitoring spreadsheet created: ' + spreadsheet.getUrl());
  return {
    success: true,
    message: 'Monitoring spreadsheet created successfully.',
    url: spreadsheet.getUrl()
  };
}

/**
 * Creates any missing tabs and headers without deleting existing student records.
 */
function ensureMonitoringTabs_(spreadsheet) {
  Object.keys(SHEET_HEADERS).forEach(function(sheetName) {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(SHEET_HEADERS[sheetName]);
    } else {
      const currentHeaders = sheet.getRange(1, 1, 1, SHEET_HEADERS[sheetName].length)
        .getDisplayValues()[0];
      const hasHeader = currentHeaders.some(function(value) {
        return String(value).trim() !== '';
      });
      if (!hasHeader) {
        sheet.getRange(1, 1, 1, SHEET_HEADERS[sheetName].length)
          .setValues([SHEET_HEADERS[sheetName]]);
      }
    }

    formatHeader_(sheet);
  });

  let guide = spreadsheet.getSheetByName('Read Me');
  if (!guide) {
    guide = spreadsheet.insertSheet('Read Me');
  }

  if (guide.getLastRow() === 0) {
    guide.getRange(1, 1, 9, 2).setValues([
      ['SPSS Training monitoring workbook', 'Instructions'],
      ['Progress Log', 'One row is added when a student opens or completes a lesson, submits a quiz or submits practical work.'],
      ['Quiz Attempts', 'Every quiz attempt is stored. Students may repeat quizzes without a limit.'],
      ['Practical Submissions', 'Student practical write-ups are stored for lecturer review.'],
      ['Lecturer Status', 'Use Pending, Reviewed or Resubmit in the Practical Submissions sheet.'],
      ['Lecturer Feedback', 'Enter feedback in the Lecturer Feedback column.'],
      ['Lecturer Score', 'Enter a mark in the Lecturer Score column if grading is required.'],
      ['Privacy', 'Keep this spreadsheet private. Do not publish or share it with all students.'],
      ['Student identity', 'Student name, registration number and email are self-entered and are not independently verified.']
    ]);
  }

  formatHeader_(guide);
}

function formatHeader_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, lastColumn)
    .setFontWeight('bold')
    .setBackground('#102b46')
    .setFontColor('#ffffff')
    .setWrap(true);
  sheet.autoResizeColumns(1, lastColumn);
}

/**
 * Returns the private monitoring spreadsheet URL to the lecturer.
 */
function getMonitoringUrl() {
  const id = PropertiesService.getScriptProperties().getProperty(TRACKING_PROPERTY);
  if (!id) {
    return {
      success: false,
      message: 'The monitoring spreadsheet has not been configured. Run setupMonitoringSheet() first.'
    };
  }

  const url = SpreadsheetApp.openById(id).getUrl();
  Logger.log('Monitoring spreadsheet URL: ' + url);
  return { success: true, url: url };
}

/**
 * Run this from the Apps Script editor to check backend configuration.
 */
function testBackend() {
  const result = getMonitoringUrl();
  Logger.log(JSON.stringify(result));
  return result;
}

/**
 * Trims and limits text supplied by the website.
 */
function clean_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/\u0000/g, '')
    .trim()
    .slice(0, maxLength || 5000);
}

/**
 * Prevents user-entered text beginning with formula characters from being
 * interpreted as a spreadsheet formula.
 */
function sheetText_(value, maxLength) {
  const text = clean_(value, maxLength);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

/**
 * Checks that required student details have been entered.
 * This validates format only; it does not verify a student's identity.
 */
function validateStudent_(student) {
  const s = student || {};
  const name = sheetText_(s.name, 120);
  const registrationNumber = sheetText_(s.reg, 80);
  const email = clean_(s.email, 160);

  if (!name || !registrationNumber || !email) {
    throw new Error('Please enter your full name, registration number and email address.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  return {
    name: name,
    reg: registrationNumber,
    email: email
  };
}

/**
 * Opens the monitoring workbook and confirms that its tabs exist.
 */
function getTrackingSheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(TRACKING_PROPERTY);
  if (!id) {
    throw new Error('The lecturer has not configured the monitoring spreadsheet. Please contact the lecturer.');
  }

  const spreadsheet = SpreadsheetApp.openById(id);
  ensureMonitoringTabs_(spreadsheet);
  return spreadsheet;
}

/**
 * Adds a progress record. Repeated visits are intentionally retained.
 */
function recordProgress(payload) {
  const p = payload || {};
  const student = validateStudent_(p.student);
  const spreadsheet = getTrackingSheet_();
  const sheet = spreadsheet.getSheetByName('Progress Log');

  const row = [
    new Date(),
    student.name,
    student.reg,
    student.email,
    sheetText_(p.moduleId, 30),
    sheetText_(p.moduleName, 150),
    sheetText_(p.lessonId, 30),
    sheetText_(p.lessonTitle, 200),
    sheetText_(p.activity || 'Lesson', 60),
    sheetText_(p.status || 'Opened', 60),
    '',
    '',
    '',
    '',
    sheetText_(p.notes, 1000)
  ];

  appendRowSafely_(sheet, row);
  return { success: true, message: 'Your activity has been recorded.' };
}

/**
 * Stores every quiz attempt.
 * Attempt number is counted for the same student and module, not globally.
 * There is no attempt limit.
 */
function submitQuiz(payload) {
  const p = payload || {};
  const student = validateStudent_(p.student);
  const score = Number(p.score);
  const maxScore = Number(p.maxScore);

  if (!Number.isFinite(score) ||
      !Number.isFinite(maxScore) ||
      maxScore <= 0 ||
      score < 0 ||
      score > maxScore) {
    throw new Error('The quiz score is invalid. Please try again.');
  }

  const moduleId = sheetText_(p.moduleId, 30);
  const moduleName = sheetText_(p.moduleName, 150);
  if (!moduleId || !moduleName) {
    throw new Error('The module information is missing. Please reload the page and try again.');
  }

  const percentage = Math.round((score / maxScore) * 10000) / 100;
  const spreadsheet = getTrackingSheet_();
  const quizSheet = spreadsheet.getSheetByName('Quiz Attempts');
  const progressSheet = spreadsheet.getSheetByName('Progress Log');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  let attemptNumber;
  try {
    attemptNumber = getStudentModuleAttemptCount_(
      quizSheet,
      student.reg,
      moduleId
    ) + 1;

    quizSheet.appendRow([
      new Date(),
      student.name,
      student.reg,
      student.email,
      moduleId,
      moduleName,
      attemptNumber,
      score,
      maxScore,
      percentage,
      JSON.stringify(p.answers || {})
    ]);

    progressSheet.appendRow([
      new Date(),
      student.name,
      student.reg,
      student.email,
      moduleId,
      moduleName,
      '',
      'Module quiz',
      'Quiz',
      'Submitted',
      score,
      maxScore,
      percentage,
      attemptNumber,
      'Quiz attempt recorded'
    ]);
  } finally {
    lock.releaseLock();
  }

  return {
    success: true,
    score: score,
    maxScore: maxScore,
    percentage: percentage,
    attemptNumber: attemptNumber,
    message: 'Your quiz attempt has been saved. You may repeat the quiz.'
  };
}

/**
 * Counts previous attempts for a particular registration number and module.
 */
function getStudentModuleAttemptCount_(sheet, registrationNumber, moduleId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  // Columns: Registration Number = 3; Module ID = 5.
  const values = sheet.getRange(2, 3, lastRow - 1, 3).getDisplayValues();
  let count = 0;

  values.forEach(function(row) {
    if (row[0] === registrationNumber && row[2] === moduleId) {
      count++;
    }
  });

  return count;
}

/**
 * Stores a practical submission for lecturer evaluation.
 */
function submitPractical(payload) {
  const p = payload || {};
  const student = validateStudent_(p.student);
  const findings = sheetText_(p.findings, 10000);

  if (findings.length < 20) {
    throw new Error('Please enter at least 20 characters describing your SPSS procedure and findings.');
  }

  const title = sheetText_(p.title, 200);
  if (!title) {
    throw new Error('Please enter the practical assignment title.');
  }

  const spreadsheet = getTrackingSheet_();
  const practicalSheet = spreadsheet.getSheetByName('Practical Submissions');
  const progressSheet = spreadsheet.getSheetByName('Progress Log');

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    practicalSheet.appendRow([
      new Date(),
      student.name,
      student.reg,
      student.email,
      sheetText_(p.moduleId, 30),
      sheetText_(p.moduleName, 150),
      title,
      sheetText_(p.dataset, 150),
      sheetText_(p.procedure || 'IBM SPSS Statistics 27', 200),
      findings,
      'Pending',
      '',
      ''
    ]);

    progressSheet.appendRow([
      new Date(),
      student.name,
      student.reg,
      student.email,
      sheetText_(p.moduleId, 30),
      sheetText_(p.moduleName, 150),
      '',
      title,
      'Practical assignment',
      'Submitted',
      '',
      '',
      '',
      '',
      'Awaiting lecturer evaluation'
    ]);
  } finally {
    lock.releaseLock();
  }

  return {
    success: true,
    message: 'Your practical work has been submitted for lecturer evaluation.'
  };
}

/**
 * Serialises writes to avoid simultaneous students overwriting one another.
 */
function appendRowSafely_(sheet, row) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Escapes error text before displaying it in the fallback HTML page.
 */
function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}


const LECTURER_KEY_PROPERTY = 'SPSS_TRAINING_LECTURER_KEY';

function createLecturerAccessKey() {
  const props = PropertiesService.getScriptProperties();
  let key = props.getProperty(LECTURER_KEY_PROPERTY);
  if (!key) {
    key = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
    props.setProperty(LECTURER_KEY_PROPERTY,key);
  }
  Logger.log('LECTURER ACCESS KEY — KEEP PRIVATE: ' + key);
  return {success:true,message:'Lecturer key is ready. Copy it from the execution log.'};
}

function requireLecturer_(key) {
  const saved = PropertiesService.getScriptProperties().getProperty(LECTURER_KEY_PROPERTY);
  if (!saved) throw new Error('Run createLecturerAccessKey() in Apps Script first.');
  if (String(key || '') !== saved) throw new Error('Access denied: incorrect lecturer key.');
}
function formatDate_(v) {
  return v instanceof Date ? Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm') : String(v || '');
}

function getStudentProgress(studentPayload) {
  const s = validateStudent_(studentPayload), ss = getTrackingSheet_();
  const p = ss.getSheetByName('Progress Log').getDataRange().getValues().slice(1);
  const q = ss.getSheetByName('Quiz Attempts').getDataRange().getValues().slice(1);
  const a = ss.getSheetByName('Practical Submissions').getDataRange().getValues().slice(1);
  const match = r => String(r[2])===s.reg && String(r[3]).toLowerCase()===s.email.toLowerCase();
  const pr=p.filter(match),qr=q.filter(match),ar=a.filter(match);
  return {
    success:true,
    lessonsOpened:pr.filter(r=>r[8]==='Lesson'&&r[9]==='Opened').length,
    lessonsCompleted:pr.filter(r=>r[8]==='Lesson'&&r[9]==='Completed').length,
    quizAttempts:qr.length,practicalSubmissions:ar.length,
    quizzes:qr.slice(-30).reverse().map(r=>({moduleName:r[5],attemptNumber:r[6],score:r[7],maxScore:r[8],percentage:r[9],date:formatDate_(r[0])})),
    practicals:ar.slice(-20).reverse().map(r=>({title:r[6],status:r[10],feedback:r[11],score:r[12]}))
  };
}

function getLecturerDashboard(key) {
  requireLecturer_(key);
  const ss=getTrackingSheet_();
  const progress=ss.getSheetByName('Progress Log').getDataRange().getValues().slice(1);
  const quizzes=ss.getSheetByName('Quiz Attempts').getDataRange().getValues().slice(1);
  const practicals=ss.getSheetByName('Practical Submissions').getDataRange().getValues().slice(1);
  const students={};
  quizzes.forEach(r=>{
    const reg=String(r[2]||'');if(!reg)return;
    if(!students[reg])students[reg]={name:String(r[1]),reg:reg,attempts:0,total:0,completedLessons:0};
    students[reg].attempts++;students[reg].total+=Number(r[9])||0;
  });
  progress.forEach(r=>{
    const reg=String(r[2]||'');
    if(reg&&r[8]==='Lesson'&&r[9]==='Completed'){
      if(!students[reg])students[reg]={name:String(r[1]),reg:reg,attempts:0,total:0,completedLessons:0};
      students[reg].completedLessons++;
    }
  });
  const studentRows=Object.keys(students).map(reg=>{
    const s=students[reg];return {name:s.name,reg:s.reg,attempts:s.attempts,average:s.attempts?Math.round(s.total/s.attempts*100)/100:0,completedLessons:s.completedLessons};
  }).sort((a,b)=>a.name.localeCompare(b.name));
  const avg=quizzes.length?Math.round(quizzes.reduce((sum,r)=>sum+(Number(r[9])||0),0)/quizzes.length*100)/100:0;
  const practicalRows=practicals.map((r,i)=>({row:i+2,name:String(r[1]),reg:String(r[2]),email:String(r[3]),title:String(r[6]),dataset:String(r[7]),findings:String(r[9]),status:String(r[10]||'Pending'),feedback:String(r[11]||''),score:r[12]==null?'':String(r[12])})).reverse().slice(0,100);
  return {success:true,summary:{students:studentRows.length,quizAttempts:quizzes.length,averageQuizPercentage:avg,practicalSubmissions:practicals.length,pendingPracticals:practicals.filter(r=>String(r[10])==='Pending').length},students:studentRows,practicals:practicalRows};
}

function updatePracticalReview(key,rowNumber,status,feedback,score) {
  requireLecturer_(key);
  const row=Number(rowNumber),mark=String(score==null?'':score).trim();
  if(!Number.isInteger(row)||row<2)throw new Error('Invalid practical row.');
  if(['Pending','Reviewed','Resubmit'].indexOf(String(status))<0)throw new Error('Invalid review status.');
  if(mark!==''&&(!Number.isFinite(Number(mark))||Number(mark)<0||Number(mark)>100))throw new Error('Enter a score from 0 to 100 or leave blank.');
  const sh=getTrackingSheet_().getSheetByName('Practical Submissions');
  if(row>sh.getLastRow())throw new Error('Submission not found.');
  sh.getRange(row,11,1,3).setValues([[status,clean_(feedback,5000),mark===''?'':Number(mark)]]);
  return {success:true,message:'Lecturer evaluation saved.'};
}