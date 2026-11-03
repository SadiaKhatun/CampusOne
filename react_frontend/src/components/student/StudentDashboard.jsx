import './StudentDashboard.css';

const classes = [
  { time: '10:00–11:00', course: 'Database Management System', code: 'CSE-301', room: 'Room 402', teacher: 'Rahim Ahmed' },
  { time: '12:00–13:00', course: 'Computer Networks', code: 'CSE-303', room: 'Lab 2', teacher: 'Rahim Ahmed' }
];
export default function StudentDashboard({ name }) {
  return <section className="student-dashboard">
    <div className="student-hero">
      <div>
        <p className="eyebrow">STUDENT PORTAL</p>
        <h2>Welcome, {name}</h2>
        <p>CSE · 8th Semester · Section A</p>
        </div>
        <div className="attendance-badge">
          <strong>92%</strong>
          <span>Attendance preview</span>
          </div>
          </div>

    <div className="student-grid">
      <article className="student-card">
        <span className="card-icon">▦</span>
        <p>Today's Classes</p>
        <strong>02</strong>
        <small>Classes scheduled today (sample)</small>
        </article>
        <article className="student-card">
          <span className="card-icon">✓</span>
          <p>Attendance</p>
          <strong>92%</strong>
          <small>Sample display, not live data</small>
          </article>
          <article className="student-card">
            <span className="card-icon">♧</span>
            <p>New Notices</p>
            <strong>02</strong>
            <small>Sample display</small>
            </article>
            </div>


    <div className="panel">
      <div className="student-panel-head">
        <div>
          <h2>Today's Classes</h2>
          <p>Sample routine for layout demonstration</p>
          </div>
          <select aria-label="Choose day" defaultValue="Sunday">
            {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>
            <option key={d}>{d}</option>)}
            </select>
            </div>

      <div className="class-list">{classes.map(c=>
        <article className="class-row" key={c.code}>
          <div className="class-time">{c.time}</div>
          <div className="class-info">
            <strong>{c.course}</strong>
            <span>{c.code} · {c.teacher}</span>
            </div>
            <div className="class-room">{c.room}</div>
            </article>)}
            </div>
    </div>
  </section>;
}
