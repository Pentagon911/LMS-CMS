import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {MdLibraryBooks,MdWarning,MdPerson,MdLock,MdFlag,MdMenuBook,MdDescription,MdRocketLaunch,MdVisibility,MdVisibilityOff} from "react-icons/md";
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('lms');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  // API login handler using fetch directly
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    try {
      // Make fetch request directly
      const response = await fetch('http://localhost:8000/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password');
      }

      // Parse the response data
      const text = await response.text();
console.log("RAW RESPONSE:", text);
const data = JSON.parse(text);

      // const data = await response.json();
      console.log('Login response:', data);

      // Store tokens
      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }
      
      // Store user data
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Store user role for role-based routing
      if (data.user && data.user.role) {
        localStorage.setItem('user_role', data.user.role);
      }

      // Redirect based on user type selection
      if (userType === 'lms') {
        navigate('/lms/dashboard');
      } else {
        navigate('/cms/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="lgn__container">
      <div className="lgn__card">
        <div className="lgn__header">
          <div className="lgn__logo-icon"><MdLibraryBooks /></div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to your portal</p>
        </div>

        {error && (
          <div className="lgn__error-message">
            <span className="lgn__error-icon"><MdWarning /></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="lgn__form-group">
            <label htmlFor="username">
              <span className="lgn__label-icon"><MdPerson /></span>
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="lgn__form-group">
            <label htmlFor="password">
              <span className="lgn__label-icon"><MdLock /></span>
              Password
            </label>
            <div className="lgn__password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="lgn__password-toggle"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </div>
          </div>

          <div className="lgn__form-group">
            <label className="lgn__radio-label">
              <span className="lgn__label-icon"><MdFlag /></span>
              Select Portal
            </label>
            <div className="lgn__radio-group">
              <label className={`lgn__radio-option ${userType === 'lms' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="lms"
                  checked={userType === 'lms'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="lgn__radio-icon"><MdDescription /></span>
                <span className="lgn__radio-text">LMS Portal</span>
                <div className="lgn__radio-desc">Learning Management System</div>
              </label>

              <label className={`lgn__radio-option ${userType === 'cms' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="cms"
                  checked={userType === 'cms'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="lgn__radio-icon"><MdMenuBook /></span>
                <span className="lgn__radio-text">CMS Portal</span>
                <div className="lgn__radio-desc">Content Management System</div>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className={`lgn__login-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="lgn__spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="lgn__btn-icon"><MdRocketLaunch /></span>
                Sign In
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;
