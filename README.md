# Automated Task Tracking System

An automated task tracking and workflow management system built using Google Sheets and Google Apps Script to organise recurring tasks, monitor completion, and support operational reporting.

## Overview

This project was developed as a task-tracking automation assignment. It uses Google Sheets as the data layer and Google Apps Script to automate recurring task workflows, employee reporting, and deadline monitoring.

## Key Features

- **Recurring Task Management:** Supports daily, 7-day, 15-day, and 30-day task cycles.
- **Task Completion Tracking:** Records task status, completion details, and timestamps.
- **Employee Reporting:** Organises task information for employee-level reporting.
- **Manager Dashboard:** Provides an overview of task progress.
- **Deadline Monitoring:** Checks task deadlines and supports alert workflows.
- **Alert and Cycle Logs:** Maintains records to support tracking and review.
- **Menu-Based Automation:** Provides custom spreadsheet actions through Google Apps Script.

## Technology Stack

- Google Sheets
- Google Apps Script
- JavaScript
- Spreadsheet-based reporting and automation

## Project Structure

```text
Automated-Task-Tracking-System/
└── Code.gs
```

## Setup

1. Make a copy of the authorised Google Sheets template.
2. Open **Extensions → Apps Script**.
3. Add the project source code from `Code.gs`.
4. Save the Apps Script project.
5. Review the required spreadsheet tabs and column names in the source code.
6. Run the setup function and grant the necessary permissions when prompted.
7. Test task creation, recurring cycles, reporting, and alert workflows using sample data.

## Purpose

The project demonstrates how spreadsheet automation can reduce repetitive manual work, improve task visibility, and support more consistent operational tracking.

## Future Improvements

- Add automated test cases.
- Improve dashboard visualisations.
- Add configurable notification rules.
- Strengthen error handling and execution logging.
- Expand documentation for setup and maintenance.

## Notes

This repository documents a task automation project. Features should be considered implemented only where supported by the source code and configured spreadsheet.
