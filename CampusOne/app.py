from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3, os, secrets, uuid
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("CAMPUSONE_DB_PATH", os.path.join(BASE_DIR, "campusone.db"))
os.makedirs(os.path.dirname(os.path.abspath(DB_PATH)), exist_ok=True)
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 8 * 1024 * 1024  # classroom image upload limit
app.secret_key = os.environ.get("CAMPUSONE_SECRET", secrets.token_hex(24))

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def record_absences_for_session(con, session_row, only_student_id=None):
    """Record Absent for enrolled students who did not mark this session."""
    course = con.execute("SELECT department, semester FROM courses WHERE id=?", (session_row["course_id"],)).fetchone()
    if not course:
        return
    students = con.execute(
        "SELECT student_id FROM students WHERE department=? AND semester=? AND active=1" + (" AND student_id=?" if only_student_id else ""),
        (course["department"], course["semester"], only_student_id) if only_student_id else (course["department"], course["semester"])
    ).fetchall()
    stamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    con.executemany(
        "INSERT OR IGNORE INTO attendance(session_id,student_id,marked_at,status) VALUES(?,?,?,'Absent')",
        [(session_row["session_id"], student["student_id"], stamp) for student in students]
    )

def init_db():
    con = db()
    con.executescript("""
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT, admin_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT, student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, department TEXT NOT NULL, semester TEXT NOT NULL, password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT, teacher_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL, department TEXT NOT NULL, password TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT, course_code TEXT UNIQUE NOT NULL,
      course_name TEXT NOT NULL, department TEXT NOT NULL, semester TEXT NOT NULL,
      teacher_id INTEGER NOT NULL, FOREIGN KEY(teacher_id) REFERENCES teachers(id)
    );
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT UNIQUE NOT NULL,
      course_id INTEGER NOT NULL, teacher_id INTEGER NOT NULL,
      start_time TEXT NOT NULL, end_time TEXT NOT NULL, status TEXT NOT NULL,
      FOREIGN KEY(course_id) REFERENCES courses(id), FOREIGN KEY(teacher_id) REFERENCES teachers(id)
    );
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL,
      student_id TEXT NOT NULL, marked_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Present',
      UNIQUE(session_id, student_id)
    );
    CREATE TABLE IF NOT EXISTS notices (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, description TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS routines (
      id INTEGER PRIMARY KEY AUTOINCREMENT, course_code TEXT NOT NULL, course_name TEXT NOT NULL,
      day TEXT NOT NULL, start_time TEXT NOT NULL, end_time TEXT NOT NULL, room TEXT NOT NULL,
      department TEXT NOT NULL, semester TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notice_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT, notice_id INTEGER NOT NULL, student_id TEXT NOT NULL,
      read_at TEXT NOT NULL, UNIQUE(notice_id, student_id)
    );
    CREATE TABLE IF NOT EXISTS late_attendance_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT NOT NULL, student_id TEXT NOT NULL,
      reason TEXT NOT NULL, requested_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      reviewed_at TEXT NOT NULL DEFAULT '', UNIQUE(session_id, student_id)
    );
    """)
    if con.execute("SELECT COUNT(*) FROM admins").fetchone()[0] == 0:
        con.execute("INSERT INTO admins(admin_id,name,password) VALUES(?,?,?)", ("ADMIN001", "Campus Administrator", "admin123"))
    if con.execute("SELECT COUNT(*) FROM students").fetchone()[0] == 0:
        con.executemany("INSERT INTO students(student_id,name,department,semester,password) VALUES(?,?,?,?,?)", [
            ("S001","Sadia Akter","CSE","8th","student123"),
            ("S002","Nusrat Jahan","CSE","8th","student123"),
            ("S003","Tanjim Hasan","CSE","8th","student123")])
    if con.execute("SELECT COUNT(*) FROM teachers").fetchone()[0] == 0:
        con.execute("INSERT INTO teachers(teacher_id,name,department,password) VALUES(?,?,?,?)",
                    ("T001","Rahim Ahmed","CSE","teacher123"))
    if con.execute("SELECT COUNT(*) FROM courses").fetchone()[0] == 0:
        tid = con.execute("SELECT id FROM teachers WHERE teacher_id='T001'").fetchone()["id"]
        con.execute("INSERT INTO courses(course_code,course_name,department,semester,teacher_id) VALUES(?,?,?,?,?)",
                    ("CSE-301","Database Management System","CSE","8th",tid))
        con.execute("INSERT INTO courses(course_code,course_name,department,semester,teacher_id) VALUES(?,?,?,?,?)",
                    ("CSE-303","Computer Networks","CSE","8th",tid))
    if con.execute("SELECT COUNT(*) FROM notices").fetchone()[0] == 0:
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        con.executemany("INSERT INTO notices(title,description,created_at) VALUES(?,?,?)", [
            ("Welcome to CampusOne","The CampusOne student and teacher portal is ready for demonstration.",now),
            ("Attendance Reminder","Please mark attendance only during an active class session.",now)])
    if con.execute("SELECT COUNT(*) FROM routines").fetchone()[0] == 0:
        con.executemany("INSERT INTO routines(course_code,course_name,day,start_time,end_time,room,department,semester) VALUES(?,?,?,?,?,?,?,?)", [
            ("CSE-301","Database Management System","Sunday","10:00","11:00","Room 402","CSE","8th"),
            ("CSE-303","Computer Networks","Monday","11:00","12:00","Room 305","CSE","8th"),
            ("CSE-301","Database Management System","Wednesday","12:00","13:00","Lab 2","CSE","8th")])
    # Safe additive migrations: preserve existing demo data and tables.
    for table, columns in {
        "admins": {"active": "INTEGER NOT NULL DEFAULT 1", "password_changed": "INTEGER NOT NULL DEFAULT 0", "address": "TEXT NOT NULL DEFAULT ''", "education": "TEXT NOT NULL DEFAULT ''", "qualifications": "TEXT NOT NULL DEFAULT ''", "profile_picture": "TEXT NOT NULL DEFAULT ''"},
        "students": {"section": "TEXT NOT NULL DEFAULT 'A'", "active": "INTEGER NOT NULL DEFAULT 1", "address": "TEXT NOT NULL DEFAULT ''", "education": "TEXT NOT NULL DEFAULT ''", "qualifications": "TEXT NOT NULL DEFAULT ''", "profile_picture": "TEXT NOT NULL DEFAULT ''"},
        "teachers": {"designation": "TEXT NOT NULL DEFAULT 'Lecturer'", "active": "INTEGER NOT NULL DEFAULT 1", "address": "TEXT NOT NULL DEFAULT ''", "education": "TEXT NOT NULL DEFAULT ''", "qualifications": "TEXT NOT NULL DEFAULT ''", "profile_picture": "TEXT NOT NULL DEFAULT ''"},
        "notices": {"session_id": "TEXT NOT NULL DEFAULT ''", "audience": "TEXT NOT NULL DEFAULT 'all'", "department": "TEXT NOT NULL DEFAULT ''", "semester": "TEXT NOT NULL DEFAULT ''", "author_id": "TEXT NOT NULL DEFAULT 'ADMIN001'", "notice_type": "TEXT NOT NULL DEFAULT 'normal'", "departments": "TEXT NOT NULL DEFAULT ''", "course_code": "TEXT NOT NULL DEFAULT ''"},
        "routines": {"teacher_name": "TEXT NOT NULL DEFAULT ''", "section": "TEXT NOT NULL DEFAULT 'All'"},
        "attendance_sessions": {"duration_minutes": "INTEGER NOT NULL DEFAULT 15", "classroom_photo": "TEXT NOT NULL DEFAULT ''", "teacher_otp": "TEXT NOT NULL DEFAULT ''"}
    }.items():
        existing = {row[1] for row in con.execute(f"PRAGMA table_info({table})").fetchall()}
        for column, definition in columns.items():
            if column not in existing:
                con.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")
    # Upgrade existing plaintext demo passwords safely at first startup.
    for table in ("admins", "students", "teachers"):
        for row in con.execute(f"SELECT id,password FROM {table}").fetchall():
            password = row["password"]
            if password and not password.startswith("pbkdf2:") and not password.startswith("scrypt:"):
                con.execute(f"UPDATE {table} SET password=? WHERE id=?", (generate_password_hash(password), row["id"]))
    con.execute("CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id, marked_at)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_sessions_course ON attendance_sessions(course_id, start_time)")
    con.execute("CREATE INDEX IF NOT EXISTS idx_routine_filter ON routines(department, semester, day, start_time)")
    con.commit()
    con.close()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    role = data.get("role", "student")
    uid = (data.get("user_id") or "").strip()
    password = data.get("password") or ""
    if role not in ("admin", "student", "teacher"):
        return jsonify({"error":"Choose a valid account type."}), 400
    if not isinstance(password, str) or not 4 <= len(password) <= 12:
        return jsonify({"error":"Password must be 4 to 12 characters long."}), 400
    table, col = {"admin": ("admins", "admin_id"), "teacher": ("teachers", "teacher_id"), "student": ("students", "student_id")}[role]
    con = db()
    user = con.execute(f"SELECT * FROM {table} WHERE {col}=?", (uid,)).fetchone()
    con.close()
    if user and not user["active"]:
        return jsonify({"error":"This account is inactive. Contact the administrator."}), 403
    valid_password = False
    if user:
        stored = user["password"] or ""
        try:
            valid_password = check_password_hash(stored, password) if stored.startswith(("pbkdf2:", "scrypt:")) else secrets.compare_digest(stored, password)
        except (ValueError, TypeError):
            valid_password = False
    if not user or not valid_password:
        return jsonify({"error":"ID or password is incorrect."}), 401
    session.clear()
    session["role"] = role
    session["uid"] = uid
    session["name"] = user["name"]
    return jsonify({"role":role,"user_id":uid,"name":user["name"]})

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"ok":True})

@app.route("/api/me")
def me():
    if not session.get("uid"):
        return jsonify({"error":"Please log in."}), 401
    return jsonify({"role":session["role"],"user_id":session["uid"],"name":session["name"]})

@app.route("/api/courses")
def courses():
    if not session.get("uid"): return jsonify({"error":"Login required"}), 401
    if session.get("role") == "admin": return jsonify({"error":"This section is not part of the admin panel."}), 403
    con = db()
    if session["role"] == "teacher":
        rows = con.execute("""SELECT c.*, t.teacher_id FROM courses c JOIN teachers t ON t.id=c.teacher_id
                              WHERE t.teacher_id=? ORDER BY c.course_code""",(session["uid"],)).fetchall()
    else:
        u = con.execute("SELECT department,semester FROM students WHERE student_id=?",(session["uid"],)).fetchone()
        rows = con.execute("""SELECT c.*, t.teacher_id FROM courses c JOIN teachers t ON t.id=c.teacher_id
                              WHERE c.department=? AND c.semester=? ORDER BY c.course_code""",
                           (u["department"],u["semester"])).fetchall()
    con.close()
    return jsonify([dict(x) for x in rows])

@app.route("/api/sessions")
def sessions():
    if not session.get("uid"): return jsonify({"error":"Login required"}), 401
    if session.get("role") == "admin": return jsonify({"error":"This section is not part of the admin panel."}), 403
    con = db()
    code_column = ",s.teacher_otp" if session.get("role") == "teacher" else ""
    base = f"""SELECT s.session_id,s.course_id,s.teacher_id,s.start_time,s.end_time,s.status,s.duration_minutes{code_column},
                          c.course_code,c.course_name,t.name AS teacher_name
                          FROM attendance_sessions s JOIN courses c ON c.id=s.course_id
                          JOIN teachers t ON t.id=s.teacher_id """
    if session["role"] == "teacher":
        rows = con.execute(base + " WHERE t.teacher_id=? ORDER BY s.id DESC", (session["uid"],)).fetchall()
    else:
        student = con.execute("SELECT department,semester FROM students WHERE student_id=? AND active=1", (session["uid"],)).fetchone()
        if not student: con.close(); return jsonify({"error":"Student account not found or inactive."}), 403
        rows = con.execute(base + " WHERE c.department=? AND c.semester=? ORDER BY s.id DESC", (student["department"],student["semester"])).fetchall()
    now = datetime.now()
    result=[]
    for item in rows:
        record=dict(item)
        if record["status"] == "active" and now > datetime.strptime(record["end_time"], "%Y-%m-%d %H:%M:%S"):
            record["status"] = "expired"
            con.execute("UPDATE attendance_sessions SET status='expired' WHERE session_id=? AND status='active'", (record["session_id"],))
            record_absences_for_session(con, record)
        elif record["status"] in ("expired", "closed") and now >= datetime.strptime(record["end_time"], "%Y-%m-%d %H:%M:%S"):
            record_absences_for_session(con, record)
        result.append(record)
    con.commit(); con.close()
    return jsonify(result)

@app.route("/api/start-session", methods=["POST"])
def start_session():
    if session.get("role") != "teacher": return jsonify({"error":"Teacher login required."}), 403
    data = request.get_json(silent=True) or {}
    try: course_id = int(data.get("course_id"))
    except (TypeError, ValueError): return jsonify({"error":"Select a course."}), 400
    con = db()
    course = con.execute("SELECT * FROM courses WHERE id=?",(course_id,)).fetchone()
    teacher = con.execute("SELECT id FROM teachers WHERE teacher_id=?",(session["uid"],)).fetchone()
    if not course or not teacher or course["teacher_id"] != teacher["id"]:
        con.close(); return jsonify({"error":"This course is not assigned to your account."}), 403
    now = datetime.now()
    try:
        duration = int(data.get("duration_minutes", 15))
    except (TypeError, ValueError):
        con.close(); return jsonify({"error":"Choose a valid session duration."}), 400
    if duration not in (5, 10, 15, 20, 30):
        con.close(); return jsonify({"error":"Duration must be 5, 10, 15, 20 or 30 minutes."}), 400
    sid = "SES-" + secrets.token_hex(4).upper()
    teacher_otp = f"{secrets.randbelow(1000000):06d}"
    end_time = now + timedelta(minutes=duration)
    con.execute("INSERT INTO attendance_sessions(session_id,course_id,teacher_id,start_time,end_time,status,duration_minutes,teacher_otp) VALUES(?,?,?,?,?,?,?,?)",
                (sid,course_id,teacher["id"],now.strftime("%Y-%m-%d %H:%M:%S"),end_time.strftime("%Y-%m-%d %H:%M:%S"),"active",duration,teacher_otp))
    con.execute("INSERT INTO notices(title,description,created_at,audience,department,semester,author_id,notice_type,session_id) VALUES(?,?,?,?,?,?,?,?,?)",
                ("Attendance Session: " + course["course_code"], f"{course['course_name']} · Teacher {session['name']} · Session ID: {sid} · Expires: {end_time.strftime('%Y-%m-%d %H:%M:%S')}", now.strftime("%Y-%m-%d %H:%M"), "students", course["department"], course["semester"], session["uid"], "session", sid))
    con.commit(); con.close()
    return jsonify({"message":f"Attendance session started for {duration} minutes.","session_id":sid,"teacher_otp":teacher_otp,"end_time":end_time.strftime("%Y-%m-%d %H:%M:%S"),"duration_minutes":duration})

@app.route("/api/mark-attendance", methods=["POST"])
def mark_attendance():
    if session.get("role") != "student": return jsonify({"error":"Student login required."}), 403
    data = request.get_json(silent=True) or {}
    sid = (data.get("session_id") or "").strip()
    otp = (data.get("otp") or "").strip()
    con = db()
    # Students may submit only the 6-digit code. The server resolves the
    # matching active session automatically; Session ID remains stored/displayed.
    if sid:
        row = con.execute("SELECT * FROM attendance_sessions WHERE session_id=?",(sid,)).fetchone()
    elif len(otp) == 6 and otp.isdigit():
        now_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        candidates = con.execute("SELECT * FROM attendance_sessions WHERE status='active' AND end_time>=? AND teacher_otp=? ORDER BY start_time DESC",(now_text, otp)).fetchall()
        row = candidates[0] if len(candidates) == 1 else None
        if len(candidates) > 1:
            con.close(); return jsonify({"error":"This code matches more than one active session. Please use the Mark present button beside your course."}), 409
    else:
        row = None
    if not row:
        con.close(); return jsonify({"error":"No active attendance session matches this code. Check the 6-digit code with your teacher."}), 404
    sid = row["session_id"]
    student = con.execute("SELECT department,semester,active FROM students WHERE student_id=?", (session["uid"],)).fetchone()
    course = con.execute("SELECT department,semester FROM courses WHERE id=?", (row["course_id"],)).fetchone()
    if not student or not student["active"] or not course or student["department"] != course["department"] or student["semester"] != course["semester"]:
        con.close(); return jsonify({"error":"You are not enrolled in this course."}), 403
    now = datetime.now()
    end = datetime.strptime(row["end_time"], "%Y-%m-%d %H:%M:%S")
    if row["status"] != "active" or now > end:
        con.close(); return jsonify({"error":"This attendance session has ended."}), 400
    if not row["teacher_otp"] or not secrets.compare_digest(str(row["teacher_otp"]), otp):
        con.close(); return jsonify({"error":"Teacher verification OTP is incorrect. Ask your teacher for the current class OTP."}), 403
    # A valid code submits an attendance request; the teacher must approve it
    # before the student's attendance becomes Present.
    stamp = now.strftime("%Y-%m-%d %H:%M:%S")
    existing = con.execute("SELECT status FROM late_attendance_requests WHERE session_id=? AND student_id=?", (sid, session["uid"])).fetchone()
    if existing:
        con.close()
        if existing["status"] == "pending":
            return jsonify({"message":"Your attendance request is already waiting for teacher approval."}), 409
        return jsonify({"error":"You have already submitted an attendance request for this session."}), 409
    if con.execute("SELECT 1 FROM attendance WHERE session_id=? AND student_id=? AND status='Present'", (sid, session["uid"])).fetchone():
        con.close(); return jsonify({"error":"Attendance is already approved for this session."}), 409
    try:
        con.execute("INSERT INTO late_attendance_requests(session_id,student_id,reason,requested_at,status) VALUES(?,?,?,?, 'pending')",
                    (sid, session["uid"], "Attendance code verified; awaiting teacher approval.", stamp))
        con.commit()
    except sqlite3.IntegrityError:
        con.close(); return jsonify({"error":"You already sent an attendance request for this session."}), 409
    con.close()
    return jsonify({"message":"Attendance request sent to your teacher. Your attendance will be successful after approval."})

@app.route("/api/attendance")
def attendance():
    if not session.get("uid"): return jsonify({"error":"Login required"}), 401
    if session.get("role") == "admin": return jsonify({"error":"This section is not part of the admin panel."}), 403
    con = db()
    if session["role"] == "student":
        rows = con.execute("""SELECT a.session_id,a.student_id,a.marked_at,a.status,c.course_code,c.course_name
          FROM attendance a JOIN attendance_sessions s ON s.session_id=a.session_id
          JOIN courses c ON c.id=s.course_id WHERE a.student_id=? ORDER BY a.id DESC""",(session["uid"],)).fetchall()
    else:
        rows = con.execute("""SELECT a.session_id,a.student_id,a.marked_at,a.status,c.course_code,c.course_name
          FROM attendance a JOIN attendance_sessions s ON s.session_id=a.session_id
          JOIN courses c ON c.id=s.course_id JOIN teachers t ON t.id=s.teacher_id
          WHERE t.teacher_id=? ORDER BY a.id DESC""",(session["uid"],)).fetchall()
    con.close()
    return jsonify([dict(x) for x in rows])


@app.route("/api/student/attendance-summary")
def student_attendance_summary():
    if session.get("role") != "student":
        return jsonify({"error":"Student login required."}), 403
    con = db()
    student = con.execute("SELECT id,student_id,department,semester FROM students WHERE student_id=? AND active=1",(session["uid"],)).fetchone()
    if not student:
        con.close(); return jsonify({"error":"Student account not found."}),404
    rows = con.execute("""
      SELECT c.id AS course_id,c.course_code,c.course_name,
        COUNT(DISTINCT s.id) AS total_sessions,
        COUNT(DISTINCT CASE WHEN a.status='Present' THEN s.id END) AS present
      FROM courses c
      LEFT JOIN attendance_sessions s ON s.course_id=c.id
      LEFT JOIN attendance a ON a.session_id=s.session_id AND a.student_id=?
      WHERE c.department=? AND c.semester=?
      GROUP BY c.id,c.course_code,c.course_name ORDER BY c.course_code
    """,(student["student_id"],student["department"],student["semester"])).fetchall()
    con.close()
    subjects=[]
    for r in rows:
        total=int(r["total_sessions"] or 0); present=int(r["present"] or 0)
        subjects.append({"course_id":r["course_id"],"course_code":r["course_code"],"course_name":r["course_name"],"total_sessions":total,"present":present,"absent":max(0,total-present),"percentage":round(present*100/total,1) if total else 0})
    total=sum(x["total_sessions"] for x in subjects); present=sum(x["present"] for x in subjects)
    return jsonify({"overall":{"total_sessions":total,"present":present,"absent":max(0,total-present),"percentage":round(present*100/total,1) if total else 0},"subjects":subjects})

@app.route("/api/teacher/course/<int:course_id>/students")
def teacher_course_students(course_id):
    if session.get("role") != "teacher": return jsonify({"error":"Teacher login required."}),403
    con=db()
    course=con.execute("SELECT c.* FROM courses c JOIN teachers t ON t.id=c.teacher_id WHERE c.id=? AND t.teacher_id=?",(course_id,session["uid"])).fetchone()
    if not course: con.close(); return jsonify({"error":"Course not found or not assigned to you."}),404
    rows=con.execute("""
      SELECT st.student_id,st.name,st.department,st.semester,
        COUNT(DISTINCT s.id) total_sessions,
        COUNT(DISTINCT CASE WHEN a.status='Present' THEN s.id END) present
      FROM students st
      LEFT JOIN attendance_sessions s ON s.course_id=?
      LEFT JOIN attendance a ON a.session_id=s.session_id AND a.student_id=st.student_id
      WHERE st.department=? AND st.semester=? AND st.active=1
      GROUP BY st.id ORDER BY st.name
    """,(course_id,course["department"],course["semester"])).fetchall()
    con.close()
    return jsonify([{"student_id":r["student_id"],"name":r["name"],"department":r["department"],"semester":r["semester"],"total_sessions":int(r["total_sessions"] or 0),"present":int(r["present"] or 0),"absent":max(0,int(r["total_sessions"] or 0)-int(r["present"] or 0)),"percentage":round((int(r["present"] or 0)*100/int(r["total_sessions"])) if r["total_sessions"] else 0,1)} for r in rows])

@app.route("/api/teacher/student/<student_id>/attendance")
def teacher_student_attendance(student_id):
    if session.get("role") != "teacher": return jsonify({"error":"Teacher login required."}),403
    course_id=request.args.get("course_id",type=int)
    con=db()
    course=con.execute("SELECT c.* FROM courses c JOIN teachers t ON t.id=c.teacher_id WHERE c.id=? AND t.teacher_id=?",(course_id,session["uid"])).fetchone()
    student=con.execute("SELECT * FROM students WHERE student_id=? AND active=1",(student_id,)).fetchone()
    if not course or not student or student["department"]!=course["department"] or student["semester"]!=course["semester"]:
        con.close(); return jsonify({"error":"Student/course access denied."}),403
    rows=con.execute("""
      SELECT s.session_id,s.start_time,s.end_time,
       CASE WHEN a.id IS NULL THEN 'Absent' ELSE a.status END AS status,a.marked_at
      FROM attendance_sessions s LEFT JOIN attendance a ON a.session_id=s.session_id AND a.student_id=?
      WHERE s.course_id=? ORDER BY s.start_time DESC
    """,(student_id,course_id)).fetchall()
    con.close()
    present=sum(1 for r in rows if r["status"]=="Present"); total=len(rows)
    return jsonify({"student":{"student_id":student["student_id"],"name":student["name"],"department":student["department"],"semester":student["semester"]},"summary":{"total_sessions":total,"present":present,"absent":total-present,"percentage":round(present*100/total,1) if total else 0},"history":[dict(r) for r in rows]})

