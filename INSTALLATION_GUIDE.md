# Installation and Operations Guide

## Install in the existing Apps Script project

1. Back up the current script and HTML files.
2. Replace `Code.gs` with the repository version.
3. Replace the contents of the HTML file named exactly `Index` with `Index.html`.
4. Save both files.
5. Run `setupMonitoringSheet()` once. It reuses the existing monitoring workbook when available and preserves existing student records.
6. Run `createLecturerAccessKey()` once. Copy the generated key from the execution log and keep it private.
7. Run `testBackend()` to confirm monitoring workbook access.
8. Deploy → Manage deployments → Edit → New version → Deploy. Set execution identity and access according to institutional policy.

## Included functions

- Three module quizzes, each with five theory and five calculation/application questions.
- Automatic marking, explanations and unlimited retained quiz attempts.
- Student progress lookup using the registration number and email provided for activity records.
- Protected lecturer dashboard showing students, quiz attempts, average quiz percentage and practical submissions.
- Lecturer evaluation of practical work as Pending, Reviewed or Resubmit, with feedback and score out of 100.
- Downloadable class performance CSV.

## Lecturer key

The dashboard key is a bearer key, not institutional single sign-on. Keep it confidential. If exposed, remove the `SPSS_TRAINING_LECTURER_KEY` Script Property and run `createLecturerAccessKey()` again.

## Privacy and scope

Keep the monitoring workbook private. Student identifiers are self-entered and are not independently verified. Teaching datasets are simulated. The website teaches SPSS 27 but does not run IBM SPSS in the browser. Google Apps Script quotas apply.
