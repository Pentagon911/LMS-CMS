import { useState, useEffect, useRef, useEffectEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdMenuBook, MdQuiz, MdPerson, MdCampaign, MdLogout, MdLibraryBooks, MdDarkMode, MdLightMode, MdTableChart } from 'react-icons/md';
import { getUserFromToken } from '../../../utils/auth';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(()=>{
      const token = getUserFromToken();
      setTokenData(token);
  },[]);

  const isTokenValid = () => {
    try {
      const tokenData = getUserFromToken();
      if (!tokenData || !tokenData.exp) return false;
      const currentTime = Date.now() / 1000;
      return tokenData.exp > currentTime + 10;
    } catch (err) {
      console.error('Token validation error:', err);
      return false;
    }
  };
  const isAuthenticated = () => {
    const tokenValid = isTokenValid();
    const userExists = localStorage.getItem('user') !== null;
    
    return tokenValid && userExists;
  };

  const checkAuthAndRedirect = () => {
    if (!isAuthenticated()) {
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      
      // Don't redirect if already on login page
      if (location.pathname !== '/login') {
        navigate('/login');
      }
      return false;
    }
    return true;
  };

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

  useEffect(() => {
    const loadUserAndValidate = () => {
      if (!isAuthenticated()) {
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
        return;
      }
      
      const userData = getUserFromStorage();
      if (userData) {
        setUser(userData);
      } else {
        setUser(null);
        if (location.pathname !== '/login') {
          navigate('/login');
        }
      }
    };

    loadUserAndValidate();

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
          navigate('/login');
        }
      }
    }, 30000); 
    
    return () => clearInterval(tokenCheckInterval);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const isInstructor = tokenData?.role === 'instructor';
  const isAdmin = tokenData?.role === 'admin';

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

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return user?.username || user?.name || 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'No email provided';
  };

  const getUserInitial = () => {
    if (user?.first_name) return user.first_name.charAt(0).toUpperCase();
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return 'U';
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  if (!isAuthenticated() && location.pathname !== '/login') {
    return null;
  }

  return (
    <header className={`cms-header-root ${isScrolled ? 'cms-header-scrolled' : ''}`}>
      <div className="cms-header-container">
        {/* Logo */}
        <div className="cms-logo">
          <span className="cms-logo-icon"><MdMenuBook /></span>
          <span className="cms-logo-text">CMS Portal</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="cms-nav-menu">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`cms-nav-link ${isActive(item.href) ? 'cms-active' : ''}`}
            >
              <span className="cms-nav-icon">{item.icon}</span>
              <span className="cms-nav-text">{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="cms-header-right">
          {/* Dark/Light Mode Toggle Button */}
          <button 
            className="cms-theme-toggle" 
            onClick={toggleDarkMode}
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? <MdLightMode /> : <MdDarkMode />}
          </button>

          {/* Profile Menu */}
          <div className="cms-profile-section" ref={profileMenuRef}>
            <button
              className="cms-profile-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="cms-avatar">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt={getDisplayName()} />
                ) : (
                  <span className="cms-avatar-placeholder">
                    {getUserInitial()}
                  </span>
                )}
              </div>
              <span className="cms-profile-name">{getDisplayName()}</span>
              <span className={`cms-profile-arrow ${isProfileMenuOpen ? 'cms-open' : ''}`}>▼</span>
            </button>

            {isProfileMenuOpen && (
              <div className="cms-profile-dropdown">
                <div className="cms-profile-dropdown-header">
                  <div className="cms-profile-user-info">
                    <strong>{getDisplayName()}</strong>
                    <span>{getUserEmail()}</span>
                    {user?.role && (
                      <span className="cms-profile-user-role-badge">{user.role}</span>
                    )}
                  </div>
                </div>
                <Link to="/cms/edit-profile" className="cms-profile-dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
                  <span className="cms-profile-dropdown-icon"><MdPerson /></span>
                  Profile
                </Link>
                <button onClick={handleLogout} className="cms-profile-dropdown-item cms-logout">
                  <span className="cms-profile-dropdown-icon"><MdLogout /></span>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="cms-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="cms-hamburger">
              <span className={`cms-line ${isMobileMenuOpen ? 'cms-open' : ''}`}></span>
              <span className={`cms-line ${isMobileMenuOpen ? 'cms-open' : ''}`}></span>
              <span className={`cms-line ${isMobileMenuOpen ? 'cms-open' : ''}`}></span>
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`cms-mobile-nav ${isMobileMenuOpen ? 'cms-open' : ''}`}>
        <div className="cms-mobile-nav-content">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`cms-mobile-link ${isActive(item.href) ? 'cms-active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <span className="cms-mobile-icon">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="cms-mobile-divider"></div>
          <Link to="/cms/edit-profile" className="cms-mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
            <span className="cms-mobile-icon"><MdPerson /></span>
            Profile
          </Link>
          <button onClick={handleLogout} className="cms-mobile-link cms-logout">
            <span className="cms-mobile-icon"><MdLogout /></span>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
