import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get user from localStorage on component mount and when storage changes
  useEffect(() => {
    const getUserFromStorage = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse user from localStorage", error);
        }
      }
    };

    getUserFromStorage();

    // Listen for storage changes (in case user logs in/out in another tab)
    window.addEventListener('storage', getUserFromStorage);
    return () => window.removeEventListener('storage', getUserFromStorage);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location]);

  // Check if user is not a student (admin, lecturer, etc.)
  const canAccessAnnouncements = user?.role && user.role !== 'student';

  // Base navigation for all users
  const baseNavigation = [
    { name: 'Dashboard', href: '/cms/dashboard', icon: '📊' },
    { name: 'Courses', href: '/cms/courses', icon: '📚' },
  ];

  // Grades tab - show for all users (students can see their grades)
  const gradesTab = { name: 'Grades', href: '/grades', icon: '📝' };

  // Announcements tab - only for non-students
  const announcementsTab = { name: 'Announcements', href: '/cms/announcements', icon: '💬' };

  // Build navigation based on role
  const navigation = canAccessAnnouncements 
    ? [...baseNavigation, gradesTab, announcementsTab]
    : [...baseNavigation, gradesTab];

  const isActive = (path) => location.pathname === path;

  // Get user display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || user?.name || 'User';
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || 'user@example.com';
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  // Handle logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Redirect to login
    navigate('/login');
  };

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/cms/dashboard" className="logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">LMS Portal</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-menu">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="header-right">
          {/* Notification Icons - Show for all users */}
          <div className="action-icons">
            <button className="icon-btn">
              <span className="icon">🔔</span>
              <span className="badge">3</span>
            </button>
            <button className="icon-btn">
              <span className="icon">💬</span>
              <span className="badge">5</span>
            </button>
          </div>

          {/* Profile Menu */}
          <div className="profile-section" ref={profileMenuRef}>
            <button
              className="profile-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="avatar">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt={getDisplayName()} />
                ) : (
                  <span className="avatar-placeholder">
                    {getUserInitial()}
                  </span>
                )}
              </div>
              <span className="profile-name">{getDisplayName()}</span>
              <span className={`arrow ${isProfileMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isProfileMenuOpen && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <div className="user-info">
                    <strong>{getDisplayName()}</strong>
                    <span>{getUserEmail()}</span>
                    {user?.role && (
                      <span className="user-role-badge">{user.role}</span>
                    )}
                  </div>
                </div>
                <div className="divider"></div>
                <Link to="/profile" className="dropdown-item">
                  <span className="item-icon">👤</span>
                  Profile
                </Link>
                <Link to="/settings" className="dropdown-item">
                  <span className="item-icon">⚙️</span>
                  Settings
                </Link>
                <div className="divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span className="item-icon">🚪</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="hamburger">
              <span className={`line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`line ${isMobileMenuOpen ? 'open' : ''}`}></span>
              <span className={`line ${isMobileMenuOpen ? 'open' : ''}`}></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`mobile-link ${isActive(item.href) ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="mobile-icon">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="mobile-divider"></div>
          <Link to="/profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="mobile-icon">👤</span>
            Profile
          </Link>
          <Link to="/settings" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="mobile-icon">⚙️</span>
            Settings
          </Link>
          <button onClick={handleLogout} className="mobile-link logout">
            <span className="mobile-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
