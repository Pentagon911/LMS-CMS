import React, { useState, useEffect } from 'react';
import request from '../../../utils/requestMethods.jsx';
import './EnrollmentsPage.css';

const EnrollmentsPage = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // GET /lms/enrollments/current_semester_modules/
      const response = await request.GET('/lms/enrollments/current_semester_modules/');
      // The response contains { enrolled: [...], available: [...] }
      setEnrolledCourses(response.enrolled || []);
      setAvailableCourses(response.available || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Enroll in a course
  const handleEnroll = async (courseId) => {
    try {
      // POST /lms/enrollments/enroll_me/
      await request.POST('/lms/enrollments/enroll_me/', { course: courseId });
      // Refresh after successful enrollment
      await fetchData();
    } catch (err) {
      console.error('Enrollment failed:', err);
      alert('Enrollment failed. Please try again.');
    }
  };

  // Drop a course
  const handleDrop = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    try {
      // POST /lms/enrollments/unenroll_me/
      await request.POST('/lms/enrollments/unenroll_me/', { course: courseId });
      // Refresh after successful drop
      await fetchData();
    } catch (err) {
      console.error('Drop failed:', err);
      alert('Failed to drop course. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  // Helper to safely display instructor name (handles string or object)
  const getInstructorName = (instructor) => {
    if (!instructor) return '—';
    if (typeof instructor === 'string') return instructor;
    // If it's an object with full_name or name property
    return instructor.full_name || instructor.name || '—';
  };

  return (
    <div className="enrollments-container">
      <div className="enrollments-header">
        <h1>My Enrollments</h1>
        <p>View and manage your enrolled courses</p>
      </div>

      {/* Enrolled Courses Section */}
      <section className="enrollments-section">
        <h2>Enrolled Courses</h2>
        <div className="enrollments-table-container">
          <table className="enrollments-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Instructor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enrolledCourses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    You are not enrolled in any courses.
                  </td>
                </tr>
              ) : (
                enrolledCourses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{getInstructorName(course.instructor)}</td>
                    <td>
                      <button
                        className="drop-btn"
                        onClick={() => handleDrop(course.id)}
                      >
                        Drop
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Available Courses Section */}
      <section className="enrollments-section">
        <h2>Available Courses</h2>
        <div className="enrollments-table-container">
          <table className="enrollments-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Title</th>
                <th>Instructor</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {availableCourses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    No courses available for enrollment.
                  </td>
                </tr>
              ) : (
                availableCourses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.code}</td>
                    <td>{course.name}</td>
                    <td>{getInstructorName(course.instructor)}</td>
                    <td>
                      <button
                        className="enroll-btn"
                        onClick={() => handleEnroll(course.id)}
                      >
                        Enroll
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default EnrollmentsPage;