@app.route("/api/notices")
def notices():
    if not session.get("uid"): return jsonify({"error":"Login required"}), 401
    con = db()
    role = session.get("role")
    if role == "admin":
        rows = con.execute("SELECT * FROM notices ORDER BY id DESC").fetchall()
    elif role == "student":
        person = con.execute("SELECT department,semester,section FROM students WHERE student_id=?", (session["uid"],)).fetchone()
        if not person: con.close(); return jsonify([])
        dept, sem = person["department"], person["semester"]
        rows = con.execute("""SELECT * FROM notices WHERE audience='all'
            OR (audience='students' AND (department='' OR department=?))
            OR (audience='department' AND department=?)
            OR (audience='semester' AND department=? AND semester=?)
            OR (audience='departments' AND instr(','||departments||',', ','||?||',')>0)
            ORDER BY id DESC""",(dept,dept,dept,sem,dept)).fetchall()
    else:
        person = con.execute("SELECT department FROM teachers WHERE teacher_id=?", (session["uid"],)).fetchone()
        if not person: con.close(); return jsonify([])
        dept = person["department"]
        rows = con.execute("""SELECT DISTINCT n.* FROM notices n
            WHERE n.audience='all'
              OR n.audience='teachers'
              OR (n.audience='department' AND n.department=?)
              OR (n.audience='semester' AND n.department=?)
              OR (n.audience='departments' AND instr(','||n.departments||',', ','||?||',')>0)
              OR (n.audience='teacher_notice' AND (
                    instr(','||n.departments||',', ','||?||',')>0
                    OR (n.course_code<>'' AND n.course_code IN
                        (SELECT c.course_code FROM courses c JOIN teachers t ON t.id=c.teacher_id WHERE t.teacher_id=?))
              ))
            ORDER BY n.id DESC""",(dept,dept,dept,dept,session["uid"])).fetchall()
    result=[dict(x) for x in rows]
    if role=="student":
        read_ids={r[0] for r in con.execute("SELECT notice_id FROM notice_reads WHERE student_id=?",(session["uid"],)).fetchall()}
        for item in result: item["is_read"]=item["id"] in read_ids
    con.close()
    return jsonify(result)

@app.route("/api/routine")
def routine():
    if not session.get("uid"): return jsonify({"error":"Login required"}), 401
    con = db()
    role = session.get("role")
    department = (request.args.get("department") or "").strip().upper()
    semester = (request.args.get("semester") or "").strip()
    section = (request.args.get("section") or "").strip()
    day_filter = (request.args.get("day") or "").strip()
    base = "SELECT * FROM routines WHERE 1=1"
    params = []
    if role == "student":
        u = con.execute("SELECT department,semester,section FROM students WHERE student_id=?",(session["uid"],)).fetchone()
        if not u: con.close(); return jsonify([])
        base += " AND department=? AND semester=? AND (section=? OR section='All' OR ?='')"
        params += [u["department"],u["semester"],u["section"] or "A",u["section"] or "A"]
    elif role == "teacher":
        # Teachers only see routines for their department and courses assigned to them.
        u = con.execute("SELECT department FROM teachers WHERE teacher_id=?",(session["uid"],)).fetchone()
        if not u: con.close(); return jsonify([])
        base += " AND (department=? OR course_code IN (SELECT c.course_code FROM courses c JOIN teachers t ON t.id=c.teacher_id WHERE t.teacher_id=?))"
        params += [u["department"],session["uid"]]
    if department and role == "admin": base += " AND department=?"; params.append(department)
    if semester and role == "admin": base += " AND semester=?"; params.append(semester)
    if section and role == "admin": base += " AND section=?"; params.append(section)
    if day_filter: base += " AND day=?"; params.append(day_filter)
    base += " ORDER BY CASE day WHEN 'Sunday' THEN 1 WHEN 'Monday' THEN 2 WHEN 'Tuesday' THEN 3 WHEN 'Wednesday' THEN 4 WHEN 'Thursday' THEN 5 WHEN 'Friday' THEN 6 ELSE 7 END,start_time"
    rows = con.execute(base,params).fetchall()
    con.close()
    return jsonify([dict(x) for x in rows])

@app.route("/api/close-session", methods=["POST"])
def close_session():
    if session.get("role") != "teacher": return jsonify({"error":"Teacher login required."}), 403
    data = request.get_json(silent=True) or {}
    con = db()
    row = con.execute("""SELECT s.session_id FROM attendance_sessions s JOIN teachers t ON t.id=s.teacher_id
                         WHERE s.session_id=? AND t.teacher_id=?""",(data.get("session_id"),session["uid"])).fetchone()
    if not row:
        con.close(); return jsonify({"error":"Session not found."}), 404
    con.execute("UPDATE attendance_sessions SET status='closed' WHERE session_id=?",(row["session_id"],))
    con.commit(); con.close()
    return jsonify({"message":"Session closed."})

@app.route("/api/admin/users", methods=["GET"])
def admin_users():
    if session.get("role") != "admin":
        return jsonify({"error":"Admin login required."}), 403
    con = db()
    students = [dict(x) for x in con.execute("SELECT student_id AS user_id,name,department,semester,active,'Student' AS role FROM students ORDER BY student_id").fetchall()]
    teachers = [dict(x) for x in con.execute("SELECT teacher_id AS user_id,name,department,designation,'—' AS semester,active,'Teacher' AS role FROM teachers ORDER BY teacher_id").fetchall()]
    con.close()
    return jsonify(students + teachers)

@app.route("/api/admin/users/<role>/<user_id>", methods=["DELETE"])
def admin_remove_user(role, user_id):
    if session.get("role") != "admin":
        return jsonify({"error":"Admin login required."}), 403
    role = (role or "").strip().lower()
    user_id = (user_id or "").strip().upper()
    if role not in ("student", "teacher"):
        return jsonify({"error":"Choose Student or Teacher."}), 400
    con = db()
    table, col = ("students", "student_id") if role == "student" else ("teachers", "teacher_id")
    cur = con.execute(f"UPDATE {table} SET active=0 WHERE {col}=? AND active=1", (user_id,))
    if cur.rowcount == 0:
        existing = con.execute(f"SELECT active FROM {table} WHERE {col}=?", (user_id,)).fetchone()
        con.close()
        if not existing: return jsonify({"error":"Account not found."}), 404
        return jsonify({"error":"Account is already inactive."}), 409
    con.commit(); con.close()
    return jsonify({"message": f"{role.title()} account {user_id} deactivated. Historical records are preserved."})

