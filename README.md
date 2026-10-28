# Automated Task Tracking System

An automated task tracking and reporting system built using **Google Sheets** and **Google Apps Script**. It helps teams manage recurring tasks, monitor employee completion, track deadlines, generate reports, and send email alerts for overdue tasks and unresolved issues.

## Features

- **Automatic Spreadsheet Setup:** Creates six required sheets and their headers automatically.
- **Recurring Task Management:** Generates recurring task cycles based on configured frequencies.
- **Employee Task Tracking:** Tracks task status, completion proof, completion timestamps, and employee details.
- **Manager Dashboard:** Displays open tasks, overdue tasks, unacknowledged issues, escalations, and completed tasks.
- **Automated Reports:** Generates employee reports from task cycle records.
- **Deadline Monitoring:** Checks task deadlines and updates overdue statuses.
- **Email Notifications:** Sends manager alerts and leadership escalations based on configured thresholds.
- **Manager Acknowledgement:** Records when a manager acknowledges an issue.
- **Duplicate Alert Prevention:** Logs alert events to help prevent duplicate notifications for the same task cycle and event.
- **Scheduled Automation:** Synchronizes task cycles hourly and checks service-level agreement (SLA) conditions every five minutes.

## Technology Stack

- Google Sheets
- Google Apps Script
- JavaScript
- SpreadsheetApp
- ScriptApp
- LockService
- MailApp

## Project Screenshots

Screenshots demonstrating the spreadsheet setup, task definitions, recurring cycle generation, employee reporting, manager dashboard, and automation testing are available below.

**[View All Project Screenshots](./screenshots/README.md)**

The screenshots are stored in the `screenshots/` folder.

## Spreadsheet Structure

When `setup()` is run, the system creates the following six sheets and their headers.

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

Before running the project, ensure you have:

- A Google account.
- Access to Google Sheets and Google Apps Script.
- A blank Google Spreadsheet.
- Permission to authorize the script and its requested Google services.

### 1. Create a Google Spreadsheet

Create a new, blank Google Spreadsheet. You do not need to create the individual sheets manually.

### 2. Open Google Apps Script

From your spreadsheet, navigate to:

**Extensions → Apps Script**

### 3. Add the Project Code

1. Open `Code.gs` in this GitHub repository.
2. Copy the complete source code.
3. Paste it into the Apps Script editor.
4. Save the project.

### 4. Initialize the System

1. Select the `setup` function from the function dropdown.
2. Click **Run**.
3. Authorize the requested permissions when prompted.
4. Return to your spreadsheet and refresh it.

The setup process creates the six required sheets and their headers, configures scheduled triggers, and runs an initial synchronization.

The **Allo Ops** custom menu should become available when the spreadsheet opens.

### 5. Configure the Settings

Open the `Settings` sheet and configure the values in the `Value` column.

| Setting | Description |
|---|---|
| `MANAGER_EMAIL` | Email address used for manager overdue-task alerts. |
| `LEADERSHIP_EMAIL` | Email address used for leadership escalation alerts. |
| `MANAGER_ALERT_GRACE_MINUTES` | Grace period after the deadline before a manager alert becomes eligible. Defaults to 30 minutes. |
| `LEADERSHIP_ESCALATION_HOURS` | Time after the deadline before leadership escalation becomes eligible. Defaults to 4 hours. |

Use email addresses you control when testing. Email notifications require valid recipient addresses and the necessary authorization.

### 6. Add Tasks

Open the `Task_Master` sheet and enter your task records below the header row.

The task fields are:

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

Use unique task IDs, valid due dates, a recurrence interval in days, and `TRUE` or `FALSE` for the `Active` field.

Set the employee email and required proof for each task.

For initial testing, add one task with a future due date. The system generates task cycles from task definitions; it does not automatically populate sample tasks.

## Using the System

After setup, open the spreadsheet and use the **Allo Ops** menu.

