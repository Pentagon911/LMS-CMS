// LMSDashboard.jsx
import React, { useState } from 'react';

const LMSDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Sample data
  const courses = [
    { id: 1, title: 'React for Beginners', progress: 75, instructor: 'John Doe', dueDate: '2024-03-15' },
    { id: 2, title: 'JavaScript Essentials', progress: 45, instructor: 'Jane Smith', dueDate: '2024-03-20' },
    { id: 3, title: 'CSS Mastery', progress: 90, instructor: 'Bob Johnson', dueDate: '2024-03-10' },
    { id: 4, title: 'Python Programming', progress: 30, instructor: 'Alice Brown', dueDate: '2024-03-25' },
  ];

  const assignments = [
    { id: 1, title: 'React Component Project', course: 'React for Beginners', due: '2024-03-15', status: 'pending' },
    { id: 2, title: 'JavaScript Quiz', course: 'JavaScript Essentials', due: '2024-03-12', status: 'submitted' },
    { id: 3, title: 'CSS Layout Challenge', course: 'CSS Mastery', due: '2024-03-18', status: 'pending' },
  ];

  const announcements = [
    { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance this weekend', date: '2024-03-08' },
    { id: 2, title: 'New Course Available', message: 'Check out our new Python course', date: '2024-03-07' },
  ];

  return (
    <div className="lms-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo">
          <h2>LMS</h2>
        </div>
        <nav className="nav-menu">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            📚 My Courses
          </button>
          <button 
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            📝 Assignments
          </button>
          <button 
            className={`nav-item ${activeTab === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveTab('announcements')}
          >
            📢 Announcements
          </button>
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Welcome back, Sarah! 👋</h1>
            <p>Continue your learning journey</p>
          </div>
          <div className="header-right">
            <div className="notification-icon">🔔</div>
            <div className="user-profile">
              <span className="user-avatar">👩‍🎓</span>
              <span className="user-name">Sarah Johnson</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeTab === 'dashboard' && (
          <div className="dashboard-content">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <h3>📚 Enrolled Courses</h3>
                <p className="stat-number">{courses.length}</p>
              </div>
              <div className="stat-card">
                <h3>📝 Pending Assignments</h3>
                <p className="stat-number">
                  {assignments.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <div className="stat-card">
                <h3>✅ Completed Courses</h3>
                <p className="stat-number">2</p>
              </div>
              <div className="stat-card">
                <h3>⏱️ Learning Hours</h3>
                <p className="stat-number">47</p>
              </div>
            </div>

            {/* Current Courses */}
            <div className="section">
              <div className="section-header">
                <h2>Current Courses</h2>
                <button className="view-all">View All →</button>
              </div>
              <div className="courses-grid">
                {courses.slice(0, 3).map(course => (
                  <div key={course.id} className="course-card">
                    <h3>{course.title}</h3>
                    <p className="instructor">Instructor: {course.instructor}</p>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${course.progress}%`}}
                      ></div>
                    </div>
                    <p className="progress-text">{course.progress}% Complete</p>
                    <p className="due-date">Due: {course.dueDate}</p>
                    <button className="continue-btn">Continue Learning</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="section">
              <div className="section-header">
                <h2>Upcoming Assignments</h2>
                <button className="view-all">View All →</button>
              </div>
              <div className="assignments-list">
                {assignments.map(assignment => (
                  <div key={assignment.id} className="assignment-item">
                    <div className="assignment-info">
                      <h4>{assignment.title}</h4>
                      <p>{assignment.course}</p>
                    </div>
                    <div className="assignment-meta">
                      <span className="due-date">Due: {assignment.due}</span>
                      <span className={`status ${assignment.status}`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="tab-content">
            <h2>My Courses</h2>
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course.id} className="course-card full-width">
                  <h3>{course.title}</h3>
                  <p className="instructor">Instructor: {course.instructor}</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{width: `${course.progress}%`}}
                    ></div>
                  </div>
                  <p className="progress-text">{course.progress}% Complete</p>
                  <p className="due-date">Due: {course.dueDate}</p>
                  <button className="continue-btn">Continue Learning</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="tab-content">
            <h2>Assignments</h2>
            <div className="assignments-list">
              {assignments.map(assignment => (
                <div key={assignment.id} className="assignment-item card-style">
                  <div className="assignment-info">
                    <h4>{assignment.title}</h4>
                    <p>Course: {assignment.course}</p>
                  </div>
                  <div className="assignment-meta">
                    <span className="due-date">Due: {assignment.due}</span>
                    <span className={`status ${assignment.status}`}>
                      {assignment.status}
                    </span>
                  </div>
                  <button className="view-btn">View Assignment</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <div className="tab-content">
            <h2>Announcements</h2>
            <div className="announcements-list">
              {announcements.map(announcement => (
                <div key={announcement.id} className="announcement-card">
                  <h4>{announcement.title}</h4>
                  <p>{announcement.message}</p>
                  <small>Posted: {announcement.date}</small>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="tab-content">
            <h2>Profile</h2>
            <div className="profile-card">
              <div className="profile-header">
                <div className="profile-avatar">👩‍🎓</div>
                <div className="profile-info">
                  <h3>Sarah Johnson</h3>
                  <p>sarah.johnson@email.com</p>
                  <p>Student ID: LMS2024001</p>
                </div>
              </div>
              <div className="profile-stats">
                <div className="stat">
                  <label>Courses Enrolled</label>
                  <span>4</span>
                </div>
                <div className="stat">
                  <label>Completed</label>
                  <span>2</span>
                </div>
                <div className="stat">
                  <label>Average Grade</label>
                  <span>85%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LMSDashboard;
