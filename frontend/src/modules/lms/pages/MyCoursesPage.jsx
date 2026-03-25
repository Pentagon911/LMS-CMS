import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdBook, MdPlayArrow } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await request.GET('/api/my-courses/');
        setCourses(data.results || []);
      } catch (err) {
        setCourses([
          { id: 1, code: 'CS1012', title: 'Programming Fundamentals', instructor: 'Dr. Smith', progress: 45 },
          { id: 2, code: 'CS1040', title: 'Program Construction', instructor: 'Prof. Johnson', progress: 60 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleContinue = (courseId) => {
    navigate(`/cms/course-content/${courseId}`);
  };

  if (loading) return <div className="loading-state"><div className="spinner"></div><p>Loading courses...</p></div>;

  return (
    <div className="my-courses-container">
      <div className="my-courses-header">
        <h1>My Courses</h1>
        <p className = "course-welcome">Continue your learning journey</p>
      </div>
      <div className="courses-grid">
        {courses.map(course => (
          <div key={course.id} className="course-card">
            <div className="course-thumbnail"><MdBook /></div>
            <div className="course-info">
              <h3>{course.code} - {course.title}</h3>
              <p className="instructor">Instructor: {course.instructor}</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                <span className="complete-text">{course.progress}% completed</span>
              </div>
              <button className="continue-btn" onClick={() => handleContinue(course.id)}>
                <MdPlayArrow /> Continue
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyCoursesPage;