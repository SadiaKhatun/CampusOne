# CampusOne React Frontend — Beginner Guide

## Why are there separate files?
Each role has its own JSX and CSS so you can learn and edit one dashboard without searching through a giant file.

- `src/components/admin/AdminDashboard.jsx` + `AdminDashboard.css`
- `src/components/student/StudentDashboard.jsx` + `StudentDashboard.css`
- `src/components/teacher/TeacherDashboard.jsx` + `TeacherDashboard.css`
- `src/App.jsx` — app shell and role preview selector
- `src/styles/app.css` — shared layout
- `src/styles/global.css` — basic page styles
- `vite.config.js` — development server and `/api` proxy to Flask

## Run it (Windows 11)
1. Install Node.js LTS from the official Node.js website if it is not already installed.
2. Open this `react_frontend` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run `npm install`
5. Run `npm run dev`
6. Open the local URL printed by Vite (usually `http://localhost:5173`).
7. Use “Preview role” to switch between Student, Teacher and Admin layouts.

To stop it, click the terminal and press `Ctrl+C`.

## Beginner exercises
- Change student dashboard wording in `src/components/student/StudentDashboard.jsx`.
- Change student dashboard colors or spacing in `src/components/student/StudentDashboard.css`.
- Change teacher dashboard wording in `src/components/teacher/TeacherDashboard.jsx`.
- Change teacher dashboard design in `src/components/teacher/TeacherDashboard.css`.
- Change admin dashboard fields in `src/components/admin/AdminDashboard.jsx`.
- Change admin dashboard design in `src/components/admin/AdminDashboard.css`.

Save the file; Vite refreshes the page automatically.

## Important honest status
This React version is a **separated UI learning preview** with sample dashboard data. Its forms and action buttons are not yet wired to the Flask database. The existing Flask app remains in the parent folder and is the current backend/demo app. Do not assume a form saved to the database just because it appears in this React preview. To make it a complete integrated React + Flask application, the login, dashboard data, routine CRUD, attendance and notice APIs must be connected and tested.

The original Flask interface is still available in `../templates/index.html`, `../static/style.css`, `../static/app.js`, and backend `../app.py`.