@app.route("/api/admin/register", methods=["POST"])
def admin_register():
    if session.get("role") != "admin":
        return jsonify({"error":"Admin login required."}), 403
    data = request.get_json(silent=True) or {}
    role = (data.get("role") or "").strip().lower()
    user_id = (data.get("user_id") or "").strip().upper()
    name = (data.get("name") or "").strip()
    department = (data.get("department") or "").strip().upper()
    password = data.get("password") or ""
    semester = (data.get("semester") or "").strip()
    section = (data.get("section") or "A").strip() or "A"
    designation = (data.get("designation") or "Lecturer").strip()
    allowed_designations = {"Professor","Associate Professor","Assistant Professor","Senior Lecturer","Lecturer","Assistant Lecturer","Department Head","Other"}
    if role == "teacher" and designation not in allowed_designations:
        return jsonify({"error":"Choose a valid teacher designation."}), 400
    if role not in ("student", "teacher"):
        return jsonify({"error":"Choose Student or Teacher."}), 400
    if not all([user_id, name, department, password]) or (role == "student" and not semester):
        return jsonify({"error":"Please fill in all required fields."}), 400
    if not isinstance(password, str) or not 4 <= len(password) <= 12:
        return jsonify({"error":"Password must be 4 to 12 characters long."}), 400
    con = db()
    try:
        if role == "student":
            con.execute("INSERT INTO students(student_id,name,department,semester,password,section) VALUES(?,?,?,?,?,?)", (user_id,name,department,semester,generate_password_hash(password),section))
        else:
            con.execute("INSERT INTO teachers(teacher_id,name,department,password,designation) VALUES(?,?,?,?,?)", (user_id,name,department,generate_password_hash(password),designation))
        con.commit()
    except sqlite3.IntegrityError:
        con.close()
        return jsonify({"error":"This ID already exists. Please use a unique ID."}), 409
    con.close()
    return jsonify({"message": f"{role.title()} account created successfully.", "user_id": user_id})



@app.route("/api/teacher/start-session-with-photo", methods=["POST"])
def teacher_start_session_with_photo():
    if session.get("role") != "teacher": return jsonify({"error":"Teacher login required."}),403
    photo=request.files.get("classroom_photo")
    if not photo or not photo.filename: return jsonify({"error":"Please upload a classroom photo."}),400
    if photo.mimetype not in ("image/jpeg","image/png","image/webp"): return jsonify({"error":"Use JPG, PNG or WEBP image."}),400
    data=request.form
    try: course_id=int(data.get("course_id")); duration=int(data.get("duration_minutes",15))
    except (TypeError,ValueError): return jsonify({"error":"Choose a course and duration."}),400
    if duration not in (5,10,15,20,30): return jsonify({"error":"Invalid session duration."}),400
    con=db(); course=con.execute("SELECT * FROM courses WHERE id=?",(course_id,)).fetchone()
    teacher=con.execute("SELECT id FROM teachers WHERE teacher_id=?",(session["uid"],)).fetchone()
    if not course or not teacher or course["teacher_id"]!=teacher["id"]:
        con.close(); return jsonify({"error":"This course is not assigned to your account."}),403
    os.makedirs(os.path.join(BASE_DIR,"static","uploads","classrooms"),exist_ok=True)
    ext={"image/jpeg":".jpg","image/png":".png","image/webp":".webp"}[photo.mimetype]
    filename=uuid.uuid4().hex+ext; photo.save(os.path.join(BASE_DIR,"static","uploads","classrooms",filename))
    now=datetime.now(); end=now+timedelta(minutes=duration); sid="SES-"+secrets.token_hex(4).upper()
    teacher_otp=f"{secrets.randbelow(900000)+100000}"
    con.execute("INSERT INTO attendance_sessions(session_id,course_id,teacher_id,start_time,end_time,status,duration_minutes,classroom_photo,teacher_otp) VALUES(?,?,?,?,?,?,?,?,?)",
      (sid,course_id,teacher["id"],now.strftime("%Y-%m-%d %H:%M:%S"),end.strftime("%Y-%m-%d %H:%M:%S"),"active",duration,"/static/uploads/classrooms/"+filename,teacher_otp))
    desc=f"{course['course_name']} · Teacher {session['name']} · Session ID: {sid} · Expires: {end.strftime('%Y-%m-%d %H:%M:%S')}"
    con.execute("INSERT INTO notices(title,description,created_at,audience,department,semester,author_id,notice_type,session_id) VALUES(?,?,?,?,?,?,?,?,?)",
      ("Attendance Session: "+course["course_code"],desc,now.strftime("%Y-%m-%d %H:%M"),"students",course["department"],course["semester"],session["uid"],"session",sid))
    con.commit(); con.close()
    return jsonify({"message":"Attendance session started and students notified.","session_id":sid,"teacher_otp":teacher_otp,"end_time":end.strftime("%Y-%m-%d %H:%M:%S"),"classroom_photo":"/static/uploads/classrooms/"+filename})

