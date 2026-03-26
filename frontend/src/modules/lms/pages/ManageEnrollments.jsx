import React, { useState, useEffect } from 'react';
import request from '../../../utils/requestMethods.jsx';
import './ManageEnrollments.css';

const ManageEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ course: '', student: '' });
  const [role, setRole] = useState(null);

  // Fetch current user role from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setRole(user.role);
      } catch (err) {
        console.error('Failed to parse user', err);
      }
    }
  }, []);

  // Fetch enrollments
  const fetchEnrollments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await request.GET('/lms/enrollments/');
      const data = response.results || response;
      console.log('📦 Enrollments data:', data);
      setEnrollments(data);
    } catch (err) {
      console.error('Failed to fetch enrollments:', err);
      setError('Failed to load enrollments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses for filter
  const fetchCourses = async () => {
    try {
      const response = await request.GET('/lms/courses/');
      setCourses(response.results || response);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    }
  };

  useEffect(() => {
    fetchEnrollments();
    fetchCourses();
  }, []);

  // ---------- Safe getters ----------
  const getStudentName = (enrollment) => {
    if (!enrollment) return '—';
    if (enrollment.student_name) return enrollment.student_name;
    if (enrollment.student) {
      if (enrollment.student.first_name) {
        return `${enrollment.student.first_name} ${enrollment.student.last_name || ''}`.trim();
      }
      if (enrollment.student.full_name) return enrollment.student.full_name;
      if (enrollment.student.name) return enrollment.student.name;
    }
    return '—';
  };

  const getStudentId = (enrollment) => {
    if (!enrollment) return '—';
    if (enrollment.student_id) return enrollment.student_id;
    if (enrollment.student?.username) return enrollment.student.username;
    if (enrollment.student?.id) return enrollment.student.id;
    return '—';
  };

  const getCourseCode = (enrollment) => {
    if (!enrollment) return '—';
    if (enrollment.course_code) return enrollment.course_code;
    if (enrollment.course?.code) return enrollment.course.code;
    return '—';
  };

  const getCourseTitle = (enrollment) => {
    if (!enrollment) return '—';
    if (enrollment.course_title) return enrollment.course_title;
    if (enrollment.course?.name) return enrollment.course.name;
    if (enrollment.course?.title) return enrollment.course.title;
    return '—';
  };

  const getCourseId = (enrollment) => {
    if (!enrollment) return null;
    if (enrollment.course_id) return enrollment.course_id;
    if (enrollment.course?.id) return enrollment.course.id;
    return null;
  };

  // Filter enrollments
  const filteredEnrollments = enrollments.filter(enrollment => {
    const courseId = getCourseId(enrollment);
    if (filters.course && courseId !== parseInt(filters.course)) return false;

    const studentName = getStudentName(enrollment);
    const studentId = getStudentId(enrollment);
    const searchString = `${studentName} ${studentId}`.toLowerCase();
    if (filters.student && !searchString.includes(filters.student.toLowerCase())) return false;

    return true;
  });

  // Delete enrollment (admin only)
  const handleDelete = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to delete this enrollment?')) return;
    try {
      await request.DELETE(`/lms/enrollments/${enrollmentId}/`);
      fetchEnrollments();
    } catch (err) {
      alert('Failed to delete enrollment.');
      console.error(err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString();
  };

  // Determine colspan for empty row
  const emptyRowColspan = role === 'admin' ? 7 : 6;

  if (loading) {
    return (
      <div className="manage-enrollments-loading">
        <div className="manage-enrollments-spinner"></div>
        <p>Loading enrollments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-enrollments-error">
        <p>{error}</p>
        <button onClick={fetchEnrollments}>Retry</button>
      </div>
    );
  }

  return (
    <div className="manage-enrollments-container">
      <div className="manage-enrollments-header">
        <h1>Manage Enrollments</h1>
        <p>
          {role === 'admin'
            ? 'View and manage all student enrollments.'
            : 'View enrollments for your courses.'}
        </p>
      </div>

      {/* Filters */}
      <div className="manage-enrollments-filters">
        <select
          value={filters.course}
          onChange={(e) => setFilters({ ...filters, course: e.target.value })}
          className="filter-select"
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.code}: {course.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search by student name or ID"
          value={filters.student}
          onChange={(e) => setFilters({ ...filters, student: e.target.value })}
          className="filter-input"
        />
      </div>

      {/* Enrollments Table */}
      <div className="manage-enrollments-table-container">
        <table className="manage-enrollments-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student ID</th>
              <th>Course Code</th>
              <th>Course Title</th>
              <th>Enrollment Date</th>
              <th>Status</th>
              {role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr>
                <td colSpan={emptyRowColspan} className="empty-row">
                  No enrollments found.
                </td>
              </tr>
            ) : (
              filteredEnrollments.map(enrollment => (
                <tr key={enrollment.id}>
                  <td>{getStudentName(enrollment)}</td>
                  <td>{getStudentId(enrollment)}</td>
                  <td>{getCourseCode(enrollment)}</td>
                  <td>{getCourseTitle(enrollment)}</td>
                  <td>{formatDate(enrollment.enrollment_date)}</td>
                  <td>
                    <span className={`status-badge status-${enrollment.status?.toLowerCase() || 'active'}`}>
                      {enrollment.status || 'Enrolled'}
                    </span>
                  </td>
                  {role === 'admin' && (
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(enrollment.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageEnrollments;