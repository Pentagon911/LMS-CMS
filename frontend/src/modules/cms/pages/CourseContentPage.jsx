import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import WeekCard from '../components/WeekCard.jsx';
import './CourseContentPage.css';

const CourseContentPage = () => {
  const { moduleCode } = useParams();
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [courseTitle, setCourseTitle] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    }
  }, []);

  // Fetch course content based on module code
  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for module: ${moduleCode} from /_data/${moduleCode}.json`);
        
        const data = await request.GET(`/_data/${moduleCode}.json`);
        console.log("Raw data received:", data);
        
        // Check if data exists and has the expected structure
        if (data && typeof data === 'object') {
          console.log("Data type:", Array.isArray(data) ? "array" : "object");
          console.log("Data keys:", Object.keys(data));
          
          // Check for courseTitle specifically
          if (data.courseTitle) {
            console.log("Found courseTitle:", data.courseTitle);
            setCourseTitle(data.courseTitle);
          } else {
            console.log("No courseTitle found in data");
            setCourseTitle('Course Content');
          }
          
          // Check for weeks
          if (data.weeks && Array.isArray(data.weeks)) {
            console.log("Found weeks array with length:", data.weeks.length);
            setCourseData(data.weeks);
          } else if (Array.isArray(data)) {
            console.log("Data is array, using as weeks array");
            setCourseData(data);
          } else {
            console.log("No weeks array found");
            setCourseData([]);
          }
        } else {
          console.log("Invalid data format received");
          setError("Invalid data format");
        }
        
      } catch (err) {
        console.error("Failed to load course content:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (moduleCode) {
      fetchCourseContent();
    }
  }, [moduleCode]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log("Current state - courseTitle:", courseTitle);
    console.log("Current state - courseData:", courseData);
  }, [courseTitle, courseData]);

  const handleContentClick = (item) => {
    console.log("Content clicked:", item);
    
    switch(item.type) {
      case 'content':
        if (item.fileUrl) {
          window.open(item.fileUrl, '_blank');
        }
        break;
        
      case 'quiz':
        navigate(`/quiz/${item.quizId}`);
        break;
        
      case 'announcement':
        alert(item.message || "No additional details");
        break;
        
      default:
        break;
    }
  };

  const handleAddContent = async (weekIndex, newItem) => {
    if (!user || user.role === 'student') return;
    
    try {
      if (!['content', 'quiz', 'announcement'].includes(newItem.type)) {
        throw new Error('Invalid item type. Only content, quiz, and announcement are allowed.');
      }

      console.log("Adding content:", { weekIndex, newItem });
      
      const updatedData = [...courseData];
      updatedData[weekIndex].items.push(newItem);
      setCourseData(updatedData);
      
    } catch (err) {
      console.error("Failed to add content", err);
      alert("Failed to add content. Please try again.");
    }
  };

  const isLecturer = user?.role && user?.role !== 'student';

  if (loading) {
    return (
      <div className="course-content-loading">
        <div className="loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error || !courseData || courseData.length === 0) {
    return (
      <div className="course-content-error">
        <p>Error: {error || 'Course not found or empty'}</p>
        <p>Module Code: {moduleCode}</p>
        <button onClick={() => navigate('/cms/courses')}>
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="course-content-container">

      {/* Course Header */}
      <div className="course-header">
        <button className="back-btn" onClick={() => navigate('/cms/courses')}>
          ←
        </button>
        
        <div className="course-info">
          <h1 className="course-title">
            <span className="module-code">{moduleCode}:</span> {courseTitle}
          </h1>
          
          <div className="course-meta">
            <span className="meta-badge">
              <span className="meta-icon">📚</span>
              <span className="meta-label">Total Weeks:</span>
              {courseData.length}
            </span>
            
            <span className="meta-badge">
              <span className="meta-icon">📊</span>
              <span className="meta-label">Total Items:</span>
              {courseData.reduce((total, week) => total + (week.items?.length || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Weeks Content */}
      <div className="weeks-container">
        {courseData.map((week, index) => (
          <WeekCard
            key={index}
            data={week}
            isLecturer={isLecturer}
            onContentClick={handleContentClick}
            onAddContent={(newItem) => handleAddContent(index, newItem)}
          />
        ))}
      </div>

      {/* Floating Action Button for Lecturers */}
      {isLecturer && (
        <button 
          className="fab-btn"
          onClick={() => {
            const lastWeekIndex = courseData.length - 1;
            
            const type = window.prompt("Enter type (content, quiz, announcement):", "content");
            
            if (type && ['content', 'quiz', 'announcement'].includes(type)) {
              const title = window.prompt("Enter title:", "New Item");
              
              if (title) {
                const newItem = {
                  type: type,
                  title: title,
                  ...(type === 'content' && { format: 'PDF', fileUrl: '/files/new_content.pdf' }),
                  ...(type === 'quiz' && { quizId: `quiz-${Date.now()}` }),
                  ...(type === 'announcement' && { message: "New announcement" })
                };
                
                handleAddContent(lastWeekIndex, newItem);
              }
            } else if (type) {
              alert("Invalid type. Please enter content, quiz, or announcement.");
            }
          }}
          title="Quick Add"
        >
          +
        </button>
      )}
    </div>
  );
};

export default CourseContentPage;
