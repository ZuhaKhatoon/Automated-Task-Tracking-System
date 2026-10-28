
const S = {
  M: 'Task_Master',
  R: 'Employee_Report',
  D: 'Manager_Dashboard',
  C: 'Cycle_Log',
  A: 'Alert_Log',
  SET: 'Settings'
};

const C = {
  ID: 1, TASK: 2, N: 3, DUE: 4, DUEAT: 5,
  EMAIL: 6, STATUS: 7, PROOF: 8, BY: 9,
  DONEAT: 10, MSENT: 11, ACKBY: 12,
  ACKAT: 13, ESC: 14, LSENT: 15
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Allo Ops')
    .addItem('Setup / Repair Triggers', 'setup')
    .addItem('Sync Cycles + Employee Report', 'syncNow')
    .addItem('Check SLAs / Send Alerts', 'checkSLAs')
    .addItem('Acknowledge selected cycle', 'acknowledgeSelectedCycle')
    .addToUi();
}

/*
 * UPDATED:
 * - Recurring cycle sync: every hour
 * - SLA checks: every 5 minutes
 */
function setup() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    const fn = trigger.getHandlerFunction();

    if (['syncNow', 'checkSLAs'].includes(fn)) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('syncNow')
    .timeBased()
    .everyHours(1)
    .create();

  ScriptApp.newTrigger('checkSLAs')
    .timeBased()
    .everyMinutes(5)
    .create();

  syncNow();

  SpreadsheetApp.getUi().alert(
    'Setup complete. SLA checks are scheduled every 5 minutes. ' +
    'Test using email addresses you control.'
  );
}

function syncNow() {
  // Prevent overlapping sync executions from creating duplicate cycles.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    syncNowLocked_();
  } finally {
    lock.releaseLock();
  }
}

function syncNowLocked_() {
  const ss = SpreadsheetApp.getActive();
  const master = ss.getSheetByName(S.M);
  const cycles = ss.getSheetByName(S.C);
  const values = master.getDataRange().getValues();

  if (values.length < 2) return;

  const headers = map_(values[0]);
  const cycleValues = cycles.getDataRange().getValues();
  const ids = new Set(
    cycleValues.slice(1).map(row => String(row[0]))
  );

  const last = {};

  cycleValues.slice(1).forEach(row => {
    const taskId = String(row[1]);
    const number = Number(row[2]) || 0;

    if (!last[taskId] || number > last[taskId].n) {
      last[taskId] = { n: number, row: row };
    }
  });

  const additions = [];
  const now = new Date();

  values.slice(1).forEach(row => {
    const taskId = String(row[headers.Task_ID] || '').trim();

    if (!taskId ||
        String(row[headers.Active]).toUpperCase() === 'FALSE') {
      return;
    }

    const frequency = Number(row[headers.Frequency_Days]) || 1;
    const baseDate =
      row[headers.Next_Due_Date] || row[headers.First_Due_Date];

    const previous = last[taskId];

    if (!previous) {
      if (!(baseDate instanceof Date)) return;

      const due = dt_(
        baseDate,
        row[headers.Deadline_Time] || '17:00'
      );

      const cycleId = cid_(taskId, 1, baseDate);

      if (!ids.has(cycleId)) {
        additions.push(
          cycle_(
            cycleId,
            taskId,
            1,
            due,
            row[headers.Employee_Email],
            due < now ? 'OVERDUE' : 'PENDING'
          )
        );
        ids.add(cycleId);
      }

      return;
    }

    if (String(previous.row[6]) !== 'COMPLETED') return;

    const number = previous.n + 1;
    const nextDate = new Date(previous.row[3]);

    // Next cycle is based on the previous due date.
    nextDate.setDate(nextDate.getDate() + frequency);

    const due = dt_(
      nextDate,
      row[headers.Deadline_Time] || '17:00'
    );

    const cycleId = cid_(taskId, number, nextDate);

    if (!ids.has(cycleId)) {
      additions.push(
        cycle_(
          cycleId,
          taskId,
          number,
          due,
          row[headers.Employee_Email],
          due < now ? 'OVERDUE' : 'PENDING'
        )
      );
      ids.add(cycleId);
    }
  });

  if (additions.length) {
    cycles.getRange(
      cycles.getLastRow() + 1,
      1,
      additions.length,
      additions[0].length
    ).setValues(additions);
  }

  overdue_();
  report_();
  dashboard_();
}

function cycle_(id, taskId, number, due, email, status) {
  return [
    id,
    taskId,
    number,
    new Date(due.getFullYear(), due.getMonth(), due.getDate()),
    due,
    email,
    status,
    '',
    '',
    '',
    '',
    '',
    '',
    'NO',
    '',
    ''
  ];
}

function onEdit(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  const rowNumber = e.range.getRow();
  const column = e.range.getColumn();

  if (sheet.getName() !== S.R || rowNumber < 2) return;

  // Handle Status edits (column H) and Proof edits (column J).
  if (![8, 10].includes(column)) return;

  const row = sheet.getRange(rowNumber, 1, 1, 15).getValues()[0];
  const cycleId = String(row[0] || '');

  if (!cycleId) return;

  const ss = SpreadsheetApp.getActive();
  const log = ss.getSheetByName(S.C);
  const values = log.getDataRange().getValues();

  const index = values.findIndex(
    (item, i) => i > 0 && String(item[0]) === cycleId
  );

  if (index < 1) return;

  const old = values[index];
  const status = String(row[7] || '').toUpperCase();
  const proof = String(row[9] || '').trim();
  const logRow = index + 1;

  // Do not overwrite an already completed cycle.
  if (String(old[6]) === 'COMPLETED') {
    report_();
    return;
  }

  // Save proof immediately, so a sync won't erase it.
  if (column === 10) {
    log.getRange(logRow, 8).setValue(proof);
    return;
  }

  if (status === 'COMPLETED') {
    if (!proof) {
      sheet.getRange(rowNumber, 8).setValue(old[6]);
      ss.toast('Enter completion proof in column J first.');
      return;
    }

    const who =
      Session.getActiveUser().getEmail() ||
      String(row[4]) ||
      'Identity unavailable';

    const now = new Date();

    log.getRange(logRow, 7).setValue('COMPLETED');
    log.getRange(logRow, 8).setValue(proof);
    log.getRange(logRow, 9).setValue(who);
    log.getRange(logRow, 10).setValue(now);

    syncNow();
    ss.toast('Completion recorded; next cycle prepared.');
    return;
  }

  if (status === 'BLOCKED') {
    log.getRange(logRow, 7).setValue('BLOCKED');
  } else if (['PENDING', 'OVERDUE'].includes(status)) {
    log.getRange(logRow, 7).setValue(
      old[4] instanceof Date && old[4] < new Date()
        ? 'OVERDUE'
        : 'PENDING'
    );
  }

  dashboard_();
}

function checkSLAs() {
  // This function is scheduled every 5 minutes by setup().
  syncNow();

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName(S.C);
  const values = sheet.getDataRange().getValues();
  const settings = settings_();
  const master = master_();
  const now = new Date();

  values.slice(1).forEach((row, index) => {
    if (String(row[6]) === 'COMPLETED') return;

    const due = row[4];
    if (!(due instanceof Date)) return;

    const task = master[String(row[1])] || {};
    const minutesLate = (now - due) / 60000;
    const hoursLate = (now - due) / 3600000;
    const sheetRow = index + 2;

    // Manager alert after the configured grace period.
    if (
      minutesLate >= Number(settings.MANAGER_ALERT_GRACE_MINUTES || 30) &&
      !row[10]
    ) {
      const result = mailOnce_(
        settings.MANAGER_EMAIL,
        `[Allo Ops] Overdue task: ${task.name || row[1]}`,
        `Task: ${task.name || row[1]}\n` +
        `Employee: ${task.owner || row[5]} (${row[5]})\n` +
        `Due: ${due}\n` +
        `Cycle: ${row[0]}\n` +
        `Status: ${row[6]}\n\n` +
        `Please acknowledge in Cycle_Log using Allo Ops → Acknowledge selected cycle.`,
        row[0],
        'MANAGER_ALERT'
      );

      if (result === 'SENT') {
        sheet.getRange(sheetRow, 11).setValue(new Date());
      }
    }

    // Leadership escalation after the configured threshold.
    if (
      hoursLate >= Number(settings.LEADERSHIP_ESCALATION_HOURS || 4) &&
      String(row[13]) !== 'YES'
    ) {
      const result = mailOnce_(
        settings.LEADERSHIP_EMAIL,
        `[Allo Ops ESCALATION] ${task.name || row[1]}`,
        `Unresolved task escalation.\n` +
        `Task: ${task.name || row[1]}\n` +
        `Employee: ${task.owner || row[5]} (${row[5]})\n` +
        `Due: ${due}\n` +
        `Cycle: ${row[0]}\n` +
        `Manager acknowledgement: ${row[12] || 'NO'}`,
        row[0],
        'LEADERSHIP_ESCALATION'
      );

      if (result === 'SENT') {
        sheet.getRange(sheetRow, 14).setValue('YES');
        sheet.getRange(sheetRow, 15).setValue(new Date());
      }
    }
  });

  report_();
  dashboard_();
}

