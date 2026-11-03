import './TeacherDashboard.css';

const courses = [
  { code: 'CSE-301', title: 'Database Management System', section: 'CSE · 8th Semester · A', students: 42 },
  { code: 'CSE-303', title: 'Computer Networks', section: 'CSE · 8th Semester · A', students: 38 }
];
export default function TeacherDashboard({ name }) {
  return <section className="teacher-dashboard">
    <div className="teacher-hero">
      <div>
        <p className="eyebrow">TEACHER PORTAL</p>
        <h2>Welcome, {name}</h2>
        <p>Manage assigned courses and review class information.</p>
        </div><div className="teacher-avatar">T</div>
        </div>

    <div className="teacher-stats">
      <article>
        <span>Assigned Courses</span>
        <strong>02</strong>
        </article>
        <article>
          <span>Today's Classes</span>
          <strong>02</strong>
          </article><article>
            <span>Attendance Sessions</span>
            <strong>View</strong>
            </article>
            </div>

    <div className="panel">
      <h2>My Assigned Courses</h2>
      <p className="muted">Sample courses for layout demonstration.</p>
      <div className="teacher-course-list">
        {courses.map(c=><article className="teacher-course" key={c.code}>
          <div className="course-mark">CR</div>
          <div className="course-main">
            <strong>{c.title}</strong>
            <span>{c.code} · {c.section}</span>
            </div>
            <div className="student-count">
              <strong>{c.students}</strong>
              <span>Students</span>
              </div>
              <button type="button" onClick={()=>alert('Preview only: connect attendance actions to the Flask API before recording attendance.')}>Open course</button>
              </article>)}
              </div>
              </div>

    <div className="panel">
      <h2>Quick actions</h2>
      <div className="teacher-actions">
        <button type="button" onClick={()=>alert('Preview only: attendance-session API needs to be connected.')}>Start attendance</button>
        <button type="button" onClick={()=>alert('Preview only: reports API needs to be connected.')}>View attendance report</button>
        </div>
        </div>
  </section>;
}
