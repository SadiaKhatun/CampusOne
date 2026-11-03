# CampusOne Upgrade Notes

- Student dashboard includes today's class schedule.
- Routine page supports day-wise filtering.
- Admin routine creation supports multi-day scheduling.
- “All days except Friday” excludes Friday explicitly.
- Semester choices are restricted to 1st–8th.
- SQLite changes are additive and preserve existing records.
- Runtime testing with real data is still required before production deployment.

## Smart Attendance Update — 2026-10-31
- Added classroom photo upload when teachers start an attendance session.
- Added student notice read tracking and unread blue/bold styling.
- Added attendance action directly inside attendance-session notification.
- Added late attendance request workflow with teacher approve/cancel controls.
- Added additive SQLite migrations for session photo, notice session linkage, notice reads and late requests.
- Face biometric recognition intentionally not implemented; see SMART_ATTENDANCE_UPDATE_BANGLA.md for privacy and covered-face limitations.
