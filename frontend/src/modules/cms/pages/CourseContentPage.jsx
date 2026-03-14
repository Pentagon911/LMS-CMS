import React from 'react';
import { useLocation, useParams } from 'react-router-dom';

const CourseContentPage = () => {
  const { courseId } = useParams();
  const location = useLocation();
  const { moduleCode, courseTitle } = location.state || {};

  return (
    <div style={{
      padding: '2rem',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <h1>{courseTitle || 'Course Content'}</h1>
      <p>Module Code: {moduleCode}</p>
      <p>Course ID: {courseId}</p>
      
      {/* Add your course content here */}
      <div style={{
        marginTop: '2rem',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '10px'
      }}>
        <h2>Course Content</h2>
        <p>Your course content will appear here...</p>
      </div>
    </div>
  );
};

export default CourseContentPage;
