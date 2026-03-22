import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdMenuBook, MdQuiz, MdPerson, MdCampaign, MdLogout, MdLibraryBooks, MdDarkMode, MdLightMode, MdTableChart } from 'react-icons/md';
import { getUserFromToken } from '../../../utils/auth';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Check if token is valid and not expired
  const isTokenValid = () => {
    const tokenData = getUserFromToken();
    if (!tokenData) return false;
    
    try {
      const currentTime = Date.now() / 1000;
      // Check if token is expired
      if (tokenData.exp && tokenData.exp < currentTime) {
        return false;
      }
      return true;
    } catch (err) {
      console.error('Token validation error:', err);
      return false;
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    const tokenValid = isTokenValid();
    const userExists = localStorage.getItem('user') !== null;
    
    return tokenValid && userExists;
  };

  // Handle authentication redirect
  const checkAuthAndRedirect = () => {
    if (!isAuthenticated()) {
      // Clear invalid data
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_role');
      
      // Don't redirect if already on login page
      if (location.pathname !== '/login') {
        navigate('/login');
      }
      return false;
    }
    return true;
  };

  // Get user from localStorage
  const getUserFromStorage = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        return null;
      }
    }
    return null;
  };

  // Get user data and validate authentication
  useEffect(() => {
    const loadUserAndValidate = () => {
      // First check if authenticated
      if (!isAuthenticated()) {
        setUser(null);
        // Only redirect if not on login page
        if (location.pathname !== '/login') {
          navigate('/login');
        }
        return;
      }
      
      // Get user data
      const userData = getUserFromStorage();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
        // If user data is missing but token exists, something is wrong
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    };

    loadUserAndValidate();

    // Listen for storage changes (in case user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'access_token' || e.key === 'refresh_token') {
        loadUserAndValidate();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.pathname, navigate]);

  // Periodically check token validity (every 30 seconds)
  useEffect(() => {
    const tokenCheckInterval = setInterval(() => {
      if (location.pathname !== '/login') {
        if (!isAuthenticated()) {
          // Clear invalid data
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_role');
          navigate('/login');
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(tokenCheckInterval);
  }, [location.pathname, navigate]);

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
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location]);

  // Apply theme class to body when theme changes
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Check user roles
  const isInstructor = user?.role === 'instructor' || user?.role === 'lecturer';
  const isAdmin = user?.role === 'admin';

  // Base navigation for all users
  const baseNavigation = [
    { name: 'Dashboard', href: '/cms/dashboard', icon: <MdDashboard /> },
    { name: 'Courses', href: '/cms/courses', icon: <MdLibraryBooks /> },
    { name: 'Time-Tables', href: '/cms/time-tables', icon: <MdTableChart />},
  ];

  // Build navigation based on role
  const navigation = [...baseNavigation];

  // Add Quiz Editor for Instructors only
  if (isInstructor) {
    navigation.push({ name: 'Quiz Editor', href: '/cms/quiz-editor', icon: <MdQuiz /> });
  }

  // Add Announcements for Instructors and Admins
  if (isInstructor || isAdmin) {
    navigation.push({ name: 'Announcements', href: '/cms/announcements', icon: <MdCampaign /> });
  }

  const isActive = (path) => location.pathname === path;

  // Get user display name
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return user?.username || user?.name || 'User';
  };

  // Get user email
  const getUserEmail = () => {
    return user?.email || 'No email provided';
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  // Handle logout
  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    
    // Redirect to login
    navigate('/login');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Don't render header if not authenticated (prevents flash of content)
  if (!isAuthenticated() && location.pathname !== '/login') {
    return null;
  }

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <span className="logo-icon"><MdMenuBook /></span>
          <span className="logo-text">CMS Portal</span>
        </div>

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
          {/* Dark/Light Mode Toggle Button */}
          <button 
            className="theme-toggle-btn" 
            onClick={toggleDarkMode}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? <MdLightMode /> : <MdDarkMode />}
          </button>

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
              <span className={`profile-arrow ${isProfileMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <div className="profile-user-info">
                    <strong>{getDisplayName()}</strong>
                    <span>{getUserEmail()}</span>
                    {user?.role && (
                      <span className="profile-user-role-badge">{user.role}</span>
                    )}
                  </div>
                </div>
                <Link to="/cms/edit-profile" className="profile-dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                  <span className="profile-dropdown-icon"><MdPerson /></span>
                  Profile
                </Link>
                <button onClick={handleLogout} className="profile-dropdown-item logout">
                  <span className="profile-dropdown-icon"><MdLogout /></span>
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
          <Link to="/cms/edit-profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="mobile-icon"><MdPerson /></span>
            Profile
          </Link>
          <button onClick={handleLogout} className="mobile-link logout">
            <span className="mobile-icon"><MdLogout /></span>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
