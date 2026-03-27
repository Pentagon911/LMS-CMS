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
          window.open(`${request.getBaseUrl()}${item.fileUrl}`, '_blank');
        }
        break;
        
      case 'quiz':
        if (user && tokenData.role !== 'student') {
        navigate(`/cms/quizes/${item.quizId}/instructor`);
      } else {
        navigate(`/cms/quizes/${item.quizId}`);
      }
      break;
        
      case 'announcement':
        alert(item.message || "No additional details");
        break;
        
      default:
        break;
    }
  };

  const handleAddContent = async (weekIndex, newItem) => {
    if (!user || tokenData.role === 'student') return;
    
    try {
      if (!['content', 'quiz', 'announcement'].includes(newItem.type)) {
        throw new Error('Invalid item type. Only content, quiz, and announcement are allowed.');
      }

      console.log("Adding content:", { weekIndex, newItem });
      
      let response;
      let apiUrl;
      // Use weekIndex + 1 as the week_id (1-based index)
      const weekIdNumber = weekIndex + 1;
      
      if (newItem.type === 'quiz') {
        // Quiz endpoint - using weekIdNumber as week_id
        apiUrl = `/cms/quizzes/${newItem.quizId}/add_to_week/`;
        response = await request.POST(apiUrl, {
          week_id: weekIdNumber,
          start_time: newItem.startTime
        });
      } else if(newItem.type === 'announcement') {
        apiUrl = `/cms/courses/${moduleId}/weeks/${weekIdNumber}/announcement/create/`;
        response = await request.POST(apiUrl, newItem);
      } else{
        apiUrl = `/cms/announcement/`;
        response = await request.POST(apiUrl, newItem);
      }
      
      // Update local state with the response
      const updatedData = [...courseData];
      if (!updatedData[weekIndex].items) {
        updatedData[weekIndex].items = [];
      }
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
      
      const newWeek = response.data || { 
        week: newWeekName, 
        items: [],
        courseId: moduleId
      };
      setCourseData([...courseData, newWeek]);
      setShowAddWeekModal(false);
      setNewWeekName('');
      
    } catch (err) {
      console.error("Failed to add week", err);
      alert("Failed to add week. Please try again.");
    }
  };
  const tokenData = getUserFromToken();
  const isLecturer = tokenData?.role && tokenData?.role !== 'student';

  if (loading) {
    return (
      <div className="ccp-loading">
        <div className="ccp-loading-spinner"></div>
        <p>Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ccp-error">
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
      <div className="ccp-empty">
        <p>No content available for this module.</p>
        {isLecturer && (
          <button className="ccp-add-week-btn" onClick={() => setShowAddWeekModal(true)}>
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
    <div className="ccp-container">
      {/* Course Header */}
      <div className="ccp-header">
        <button className="ccp-back-btn" onClick={() => navigate('/cms/courses')}>
          ←
        </button>
        
        <div className="ccp-info">
          <h1 className="ccp-title">
            <span className="ccp-module-code">{moduleId}:</span> {courseTitle}
          </h1>
          
          <div className="ccp-meta">
            <span className="ccp-meta-badge">
              <span className="ccp-meta-icon"><MdCalendarMonth /></span>
              <span className="ccp-meta-label">Total Weeks:</span>
              {courseData.length}
            </span>
            
            <span className="ccp-meta-badge">
              <span className="ccp-meta-icon"><MdLibraryBooks /></span>
              <span className="ccp-meta-label">Total Items:</span>
              {courseData.reduce((total, week) => total + (week.items?.length || 0), 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Weeks Content */}
      <div className="ccp-weeks-container">
        {courseData.map((week, index) => (
          <WeekCard
            key={index}
            data={week}
            weekNumber={week.week || `Week ${index + 1}`}
            weekIndex={index}  // Pass the index (0-based)
            courseId={moduleId}
            isLecturer={isLecturer}
            onContentClick={handleContentClick}
            onAddContent={(newItem) => handleAddContent(index, newItem)}
          />
        ))}
      </div>

      {/* Add Week Button for Lecturers */}
      {isLecturer && (
        <button className="ccp-add-week-btn" onClick={() => setShowAddWeekModal(true)}>
          + Add New Week
        </button>
      )}

      {/* Add Week Modal */}
      {showAddWeekModal && (
        <div className="ccp-modal-overlay" onClick={() => setShowAddWeekModal(false)}>
          <div className="ccp-modal-content" onClick={e => e.stopPropagation()}>
            <div className="ccp-modal-header">
              <h3>Add New Week</h3>
              <button className="ccp-modal-close-btn" onClick={() => setShowAddWeekModal(false)}>×</button>
            </div>
            <div className="ccp-modal-body">
              <div className="ccp-form-group">
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
            <div className="ccp-modal-actions">
              <button className="ccp-cancel-btn" onClick={() => setShowAddWeekModal(false)}>
                Cancel
              </button>
              <button 
                className="ccp-confirm-btn" 
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
