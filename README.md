# Automated Task Tracking System

An automated task tracking and reporting system built using **Google Sheets and Google Apps Script**. It helps teams manage recurring tasks, track employee completion, monitor deadlines, and send email alerts for overdue tasks and unresolved issues.

## Features

- **Automatic Spreadsheet Setup:** Creates the six required sheets and their headers automatically.
- **Recurring Task Management:** Generates task cycles based on configured frequencies.
- **Employee Task Tracking:** Tracks task status, completion proof, completion timestamps, and employee details.
- **Manager Dashboard:** Displays open tasks, overdue tasks, unacknowledged issues, escalations, and completed tasks.
- **Automated Reports:** Generates an employee report from the task cycle records.
- **Deadline Monitoring:** Checks task deadlines and updates overdue statuses.
- **Email Notifications:** Sends manager alerts and leadership escalations based on configured thresholds.
- **Manager Acknowledgement:** Records when a manager acknowledges an issue.
- **Duplicate Alert Prevention:** Logs alert events to help prevent duplicate notifications for the same task cycle and event.
- **Scheduled Automation:** Runs recurring task synchronization hourly and checks service-level agreement (SLA) conditions every five minutes.

## Technology Stack

- Google Sheets
- Google Apps Script
- JavaScript
- Google Apps Script services: SpreadsheetApp, ScriptApp, LockService, MailApp

## Spreadsheet Structure

The system automatically creates the following six sheets when `setup()` is run.

| Sheet | Purpose |
|---|---|
| `Task_Master` | Stores task definitions, employee details, due dates, recurrence frequency, and required completion proof. |
| `Employee_Report` | Displays generated task records and allows employees to update task status and completion proof. |
| `Manager_Dashboard` | Displays task counts and outstanding issues. |
| `Cycle_Log` | Stores recurring task cycles, deadlines, statuses, completion details, acknowledgements, and escalation information. |
| `Alert_Log` | Records alert events, recipients, timestamps, and outcomes. |
| `Settings` | Stores manager and leadership email addresses and alert thresholds. |

## Getting Started

### Prerequisites

- A Google account
- Access to Google Sheets and Google Apps Script
- A blank Google Spreadsheet
- Permission to authorize the script and its requested Google services

### 1. Create a Google Spreadsheet

Create a new, blank Google Spreadsheet. You do not need to create the individual sheets manually.

### 2. Open Google Apps Script

From your spreadsheet, navigate to:

**Extensions → Apps Script**

### 3. Add the Project Code

Open `Code.gs` in this repository, copy the complete source code, and paste it into the Apps Script editor. Save the project.

### 4. Initialize the System

Select the `setup` function from the function dropdown and click **Run**.

Authorize the requested permissions when prompted.

The setup process creates the six required sheets and their headers, configures scheduled triggers, and runs an initial synchronization.

Return to your spreadsheet and refresh it. The **Allo Ops** custom menu should be available after the spreadsheet opens.

### 5. Configure the Settings

Open the `Settings` sheet and configure the values in the `Value` column.

| Setting | Description |
|---|---|
| `MANAGER_EMAIL` | Email address used for manager overdue-task alerts. |
| `LEADERSHIP_EMAIL` | Email address used for leadership escalation alerts. |
| `MANAGER_ALERT_GRACE_MINUTES` | Grace period after the deadline before a manager alert is eligible. Defaults to 30 minutes. |
| `LEADERSHIP_ESCALATION_HOURS` | Time after the deadline before leadership escalation is eligible. Defaults to 4 hours. |

Use email addresses you control when testing. Email notifications require valid recipient addresses and the necessary authorization.

### 6. Add Tasks

Open `Task_Master` and enter your own task records below the header row.

The columns are:

- `Task_ID`
- `Task_Name`
- `Assigned_To`
- `Employee_Email`
- `Task_Type`
- `Frequency_Days`
- `First_Due_Date`
- `Next_Due_Date`
- `Deadline_Time`
- `Required_Proof`
- `Active`

Use unique task IDs, valid due dates, a recurrence interval in days, and `TRUE` or `FALSE` for the `Active` field. Set the employee email and required proof for each task.

For initial testing, add one task with a due date in the future. The system generates task cycles from the task definitions; it does not automatically populate sample tasks.

## Using the System

After setup, open the spreadsheet and use the **Allo Ops** menu.

| Menu option | Function |
|---|---|
| Setup / Repair Triggers | Runs `setup()` to initialize sheets and configure scheduled triggers. |
| Sync Cycles + Employee Report | Runs `syncNow()` to synchronize recurring cycles, update overdue statuses, and refresh reports and dashboard metrics. |
| Check SLAs / Send Alerts | Runs `checkSLAs()` to check overdue tasks and send eligible notifications. |
| Acknowledge selected cycle | Records a manager acknowledgement for the selected row in `Cycle_Log`. |

### Employee Completion Workflow

1. Open `Employee_Report`.
2. Locate the relevant task cycle.
3. Enter completion proof in the `Completion_Proof (edit)` column.
4. Change the task status to `COMPLETED`.
5. The script records completion details and prepares the next recurring cycle when applicable.

Employees can also mark tasks as `BLOCKED` when they cannot complete them. The system uses the task's deadline and status to support overdue monitoring.

## Automation Schedule

After `setup()` is run, the script creates these time-driven triggers:

- **Hourly:** Synchronizes recurring task cycles and refreshes reports and dashboard metrics.
- **Every five minutes:** Checks SLA conditions and sends eligible manager or leadership alerts.

The actual timing of scheduled executions may vary slightly. The first setup also performs an initial synchronization.

## Important Notes

- Each user should run the script in their own Google Spreadsheet and authorize it with their own Google account.
- Users must enter their own task records and configure their notification recipients.
- The six sheets and headers are created automatically; existing sheet data is preserved by the initialization function.
- The system does not create sample tasks or automatically discover employee information.
- Email alerts can be sent to configured recipients. Test with addresses you control before using real operational addresses.
- Keep the `Settings` sheet accurate and restrict spreadsheet access to authorized users.
- The project requires authorization for spreadsheet access, time-driven triggers, and email notifications.
- This is a Google Apps Script project, not a standalone web application.

## Troubleshooting

**The required sheets are missing**

Run `setup()` from the Apps Script editor and review any execution errors.

**No task cycles are generated**

Check that `Task_Master` contains task records below the header row, that each task has a valid `Task_ID`, and that the required date and frequency fields are populated.

**Email alerts are not sent**

Verify the manager and leadership email settings, review `Alert_Log`, check Apps Script execution logs, and confirm that the script has the necessary permissions.

**The Allo Ops menu is missing**

Refresh the spreadsheet and reopen it. The menu is added by the `onOpen()` function.


