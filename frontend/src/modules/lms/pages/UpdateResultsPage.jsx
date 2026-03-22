import React, { useState, useEffect } from 'react';
import { MdUpload } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './UpdateResultsPage.css';

const UpdateResultsPage = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await request.GET('/api/instructor/courses/');
        setCourses(data.results || [
          { id: 1, code: 'CS1012', title: 'Programming Fundamentals' },
          { id: 2, code: 'CS1040', title: 'Program Construction' },
        ]);
      } catch (err) {
        setCourses([
          { id: 1, code: 'CS1012', title: 'Programming Fundamentals' },
          { id: 2, code: 'CS1040', title: 'Program Construction' },
        ]);
      }
    };
    fetchCourses();
  }, []);

  const handleLoadStudents = async () => {
    if (!selectedCourse || !semester || !year) return;
    setLoading(true);
    try {
      const data = await request.GET(`/api/courses/${selectedCourse}/students?semester=${semester}&year=${year}`);
      setStudents(data.results || [
        { id: 1, name: 'John Doe', registrationNo: 'STU001', marks: '' },
        { id: 2, name: 'Jane Smith', registrationNo: 'STU002', marks: '' },
      ]);
    } catch (err) {
      setMessage('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, marks) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, marks } : s));
  };

  const handleSubmit = async () => {
    if (students.some(s => s.marks === '')) {
      setMessage('Please enter marks for all students');
      return;
    }
    setLoading(true);
    try {
      await request.POST(`/api/courses/${selectedCourse}/results`, { semester, year, students });
      setMessage('Results uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to upload results');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-results-container">
      <div className="update-results-header">
        <h1>Update Results</h1>
        <p>Enter or update student marks for your courses</p>
      </div>

      <div className="selection-panel">
        <div className="form-group">
          <label>Course</label>
          <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Semester</label>
          <select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">Select Semester</option>
            <option value="Semester 1">Semester 1</option>
            <option value="Semester 2">Semester 2</option>
          </select>
        </div>
        <div className="form-group">
          <label>Year</label>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">Select Year</option>
            {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button className="load-btn" onClick={handleLoadStudents} disabled={!selectedCourse || !semester || !year}>
          Load Students
        </button>
      </div>

      {students.length > 0 && (
        <div className="marks-table-container">
          <table className="marks-table">
            <thead>
              <tr><th>Registration No.</th><th>Student Name</th><th>Marks</th></tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td>{student.registrationNo}</td>
                  <td>{student.name}</td>
                  <td><input type="number" min="0" max="100" value={student.marks} onChange={(e) => handleMarksChange(student.id, e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="actions">
            <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Uploading...' : <><MdUpload /> Upload Results</>}
            </button>
          </div>
        </div>
      )}

      {message && <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>{message}</div>}
    </div>
  );
};

export default UpdateResultsPage;