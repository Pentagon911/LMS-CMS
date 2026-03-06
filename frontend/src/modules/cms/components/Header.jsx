import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const location = useLocation();

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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Grades', href: '/grades', icon: '📝' },
    { name: 'Time Table', href: '/timetable', icon: '📅' },
    { name: 'Courses', href: '/courses', icon: '📚' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
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
          {/* Notification Icons */}
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
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span className="avatar-placeholder">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <span className="profile-name">{user?.name || 'User'}</span>
              <span className={`arrow ${isProfileMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isProfileMenuOpen && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <div className="user-info">
                    <strong>{user?.name || 'Guest User'}</strong>
                    <span>{user?.email || 'user@example.com'}</span>
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
                <button onClick={onLogout} className="dropdown-item logout">
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
          <button onClick={onLogout} className="mobile-link logout">
            <span className="mobile-icon">🚪</span>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