| Menu Option | Function |
|---|---|
| `Setup / Repair Triggers` | Runs `setup()` to initialize sheets and configure scheduled triggers. |
| `Sync Cycles + Employee Report` | Runs `syncNow()` to synchronize recurring cycles, update overdue statuses, and refresh reports and dashboard metrics. |
| `Check SLAs / Send Alerts` | Runs `checkSLAs()` to check overdue tasks and send eligible notifications. |
| `Acknowledge selected cycle` | Records a manager acknowledgement for the selected row in `Cycle_Log`. |

## Employee Completion Workflow

1. Open `Employee_Report`.
2. Locate the relevant task cycle.
3. Enter completion proof in the `Completion_Proof (edit)` column.
4. Change the task status to `COMPLETED`.
5. The script records completion details and prepares the next recurring cycle when applicable.

Employees can also mark tasks as `BLOCKED` when they cannot complete them. The system uses task deadlines and statuses to support overdue monitoring.

## Automation Schedule

After `setup()` is run, the script creates these time-driven triggers:

| Schedule | Action |
|---|---|
| Hourly | Synchronizes recurring task cycles and refreshes reports and dashboard metrics. |
| Every five minutes | Checks SLA conditions and sends eligible manager or leadership alerts. |

The actual timing of scheduled executions may vary slightly. The initial setup also performs an initial synchronization.

## Testing the Project

To test the system:

1. Run `setup()` and verify that all six sheets are created.
2. Add a test task to `Task_Master`.
3. Run the synchronization function.
4. Check whether the expected task cycle appears in `Cycle_Log`.
5. Review `Employee_Report` and `Manager_Dashboard`.
6. Test task completion and completion proof.
7. Verify alert behavior using controlled test email addresses.
8. Review `Alert_Log` and Apps Script execution logs.

Use appropriate test dates and settings when verifying overdue alerts and escalations.

## Important Notes

- Each user should run the script in their own Google Spreadsheet and authorize it with their own Google account.
- Users must enter their own task records and configure notification recipients.
- The six sheets and headers are created automatically. Existing sheet data is preserved by the initialization function.
- The system does not create sample tasks or automatically discover employee information.
- Email alerts can be sent to configured recipients. Test with addresses you control before using real operational addresses.
- Keep the `Settings` sheet accurate and restrict spreadsheet access to authorized users.
- The project requires authorization for spreadsheet access, time-driven triggers, and email notifications.
- This is a Google Apps Script project, not a standalone web application.

## Troubleshooting

### Required Sheets Are Missing

Run `setup()` from the Apps Script editor and review any execution errors.

### No Task Cycles Are Generated

Check that `Task_Master` contains task records below the header row, each task has a valid `Task_ID`, and the required date and frequency fields are populated.

### Email Alerts Are Not Sent

- Verify the manager and leadership email settings.
- Review `Alert_Log`.
- Check Apps Script execution logs.
- Confirm that the script has the necessary permissions.
- Verify that the alert conditions and thresholds have been met.

### The Allo Ops Menu Is Missing

Refresh the spreadsheet and reopen it. Check for errors in the Apps Script editor if the menu remains unavailable.

### Scheduled Automation Is Not Running

Open the Apps Script project's **Triggers** page. Confirm that the expected time-driven triggers exist and review the execution history for errors.

## Project Structure

```text
Automated-Task-Tracking-System/
├── Code.gs
├── README.md
└── screenshots/
    ├── README.md
    ├── 01-spreadsheet-setup.png
    ├── 02-task-master.png
    ├── 03-cycle-generation.png
    ├── 04-employee-report.png
    ├── 05-manager-dashboard.png
    └── 06-automation-test.png
```

## Future Enhancements

Potential improvements include:

- Role-based access for employees and managers.
- Enhanced analytics and performance summaries.
- More configurable notification rules.
- Additional reporting and export options.
- Integration with other workplace productivity tools.

## Author

**Zuha Khatoon**

GitHub: [ZuhaKhatoon](https://github.com/ZuhaKhatoon)

---

*Built using Google Sheets and Google Apps Script to simplify recurring task management, reporting, and deadline monitoring.*
