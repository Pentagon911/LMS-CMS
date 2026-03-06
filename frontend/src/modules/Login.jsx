import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('lms'); // 'lms' or 'cms'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  // Mock validation - replace with real authentication later
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    // Mock authentication (replace with actual API call)
    setTimeout(() => {
      // For demo purposes, any credentials work
      // In real app, you would validate with backend
      
      if (username === 'admin' && password === 'admin') {
        // Redirect based on user type selection
        if (userType === 'lms') {
          navigate('/lms/dashboard');
        } else {
          navigate('/cms');
        }
      } else {
        setError('Invalid username or password');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">📚</div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to your portal</p>
        </div>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <span className="label-icon">👤</span>
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

          <div className="form-group">
            <label htmlFor="password">
              <span className="label-icon">🔒</span>
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label className="radio-label">
              <span className="label-icon">🎯</span>
              Select Portal
            </label>
            <div className="radio-group">
              <label className={`radio-option ${userType === 'lms' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="lms"
                  checked={userType === 'lms'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="radio-icon">📖</span>
                <span className="radio-text">LMS Portal</span>
                <span className="radio-desc">Learning Management System</span>
              </label>

              <label className={`radio-option ${userType === 'cms' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="userType"
                  value="cms"
                  checked={userType === 'cms'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                <span className="radio-icon">📝</span>
                <span className="radio-text">CMS Portal</span>
                <span className="radio-desc">Content Management System</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className={`login-btn ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span className="btn-icon">🚀</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials: username: admin, password: admin</p>
          <p className="hint">(Works for both LMS and CMS)</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
