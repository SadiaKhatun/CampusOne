let role = "student";
let currentUser = null;
let cachedCourses = [];
let allAdminUsers = [];
let activeUserTab = "teacher";
let cachedNotices = [];
const $ = (id) => document.getElementById(id);
const dateTimeShort = (v) => v ? String(v).replace("T"," ").slice(0,16) : "—";
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
async function api(url, options={}) {
  const res = await fetch(url,{headers:{"Content-Type":"application/json"},...options});
  const data = await res.json().catch(()=>({}));
  if(!res.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}
document.querySelectorAll(".role").forEach(btn=>btn.addEventListener("click",()=>{
  role=btn.dataset.role;
  document.querySelectorAll(".role").forEach(b=>b.classList.toggle("active",b===btn));
  $("id-label").textContent=role==="student"?"Student ID":role==="teacher"?"Teacher ID":"Admin ID";
  $("user-id").placeholder=role==="student"?"e.g. S001":role==="teacher"?"e.g. T001":"e.g. ADMIN001";
  $("demo-account").textContent=role==="student"?"Student: S001 / student123":role==="teacher"?"Teacher: T001 / teacher123":"Admin: ADMIN001 / admin123";
  $("login-error").textContent="";
}));
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("login-error").textContent="";const loginPassword=$("password").value;if(loginPassword.length<4||loginPassword.length>12){$("login-error").textContent="Password must be 4 to 12 characters long.";return;}
  try{currentUser=await api("/api/login",{method:"POST",body:JSON.stringify({role,user_id:$("user-id").value,password:$("password").value})});showApp();await renderPage("dashboard");}
  catch(err){$("login-error").textContent=err.message;}
});
$("logout").addEventListener("click",async()=>{await api("/api/logout",{method:"POST",body:"{}"});currentUser=null;$("app-view").classList.add("hidden");$("login-view").classList.remove("hidden");$("password").value="";});
document.querySelectorAll(".nav-item").forEach(btn=>btn.addEventListener("click",()=>{renderPage(btn.dataset.page);const nav=$("navigation"),toggle=$("menu-toggle");nav.classList.remove("nav-open");if(toggle)toggle.setAttribute("aria-expanded","false")}));
const menuToggle=$("menu-toggle"); if(menuToggle) menuToggle.addEventListener("click",()=>{const nav=$("navigation"),open=nav.classList.toggle("nav-open");menuToggle.setAttribute("aria-expanded",String(open));});
$("profile-shortcut").addEventListener("click",()=>{if(currentUser)renderPage("profile")});
$("notice-modal-close").addEventListener("click",closeNoticeModal);
$("notice-modal").addEventListener("click",e=>{if(e.target.id==="notice-modal")closeNoticeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeNoticeModal()});
function openInfoModal(title,html){$("notice-modal-title").textContent=title;$("notice-modal-date").textContent="CampusOne details";$("notice-modal-meta").textContent="ACADEMIC DETAILS";$("notice-modal-body").innerHTML=html;$("notice-modal-extra").innerHTML="";$("notice-modal").classList.remove("hidden");document.body.classList.add("modal-open");}
function closeNoticeModal(){$("notice-modal").classList.add("hidden");document.body.classList.remove("modal-open")}
function openNoticeModal(n){$("notice-modal-title").textContent=n.title||"Campus notice";$("notice-modal-date").textContent=`Published: ${n.created_at||"—"}`;$("notice-modal-meta").textContent=`${n.notice_type||"normal"} NOTICE · ${n.audience||"all"}`;$("notice-modal-body").textContent=n.description||"No details provided.";$("notice-modal-extra").innerHTML=n.session_id?`<div class="session-box"><span class="muted">Attendance Session ID</span><br><strong>${esc(n.session_id)}</strong><p>Session ID is managed automatically. Enter the 6-digit attendance code to mark present.</p><button class="small-btn secondary" id="modal-copy-session">Copy Session ID</button>${currentUser?.role==="student"?` <button class="small-btn" id="modal-mark-session" data-session="${esc(n.session_id)}">Mark attendance</button>`:""}</div>`:"";$("notice-modal").classList.remove("hidden");document.body.classList.add("modal-open");const copy=$("modal-copy-session");if(copy)copy.onclick=async()=>{try{await navigator.clipboard.writeText(n.session_id);toast("Session ID copied.")}catch(e){toast("Session ID: "+n.session_id)}};const mark=$("modal-mark-session");if(mark)mark.onclick=()=>{const sid=mark.dataset.session;closeNoticeModal();renderPage("attendance");setTimeout(()=>{const input=$("session-id-input");if(input){input.focus()}},100)};}
function showApp(){
  $("login-view").classList.add("hidden");$("app-view").classList.remove("hidden");
  $("profile-name").textContent=currentUser.name;$("profile-role").textContent=currentUser.role==="admin"?"Admin Panel":currentUser.role==="teacher"?"Teacher Portal":"Student Portal";
  setAvatar(currentUser.profile_picture,currentUser.name);
  api("/api/profile").then(p=>{currentUser.profile_picture=p.profile_picture||"";setAvatar(currentUser.profile_picture,currentUser.name)}).catch(()=>{});
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("hidden", currentUser.role==="admin" ? !["dashboard","users","notices","routine","profile"].includes(b.dataset.page) : b.dataset.page==="users"));
}
function setAvatar(src,name){const a=$("avatar");if(src){a.innerHTML=`<img src="${esc(src)}" alt="Profile picture">`;a.classList.add("has-image")}else{a.textContent=(name||"U").charAt(0).toUpperCase();a.classList.remove("has-image")}}
function setPage(page){
  const labels={dashboard:"Dashboard",attendance:"Attendance",courses:"My Courses",routine:"Class Routine",notices:"Notices",users:"User Management",profile:"My Profile"};
  $("page-title").textContent=labels[page]||"Dashboard";$("crumb-page").textContent=labels[page]||"Dashboard";
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
}
function heading(title,subtitle,action=""){return `<div class="section-heading"><div><h2>${title}</h2><p>${subtitle}</p></div>${action}</div>`}
function table(headers,rows){if(!rows.length)return `<div class="empty">No records to display yet.</div>`;return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`}
async function renderPage(page){
  setPage(page);const c=$("content");c.innerHTML=`<div class="empty">Loading your information…</div>`;
  try{
    if(page==="dashboard") c.innerHTML=await dashboardHTML();
    if(page==="users") c.innerHTML=await usersHTML();
    if(page==="courses") c.innerHTML=await coursesHTML();
    if(page==="attendance") c.innerHTML=await attendanceHTML();
    if(page==="routine") c.innerHTML=await routineHTML();
    if(page==="notices") c.innerHTML=await noticesHTML();
    if(page==="profile") c.innerHTML=await profileHTML();
    bindPageActions(page);
  }catch(err){c.innerHTML=`<div class="panel"><strong>Could not load this section</strong><p class="muted">${esc(err.message)}</p></div>`}
}
async function dashboardHTML(){
  if(currentUser.role==="admin"){
    const users=await api("/api/admin/users");
    const students=users.filter(u=>u.role==="Student").length, teachers=users.filter(u=>u.role==="Teacher").length;
    return `<section class="welcome"><div><span class="eyebrow">ADMINISTRATOR WORKSPACE</span><h2>Welcome, ${esc(currentUser.name.split(" ")[0])}!</h2><p>Create student and teacher accounts, assign login credentials and manage registered users.</p></div><div class="welcome-art">✦</div></section><div class="stats-grid"><article class="stat-card"><div class="stat-icon">♙</div><div><small>Registered Students</small><strong>${students}</strong></div></article><article class="stat-card"><div class="stat-icon green">♧</div><div><small>Registered Teachers</small><strong>${teachers}</strong></div></article><article class="stat-card"><div class="stat-icon orange">▦</div><div><small>Total Accounts</small><strong>${users.length}</strong></div></article></div>${heading("Admin actions","Create a new account or review the user directory.",'<button class="small-btn" data-go="users">Manage users →</button>')}<section class="panel"><h3>Account access</h3><p class="muted" style="margin-top:8px;margin-bottom:0">Admin creates accounts. Students and teachers then sign in with their own ID and password. Each role sees only its permitted portal.</p></section>`;
  }
  const [courses,sessions,attendance,notices]=await Promise.all([api("/api/courses"),api("/api/sessions"),api("/api/attendance"),api("/api/notices")]);
  cachedCourses=courses; cachedNotices=notices;
  const active=sessions.filter(s=>s.status==="active"&&new Date(s.end_time.replace(" ","T"))>=new Date()).length;
  const studentSummary=currentUser.role==="student"?await api("/api/student/attendance-summary") : null;
  const overall=studentSummary?.overall||{};
  return `<section class="welcome"><div><span class="eyebrow">YOUR CAMPUS, CONNECTED</span><h2>Welcome back, ${esc(currentUser.name.split(" ")[0])}!</h2><p>Here is your academic overview. Keep track of classes, attendance and campus updates.</p></div><div class="welcome-art">✦</div></section>
  <div class="stats-grid">
    <article class="stat-card"><div class="stat-icon">▤</div><div><small>${currentUser.role==="teacher"?"Assigned Courses":"My Courses"}</small><strong>${courses.length}</strong></div></article>
    <article class="stat-card"><div class="stat-icon green">◷</div><div><small>${currentUser.role==="teacher"?"Active Sessions":"Overall Attendance"}</small><strong>${currentUser.role==="teacher"?active:`${overall.percentage||0}%`}</strong></div></article>
    <article class="stat-card"><div class="stat-icon orange">♧</div><div><small>Campus Notices</small><strong>${notices.length}</strong></div></article>
  </div>
  ${currentUser.role==="student"?`${heading("Attendance overview","Your overall and subject-wise attendance percentage.")}<section class="panel"><div class="stats-grid"><article class="stat-card"><div><small>Present</small><strong>${overall.present||0}</strong></div></article><article class="stat-card"><div><small>Absent</small><strong>${overall.absent||0}</strong></div></article><article class="stat-card"><div><small>Conducted sessions</small><strong>${overall.total_sessions||0}</strong></div></article></div></section><section class="panel"><div class="panel-head"><div><h3>Subject-wise attendance</h3><p>Percentage is based on sessions created for each subject.</p></div></div>${table(["SUBJECT","PRESENT","ABSENT","TOTAL","ATTENDANCE"],(studentSummary.subjects||[]).map(s=>[`${esc(s.course_code)} · ${esc(s.course_name)}`,s.present,s.absent,s.total_sessions,`<strong>${s.percentage}%</strong>`]))}</section>`:""}
  ${currentUser.role==="student"?await (async()=>{const routines=await api("/api/routine");const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];const today=days[new Date().getDay()];const todayRows=routines.filter(r=>r.day===today).sort((a,b)=>a.start_time.localeCompare(b.start_time));return `${heading("Today's Classes",`Your classes for ${today}.`)}<section class="panel"><div class="panel-head"><div><h3>${today} schedule</h3><p>All classes scheduled for today.</p></div><button class="link-button" data-go="routine">View weekly routine →</button></div>${table(["TIME","COURSE","SECTION","TEACHER","ROOM"],todayRows.map(r=>[`${esc(r.start_time)}–${esc(r.end_time)}`,`${esc(r.course_code)} · ${esc(r.course_name)}`,esc(r.section||"All"),esc(r.teacher_name||"—"),esc(r.room)]))}</section>`})():""}
  ${currentUser.role==="student"?`${heading("Notifications","Unread notices are highlighted in blue and bold.")}<section class="panel"><div class="notification-list">${notices.map((n,i)=>`<button type="button" class="notice-click-card ${!n.is_read?"notice-unread":""}" data-dash-notice="${i}" data-notice-id="${n.id}"><span class="notice-symbol">♧</span><span class="notice-click-content"><strong>${esc(n.title)}</strong><p>${esc(n.description).slice(0,130)}${String(n.description||"").length>130?"…":""}</p><small>${esc(n.created_at)} · ${n.is_read?"Read":"Unread"}</small></span><span class="notice-arrow">↗</span></button>`).join("")||`<div class="empty">No notifications.</div>`}</div></section>`:""}
  ${heading("Quick access","Go directly to the information you need.")}
  <div class="two-col"><section class="panel"><div class="panel-head"><div><h3>${currentUser.role==="teacher"?"Your courses":"Recent attendance"}</h3><p>${currentUser.role==="teacher"?"Open a course to view its students":"Your latest attendance activity"}</p></div><button class="link-button" data-go="${currentUser.role==="teacher"?"courses":"attendance"}">View all →</button></div>
  ${currentUser.role==="teacher"?courses.slice(0,3).map(x=>`<div class="notice-item"><strong>${esc(x.course_code)} · ${esc(x.course_name)}</strong><p>${esc(x.department)} · ${esc(x.semester)} semester</p></div>`).join(""):attendance.slice(0,3).map(x=>`<div class="notice-item"><strong>${esc(x.course_code)} · ${esc(x.course_name)}</strong><p>${esc(x.marked_at)} · <span class="badge">${esc(x.status)}</span></p></div>`).join("")||`<div class="empty">No attendance records yet.</div>`}
  </section><section class="panel"><div class="panel-head"><div><h3>Latest notices</h3><p>Campus announcements</p></div><button class="link-button" data-go="notices">View all →</button></div>${notices.slice(0,3).map(n=>`<div class="notice-item"><strong>${esc(n.title)}</strong><p>${esc(n.description)}</p><small>${esc(n.created_at)}</small></div>`).join("")}</section></div>`;
}

async function usersHTML(){
  allAdminUsers=await api("/api/admin/users");
  const students=allAdminUsers.filter(u=>u.role==="Student"); const teachers=allAdminUsers.filter(u=>u.role==="Teacher");
  const deptOptions=[...new Set(allAdminUsers.map(u=>u.department||"Other"))].sort().map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("");
  return `${heading("User Management","Teacher Please review the selected settings. Student Please review the selected settings.; ID, Please review the selected settings..",'<button class="small-btn" data-user-register-focus>Create account ↓</button>')}
  <div class="user-type-grid"><button class="user-type-card ${activeUserTab==="teacher"?"selected":""}" data-user-tab="teacher"><span class="user-type-icon">♙</span><span><small>REGISTERED TEACHERS</small><strong>${teachers.length}</strong><em>View all teachers →</em></span></button><button class="user-type-card ${activeUserTab==="student"?"selected":""}" data-user-tab="student"><span class="user-type-icon student-icon">♧</span><span><small>REGISTERED STUDENTS</small><strong>${students.length}</strong><em>View all students →</em></span></button></div>
  <section class="panel"><div class="panel-head"><div><h3 id="user-list-title">${activeUserTab==="teacher"?"Registered Teachers":"Registered Students"}</h3><p id="user-list-subtitle">Search all ${activeUserTab==="teacher"?"teachers":"students"} across departments</p></div></div><div class="filter-grid"><div><label for="user-search">Search ID or name</label><input id="user-search" placeholder="Enter ID or name..."></div><div><label for="user-department-filter">Department</label><select class="select" id="user-department-filter"><option value="">All departments</option>${deptOptions}</select></div><div id="user-semester-filter-wrap" class="${activeUserTab==="student"?"":"hidden"}"><label for="user-semester-filter">Semester</label><select class="select" id="user-semester-filter"><option value="">All semesters</option>${[...new Set(students.map(u=>u.semester).filter(Boolean))].sort().map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join("")}</select></div><div><label for="user-status-filter">Status</label><select class="select" id="user-status-filter"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div></div><div id="user-list-results"></div></section>
  <section class="panel" id="register-account-panel"><div class="panel-head"><div><h3>Create an account</h3><p>Register a new student or teacher with a unique ID.</p></div></div><form id="register-form"><div class="form-grid"><div><label for="reg-role">Account type</label><select class="select" id="reg-role"><option value="student">Student</option><option value="teacher">Teacher</option></select></div><div><label for="reg-id">Student / Teacher ID</label><input id="reg-id" placeholder="e.g. S004 or T002" required></div><div><label for="reg-name">Full name</label><input id="reg-name" placeholder="Enter full name" required></div><div><label for="reg-department">Department</label><input id="reg-department" placeholder="e.g. CSE" required></div><div id="semester-field"><label for="reg-semester">Semester</label><input id="reg-semester" placeholder="e.g. 8th" required></div><div id="section-field"><label for="reg-section">Section</label><select id="reg-section" class="select"><option>A</option><option>B</option><option>C</option><option>D</option><option>All</option></select></div><div id="designation-field" class="hidden"><label for="reg-designation">Teacher designation</label><select id="reg-designation" class="select"><option>Professor</option><option>Associate Professor</option><option>Assistant Professor</option><option>Senior Lecturer</option><option selected>Lecturer</option><option>Assistant Lecturer</option><option>Department Head</option><option>Other</option></select></div><div><label for="reg-password">Initial password</label><input id="reg-password" type="password" minlength="4" maxlength="12" pattern=".{4,12}" title="Password must be 4 to 12 characters" placeholder="4–12 characters" required></div></div><p class="muted" style="margin:12px 0">Share the new ID and password securely with the registered person.</p><button class="small-btn" type="submit">Create account</button><div id="register-error" class="error" role="alert"></div></form></section>`;
}
function renderAdminUsers(){const role=activeUserTab==="teacher"?"Teacher":"Student";const query=($("user-search")?.value||"").trim().toLowerCase();const dept=$("user-department-filter")?.value||"";const sem=$("user-semester-filter")?.value||"";const status=$("user-status-filter")?.value||"";const list=allAdminUsers.filter(u=>u.role===role&&(!query||u.user_id.toLowerCase().includes(query)||u.name.toLowerCase().includes(query))&&(!dept||u.department===dept)&&(!sem||u.semester===sem)&&(!status||(status==="active"?u.active:!u.active)));const root=$("user-list-results");if(!root)return;root.innerHTML=table(["ID","NAME","DEPARTMENT",...(activeUserTab==="student"?["SEMESTER"]:["DESIGNATION"]),"STATUS","ACTION"],list.map(u=>[esc(u.user_id),`<strong>${esc(u.name)}</strong>`,esc(u.department||"—"),...(activeUserTab==="student"?[esc(u.semester||"—")]:[esc(u.designation||"Lecturer")]),u.active?'<span class="badge">Active</span>':'<span class="badge gray">Deactive</span>',u.active?`<button class="small-btn danger" data-remove-role="${u.role.toLowerCase()}" data-remove-id="${esc(u.user_id)}">Deactivate</button>`:`<button class="small-btn secondary" data-activate-role="${u.role.toLowerCase()}" data-activate-id="${esc(u.user_id)}">Reactivate</button>`]));root.querySelectorAll("[data-remove-role]").forEach(b=>b.onclick=async()=>{const r=b.dataset.removeRole,id=b.dataset.removeId;if(!confirm(`Deactivate ${r} account ${id}? Historical attendance will be preserved.`))return;try{const out=await api(`/api/admin/users/${r}/${encodeURIComponent(id)}`,{method:"DELETE"});toast(out.message);renderPage("users")}catch(e){toast(e.message)}});root.querySelectorAll("[data-activate-role]").forEach(b=>b.onclick=async()=>{try{const out=await api(`/api/admin/users/${b.dataset.activateRole}/${encodeURIComponent(b.dataset.activateId)}/activate`,{method:"POST",body:"{}"});toast(out.message);renderPage("users")}catch(e){toast(e.message)}})}

async function coursesHTML(){
  const courses=await api("/api/courses");cachedCourses=courses;
  return `${heading("My Courses","Select a course to view its student list and attendance performance.")}<section class="panel">${table(["COURSE CODE","COURSE NAME","DEPARTMENT","SEMESTER","TEACHER",...(currentUser.role==="teacher"?["STUDENTS"]:[])],courses.map(x=>[esc(x.course_code),`<strong>${esc(x.course_name)}</strong>`,esc(x.department),esc(x.semester),esc(x.teacher_id),...(currentUser.role==="teacher"?[`<button class="small-btn secondary" data-course-students="${x.id}">View students →</button>`]:[])]))}</section>
  ${currentUser.role==="teacher"?`<section class="panel" id="course-student-panel"><div class="panel-head"><div><h3>Course student list</h3><p>Choose a course above. Filter by department and semester.</p></div></div><div class="filter-grid"><div><label>Department</label><select id="course-dept-filter" class="select"><option value="">All departments</option>${[...new Set(courses.map(c=>c.department))].map(d=>`<option>${esc(d)}</option>`).join("")}</select></div><div><label>Semester</label><select id="course-sem-filter" class="select"><option value="">All semesters</option>${[...new Set(courses.map(c=>c.semester))].map(s=>`<option>${esc(s)}</option>`).join("")}</select></div></div><div id="course-students-result" class="empty">Select a course to load students.</div></section>
  <section class="panel"><div class="panel-head"><div><h3>Start attendance session</h3><p>Choose a course and session duration.</p></div></div><div class="field-row"><select class="select" id="course-select">${courses.map(x=>`<option value="${x.id}">${esc(x.course_code)} — ${esc(x.course_name)}</option>`).join("")}</select><select class="select" id="session-duration"><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15" selected>15 minutes</option><option value="20">20 minutes</option><option value="30">30 minutes</option></select><button class="small-btn" id="start-session">Start session</button></div><div id="new-session"></div></section>`:""}`;
}
async function attendanceHTML(){
  const [records,sessions]=await Promise.all([api("/api/attendance"),api("/api/sessions")]);
  const sessionRows=sessions.map(s=>[`${esc(s.session_id)}${currentUser.role==="teacher"?`<br><span class="muted">6-digit code: <strong>${esc(s.teacher_otp||"—")}</strong></span>`:""}`,`${esc(s.course_code)} · ${esc(s.course_name)}`,esc(s.teacher_name),esc(s.start_time),s.status==="active"?`<span class="badge">Active</span>`:`<span class="badge gray">${esc(s.status)}</span>`,
  currentUser.role==="student"&&s.status==="active"?`<button class="small-btn secondary" data-mark="${esc(s.session_id)}">Mark present</button>`:currentUser.role==="teacher"&&s.status==="active"?`<button class="small-btn danger" data-close="${esc(s.session_id)}">Close</button>`:"—"]);
  const recordRows=records.map(a=>[esc(a.session_id),`${esc(a.course_code)} · ${esc(a.course_name)}`,esc(a.student_id),esc(a.marked_at),`<span class="badge">${esc(a.status)}</span>`]);
  return `${heading("Attendance management","Active class sessions and attendance records.")}${currentUser.role==="student"?`<section class="panel"><div class="panel-head"><div><h3>Mark attendance</h3><p>Enter only the 6-digit attendance code shared by your teacher. Session ID is handled automatically.</p></div></div><div class="field-row"><input id="attendance-code-input" class="select" inputmode="numeric" maxlength="6" placeholder="6-digit attendance code"><button class="small-btn" id="mark-session">Request attendance</button></div><p class="muted" style="margin-top:12px;margin-bottom:0">Session ID is stored automatically. After you enter the correct code, your teacher must approve the request for attendance to become Present. If cancelled, it will show Absent.</p><div class="field-row" style="margin-top:12px"><input id="late-session-id" class="select" placeholder="Session ID for teacher review"><input id="late-reason" class="select" placeholder="Reason (optional)"><button class="small-btn secondary" id="late-request">Request teacher verification</button></div></section>`:""}
  <section class="panel"><div class="panel-head"><div><h3>${currentUser.role==="teacher"?"Class sessions":"Available sessions"}</h3><p>Session status and start time</p></div></div>${table([currentUser.role==="teacher"?"SESSION ID / ATTENDANCE CODE":"SESSION ID","COURSE","TEACHER","STARTED AT","STATUS","ACTION"],sessionRows)}</section>
  ${currentUser.role==="teacher"?`<section class="panel"><div class="panel-head"><div><h3>Attendance approval requests</h3><p>Students who enter the correct 6-digit code will appear here. Approve to mark Present or Cancel to mark Absent.</p></div></div><div id="late-request-list">Loading requests…</div></section>`:""}
  <section class="panel"><div class="panel-head"><div><h3>Attendance history</h3><p>${records.length} record(s) available</p></div></div>${table(["SESSION ID","COURSE","STUDENT ID","MARKED AT","STATUS"],recordRows)}</section>`;
}
async function routineHTML(){
  const rows=await api("/api/routine");
  const departments=[...new Set(rows.map(r=>r.department).filter(Boolean))].sort();
  const semesters=[...new Set(rows.map(r=>r.semester).filter(Boolean))].sort();
  const sections=[...new Set(rows.map(r=>r.section||"All").filter(Boolean))].sort();
  const filterUI=`<section class="panel"><div class="form-grid">
    <div><label>Filter by Department</label><select id="routine-filter-department" class="select"><option value="">All Departments</option>${departments.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
    <div><label>Filter by Semester</label><select id="routine-filter-semester" class="select"><option value="">All Semesters</option>${semesters.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
    <div><label>Filter by Section</label><select id="routine-filter-section" class="select"><option value="">All Sections</option>${sections.map(x=>`<option>${esc(x)}</option>`).join("")}</select></div>
  <div><label>Filter by Day</label><select id="routine-filter-day" class="select"><option value="">All Days</option>${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(x=>`<option>${x}</option>`).join("")}</select></div></div><p class="muted">Filter your weekly schedule by day.</p></section>`;
  const routineTable=(data)=>table(["COURSE CODE","COURSE NAME","DEPARTMENT","SEMESTER","SECTION","DAY","START","END","TEACHER","ROOM"],data.map(r=>[esc(r.course_code),`<button class="link-button" data-routine-course="${esc(r.course_code)}"><strong>${esc(r.course_name)}</strong> ↗</button>`,esc(r.department),esc(r.semester),esc(r.section||"All"),esc(r.day),esc(r.start_time),esc(r.end_time),esc(r.teacher_name||"—"),esc(r.room)]));
  const createUI=currentUser.role==="admin"?`<section class="panel"><h3>Create class routine</h3><p class="muted">Select multiple departments, semesters, sections and class days when needed.</p><form id="routine-form">
    <div class="form-grid">
      <div><label>Course code</label><input id="rt-code" required></div><div><label>Course name</label><input id="rt-name" required></div>
      <div><label>Department(s)</label><div class="choice-grid">${["CSE","EEE","LAW","English","Bangla","BBA","Economics","Other"].map((x,i)=>`<label class="choice-item"><input type="checkbox" class="rt-dept" value="${x}" ${i===0?"checked":""}> ${x}</label>`).join("")}</div></div>
      <div><label>Semester(s)</label><div class="choice-grid">${["1st","2nd","3rd","4th","5th","6th","7th","8th"].map((x,i)=>`<label class="choice-item"><input type="checkbox" class="rt-semester" value="${x}" ${x==="8th"?"checked":""}> ${x}</label>`).join("")}</div></div>
      <div><label>Section(s)</label><div class="choice-grid">${["A","B","C","D","All"].map((x,i)=>`<label class="choice-item"><input type="checkbox" class="rt-section" value="${x}" ${x==="A"?"checked":""}> ${x}</label>`).join("")}</div></div>
      <div><label>Teacher</label><input id="rt-teacher" placeholder="Teacher name (optional)"></div>
      <div style="grid-column:1/-1"><label>Class days</label><label class="choice-item"><input type="checkbox" id="rt-all-days"> All days except Friday</label><div class="choice-grid" id="rt-days-grid">${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(x=>`<label class="choice-item"><input type="checkbox" class="rt-day" value="${x}" ${x==="Sunday"?"checked":""}> ${x}</label>`).join("")}</div><p class="muted">Select multiple days if this class repeats at the same time.</p></div>
      <div><label>Start time</label><input id="rt-start" type="time" required></div><div><label>End time</label><input id="rt-end" type="time" required></div><div><label>Room</label><input id="rt-room" required></div>
    </div><button class="small-btn" style="margin-top:14px">Create routine</button><div id="routine-error" class="error"></div></form></section>`:"";
  return `${heading("Class routine","Filter by department, semester and section. Combined classes appear in every selected department.")}${filterUI}<section class="panel"><div id="routine-table-wrap">${routineTable(rows)}</div></section>${createUI}`;
}
async function noticesHTML(){
  const rows=await api("/api/notices"); cachedNotices=rows;
  const deptChecks=["CSE","EEE","LAW","English","Bangla","BBA","Economics","Other"].map((x,i)=>`<label class="choice-item"><input type="checkbox" class="notice-dept" value="${x}" ${i===0?"checked":""}> ${x}</label>`).join("");
  const adminForm=currentUser.role==="admin"?`<section class="panel"><h3>Publish notice</h3><form id="notice-form"><div class="form-grid">
    <div><label>Notice title</label><input id="notice-title" required></div>
    <div><label>Notice audience</label><select id="notice-audience" class="select"><option value="all">Everyone (Please review the selected settings. Student)</option><option value="department">Specific Department</option><option value="departments">Multiple Departments</option><option value="teacher_notice">Teacher Notice</option></select></div>
    <div id="notice-single-dept-wrap"><label>Department</label><select id="notice-department" class="select">${["CSE","EEE","LAW","English","Bangla","BBA","Economics","Other"].map(x=>`<option>${x}</option>`).join("")}</select></div>
    <div id="notice-multi-dept-wrap" class="hidden"><label>Departments</label><div class="choice-grid">${deptChecks}</div></div>
    <div id="notice-course-wrap" class="hidden"><label>Assigned course (optional for Teacher Notice)</label><input id="notice-course-code" placeholder="e.g. CSE-301"></div>
    <div style="grid-column:1/-1"><label>Notice details</label><textarea id="notice-description" rows="4" required></textarea></div>
  </div><p class="muted">Teacher Notice: Teachers in selected departments and teachers assigned to the selected course can view this notice.</p><button class="small-btn" style="margin-top:14px">Publish notice</button><div id="notice-error" class="error"></div></form></section>`:"";
  const teacherForm=currentUser.role==="teacher"?`<section class="panel"><h3>Publish class notice</h3><p class="muted">This notice will be published only to students in your authorized department.</p><form id="teacher-notice-form"><div class="form-grid"><div><label>Title</label><input id="teacher-notice-title" required></div><div><label>Audience</label><select id="teacher-notice-audience" class="select"><option value="semester">One semester</option><option value="students">All students in my department</option></select></div><div><label>Semester (if one semester)</label><input id="teacher-notice-semester" placeholder="e.g. 8th"></div><div style="grid-column:1/-1"><label>Notice details</label><textarea id="teacher-notice-description" rows="4" required></textarea></div></div><button class="small-btn" style="margin-top:14px">Publish notice</button><div id="teacher-notice-error" class="error"></div></form></section>`:"";
  return `${heading("Campus notices","Each notice is visible only to its selected audience.")}${adminForm}${teacherForm}<section class="panel"><div class="panel-head"><div><h3>Notices visible to you</h3><p>Click any notice to read the full announcement.</p></div></div>${rows.map((n,i)=>`<button type="button" class="notice-click-card ${currentUser.role==="student"&&!n.is_read?"notice-unread":""}" data-notice-index="${i}" data-notice-id="${n.id}"><span class="notice-symbol">♧</span><span class="notice-click-content"><strong>${esc(n.title)}</strong><p>${esc(n.description).slice(0,145)}${String(n.description||"").length>145?"…":""}</p><small>Published: ${esc(n.created_at)} · ${esc(n.notice_type||"normal")} · Audience: ${esc(n.audience||"all")}${n.departments?` · ${esc(n.departments)}`:""}</small></span><span class="notice-arrow">↗</span></button>`).join("")||`<div class="empty">No notices available.</div>`}</section>`;
}
async function profileHTML(){const p=await api("/api/profile");return `${heading("My Profile","Change your picture and personal details. Your account ID and academic permissions stay protected.")}<section class="panel profile-edit-panel"><div class="profile-edit-intro"><div class="profile-photo-large" id="profile-photo-preview">${p.profile_picture?`<img src="${esc(p.profile_picture)}" alt="Profile picture">`:esc((p.name||"U").charAt(0).toUpperCase())}</div><div><h3>${esc(p.name)}</h3><p class="muted">${esc(currentUser.role.toUpperCase())} · ${esc(currentUser.user_id||currentUser.id||"")}</p><label class="small-btn secondary upload-label" for="profile-file">Upload / change photo</label><input id="profile-file" class="hidden" type="file" accept="image/png,image/jpeg,image/webp"><p class="field-help">JPG, PNG or WebP · maximum 1 MB</p></div></div><form id="profile-form"><div class="form-grid"><div><label>Full name</label><input id="profile-edit-name" value="${esc(p.name)}" required maxlength="100"></div><div><label>Profile picture URL (optional)</label><input id="profile-picture" value="${esc(p.profile_picture.startsWith("data:image/")?"":p.profile_picture)}" placeholder="Or paste an image URL"></div><div><label>Address</label><input id="profile-address" value="${esc(p.address)}" maxlength="250"></div><div><label>Education</label><input id="profile-education" value="${esc(p.education)}" maxlength="250"></div><div style="grid-column:1/-1"><label>Additional qualifications</label><textarea id="profile-qualifications" rows="3" maxlength="1000">${esc(p.qualifications)}</textarea></div></div><button class="small-btn" style="margin-top:14px">Save profile</button> <button class="small-btn secondary" type="button" id="profile-cancel">Cancel</button><div id="profile-error" class="error"></div></form></section>`;}
function bindPageActions(page){
  if(page==="courses"){
    $("start-session")?.addEventListener("click",async()=>{
      try{
        const out=await api("/api/start-session",{method:"POST",body:JSON.stringify({course_id:$("course-select").value,duration_minutes:$("session-duration").value})});
        $("new-session").innerHTML=`<div class="session-box"><span class="muted">Share this Session ID and 6-digit attendance code with students</span><br><strong>Session ID: ${esc(out.session_id)}</strong><p>${esc(out.message)}</p><p><strong>Attendance code: ${esc(out.teacher_otp||"Check server response")}</strong></p><button class="small-btn secondary" id="copy-session" style="margin-top:10px">Copy Session ID</button></div>`;
        $("copy-session").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(out.session_id);toast("Session ID copied.");}catch(e){toast("Session ID: "+out.session_id)}});
        toast("Attendance session started.");
      }catch(e){toast(e.message);}
    });
  }

  if(page==="users"){
    document.querySelectorAll("[data-user-tab]").forEach(b=>b.addEventListener("click",()=>{activeUserTab=b.dataset.userTab;renderPage("users")}));
    ["user-search","user-department-filter","user-semester-filter","user-status-filter"].forEach(id=>$(id)?.addEventListener(id==="user-search"?"input":"change",renderAdminUsers));renderAdminUsers();
    const focusBtn=document.querySelector("[data-user-register-focus]");if(focusBtn)focusBtn.onclick=()=>$("register-account-panel").scrollIntoView({behavior:"smooth",block:"start"});
  }
  const regForm=$("register-form");
  if(regForm){
    const roleSelect=$("reg-role"), semesterField=$("semester-field"), semesterInput=$("reg-semester"), sectionField=$("section-field");
    const syncRole=()=>{const student=roleSelect.value==="student";semesterField.classList.toggle("hidden",!student);sectionField?.classList.toggle("hidden",!student);$("designation-field")?.classList.toggle("hidden",student);semesterInput.required=student;$("reg-id").placeholder=student?"e.g. S004":"e.g. T002";};
    roleSelect.addEventListener("change",syncRole);syncRole();
    regForm.addEventListener("submit",async e=>{e.preventDefault();$("register-error").textContent="";const pw=$("reg-password").value;if(pw.length<4||pw.length>12){$("register-error").textContent="Password must be 4 to 12 characters long.";return;}try{const out=await api("/api/admin/register",{method:"POST",body:JSON.stringify({role:roleSelect.value,user_id:$("reg-id").value,name:$("reg-name").value,department:$("reg-department").value,semester:semesterInput.value,section:$("reg-section")?.value||"A",designation:$("reg-designation")?.value||"Lecturer",password:$("reg-password").value})});toast(`${out.message} ID: ${out.user_id}`);renderPage("users");}catch(err){$("register-error").textContent=err.message;}});
  }
  document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>renderPage(b.dataset.go)));
  document.querySelectorAll("[data-remove-role]").forEach(b=>b.addEventListener("click",async()=>{
    const role=b.dataset.removeRole, id=b.dataset.removeId;
    if(!confirm(`Deactivate ${role} account ${id}? Historical attendance will be preserved.`)) return;
    try{const out=await api(`/api/admin/users/${role}/${encodeURIComponent(id)}`,{method:"DELETE"});toast(out.message);renderPage("users");}
    catch(err){alert(err.message);}
  }));
  document.querySelectorAll("[data-activate-role]").forEach(b=>b.addEventListener("click",async()=>{try{const out=await api(`/api/admin/users/${b.dataset.activateRole}/${encodeURIComponent(b.dataset.activateId)}/activate`,{method:"POST",body:"{}"});toast(out.message);renderPage("users")}catch(e){toast(e.message)}}));
  const audienceSelect=$("notice-audience");
  const updateAudienceFields=()=>{const a=audienceSelect?.value||"all";$("notice-single-dept-wrap")?.classList.toggle("hidden",a!=="department");$("notice-multi-dept-wrap")?.classList.toggle("hidden",!["departments","teacher_notice"].includes(a));$("notice-course-wrap")?.classList.toggle("hidden",a!=="teacher_notice")};
  audienceSelect?.addEventListener("change",updateAudienceFields); updateAudienceFields();
  const nf=$("notice-form"); if(nf) nf.addEventListener("submit",async e=>{e.preventDefault();try{const out=await api("/api/admin/notices",{method:"POST",body:JSON.stringify({title:$("notice-title").value,description:$("notice-description").value,audience:$("notice-audience").value,department:$("notice-department")?.value||"",departments:[...document.querySelectorAll(".notice-dept:checked")].map(x=>x.value),course_code:$("notice-course-code")?.value||""})});toast(out.message);renderPage("notices")}catch(err){$("notice-error").textContent=err.message}});
  const tnf=$("teacher-notice-form"); if(tnf) tnf.addEventListener("submit",async e=>{e.preventDefault();try{const out=await api("/api/teacher/notices",{method:"POST",body:JSON.stringify({title:$("teacher-notice-title").value,description:$("teacher-notice-description").value,audience:$("teacher-notice-audience").value,semester:$("teacher-notice-semester").value})});toast(out.message);renderPage("notices")}catch(err){$("teacher-notice-error").textContent=err.message}});
  const rf=$("routine-form");
  const allDays=$("rt-all-days");
  allDays?.addEventListener("change",()=>{document.querySelectorAll(".rt-day").forEach(x=>{x.checked=false;x.disabled=allDays.checked;});});
  document.querySelectorAll(".rt-day").forEach(x=>x.addEventListener("change",()=>{if(x.checked&&allDays?.checked){allDays.checked=false;document.querySelectorAll(".rt-day").forEach(y=>y.disabled=false);}}));
  if(rf) rf.addEventListener("submit",async e=>{e.preventDefault();try{const out=await api("/api/admin/routine",{method:"POST",body:JSON.stringify({course_code:$("rt-code").value,course_name:$("rt-name").value,departments:[...document.querySelectorAll(".rt-dept:checked")].map(x=>x.value),semesters:[...document.querySelectorAll(".rt-semester:checked")].map(x=>x.value),sections:[...document.querySelectorAll(".rt-section:checked")].map(x=>x.value),teacher_name:$("rt-teacher").value,days:[...document.querySelectorAll(".rt-day:checked")].map(x=>x.value),all_days:$("rt-all-days").checked,start_time:$("rt-start").value,end_time:$("rt-end").value,room:$("rt-room").value})});toast(out.message);renderPage("routine")}catch(err){$("routine-error").textContent=err.message}});
  const bindRoutineCourseLinks=()=>{
    document.querySelectorAll("[data-routine-course]").forEach(btn=>{
      btn.addEventListener("click",()=>{
        const code=btn.dataset.routineCourse;
        api("/api/routine").then(all=>{
          const matches=all.filter(r=>r.course_code===code);
          openInfoModal(`${code} · Combined Classes`,`<p>This course is scheduled for these Department/Semester/Section groups:</p>${table(["DEPARTMENT","SEMESTER","SECTION","DAY","TIME","ROOM"],matches.map(r=>[esc(r.department),esc(r.semester),esc(r.section||"All"),esc(r.day),`${esc(r.start_time)} – ${esc(r.end_time)}`,esc(r.room)]))}`);
        }).catch(err=>toast(err.message));
      });
    });
  };
  const applyRoutineFilters=async()=>{
    try{
      const q=new URLSearchParams();
      if($("routine-filter-department")?.value)q.set("department",$("routine-filter-department").value);
      if($("routine-filter-semester")?.value)q.set("semester",$("routine-filter-semester").value);
      if($("routine-filter-section")?.value)q.set("section",$("routine-filter-section").value);
      if($("routine-filter-day")?.value)q.set("day",$("routine-filter-day").value);
      const rows=await api("/api/routine?"+q.toString());
      const wrap=$("routine-table-wrap");
      if(wrap)wrap.innerHTML=table(["COURSE CODE","COURSE NAME","DEPARTMENT","SEMESTER","SECTION","DAY","START","END","TEACHER","ROOM"],rows.map(r=>[esc(r.course_code),`<button class="link-button" data-routine-course="${esc(r.course_code)}"><strong>${esc(r.course_name)}</strong> ↗</button>`,esc(r.department),esc(r.semester),esc(r.section||"All"),esc(r.day),esc(r.start_time),esc(r.end_time),esc(r.teacher_name||"—"),esc(r.room)]));
      bindRoutineCourseLinks();
    }catch(err){toast(err.message)}
  };
  ["routine-filter-department","routine-filter-semester","routine-filter-section","routine-filter-day"].forEach(id=>$(id)?.addEventListener("change",applyRoutineFilters));
  bindRoutineCourseLinks();
  const pf=$("profile-form"); if(pf){
    const file=$("profile-file"),urlInput=$("profile-picture"),preview=$("profile-photo-preview");let chosenPicture="";
    file?.addEventListener("change",()=>{const f=file.files?.[0];if(!f)return;if(!["image/jpeg","image/png","image/webp"].includes(f.type)){toast("Choose a JPG, PNG or WebP image.");file.value="";return}if(f.size>1024*1024){toast("Image must be smaller than 1 MB.");file.value="";return}const reader=new FileReader();reader.onload=()=>{chosenPicture=String(reader.result||"");preview.innerHTML=`<img src="${chosenPicture}" alt="Profile preview">`;urlInput.value=""};reader.readAsDataURL(f)});
    urlInput?.addEventListener("input",()=>{chosenPicture="";preview.innerHTML=urlInput.value?`<img src="${esc(urlInput.value)}" alt="Profile preview" onerror="this.style.display='none'">`:(($("profile-edit-name").value||"U").charAt(0).toUpperCase())});
    $("profile-edit-name")?.addEventListener("input",()=>{if(!chosenPicture&&!urlInput.value)preview.textContent=($("profile-edit-name").value||"U").charAt(0).toUpperCase()});
    $("profile-cancel")?.addEventListener("click",()=>renderPage("profile"));
    pf.addEventListener("submit",async e=>{e.preventDefault();try{const picture=chosenPicture||urlInput.value.trim();const out=await api("/api/profile",{method:"PUT",body:JSON.stringify({name:$("profile-edit-name").value,address:$("profile-address").value,education:$("profile-education").value,qualifications:$("profile-qualifications").value,profile_picture:picture})});currentUser.name=$("profile-edit-name").value;currentUser.profile_picture=picture;$("profile-name").textContent=currentUser.name;setAvatar(picture,currentUser.name);toast(out.message)}catch(err){$("profile-error").textContent=err.message}});
  }
  if(page==="dashboard"){document.querySelectorAll("[data-dash-notice]").forEach(b=>b.addEventListener("click",async()=>{const n=cachedNotices[Number(b.dataset.dashNotice)]||{};openNoticeModal(n);if(currentUser.role==="student"&&!n.is_read){try{await api(`/api/notices/${b.dataset.noticeId}/read`,{method:"POST",body:"{}"});n.is_read=true;b.classList.remove("notice-unread");const small=b.querySelector("small");if(small)small.textContent=small.textContent.replace("Unread","Read")}catch(e){toast(e.message)}}}));}
  if(page==="notices"){document.querySelectorAll("[data-notice-index]").forEach(b=>b.addEventListener("click",async()=>{const n=cachedNotices[Number(b.dataset.noticeIndex)]||{};openNoticeModal(n);if(currentUser.role==="student"&&!n.is_read){try{await api(`/api/notices/${b.dataset.noticeId}/read`,{method:"POST",body:"{}"});n.is_read=true;b.classList.remove("notice-unread")}catch(e){toast(e.message)}}}));}

  document.querySelectorAll("[data-course-students]").forEach(btn=>btn.addEventListener("click",async()=>{
    const courseId=btn.dataset.courseStudents;const target=$("course-students-result");target.innerHTML='<div class="empty">Loading students…</div>';
    try{const students=await api(`/api/teacher/course/${courseId}/students`);target.dataset.courseId=courseId;target.dataset.students=JSON.stringify(students);renderCourseStudents();}
    catch(err){target.innerHTML=`<div class="empty">${esc(err.message)}</div>`;}
  }));
  ["course-dept-filter","course-sem-filter"].forEach(id=>$(id)?.addEventListener("change",renderCourseStudents));
  function renderCourseStudents(){
    const target=$("course-students-result");if(!target?.dataset.students)return;
    const all=JSON.parse(target.dataset.students),dept=$("course-dept-filter")?.value||"",sem=$("course-sem-filter")?.value||"";
    const list=all.filter(s=>(!dept||s.department===dept)&&(!sem||s.semester===sem));
    target.innerHTML=table(["STUDENT","STUDENT ID","DEPARTMENT","SEMESTER","PRESENT","ABSENT","ATTENDANCE"],list.map(s=>[`<button class="link-button" data-student-detail="${esc(s.student_id)}"><strong>${esc(s.name)}</strong></button>`,esc(s.student_id),esc(s.department),esc(s.semester),s.present,s.absent,`<strong>${s.percentage}%</strong>`]));
    target.querySelectorAll("[data-student-detail]").forEach(b=>b.addEventListener("click",async()=>{try{const d=await api(`/api/teacher/student/${encodeURIComponent(b.dataset.studentDetail)}/attendance?course_id=${target.dataset.courseId}`);openInfoModal(`${d.student.name} · ${d.student.student_id}`,`<p><strong>Attendance:</strong> ${d.summary.percentage}%</p><p><strong>Present:</strong> ${d.summary.present} &nbsp; <strong>Absent:</strong> ${d.summary.absent}</p><p><strong>Department:</strong> ${esc(d.student.department)} · <strong>Semester:</strong> ${esc(d.student.semester)}</p>${table(["SESSION","DATE / TIME","STATUS"],d.history.map(h=>[esc(h.session_id),esc(dateTimeShort(h.marked_at||h.start_time)),`<span class="badge ${h.status==="Absent"?"orange":""}">${esc(h.status)}</span>`]))}`)}catch(e){toast(e.message)}}));
  }

  const mark=async sid=>{const otp=prompt("Enter the 6-digit attendance code provided by your teacher:");if(otp===null)return;if(!/^\d{6}$/.test(otp.trim())){toast("Please enter a valid 6-digit code.");return;}try{const out=await api("/api/mark-attendance",{method:"POST",body:JSON.stringify({session_id:sid,otp:otp.trim()})});toast(out.message);renderPage("attendance");}catch(e){toast(e.message);}};
  const markBtn=$("mark-session");if(markBtn)markBtn.addEventListener("click",async()=>{const otp=$("attendance-code-input").value.trim();if(!/^\d{6}$/.test(otp)){toast("Enter a valid 6-digit attendance code.");return}try{const out=await api("/api/mark-attendance",{method:"POST",body:JSON.stringify({otp})});toast(out.message);renderPage("attendance")}catch(e){toast(e.message)}});
  document.querySelectorAll("[data-mark]").forEach(b=>b.addEventListener("click",()=>mark(b.dataset.mark)));
  document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",async()=>{try{const out=await api("/api/close-session",{method:"POST",body:JSON.stringify({session_id:b.dataset.close})});toast(out.message);renderPage("attendance")}catch(e){toast(e.message)}}));
  const lateBtn=$("late-request"); if(lateBtn)lateBtn.onclick=async()=>{try{const out=await api("/api/late-attendance-requests",{method:"POST",body:JSON.stringify({session_id:$("late-session-id").value.trim(),reason:$("late-reason").value.trim()})});toast(out.message);$("late-session-id").value="";$("late-reason").value="";}catch(e){toast(e.message)}};
  const requestList=$("late-request-list"); if(requestList){(async()=>{try{const items=await api("/api/late-attendance-requests");requestList.innerHTML=items.length?items.map(x=>`<div class="notice-item"><strong>${esc(x.student_name)} · ${esc(x.student_id)}</strong><p>${esc(x.course_code)} · ${esc(x.reason)} · ${esc(x.requested_at)}</p><span class="badge">${esc(x.status)}</span>${x.status==="pending"?` <button class="small-btn" data-review="approve" data-request="${x.id}">Approve</button> <button class="small-btn danger" data-review="cancel" data-request="${x.id}">Cancel</button>`:""}</div>`).join(""):`<div class="empty">No late requests.</div>`;requestList.querySelectorAll("[data-review]").forEach(b=>b.onclick=async()=>{try{const out=await api(`/api/late-attendance-requests/${b.dataset.request}/review`,{method:"POST",body:JSON.stringify({decision:b.dataset.review})});toast(out.message);renderPage("attendance")}catch(e){toast(e.message)}})}catch(e){requestList.textContent=e.message}})()}

}
