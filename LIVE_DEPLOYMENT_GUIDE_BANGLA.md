# CampusOne Live Starter — Beginner Guide (Bangla)

## এই প্যাকেজে কী পরিবর্তন করা হয়েছে
- Render/Gunicorn-এর জন্য `Procfile` যোগ করা হয়েছে।
- Flask app production server দিয়ে import হলেও database tables initialize হবে।
- `CAMPUSONE_DB_PATH` environment variable দিয়ে SQLite database-এর অবস্থান সেট করা যাবে।
- Render-এর উদাহরণ configuration (`render.yaml`) যোগ করা হয়েছে।
- Python requirements-এ Gunicorn যোগ করা হয়েছে (Windows-এ এটি ইনস্টল করা লাগবে না)।

## গুরুত্বপূর্ণ অবস্থা
- বর্তমান কার্যকরী app হলো Flask frontend: `templates/index.html`, `static/style.css`, `static/app.js`, `app.py`।
- `react_frontend/` এখনো আলাদা UI preview; এটি Flask API-তে সম্পূর্ণ connected নয়।
- তাই এই ধাপ Flask app deploy করার প্রস্তুতি; React preview-কে production frontend বানানো নয়।
- SQLite disk configuration Render-এ persistent disk সুবিধা/plan-এর উপর নির্ভরশীল। Disk mount ছাড়া live data স্থায়ী হবে না।
- এটি demo/learning project; বাস্তব বিশ্ববিদ্যালয়ের সংবেদনশীল তথ্য ব্যবহারের আগে security review প্রয়োজন।

## Render-এ deploy করার সাধারণ ধাপ
1. পুরো folder GitHub repository-তে upload করুন।
2. Render-এ New > Blueprint অথবা Web Service নির্বাচন করে repository connect করুন।
3. `render.yaml` ব্যবহার করলে সেটিংসগুলো review করুন। Persistent disk-এর জন্য Render-এর উপযুক্ত plan দরকার হতে পারে।
4. `CAMPUSONE_SECRET`-এ শক্তিশালী random secret রাখুন; `CAMPUSONE_DB_PATH` `/var/data/campusone.db` হওয়া উচিত যদি disk mount path `/var/data` হয়।
5. Deploy শেষে `/health` খুলে `status: ok` দেখুন।
6. Demo login password বদলানো ও role permissions যাচাই না করে প্রকৃত তথ্য দেবেন না।

## Local Windows-এ চালানো
`run_windows.bat` double-click করুন। Browser-এ `http://127.0.0.1:5000` খুলবে।

## Demo accounts (শুধু local testing-এর জন্য)
- Admin: `ADMIN001` / `admin123`
- Student: `S001` / `student123`
- Teacher: `T001` / `teacher123`

এই default password-গুলো public internet-এ ব্যবহার করবেন না। Deploy করার আগে বদলানোর ব্যবস্থা করুন।
