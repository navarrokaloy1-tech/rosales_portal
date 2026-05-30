# RNHS Online Class Record — POC (Frontend)

Angular 21 standalone + SCSS + Angular Material, themed in the colors of the
Rosales National High School seal (red `#B71C1C`, royal blue `#1E3A8A`,
golden yellow `#F5B400`).

This POC runs frontend-only with mock data — no backend, no SharePoint yet.

## Run

```bash
cd frontend
npm install        # only if you skipped `ng new`'s install step
npm start          # ng serve, opens http://localhost:4200
```

## Demo accounts

Use the quick-login buttons on the sign-in page, or type one of these emails
(any password works in the POC):

| Role    | Email                              | Notes                       |
|---------|------------------------------------|-----------------------------|
| Admin   | `admin@rnhs.edu.ph`                | Ramon Bautista              |
| Teacher | `m.santos@rnhs.edu.ph`             | Maria Santos · Mathematics  |
| Teacher | `j.reyes@rnhs.edu.ph`              | Jose Reyes · Science        |
| Student | `juan.cruz@student.rnhs.edu.ph`    | Grade 10 · Rizal            |

## What's wired up

- **Login** — branded with the school seal, role-aware redirect.
- **Student dashboard** — quarter average, KPI tiles, expandable subject panels
  showing every WW / PT / QA score and its computed quarter grade (DepEd
  weighting 30 / 50 / 20).
- **Teacher dashboard** — subject cards linking to the class record grid.
- **Class record** — sticky-column spreadsheet grid for entering scores;
  saves are reflected in real-time via Angular signals, generate an audit
  entry, and notify the student. Enforces "only the assigned teacher may
  edit". CSV export included.
- **Admin overview** — KPIs (students, teachers, classes, subjects, at-risk),
  at-risk list, teacher activity, audit log.
- **Notifications** — top-bar bell with unread badge.

## Permissions enforced

- Students cannot view another student's grades (service throws on attempts).
- Only the assigned teacher can edit a subject's grades.
- Admin views the teacher / student pages as read-only.

## Logo

Place the RNHS seal at `public/assets/images/rnhs-logo.png`. The login card
and sidebar brand reference this asset; if the file is missing the UI hides
the image gracefully (onerror handler).

## Next steps (post-POC)

- Replace `DataService` mock with calls to a .NET 8 Web API.
- Wire Microsoft Entra ID via MSAL.js (replace mock `AuthService`).
- Back the data with SharePoint Lists via Microsoft Graph.
- Add SignalR for real-time pushes (currently in-process via signals).
