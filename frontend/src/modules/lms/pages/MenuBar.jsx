import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from '../components/HeaderTemp';
import LoadingSpinner from '../components/LoadingSpinner';
import './MenuBar.css';

const MenuBar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user', error);
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return <LoadingSpinner message="Loading LMS..." />;
  }

  return (
    <div className="lms-layout">
      <Header user={user} onLogout={handleLogout} />
      <main className="lms-content">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
};

export default MenuBar;