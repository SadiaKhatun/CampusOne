# CampusOne — Full Source Code & Beginner Manual

All interface text in the app is English. This folder contains the actual source code; it is not just a design mockup.

## 1. Where is the code?

- `app.py` — BACKEND: Python + Flask routes, login, database tables, and API actions.
- `templates/index.html` — FRONTEND STRUCTURE: login screen and the main app shell/navigation.
- `static/style.css` — FRONTEND DESIGN: colors, layout, cards, forms, responsive/mobile layout.
- `static/app.js` — FRONTEND BEHAVIOUR: role login, dashboard rendering, buttons, filters, API requests.
- `requirements.txt` — Python packages needed to run the project.
- `run_windows.bat` — Windows startup script.
- `campusone.db` — created automatically when the app first starts; contains demo data.
- `README_BANGLA.md` — quick-start notes in Bangla (the application UI itself is English).

## 2. How to run it on Windows 11

1. Extract the ZIP to a normal folder, for example `Desktop\CampusOne`.
2. Open the extracted folder and confirm you can see `app.py`, `templates`, `static`, and `run_windows.bat`.
3. Double-click `run_windows.bat`.
4. Wait until the terminal says the Flask server is running.
5. Open the local address printed in the terminal (usually `http://127.0.0.1:5000`).
6. Demo logins:
   - Admin ID: `ADMIN001` / Password: `admin123`
   - Student ID: `S001` / Password: `student123`
   - Teacher ID: `T001` / Password: `teacher123`
7. To stop the server, click the terminal window and press `Ctrl+C`.

## 3. What each role does

- Admin dashboard: overview and administrative controls such as users, notices and routines that are exposed by this demo.
- Student dashboard: student view of today's classes, routine, attendance, courses, notices and profile.
- Teacher dashboard: teacher view of assigned courses and attendance-related tools available in this demo.
- Routine: routine records are handled through the routine interface/API; multi-day selection and the day-wise view are part of the intended updated flow.
- Notices: notice audience logic is handled by backend and frontend code; verify each audience type using demo accounts before a live presentation.

## 4. Make safe changes without writing code

For ordinary data changes, use the app's Admin page if it has the relevant control:
- Change a class day/time: Admin → Class Routine → edit the routine, then Save.
- Change a notice: Admin → Notices → create/edit the notice and select its audience.
- Check student information: log in as a student and view the student dashboard.
- Check teacher tools: log in as a teacher.

Important: A control must actually exist in the current UI for this no-code method to work. A new page, button, feature, or database field requires source-code changes.

## 5. Beginner guide to edit source code

Always make a backup copy of the whole folder first.

### Change visible text
1. Open `templates/index.html` in VS Code or Notepad.
2. Press `Ctrl+F` and search for the exact English text.
3. Change only the text between the HTML tags, not the tag names.
4. Save and refresh the browser.

Some text is created by JavaScript in `static/app.js`; if you cannot find it in `index.html`, search in `app.js`.

### Change colors, spacing or fonts
1. Open `static/style.css`.
2. Search for the relevant class name or CSS variable near the top (for example `--blue`, `--ink`, `--line`).
3. Change one value at a time.
4. Save and refresh the browser.

### Change dashboard cards or page behaviour
1. Open `static/app.js`.
2. Press `Ctrl+F` and search for the page name or visible heading.
3. Read the surrounding function before changing anything.
4. Make a backup and change only one small thing at a time.
5. Refresh the browser and test Student, Teacher and Admin logins.

### Change database or login logic
1. Open `app.py`.
2. Database tables are created in `init_db()`.
3. Web/API endpoints are the functions decorated with `@app.route(...)`.
4. Do not edit password checks, role permissions or database table definitions unless you understand the change.
5. Test using demo accounts only. Never test on real student records.

## 6. What frontend and backend mean

- Frontend = what the user sees in the browser: `index.html`, `style.css`, `app.js`.
- Backend = Python code running on the computer/server: `app.py`.
- Database = where records are saved: SQLite file `campusone.db`.
- API = a route such as `/api/login` that lets the frontend ask the backend for data.

## 7. Manual practice plan

Practice in this order:
1. Run the project and log in with each demo account.
2. Find the login heading in `templates/index.html`; change its wording, save, refresh.
3. Find `--blue` in `static/style.css`; change the color slightly, save, refresh.
4. Search `static/app.js` for `dashboard` and identify where dashboard content is created.
5. Search `app.py` for `@app.route` and identify the login/API routes.
6. Only after these small exercises, try changing routine or notice logic.

## 8. Important project status

This is a learning/demo project built with Flask + SQLite. Syntax checks do not prove every workflow is fully correct. Before a real university deployment, test login, role permissions, routine create/edit, multiple days, semester filters, attendance saving, notice audience filtering, database backups and security. Change the default demo passwords and configure a strong secret key before any public hosting.

## 9. Separate React dashboard files (easy editing option)

The `react_frontend` folder is an additional React/Vite UI learning preview with role-specific files:
- Admin: `react_frontend/src/components/admin/AdminDashboard.jsx` and `AdminDashboard.css`
- Student: `react_frontend/src/components/student/StudentDashboard.jsx` and `StudentDashboard.css`
- Teacher: `react_frontend/src/components/teacher/TeacherDashboard.jsx` and `TeacherDashboard.css`

To open this version, install Node.js LTS, then run `run_react_frontend_windows.bat`, or open `react_frontend` in VS Code and run `npm install` followed by `npm run dev`.

Important: the React version currently demonstrates separated UI and sample data. It is not yet connected end-to-end to the Flask/SQLite backend. Use the original Flask app for the existing demo workflow; do not treat the React preview's buttons as saving real data.
