# SPSS Training by Dr. Fred Monari

**Learning platform:** IBM SPSS Statistics 27  
**Implementation:** Google Apps Script, HTML, CSS, JavaScript and Google Sheets

A browser-based learning and practice platform that guides students through SPSS 27 lessons, quizzes, downloadable teaching datasets and practical assignments.

## Main features

- Three learning modules with structured lessons and SPSS 27 step-by-step procedures.
- Health and agricultural examples, including downloadable simulated teaching datasets.
- SPSS syntax examples that students can download and practise.
- Three module quizzes, each containing five theory and five calculation/application questions, with automatic marking and explanations.
- Unlimited quiz attempts, with each attempt retained in the monitoring workbook.
- Student progress lookup using the same registration number and email supplied for activity records.
- Practical assignment submission for lecturer evaluation.
- Lecturer dashboard protected by a generated private access key.
- Lecturer review of practical work using Pending, Reviewed or Resubmit, with feedback and a score out of 100.
- CSV export of class performance.

## Repository files

- `Code.gs` — Apps Script backend for the website, monitoring workbook, quiz records, student progress, practical submissions and lecturer functions.
- `Index.html` — complete student learning interface, learning materials, quizzes, datasets and lecturer dashboard.
- `INSTALLATION_GUIDE.md` — deployment and operational guide.
- `.gitignore` — excludes common local/private files from version control.

## Deploying in Google Apps Script

This GitHub repository stores source code; it does not run the application itself.

1. Open the existing Google Apps Script project used by the SPSS Training website.
2. Keep a backup of the current `Code.gs` and `Index` HTML file before replacing anything.
3. Replace the server-side script with `Code.gs`.
4. Replace the contents of the HTML file named exactly `Index` with `Index.html`.
5. Save the project.
6. Run `setupMonitoringSheet()` once. It reuses the monitoring workbook ID already stored in Script Properties when it is accessible and ensures the required tabs exist without deleting existing rows.
7. Run `createLecturerAccessKey()` once. Copy the generated key from the execution log and keep it private.
8. Run `testBackend()` and verify that the monitoring workbook can be opened.
9. Deploy through **Deploy → Manage deployments → Edit → New version → Deploy**. Confirm the execution identity and access permissions are appropriate for your institution.
10. Test student progress recording, quiz submission, practical submission, lecturer access, practical review and CSV export before sharing the web app.

## Student privacy and security

The monitoring spreadsheet contains student names, registration numbers, email addresses, quiz attempts, practical work and lecturer feedback. Keep it private and restrict access to authorised staff. Never upload that spreadsheet, student exports, deployment URLs or lecturer access keys to this public repository.

Student details are self-entered. The progress lookup matches registration number and email but is not verified identity authentication or institutional single sign-on.

The lecturer dashboard key is a bearer credential. Anyone who obtains the key can access the lecturer dashboard. Store it privately, do not paste it into source code, and regenerate it if exposed by removing the `SPSS_TRAINING_LECTURER_KEY` Script Property and running `createLecturerAccessKey()` again.

## Teaching data and software scope

The health and agriculture datasets supplied with the website are simulated teaching data. The platform teaches SPSS procedures and provides syntax examples; it does not execute IBM SPSS Statistics inside the browser. Students run the procedures in their own SPSS 27 installation.

Google Apps Script quotas and service availability apply.
