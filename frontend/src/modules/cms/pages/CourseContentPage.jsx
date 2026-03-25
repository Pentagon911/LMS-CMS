import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import request from '../../../utils/requestMethods.jsx';
import { getUserFromToken } from "../../../utils/auth";
import WeekCard from '../components/WeekCard.jsx';
import './CourseContentPage.css';
import { MdCalendarMonth, MdLibraryBooks } from 'react-icons/md';

const CourseContentPage = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  
  const [courseData, setCourseData] = useState(null);
  const [courseTitle, setCourseTitle] = useState(''); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAddWeekModal, setShowAddWeekModal] = useState(false);
  const [newWeekName, setNewWeekName] = useState('');

  useEffect(() => {
    const token = getUserFromToken();
    setUser(token);
  }, []);

  // Fetch course content based on module ID
  useEffect(() => {
    const fetchCourseContent = async () => {
      if (!moduleId) {
        console.log("No moduleId provided");
        setError("No module ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log(`Fetching data for module ID: ${moduleId}`);
        
        let data;
        try {
          data = await request.GET(`/cms/courses/${moduleId}/dashboard/`);
          console.log("Data from dashboard endpoint:", data);
        } catch (dashboardError) {
          console.log("Dashboard endpoint failed, trying courses endpoint");
        }
        
        if (!data) {
          throw new Error("No data received from server");
        }
        
        // Parse the response based on structure
        let weeks = [];
        let title = '';
        
        if (data.weeks && Array.isArray(data.weeks)) {
          weeks = data.weeks;
          title = data.courseTitle || data.title || 'Course Content';
        } else if (data.content && Array.isArray(data.content)) {
          weeks = data.content;
          title = data.courseTitle || data.title || 'Course Content';
        } else if (Array.isArray(data)) {
          weeks = data;
          title = 'Course Content';
        } else {
          console.log("Unexpected data structure:", Object.keys(data));
          // If the data is the weeks array directly
          if (data.length !== undefined) {
            weeks = data;
            title = 'Course Content';
          } else {
            throw new Error("Invalid data format");
          }
        }
        
        console.log("Parsed weeks:", weeks);
        setCourseTitle(title);
        setCourseData(weeks);
        setError(null);
        
      } catch (err) {
        console.error("Failed to load course content:", err);
        console.error("Error details:", err.message);
        setError(err.message || 'Failed to load course content');
        setCourseData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseContent();
  }, [moduleId]);

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
    
    let response;
    let apiUrl;
    
    if (newItem.type === 'quiz') {
      // Quiz endpoint
      apiUrl = `/cms/quizzes/${quizzId}/add_to_week/`;
      response = await request.POST(apiUrl, newItem);
    } else if(newItem.type === 'announcement') {
      apiUrl = `/cms/courses/${moduleId}/weeks/${weekIndex + 1}/announcement/create/`;
      response = await request.POST(apiUrl, newItem);
    } else{
        apiUrl = '/cms/weeks/${weekIndex + 1}/upload/';
        response = await request.POST(apiUrl, newItem);
    }
    // Update local state with the response
    const updatedData = [...courseData];
    updatedData[weekIndex].items.push(response.data || newItem);
    setCourseData(updatedData);
    
  } catch (err) {
    console.error("Failed to add content", err);
    alert("Failed to add content. Please try again.");
  }
};

  const handleAddWeek = async () => {
    if (!newWeekName.trim()) return;
    
    try {
      // Make API call to add week
      const response = await request.POST(`/cms/courses/${moduleId}/weeks/`, {
        name: newWeekName,
        weekNumber: courseData.length + 1
      });
      console.log("Week added:", response);
      
      const newWeek = response.data || { week: newWeekName, items: [] };
      setCourseData([...courseData, newWeek]);
      setShowAddWeekModal(false);
      setNewWeekName('');
      
    } catch (err) {
      console.error("Failed to add week", err);
      alert("Failed to add week. Please try again.");
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

  if (error) {
    return (
      <div className="course-content-error">
        <p>Error: {error}</p>
        <p>Module ID: {moduleId}</p>
        <button onClick={() => navigate('/cms/courses')}>
          Back to Courses
        </button>
      </div>
    );
  }

  if (!courseData || courseData.length === 0) {
    return (
      <div className="course-content-empty">
        <p>No content available for this module.</p>
        {isLecturer && (
          <button className="add-week-btn" onClick={() => setShowAddWeekModal(true)}>
            + Add First Week
          </button>
        )}
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
            <span className="module-code">{moduleId}:</span> {courseTitle}
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

      {/* Add Week Button for Lecturers */}
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
