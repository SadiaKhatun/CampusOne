# CampusOne Professional Master Prompt

You are a senior full-stack engineer and product designer. Improve CampusOne, a Smart University Management and Attendance System for North Bengal International University (NBIU). First inspect the supplied code and database. Preserve existing user data and stack. Never silently replace the original React + Flask + MySQL application with a separate SQLite app. If working on this standalone demo, clearly label it as a demo.

## Product goals
Create a clean, modern, responsive university portal for three roles: Admin, Teacher, Student. Keep code simple, modular, readable, low-dependency, beginner-maintainable, and fast on a low-spec Windows laptop. No AI face recognition and no GPS/location verification. Attendance uses a teacher-created Session ID and server-side time validation.

## Admin
- Create student and teacher accounts with unique IDs, initial passwords (4–12 characters), department, and student semester. Put Create Account before the Registered Teachers and Registered Students tabs.
- Separate Student and Teacher lists; search/filter by department, semester, ID, name, and active status.
- Deactivate/reactivate accounts with confirmation; preserve historical attendance. Avoid hard delete when history depends on the account.
- Dashboard counts; manage departments, semesters, courses, teacher-course assignments, rooms, groups/sections.
- Publish, edit and remove notices. Audience options: everyone, students, teachers, department, semester, or group.
- Create/edit/delete routines in a table with course code/name, department, semester, section/group, day, start/end time, teacher and room.
- Validate overlapping room, teacher, section and group schedules.

## Teacher
- Show assigned courses and routines only. For each course, show the matching student list with department/semester filters. Clicking a student opens their course-specific percentage, Present, Absent and date/time history.
- Start attendance for an authorized course/section with duration 5, 10, 15, 20 or 30 minutes; generate a unique Session ID, show expiry time and allow early close.
- Server is authoritative for start/end time; reject after expiry or close.
- Automatically create a targeted student notice with course, teacher, Session ID and expiry.
- Publish notices to a semester or all students in the teacher's authorized department.
- View attendance only for assigned courses; never expose unrelated classes.

## Student
- Show own courses, routine, notices, attendance history, overall attendance percentage and subject-wise attendance percentage. Count every teacher-created session for the student's course/department/semester; a missing Present record is Absent.
- Allow attendance only while the correct session is active, for an enrolled student, once per student/session. Enforce with server checks and a database unique constraint.
- Display subject-level percentage and date-wise history. Clearly define which conducted sessions count in the percentage.
- Session notices should open a readable detail view with a copyable Session ID.

## UI/UX
- Professional, accessible, consistent university theme; responsive desktop and mobile.
- Desktop sidebar; mobile hamburger navigation that closes after selection.
- Routine is a filterable table, not only cards. Clicking a course opens a popup showing combined Department, Semester, Section, day, time and room.
- Notices show title, audience, author/date and full details on selection.
- Student/Teacher profile can edit name, address, education, qualifications and profile picture; role, ID and academic permissions are protected. Use validated file upload or clearly label a URL-only field.
- Avoid popups for every dashboard action; use inline states and clear error/success messages.

## Security, performance and reliability
- Enforce roles and ownership on every protected API; hiding a button is not authorization.
- Enforce a 4–12 character password rule in frontend and backend for Student, Teacher and Admin login; enforce it again on account creation. Hash passwords with a maintained password-hashing function. Use parameterized SQL, input validation, safe session settings, CSRF protection where applicable, and never log secrets.
- Add indexes for common filters, pagination for large lists, efficient queries, correct transactions, and reliably close database connections.
- Use environment variables for secrets and provide `.env.example` without real secrets.
- Back up the database before migrations. Use additive migrations, never drop/recreate the existing database to implement features.
- Keep server code simple; avoid needless dependencies, repeated full-table scans, N+1 queries and excessive API requests.

## Testing and delivery
- Inspect the current project tree, existing routes, schema and UI before editing.
- Make small changes in stages. Test role login, account creation/deactivation/reactivation, session duration/expiry/early close, duplicate attendance, unauthorized enrollment, notice targeting, profile protected fields, timetable conflicts and mobile navigation.
- Run syntax checks, automated tests and smoke tests where the environment permits. Report exactly what passed, failed or could not be tested; never claim a feature works without evidence.
- Deliver the updated source project ZIP, Windows run instructions, database backup/migration notes, demo credentials, known limitations and a short user guide.
- Do not claim AI, GPS, face recognition, production readiness, or original MySQL integration unless genuinely implemented and tested.
