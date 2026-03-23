import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDashboard, MdPerson, MdVolunteerActivism, MdLogout, MdLibraryBooks, MdSchool, MdDarkMode, MdLightMode, MdAdminPanelSettings, MdExpandMore, MdMenuBook, MdAssignment, MdEvent, MdGrade, MdPeople, MdAttachMoney, MdHelp, MdHome, MdUpload, MdMedicalServices, MdHelpOutline
} from 'react-icons/md';
import '../../cms/components/Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });
  
  const profileMenuRef = useRef(null);
  const dropdownRefs = useRef({});
  const location = useLocation();
  const navigate = useNavigate();

  const dropdownData = {
    'Acadamic Managements': {
      admin: [
        { name: 'Update Exam Timetables', path: '/lms/academics/time-tables', icon: <MdEvent /> },
      ],
      student: [
        { name: 'Enrollments', path: '/lms/academics/enrollment', icon: <MdMenuBook /> },
        { name: 'My Courses', path: '/lms/academics/my-courses', icon: <MdAssignment /> },
        { name: 'Exam Results', path: '/lms/academics/results', icon: <MdGrade /> },
        { name: 'Exam Timetables', path: '/lms/academics/time-tables', icon: <MdEvent /> },
      ],
      instructor: [
          { name: 'Update Results', path: '/lms/update-results', icon: <MdUpload /> },
          { name: 'Exam Timetables', path: '/lms/academics/time-tables', icon: <MdEvent /> },
      ]
    },
    'Appeals/Welfare': {
    //   // admin: [
    //   //   { name: 'Bursary Appeals', path: '/lms/appeals-and-welfare/bursary-appeals', icon: <MdAttachMoney /> },
    //   //   { name: 'Hostel Appeals', path: '/lms/appeals-and-welfare/hostel-appeals', icon: <MdHome /> },
    //   //   { name: 'Exam Appeals', path: '/lms/appeals-and-welfare/exam-appeals', icon: <MdHelpOutline /> },
    //   //   { name: 'Medical Appeals', path: '/lms/appeals-and-welfare/medical-eppeals', icon: <MdMedicalServices /> }
    //   // ],
      student: [
        { name: 'My Appeals', path: '/lms/appeals-and-welfare/my-appeals', icon: <MdAssignment /> },
        { name: 'Apply bursary', path: '/lms/appeals-and-welfare/bursary', icon: <MdAttachMoney /> },
        { name: 'Apply Hostel Facility', path: '/lms/appeals-and-welfare/welfare-request', icon: <MdHome /> },
        { name: 'Medical Leave', path: '/lms/appeals-and-welfare/medical-leave', icon: <MdHelp /> },
        { name: 'Exam-Rewrite', path: '/lms/appeals-and-welfare/exam-rewrite', icon: <MdEvent/>}
      ]
    },
    'Server Managements': {
      admin: [
        { name: 'User Management', path: '/lms/server-management/users', icon: <MdPeople /> },
        { name: 'Course Management', path: '/lms/server-management/courses', icon: <MdMenuBook /> },
      ]
    }
  };

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

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

  // Close mobile menu and dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
    setOpenDropdown(null);
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
  const isInstructor = user?.role === 'instructor';

  // Base navigation for all users
  const baseNavigation = [
    { name: 'Dashboard', href: '/lms/dashboard', icon: <MdDashboard />, hasDropdown: false },
    { name: 'Acadamic Managements', href: '/lms/academics', icon: <MdSchool />, hasDropdown: true },
  ];

  // Build navigation based on role
  const navigation = [...baseNavigation];

  if (isStudent) {
    navigation.push({ 
      name: 'Appeals/Welfare', 
      href: '/lms/appeals-and-welfare', 
      icon: <MdVolunteerActivism />, 
      hasDropdown: true 
    });
  } else if (isAdmin) {
    navigation.push({ 
      name: 'Appeals/Welfare', 
      href: '/lms/admin/appeals', 
      icon: <MdVolunteerActivism />, 
      hasDropdown: false 
    });
  }
  if (isAdmin) {
    navigation.push({ 
      name: 'Server Managements', 
      href: '/lms/server-management', 
      icon: <MdAdminPanelSettings />, 
      hasDropdown: true 
    });
  }

  // Get dropdown items based on role
  const getDropdownItems = (menuName) => {
    const menuData = dropdownData[menuName];
    if (!menuData) return [];
    
    if (isAdmin && menuData.admin) {
      return menuData.admin;
    } else if (isStudent && menuData.student) {
      return menuData.student;
    }
    return [];
  };

  const isActive = (path) => location.pathname === path;
  const isDropdownItemActive = (path) => location.pathname === path;

  // Handle navigation with dropdown
  const handleNavClick = (item, e) => {
    if (item.hasDropdown) {
      e.preventDefault();
      // Toggle dropdown
      setOpenDropdown(openDropdown === item.name ? null : item.name);
    } else {
      // For items without dropdown, navigate directly
      navigate(item.href);
    }
  };

  // Handle dropdown item click
  const handleDropdownItemClick = (path) => {
    navigate(path);
    setOpenDropdown(null);
  };

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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
            <div 
              key={item.name} 
              className={`nav-item ${item.hasDropdown ? 'has-dropdown' : ''}`}
              ref={el => dropdownRefs.current[item.name] = el}
            >
              <Link
                to={item.href}
                className={`nav-link ${isActive(item.href) ? 'active' : ''} ${openDropdown === item.name ? 'dropdown-open' : ''}`}
                onClick={(e) => handleNavClick(item, e)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-text">{item.name}</span>
                {item.hasDropdown && (
                  <span className={`nav-dropdown-arrow ${openDropdown === item.name ? 'rotate' : ''}`}>
                    <MdExpandMore />
                  </span>
                )}
              </Link>
              
              {/* Dropdown Menu */}
              {item.hasDropdown && openDropdown === item.name && (
                <div className="nav-dropdown-menu">
                  {getDropdownItems(item.name).map((dropdownItem) => (
                    <button
                      key={dropdownItem.path}
                      className={`nav-dropdown-item ${isDropdownItemActive(dropdownItem.path) ? 'active' : ''}`}
                      onClick={() => handleDropdownItemClick(dropdownItem.path)}
                    >
                      <span className="nav-dropdown-icon">{dropdownItem.icon}</span>
                      <span className="nav-dropdown-text">{dropdownItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                <Link to="/lms/edit-profile" className="profile-dropdown-item" onClick={() => setIsProfileMenuOpen(false)}>
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

      {/* Mobile Navigation with nested dropdowns */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          {navigation.map((item) => (
            <div key={item.name} className="mobile-nav-item">
              <div 
                className={`mobile-link-header ${openDropdown === item.name ? 'expanded' : ''}`}
                onClick={() => {
                  if (item.hasDropdown) {
                    setOpenDropdown(openDropdown === item.name ? null : item.name);
                  } else {
                    navigate(item.href);
                    setIsMobileMenuOpen(false);
                  }
                }}
              >
                <span className="mobile-icon">{item.icon}</span>
                <span className="mobile-text">{item.name}</span>
                {item.hasDropdown && (
                  <span className={`mobile-arrow ${openDropdown === item.name ? 'rotate' : ''}`}>
                    <MdExpandMore />
                  </span>
                )}
              </div>
              
              {/* Mobile Submenu */}
              {item.hasDropdown && openDropdown === item.name && (
                <div className="mobile-submenu">
                  {getDropdownItems(item.name).map((dropdownItem) => (
                    <button
                      key={dropdownItem.path}
                      className={`mobile-submenu-item ${isDropdownItemActive(dropdownItem.path) ? 'active' : ''}`}
                      onClick={() => {
                        navigate(dropdownItem.path);
                        setIsMobileMenuOpen(false);
                        setOpenDropdown(null);
                      }}
                    >
                      <span className="submenu-icon">{dropdownItem.icon}</span>
                      <span className="submenu-text">{dropdownItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className="mobile-divider"></div>
          <div 
            className="mobile-link-header"
            onClick={() => {
              navigate('/lms/edit-profile');
              setIsMobileMenuOpen(false);
            }}
          >
            <span className="mobile-icon"><MdPerson /></span>
            <span className="mobile-text">Profile</span>
          </div>
          <div 
            className="mobile-link-header logout"
            onClick={handleLogout}
          >
            <span className="mobile-icon"><MdLogout /></span>
            <span className="mobile-text">Sign Out</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
