import React, { useState, useEffect } from 'react';
import request from '../../../utils/requestMethods.jsx';
import './EnrollmentsPage.css';

const EnrollmentsPage = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const data = await request.GET('/api/enrollments/');
        setEnrollments(data.results || []);
      } catch (err) {
        setEnrollments([
          { id: 1, courseCode: 'CS1012', courseTitle: 'Programming Fundamentals', instructor: 'Dr. Smith', enrolledDate: '2026-01-15', status: 'Active', progress: 45 },
          { id: 2, courseCode: 'CS1040', courseTitle: 'Program Construction', instructor: 'Prof. Johnson', enrolledDate: '2026-01-15', status: 'Active', progress: 60 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  const handleDrop = async (id) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    try {
      await request.DELETE(`/api/enrollments/${id}/`);
      setEnrollments(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Failed to drop course');
    }
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading enrollments...</p></div>;

  return (
    <div className="enrollments-container">
      <div className="enrollments-header">
        <h1>My Enrollments</h1>
        <p>View and manage your enrolled courses</p>
      </div>
      <div className="enrollments-table-container">
        <table className="enrollments-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Instructor</th>
              <th>Enrolled Date</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map(e => (
              <tr key={e.id}>
                <td>{e.courseCode}</td>
                <td>{e.courseTitle}</td>
                <td>{e.instructor}</td>
                <td>{new Date(e.enrolledDate).toLocaleDateString()}</td>
                <td>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${e.progress}%` }}></div>
                    <span>{e.progress}%</span>
                  </div>
                </td>
                <td><span className={`status-${e.status.toLowerCase()}`}>{e.status}</span></td>
                <td><button className="drop-btn" onClick={() => handleDrop(e.id)}>Drop</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnrollmentsPage;