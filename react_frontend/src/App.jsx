import { useState } from 'react';
import AdminDashboard from './components/admin/AdminDashboard.jsx';
import StudentDashboard from './components/student/StudentDashboard.jsx';
import TeacherDashboard from './components/teacher/TeacherDashboard.jsx';
import './styles/app.css';

export default function App() {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('Demo User');
  const [message, setMessage] = useState('This is a UI learning preview. Connect and test API actions before using real data.');
  return <div className="app-shell">
    <header className="topbar"><div className="brand">
      <span className="brand-icon">C</span>
      <div>
        <strong>CampusOne</strong>
        <small>University Management System</small>
        </div>
        </div>

      <label className="role-picker">Preview role <select value={role} onChange={e => setRole(e.target.value)}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="admin">Admin</option>
        </select>
        </label>

    </header>


    <main className="main">
      <div className="welcome">
        <div>
          <p className="eyebrow">WORKSPACE / {role.toUpperCase()}</p>

          <h1>{role[0].toUpperCase()+role.slice(1)} Dashboard</h1>
          <p>Use the separate files to learn and edit each dashboard independently.</p>
          </div>

      <label className="name-field">Preview name<input value={name} onChange={e=>setName(e.target.value)} />
      </label>
      </div>
      
      <div className="notice-strip">{message}</div>
      {role === 'admin' && <AdminDashboard />}
      {role === 'student' && <StudentDashboard name={name} />}
      {role === 'teacher' && <TeacherDashboard name={name} />}
      <footer>CampusOne learning edition · UI preview only</footer>
    </main>
  </div>;
}
