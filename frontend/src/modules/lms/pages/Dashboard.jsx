import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import ActionButton from '../components/ActionButton';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useOutletContext(); // Get user from MenuBar
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading (remove if not needed)
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNavigate = (path) => {
    navigate(`/lms/${path}`);
  };

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  // Role-based dashboards
  const renderStudentDashboard = () => (
    <div className="dashboard-grid">
      <DashboardCard title="Appeals & Welfare" icon="🤝">
        <ActionButton icon="💰" label="Apply Bursary" onClick={() => handleNavigate('apply-bursary')} />
        <ActionButton icon="🏠" label="Apply Hostel" onClick={() => handleNavigate('apply-hostel')} />
        <ActionButton icon="📝" label="Exam Rewrite" onClick={() => handleNavigate('exam-rewrite')} />
        <ActionButton icon="⚕️" label="Medical Leave" onClick={() => handleNavigate('medical-leave')} />
        <ActionButton icon="🔄" label="Re-evaluation" onClick={() => handleNavigate('re-evaluation')} />
      </DashboardCard>

      <DashboardCard title="Academic Management" icon="📚">
        <ActionButton icon="➕" label="Enroll Courses" onClick={() => handleNavigate('enroll-courses')} />
        <ActionButton icon="📋" label="Enrollment History" onClick={() => handleNavigate('enrollment-history')} />
        <ActionButton icon="📊" label="Exam Results" onClick={() => handleNavigate('exam-results')} />
      </DashboardCard>
    </div>
  );

  const renderAdminDashboard = () => (
    <div className="dashboard-grid">
      <DashboardCard title="Administration" icon="⚙️">
        <ActionButton icon="👥" label="Manage Users" onClick={() => handleNavigate('manage-users')} />
        <ActionButton icon="📚" label="Manage Courses" onClick={() => handleNavigate('manage-courses')} />
        <ActionButton icon="📋" label="Review Appeals" onClick={() => handleNavigate('review-appeals')} />
        <ActionButton icon="⏰" label="Exam Timetable" onClick={() => handleNavigate('exam-timetable')} />
      </DashboardCard>
    </div>
  );

  const renderInstructorDashboard = () => (
    <div className="dashboard-grid">
      <DashboardCard title="Instructor Tools" icon="✏️">
        <ActionButton icon="📈" label="Update Results" onClick={() => handleNavigate('update-results')} />
      </DashboardCard>
    </div>
  );

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, {user?.first_name || 'User'}! 👋
        </h1>
        <p className="welcome-subtitle">
          {user?.role === 'student' && "Manage your academic and welfare requests."}
          {user?.role === 'admin' && "Oversee system operations and user management."}
          {user?.role === 'instructor' && "Update student results and manage courses."}
        </p>
      </div>

      {user?.role === 'student' && renderStudentDashboard()}
      {user?.role === 'admin' && renderAdminDashboard()}
      {user?.role === 'instructor' && renderInstructorDashboard()}
    </div>
  );
};

export default Dashboard;