@app.route("/api/notices/<int:notice_id>/read", methods=["POST"])
def mark_notice_read(notice_id):
    if session.get("role")!="student": return jsonify({"error":"Student login required."}),403
    con=db(); notice=con.execute("SELECT id FROM notices WHERE id=?",(notice_id,)).fetchone()
    if not notice: con.close(); return jsonify({"error":"Notice not found."}),404
    con.execute("INSERT OR IGNORE INTO notice_reads(notice_id,student_id,read_at) VALUES(?,?,?)",(notice_id,session["uid"],datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
    con.commit(); con.close(); return jsonify({"message":"Notice marked as read."})

@app.route("/api/late-attendance-requests", methods=["GET","POST"])
def late_attendance_requests():
    role=session.get("role")
    if role not in ("student","teacher"): return jsonify({"error":"Please log in as student or teacher."}),403
    con=db()
    if request.method=="POST":
        if role!="student": con.close(); return jsonify({"error":"Student login required."}),403
        d=request.get_json(silent=True) or {}; sid=(d.get("session_id") or "").strip(); reason=(d.get("reason") or "Arrived after the attendance window.").strip()[:500]
        row=con.execute("SELECT s.*,c.department,c.semester FROM attendance_sessions s JOIN courses c ON c.id=s.course_id WHERE s.session_id=?",(sid,)).fetchone()
        student=con.execute("SELECT department,semester FROM students WHERE student_id=? AND active=1",(session["uid"],)).fetchone()
        if not row or not student or student["department"]!=row["department"] or student["semester"]!=row["semester"]:
            con.close(); return jsonify({"error":"Session not found or not available for your course."}),404
        if con.execute("SELECT 1 FROM attendance WHERE session_id=? AND student_id=?",(sid,session["uid"])).fetchone():
            con.close(); return jsonify({"error":"Attendance is already recorded."}),409
        camera_failed = reason.startswith("CAMERA_VERIFICATION_FAILED:")
        try:
            con.execute("INSERT INTO late_attendance_requests(session_id,student_id,reason,requested_at) VALUES(?,?,?,?)",(sid,session["uid"],reason,datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
            con.commit()
        except sqlite3.IntegrityError:
            con.close(); return jsonify({"error":"You already sent a request for this session."}),409
        con.close(); return jsonify({"message":"Late attendance request sent to your teacher."})
    if role=="student":
        rows=con.execute("SELECT r.*,c.course_code,c.course_name FROM late_attendance_requests r JOIN attendance_sessions s ON s.session_id=r.session_id JOIN courses c ON c.id=s.course_id WHERE r.student_id=? ORDER BY r.id DESC",(session["uid"],)).fetchall()
    else:
        rows=con.execute("SELECT r.*,st.name AS student_name,c.course_code,c.course_name FROM late_attendance_requests r JOIN attendance_sessions s ON s.session_id=r.session_id JOIN courses c ON c.id=s.course_id JOIN teachers t ON t.id=s.teacher_id JOIN students st ON st.student_id=r.student_id WHERE t.teacher_id=? ORDER BY r.id DESC",(session["uid"],)).fetchall()
    con.close(); return jsonify([dict(x) for x in rows])

@app.route("/api/late-attendance-requests/<int:request_id>/review", methods=["POST"])
def review_late_attendance_request(request_id):
    if session.get("role")!="teacher": return jsonify({"error":"Teacher login required."}),403
    d=request.get_json(silent=True) or {}; decision=d.get("decision")
    if decision not in ("approve","cancel"): return jsonify({"error":"Choose approve or cancel."}),400
    con=db(); req=con.execute("SELECT r.*,s.status AS session_status,s.end_time FROM late_attendance_requests r JOIN attendance_sessions s ON s.session_id=r.session_id JOIN teachers t ON t.id=s.teacher_id WHERE r.id=? AND t.teacher_id=?",(request_id,session["uid"])).fetchone()
    if not req: con.close(); return jsonify({"error":"Request not found."}),404
    if req["status"]!="pending": con.close(); return jsonify({"error":"This request has already been reviewed."}),409
    now=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if decision=="approve":
        con.execute("INSERT INTO attendance(session_id,student_id,marked_at,status) VALUES(?,?,?,'Present') ON CONFLICT(session_id,student_id) DO UPDATE SET marked_at=excluded.marked_at,status='Present'",(req["session_id"],req["student_id"],now))
        status="approved"
    else:
        session_row = con.execute("SELECT * FROM attendance_sessions WHERE session_id=?", (req["session_id"],)).fetchone()
        record_absences_for_session(con, session_row, req["student_id"])
        con.execute("UPDATE attendance SET status='Absent' WHERE session_id=? AND student_id=?", (req["session_id"], req["student_id"]))
        status="cancelled"
    con.execute("UPDATE late_attendance_requests SET status=?,reviewed_at=? WHERE id=?",(status,now,request_id)); con.commit(); con.close()
    return jsonify({"message":"Attendance successful: request approved and marked Present." if decision=="approve" else "Request cancelled; attendance marked Absent."})

def require_admin():
    return session.get("role") == "admin"

@app.route("/api/admin/users/<role>/<user_id>/activate", methods=["POST"])
def admin_activate_user(role, user_id):
    if not require_admin(): return jsonify({"error":"Admin login required."}), 403
    role = (role or "").lower(); user_id = (user_id or "").upper()
    if role not in ("student", "teacher"): return jsonify({"error":"Invalid role."}), 400
    table, col = ("students", "student_id") if role == "student" else ("teachers", "teacher_id")
    con = db(); cur = con.execute(f"UPDATE {table} SET active=1 WHERE {col}=? AND active=0", (user_id,))
    if cur.rowcount == 0:
        exists = con.execute(f"SELECT 1 FROM {table} WHERE {col}=?", (user_id,)).fetchone(); con.close()
        return (jsonify({"error":"Account not found."}),404) if not exists else (jsonify({"error":"Account is already active."}),409)
    con.commit(); con.close(); return jsonify({"message":f"{role.title()} account {user_id} reactivated."})

@app.route("/api/admin/notices", methods=["POST"])
def admin_create_notice():
    if not require_admin(): return jsonify({"error":"Admin login required."}), 403
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    audience = (data.get("audience") or "all").strip().lower()
    departments = data.get("departments") or []
    if isinstance(departments, str): departments = [x.strip().upper() for x in departments.split(",") if x.strip()]
    departments = sorted(set(str(x).strip().upper() for x in departments if str(x).strip()))
    department = (data.get("department") or "").strip().upper()
    semester = (data.get("semester") or "").strip()
    course_code = (data.get("course_code") or "").strip().upper()
    if not title or not description: return jsonify({"error":"Title and description are required."}), 400
    if audience not in ("all", "department", "departments", "teacher_notice"): return jsonify({"error":"Choose Everyone, Specific Department, Multiple Departments or Teacher Notice."}), 400
    if audience == "department" and not department: return jsonify({"error":"Choose a department."}), 400
    if audience == "departments" and not departments: return jsonify({"error":"Choose at least one department."}), 400
    if audience == "teacher_notice" and not departments and not course_code: return jsonify({"error":"Choose a department or assigned course."}), 400
    con = db()
    con.execute("""INSERT INTO notices(title,description,created_at,audience,department,semester,author_id,notice_type,departments,course_code)
        VALUES(?,?,?,?,?,?,?,?,?,?)""",
        (title,description,datetime.now().strftime("%Y-%m-%d %H:%M"),audience,department,semester,session.get("uid","ADMIN001"),"normal",",".join(departments),course_code))
    con.commit(); con.close()
    return jsonify({"message":"Notice published successfully."})

@app.route("/api/teacher/notices", methods=["POST"])
def teacher_create_notice():
    if session.get("role") != "teacher": return jsonify({"error":"Teacher login required."}), 403
    d = request.get_json(silent=True) or {}
    title=(d.get("title") or "").strip(); description=(d.get("description") or "").strip()
    semester=(d.get("semester") or "").strip(); audience=(d.get("audience") or "semester").strip().lower()
    if not title or not description: return jsonify({"error":"Title and details are required."}),400
    con=db()
    teacher=con.execute("SELECT department FROM teachers WHERE teacher_id=? AND active=1",(session["uid"],)).fetchone()
    if not teacher: con.close(); return jsonify({"error":"Teacher account not found or inactive."}),403
    if audience not in ("semester","students"): con.close(); return jsonify({"error":"Teachers may target one semester or all students in their department."}),400
    if audience=="semester" and not semester: con.close(); return jsonify({"error":"Choose a semester or select all students."}),400
    con.execute("INSERT INTO notices(title,description,created_at,audience,department,semester,author_id,notice_type,departments) VALUES(?,?,?,?,?,?,?,?,?)",
        (title,description,datetime.now().strftime("%Y-%m-%d %H:%M"),"semester" if audience=="semester" else "department",teacher["department"],semester,session["uid"],"normal",teacher["department"]))
    con.commit(); con.close()
    return jsonify({"message":"Notice published to the selected audience."})

@app.route("/api/admin/routine", methods=["POST"])
def admin_create_routine():
    if not require_admin(): return jsonify({"error":"Admin login required."}), 403
    d = request.get_json(silent=True) or {}
    fields = {k:(d.get(k) or "").strip() for k in ("course_code","course_name","day","start_time","end_time","room","teacher_name","section")}
    days = d.get("days") or ([fields["day"]] if fields["day"] else [])
    days = list(dict.fromkeys(str(x).strip() for x in days if str(x).strip()))
    if d.get("all_days"):
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Saturday"]
    departments = d.get("departments") or ([d.get("department")] if d.get("department") else [])
    semesters = d.get("semesters") or ([d.get("semester")] if d.get("semester") else [])
    sections = d.get("sections") or ([fields["section"]] if fields["section"] else ["A"])
    departments = sorted(set(str(x).strip().upper() for x in departments if str(x).strip()))
    semesters = sorted(set(str(x).strip() for x in semesters if str(x).strip()))
    sections = sorted(set(str(x).strip() for x in sections if str(x).strip()))
    if not all(fields[k] for k in ("course_code","course_name","start_time","end_time","room")) or not days or not departments or not semesters or not sections:
        return jsonify({"error":"Course, day, time, room and at least one Department, Semester and Section are required."}), 400
    try:
        if datetime.strptime(fields["start_time"],"%H:%M") >= datetime.strptime(fields["end_time"],"%H:%M"):
            return jsonify({"error":"End time must be later than start time."}), 400
    except ValueError: return jsonify({"error":"Time must use HH:MM format."}), 400
    con = db()
    created = 0
    for day in days:
      for department in departments:
        for semester in semesters:
            for section in sections:
                clash = con.execute("""SELECT id FROM routines WHERE day=? AND start_time < ? AND end_time > ?
                    AND (room=? OR (teacher_name<>'' AND teacher_name=?))
                    AND NOT (course_code=? AND course_name=? AND start_time=? AND end_time=? AND room=?)
                    LIMIT 1""",
                    (day,fields["end_time"],fields["start_time"],fields["room"],fields["teacher_name"],fields["course_code"],fields["course_name"],fields["start_time"],fields["end_time"],fields["room"])).fetchone()
                if clash:
                    con.rollback(); con.close()
                    return jsonify({"error":f"Time conflict detected for {department}, semester {semester}, section {section}. Check room or teacher schedule."}), 409
    for day in days:
      for department in departments:
        for semester in semesters:
            for section in sections:
                exists = con.execute("""SELECT id FROM routines WHERE course_code=? AND day=? AND start_time=? AND end_time=? AND room=? AND department=? AND semester=? AND section=?""",
                    (fields["course_code"],day,fields["start_time"],fields["end_time"],fields["room"],department,semester,section)).fetchone()
                if not exists:
                    con.execute("""INSERT INTO routines(course_code,course_name,day,start_time,end_time,room,department,semester,teacher_name,section)
                    VALUES(?,?,?,?,?,?,?,?,?,?)""",(fields["course_code"],fields["course_name"],day,fields["start_time"],fields["end_time"],fields["room"],department,semester,fields["teacher_name"],section))
                    created += 1
    con.commit(); con.close()
    return jsonify({"message":f"Routine created for {created} Day/Department/Semester/Section combination(s)."})

@app.route("/api/profile", methods=["GET","PUT"])
def profile():
    if not session.get("uid"): return jsonify({"error":"Login required."}), 401
    role=session.get("role")
    if role == "admin": table,col="admins","admin_id"
    elif role == "teacher": table,col="teachers","teacher_id"
    else: table,col="students","student_id"
    con=db()
    if request.method == "GET":
        row=con.execute(f"SELECT * FROM {table} WHERE {col}=?",(session["uid"],)).fetchone(); con.close()
        if not row: return jsonify({"error":"Profile not found."}),404
        keys=("name","address","education","qualifications","profile_picture")
        return jsonify({k:row[k] if k in row.keys() else "" for k in keys})
    d=request.get_json(silent=True) or {}; name=(d.get("name") or "").strip()
    if not name: con.close(); return jsonify({"error":"Name is required."}),400
    fields={k:(d.get(k) or "").strip() for k in ("address","education","qualifications","profile_picture")}
    if len(fields["profile_picture"])>1500000: con.close(); return jsonify({"error":"Profile image or URL is too large (maximum about 1 MB)."}),400
    con.execute(f"UPDATE {table} SET name=?, address=?, education=?, qualifications=?, profile_picture=? WHERE {col}=?",(name,fields["address"],fields["education"],fields["qualifications"],fields["profile_picture"],session["uid"]))
    con.commit(); con.close(); session["name"]=name
    return jsonify({"message":"Profile updated successfully."})

@app.route("/health")
def health():
    return jsonify({"app":"CampusOne","database":"SQLite","status":"ok"})

# Initialize tables when the app is imported by a production server such as Gunicorn.
init_db()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False)
