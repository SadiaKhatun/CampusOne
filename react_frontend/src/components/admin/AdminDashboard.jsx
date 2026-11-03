import './AdminDashboard.css';

const departments = ['CSE', 'EEE', 'LAW', 'English', 'Bangla', 'BBA'];
const semesters = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

export default function AdminDashboard() {
  return <section className="admin-dashboard">
    <div className="stat-grid">
      <article className="stat-card">
        <span>Departments</span>
        <strong>06</strong>
        <small>Example preview data</small>
        </article>

      <article className="stat-card">
        <span>Semesters</span>
        <strong>08</strong>
        <small>1st to 8th semester</small>
        </article>
 
      <article className="stat-card">
        <span>Routine actions</span>
        <strong>Manage</strong>
        <small>Connect to backend to save changes</small>
        </article>
    </div>


    <div className="panel">
      <div className="panel-heading">
        <div><h2>Routine setup</h2>
        <p>Choose a department, semester and class days.</p>
        </div>
        </div>

      <div className="form-grid">
        <label>Department<select>
          {departments.map(d=><option key={d}>{d}</option>)}
          </select>
          </label>
      <label>Semester<select>
        {semesters.map(s=><option key={s}>{s}</option>)}</select>
        </label>
      <label>Course name<input placeholder="e.g. Database Management" /></label>
      <label>Room<input placeholder="e.g. Room 402" />
      </label>
      </div>


      <p className="field-title">Class days</p>
      <div className="day-list">
        {['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>
        <label key={d} className="day-option">
          <input type="checkbox" disabled={d==='Friday'} />{d}{d==='Friday'&&<small>Excluded in this example</small>}</label>)}</div>
      <button type="button" className="primary-button" onClick={()=>alert('Preview only: connect this form to the Flask API before saving real routines.')}>Preview save action</button>
    </div>

    <div className="panel">
      <h2>Notice audience</h2>
      <div className="form-grid">
        <label>Audience<select>
          <option>Everyone</option>
          <option>Specific Department</option>
          <option>Multiple Departments</option>
          <option>Teacher Notice</option>
          </select>
          </label>
          <label>Notice title<input placeholder="Enter notice title" />
          </label>
          </div>
          <p className="muted">This UI illustrates the fields. Backend permissions and saving must be connected and tested.</p>
          </div>
          
  </section>;
}
