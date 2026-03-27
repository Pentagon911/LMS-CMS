import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdSchool,
  MdBook,
  MdGrade,
  MdCalendarToday,
  MdTrendingUp,
  MdBadge,
  MdRefresh,
  MdWarning
} from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './EnrollmentHistoryPage.css';

const EnrollmentHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');

  useEffect(() => {
    fetchEnrollmentHistory();
  }, []);

  const fetchEnrollmentHistory = async () => {
    try {
      setLoading(true);
      const data = await request.GET('/lms/enrollments/enrollment_history/');
      setHistory(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching enrollment history:', err);
      setError('Failed to load enrollment history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getCreditColor = (credits) => {
    if (credits >= 12) return 'high-credits';
    if (credits >= 6) return 'medium-credits';
    return 'low-credits';
  };

  if (loading) {
    return (
      <div className="enrollment-history-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading enrollment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="enrollment-history-container">
        <div className="error-state">
          <MdWarning size={48} />
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchEnrollmentHistory}>
            <MdRefresh /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!history) {
    return (
      <div className="enrollment-history-container">
        <div className="empty-state">
          <MdBook size={64} />
          <p>No enrollment history found.</p>
        </div>
      </div>
    );
  }

  const semesters = history.history?.map(h => h.semester) || [];
  const filteredHistory = selectedSemester === 'all'
    ? history.history
    : history.history?.filter(h => h.semester === parseInt(selectedSemester));

  return (
    <div className="enrollment-history-container">
      {/* Header Section */}
      <div className="history-header">
        <h1>Enrollment History</h1>
        <p className="history-subtitle">Track your academic journey</p>
      </div>

      {/* Student Info Card */}
      {history.student && (
        <div className="student-info-card">
          <div className="student-avatar">
            <MdSchool size={32} />
          </div>
          <div className="student-details">
            <h2>{history.student.name}</h2>
            <div className="student-meta">
              <span className="meta-item">
                <MdBadge className="meta-icon" />
                Index: {history.student.index_number}
              </span>
              <span className="meta-item">
                <MdSchool className="meta-icon" />
                Program: {history.student.program}
              </span>
            </div>
          </div>
          <div className="stats-summary">
            <div className="stat-item">
              <span className="stat-value">{history.total_credits}</span>
              <span className="stat-label">Total Credits</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{history.total_gpa_credits}</span>
              <span className="stat-label">GPA Credits</span>
            </div>
          </div>
        </div>
      )}

      {/* Semester Filter */}
      {semesters.length > 0 && (
        <div className="filter-section">
          <label className="filter-label">
            <MdCalendarToday className="filter-icon" />
            Filter by Semester:
          </label>
          <select
            className="semester-select"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="all">All Semesters</option>
            {semesters.sort((a, b) => b - a).map(sem => (
              <option key={sem} value={sem}>Semester {sem}</option>
            ))}
          </select>
        </div>
      )}

      {/* Enrollment History List */}
      <div className="history-list">
        {filteredHistory?.length === 0 ? (
          <div className="empty-state">
            <MdWarning size={48} />
            <p>No enrollment records found for the selected semester.</p>
          </div>
        ) : (
          filteredHistory?.map((semesterData) => (
            <div key={semesterData.semester} className="semester-card">
              <div className="semester-header">
                <div className="semester-title">
                  <h2>Semester {semesterData.semester}</h2>
                  <span className={`credit-badge ${getCreditColor(semesterData.total_credits)}`}>
                    {semesterData.total_credits} Credits
                  </span>
                </div>
                <div className="semester-stats">
                  <div className="stat-badge">
                    GPA Credits: {semesterData.gpa_credits}
                  </div>
                </div>
              </div>

              <div className="courses-table-container">
                <table className="courses-table">
                  <thead>
                    <tr>
                      <th>Course Code</th>
                      <th>Course Name</th>
                      <th>Credits</th>
                      <th>Offering Type</th>
                      <th>GPA Status</th>
                      <th>Instructor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semesterData.courses?.map((course) => (
                      <tr key={course.id} className="course-row">
                        <td className="course-code">
                          <strong>{course.code}</strong>
                        </td>
                        <td className="course-name">
                          {course.name}
                          {course.color && (
                            <span
                              className="color-dot"
                              style={{ backgroundColor: course.color }}
                              title={`Course color: ${course.color}`}
                            />
                          )}
                        </td>
                        <td className="course-credits">
                          {course.credits}
                        </td>
                        <td>
                          <span className={`offering-badge ${course.offering_type}`}>
                            {course.offering_type === 'compulsory' ? 'Compulsory' : 'Elective'}
                          </span>
                        </td>
                        <td>
                          <span className={`gpa-badge ${course.gpa_applicable ? 'gpa-yes' : 'gpa-no'}`}>
                            {course.gpa_applicable ? 'GPA Applicable' : 'Non-GPA'}
                          </span>
                        </td>
                        <td className="course-instructor">
                          {course.instructor_name || 'Not Assigned'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="semester-total">
                      <td colSpan="2" className="total-label">
                        <strong>Semester Total</strong>
                      </td>
                      <td className="total-value">
                        <strong>{semesterData.total_credits} Credits</strong>
                      </td>
                      <td colSpan="3" className="gpa-total">
                        <strong>GPA Credits: {semesterData.gpa_credits}</strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Overall Summary Footer */}
      {history.history?.length > 0 && selectedSemester === 'all' && (
        <div className="overall-summary">
          <div className="summary-card">
            <h3>Academic Summary</h3>
            <div className="summary-stats">
              <div className="summary-item">
                <MdTrendingUp className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-value">{history.total_credits}</span>
                  <span className="summary-label">Total Credits Enrolled</span>
                </div>
              </div>
              <div className="summary-item">
                <MdGrade className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-value">{history.total_gpa_credits}</span>
                  <span className="summary-label">GPA Eligible Credits</span>
                </div>
              </div>
              <div className="summary-item">
                <MdSchool className="summary-icon" />
                <div className="summary-info">
                  <span className="summary-value">{semesters.length}</span>
                  <span className="summary-label">Semesters Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentHistoryPage;