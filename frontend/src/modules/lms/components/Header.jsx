import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPerson, MdVolunteerActivism, MdLogout, MdLibraryBooks, MdSchool, MdDarkMode, MdLightMode, MdAdminPanelSettings } from 'react-icons/md';
import '../../cms/components/Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  
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
  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // Base navigation for all users
  const baseNavigation = [
    { name: 'Dashboard', href: '/lms/dashboard', icon: <MdDashboard /> },
    { name: 'Acadamic Managements', href: '/lms/academics', icon: <MdSchool /> },
  ];

  // Build navigation based on role
  const navigation = [...baseNavigation];

  if (isStudent || isAdmin) {
    navigation.push({ name: 'Appeals/Welfare', href: '/lms/appeals-and-welfare', icon: <MdVolunteerActivism /> });
  }
  if (isAdmin) {
    navigation.push({ name: 'Server Managements', href: '/lms/server-management', icon: <MdAdminPanelSettings /> });
  }

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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <span className="logo-icon"><MdLibraryBooks /></span>
          <span className="logo-text">LMS Portal</span>
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
                <Link to="/lms/edit-profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
                    <span className="mobile-icon"><MdPerson /></span>
                    Profile
                </Link>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span className="item-icon"><MdLogout /></span>
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
          <Link to="/lms/edit-profile" className="mobile-link" onClick={() => setIsMobileMenuOpen(false)}>
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
