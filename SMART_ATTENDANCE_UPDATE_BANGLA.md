# CampusOne Smart Attendance Update (বাংলা)

এই আপডেটে মূল SQLite ডেটাবেসের পুরোনো তথ্য না মুছে additive migration যোগ করা হয়েছে। প্রথমবার অ্যাপ চালু হলে নতুন কলাম ও টেবিল নিজে তৈরি হবে।

## যুক্ত ফিচার

1. Teacher Dashboard-এর Attendance Management অংশে Course, সময় এবং classroom photo দিয়ে session চালু করা যায়। ছবি JPG/PNG/WEBP হতে হবে; সর্বোচ্চ upload size অ্যাপের 8 MB request limit-এর মধ্যে। ছবিগুলো `static/uploads/classrooms/`-এ রাখা হয়।
2. Session চালু হলে সংশ্লিষ্ট department ও semester-এর শিক্ষার্থীদের Notice/Notification-এ Attendance Session দেখা যায়। Notification খুললে সেখান থেকেই Mark Attendance করা যায়।
3. Student notice খুললে সেটি read হিসেবে সংরক্ষিত হয়। Unread notice নীল ও bold, read notice স্বাভাবিক থাকে।
4. Attendance page থেকে Session ID দিয়ে Attendance দেওয়া যায়। একই session-এ একই student-এর duplicate attendance database constraint দিয়ে আটকানো হয়।
5. Session বন্ধ/মেয়াদ শেষ হওয়ার পর শিক্ষার্থী Late Attendance Request পাঠাতে পারে। Teacher Attendance page-এর Late Attendance Requests অংশ থেকে Approve বা Cancel করতে পারেন। Approve হলে Present attendance record তৈরি হয়।

## Demo login

- Teacher: `T001` / `teacher123`
- Student: `S001` / `student123`

## চালানোর নিয়ম (Windows)

1. ZIP extract করো।
2. `run_windows.bat` চালাও অথবা আগের মতো virtual environment চালু করে `pip install -r requirements.txt` এবং `python app.py` চালাও।
3. Browser-এ `http://127.0.0.1:5000` খোলো।
4. Teacher login করে Attendance page-এ যাও, Course ও duration বেছে classroom photo upload করে Start session চাপো।
5. Student login করে Notices-এ session notification খুলে Mark attendance চাপো।
6. Late request পরীক্ষা করতে session শেষ/close হওয়ার পর Student Attendance page-এ Session ID দিয়ে request পাঠাও। Teacher login করে Attendance page থেকে Approve/Cancel করো।

## Face scan / OpenCV সম্পর্কে গুরুত্বপূর্ণ সীমাবদ্ধতা

এই আপডেটে OpenCV face recognition বা মুখের biometric identity matching যোগ করা হয়নি। OpenCV দিয়ে camera frame-এ face detect করা গেলেও সেটি দিয়ে শিক্ষার্থীর পরিচয় নিশ্চিত হয় না; নিকাব/মাস্কে মুখ আংশিক ঢাকা থাকলে নির্ভরযোগ্য face identity matching সম্ভব নয়। তাই ভুল পরিচয়/ভুল attendance এড়াতে ID/session-based attendance এবং teacher-approved late request রাখা হয়েছে। কোনো biometric template বা face image database-এ সংরক্ষণ করা হয় না। Classroom photo কেবল session-এর সঙ্গে সংযুক্ত প্রমাণ/রেফারেন্স; এটি স্বয়ংক্রিয়ভাবে শিক্ষার্থীর পরিচয় যাচাই করে না।

## API সংক্ষেপ

- `POST /api/teacher/start-session-with-photo` — multipart form: `course_id`, `duration_minutes`, `classroom_photo`
- `POST /api/notices/<notice_id>/read` — student notice read state
- `POST /api/late-attendance-requests` — student request: `session_id`, optional `reason`
- `GET /api/late-attendance-requests` — student নিজের request / teacher assigned course-এর requests
- `POST /api/late-attendance-requests/<request_id>/review` — teacher JSON: `{"decision":"approve"}` অথবা `{"decision":"cancel"}`

এটি একটি development/demo update। Production-এ চালানোর আগে HTTPS, stronger authentication, upload content validation, file retention policy, database backup এবং teacher/student permission review করা উচিত।


## Attendance mode update
এই সংস্করণে Camera Attendance ও OpenCV ব্যবহার করা হয় না। Attendance দিতে Session ID এবং শিক্ষক-প্রদত্ত ৬ সংখ্যার কোড বাধ্যতামূলক। Student profile picture বাধ্যতামূলক নয়। অন্যান্য dashboard ও feature অপরিবর্তিত রাখার চেষ্টা করা হয়েছে।
