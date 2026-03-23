import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import { getUserFromToken} from "../../../utils/auth";
import WeekCard from '../components/WeekCard.jsx';
import './CourseContentPage.css';
import { MdCalendarMonth, MdLibraryBooks } from 'react-icons/md';

const CourseContentPage = () => {
  const { moduleCode } = useParams();
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [courseTitle, setCourseTitle] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [newWeekName, setNewWeekName] = useState('');


  useEffect(()=>{
      const token = getUserFromToken();
      setUser(token);
  },[]);

  // Fetch course content based on module code
  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for module: ${moduleCode} from /_data/${moduleCode}.json`);
        
        const data = await request.GET(`/cms/courses/${moduleCode}/dashboard`);
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

  const handleAddWeek = () => {
    if (!newWeekName.trim()) return; 
    const newWeek = {
      week: newWeekName,
      items: []
    };
    setCourseData([...courseData, newWeek]);
    setShowAddWeekModal(false);
    setNewWeekName('');
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
              <span className="meta-icon"><MdCalendarMonth /></span>
              <span className="meta-label">Total Weeks:</span>
              {courseData.length}
            </span>
            
            <span className="meta-badge">
              <span className="meta-icon"><MdLibraryBooks /></span>
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
      <button className="add-week-btn" onClick={() => setShowAddWeekModal(true)}>
        + Add New Week
      </button>
      )}

      {/* Add Week Modal */}
      {showAddWeekModal && (
        <div className="modal-overlay" onClick={() => setShowAddWeekModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Week</h3>
              <button className="close-btn" onClick={() => setShowAddWeekModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Week Name</label>
                <input
                  type="text"
                  value={newWeekName}
                  onChange={(e) => setNewWeekName(e.target.value)}
                  placeholder="e.g., Week 1: Introduction"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddWeekModal(false)}>
                Cancel
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleAddWeek}
                disabled={!newWeekName.trim()}
              >
                Add Week
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseContentPage;