function acknowledgeSelectedCycle() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getActiveSheet();

  if (
    sheet.getName() !== S.C ||
    sheet.getActiveRange().getRow() < 2
  ) {
    SpreadsheetApp.getUi().alert(
      'Select a cycle row in Cycle_Log first.'
    );
    return;
  }

  const row = sheet.getActiveRange().getRow();

  sheet.getRange(row, 12).setValue(
    Session.getActiveUser().getEmail() ||
    'Manager identity unavailable'
  );

  sheet.getRange(row, 13).setValue(new Date());

  event_(
    sheet.getRange(row, 1).getValue(),
    'MANAGER_ACK',
    'Manager',
    'Acknowledged'
  );

  dashboard_();
  ss.toast('Acknowledgement recorded.');
}

function report_() {
  const ss = SpreadsheetApp.getActive();

  const output = [[
    'Cycle_ID',
    'Task_ID',
    'Task_Name',
    'Assigned_To',
    'Employee_Email',
    'Due_Date',
    'Due_DateTime',
    'Status (edit dropdown)',
    'Required_Proof',
    'Completion_Proof (edit)',
    'Completed_By',
    'Completed_At',
    'Manager_Acknowledged',
    'Manager_Ack_At',
    'Escalated?'
  ]];

  const values = ss.getSheetByName(S.C).getDataRange().getValues();
  const master = master_();
  const now = new Date();

  values.slice(1).forEach(row => {
    if (
      String(row[6]) === 'COMPLETED' ||
      (row[4] instanceof Date && row[4] > now)
    ) return;

    const task = master[String(row[1])] || {};

    output.push([
      row[0],
      row[1],
      task.name || row[1],
      task.owner || '',
      row[5],
      row[3],
      row[4],
      row[6],
      task.proof || 'Ticket ID / daily confirmation',
      row[7] || '',
      row[8] || '',
      row[9] || '',
      row[12] ? 'YES' : 'NO',
      row[12] || '',
      row[13] || 'NO'
    ]);
  });

  const sheet = ss.getSheetByName(S.R);
  sheet.clearContents();
  sheet.getRange(1, 1, output.length, 15).setValues(output);
  sheet.setFrozenRows(1);

  if (output.length > 1) {
    sheet.getRange(2, 8, output.length - 1, 1)
      .setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(
            ['PENDING', 'COMPLETED', 'BLOCKED', 'OVERDUE'],
            true
          )
          .setAllowInvalid(false)
          .build()
      );

    sheet.getRange(2, 6, output.length - 1, 1)
      .setNumberFormat('yyyy-mm-dd');

    sheet.getRange(2, 7, output.length - 1, 1)
      .setNumberFormat('yyyy-mm-dd hh:mm');
  }

  sheet.getRange(1, 1, 1, 15)
    .setFontWeight('bold')
    .setBackground('#17365D')
    .setFontColor('#FFFFFF');

  sheet.autoResizeColumns(1, 15);
}

function overdue_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(S.C);
  const values = sheet.getDataRange().getValues();
  const now = new Date();

  values.slice(1).forEach((row, index) => {
    if (['COMPLETED', 'BLOCKED'].includes(String(row[6]))) return;

    if (
      row[4] instanceof Date &&
      row[4] < now &&
      String(row[6]) !== 'OVERDUE'
    ) {
      sheet.getRange(index + 2, 7).setValue('OVERDUE');
    }
  });
}

function dashboard_() {
  const ss = SpreadsheetApp.getActive();
  const dashboard = ss.getSheetByName(S.D);
  const values = ss.getSheetByName(S.C)
    .getDataRange().getValues().slice(1);

  const count = status =>
    values.filter(row => String(row[6]) === status).length;

  dashboard.getRange('B2').setValue(
    count('PENDING') + count('OVERDUE') + count('BLOCKED')
  );

  dashboard.getRange('B3').setValue(count('OVERDUE'));

  dashboard.getRange('B4').setValue(
    values.filter(row =>
      ['OVERDUE', 'BLOCKED'].includes(String(row[6])) &&
      !row[12]
    ).length
  );

  dashboard.getRange('B5').setValue(
    values.filter(row => String(row[13]) === 'YES').length
  );

  dashboard.getRange('B6').setValue(count('COMPLETED'));
}

function master_() {
  const values = SpreadsheetApp.getActive()
    .getSheetByName(S.M).getDataRange().getValues();

  const headers = map_(values[0]);
  const output = {};

  values.slice(1).forEach(row => {
    const id = String(row[headers.Task_ID] || '');
    if (!id) return;

    output[id] = {
      name: row[headers.Task_Name],
      owner: row[headers.Assigned_To],
      email: row[headers.Employee_Email],
      type: row[headers.Task_Type],
      proof: row[headers.Required_Proof]
    };
  });

  return output;
}

function settings_() {
  const values = SpreadsheetApp.getActive()
    .getSheetByName(S.SET).getDataRange().getValues();

  const output = {};

  values.slice(1).forEach(row => {
    if (row[0] !== '') output[String(row[0])] = row[1];
  });

  return output;
}

function map_(headers) {
  const output = {};
  headers.forEach((value, index) => {
    output[String(value).trim()] = index;
  });
  return output;
}

function dt_(date, time) {
  const d = new Date(date);
  let hour = 17;
  let minute = 0;

  if (time instanceof Date) {
    hour = time.getHours();
    minute = time.getMinutes();
  } else {
    const parts = String(time).split(':');
    hour = Number(parts[0]) || 0;
    minute = Number(parts[1]) || 0;
  }

  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    hour,
    minute,
    0,
    0
  );
}

function cid_(taskId, number, date) {
  return `${taskId}-C${String(number).padStart(4, '0')}-` +
    Utilities.formatDate(
      new Date(date),
      Session.getScriptTimeZone(),
      'yyyyMMdd'
    );
}

function mailOnce_(to, subject, body, cycleId, type) {
  // Keep the check-send-log sequence atomic to reduce duplicate emails
  // if two SLA executions happen close together.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(S.A);
    const key = `${cycleId}|${type}`;
    const values = sheet.getDataRange().getValues();

    // Do not send the same alert twice for the same cycle/event.
    if (values.slice(1).some(row => String(row[0]) === key)) {
      return 'ALREADY_LOGGED';
    }

    if (!to || String(to).includes('example.com')) {
      sheet.appendRow([
        key,
        cycleId,
        type,
        to || '',
        new Date(),
        'NOT SENT: configure a real test email'
      ]);
      return 'NOT_SENT';
    }

    try {
      MailApp.sendEmail(String(to), subject, body);
      sheet.appendRow([
        key,
        cycleId,
        type,
        to,
        new Date(),
        'SENT'
      ]);
      return 'SENT';
    } catch (error) {
      sheet.appendRow([
        key,
        cycleId,
        type,
        to,
        new Date(),
        'ERROR: ' + error.message
      ]);
      throw error;
    }
  } finally {
    lock.releaseLock();
  }
}

function event_(cycleId, type, recipient, note) {
  SpreadsheetApp.getActive()
    .getSheetByName(S.A)
    .appendRow([
      `${cycleId}|${type}`,
      cycleId,
      type,
      recipient,
      new Date(),
      note
    ]);
}
