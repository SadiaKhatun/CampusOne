# CampusOne update — 1 November 2026

## Updated in the deployed Flask application
- Student dashboard now lists notifications; unread notices are highlighted blue and bold. Opening a notice marks it read.
- Attendance actions from the Attendance page and attendance notices open the student camera scanner.
- Teacher session creation generates a six-digit teacher verification OTP. The teacher sees it after starting the session and shares it verbally with the class.
- Students capture a live camera frame and submit the session ID plus teacher OTP. The server validates the OTP and prevents duplicate attendance.
- If camera verification is unavailable or unsuccessful, the student can request manual teacher review. Teachers can approve or cancel from Attendance > Late attendance requests.
- Admin teacher directory includes Designation and Active/Deactive status.
- Teacher registration has the requested eight designations.

## Important biometric limitation
This package does **not** contain a face-recognition model or enrolled face templates. The camera opens and captures a frame, but the application does not claim to identify a face automatically. Attendance is confirmed using the teacher-issued OTP; the manual review path is available for camera problems. True automatic face matching needs a separate consent-based face-enrolment workflow, secure template storage, liveness checks, and a tested biometric model. Do not describe the current build as automatic face recognition.

## Database safety
The app adds `teacher_otp` and `designation` using additive SQLite migrations. Existing student, teacher, course, notice, and attendance tables are preserved. Existing teachers receive `Lecturer` as their default designation; admins can select a designation for newly registered teachers.

## Which frontend is updated?
The Render-served Flask interface is in `templates/index.html`, `static/app.js`, and `static/style.css`, with API/database logic in `app.py`. The separate `react_frontend` folder remains a UI learning preview and is not the database-connected Render interface.


## Attendance mode update
এই সংস্করণে Camera Attendance ও OpenCV ব্যবহার করা হয় না। Attendance দিতে Session ID এবং শিক্ষক-প্রদত্ত ৬ সংখ্যার কোড বাধ্যতামূলক। Student profile picture বাধ্যতামূলক নয়। অন্যান্য dashboard ও feature অপরিবর্তিত রাখার চেষ্টা করা হয়েছে।
