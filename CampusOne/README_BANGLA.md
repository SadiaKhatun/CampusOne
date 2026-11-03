# CampusOne — Updated Demo Project

## New features
- Student dashboard displays all classes scheduled for the current day.
- Students can open Class Routine and filter their schedule by Sunday through Saturday.
- Admin can select multiple class days for one routine entry.
- The “All days except Friday” option schedules the class on Sunday, Monday, Tuesday, Wednesday, Thursday and Saturday.
- Semester selection is limited to 1st through 8th semester.
- Existing SQLite data is preserved; schema changes are additive.

## Run on Windows
1. Extract the ZIP archive.
2. Run `run_windows.bat`.
3. Open the local address shown in the terminal.

Demo accounts:
- Admin: `ADMIN001` / `admin123`
- Student: `S001` / `student123`
- Teacher: `T001` / `teacher123`

This is a Flask + SQLite demo. Test all workflows locally before using real institutional data.


## Live deployment status
এই package-এ Flask app deploy করার starter files যোগ করা হয়েছে। React dashboard preview এখনো Flask API-এর সঙ্গে সম্পূর্ণ যুক্ত নয়। বিস্তারিত `LIVE_DEPLOYMENT_GUIDE_BANGLA.md` দেখুন।


## Attendance mode update
এই সংস্করণে Camera Attendance ও OpenCV ব্যবহার করা হয় না। Attendance দিতে Session ID এবং শিক্ষক-প্রদত্ত ৬ সংখ্যার কোড বাধ্যতামূলক। Student profile picture বাধ্যতামূলক নয়। অন্যান্য dashboard ও feature অপরিবর্তিত রাখার চেষ্টা করা হয়েছে।
