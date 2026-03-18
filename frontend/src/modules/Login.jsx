import request from '../utils/requestMethods.jsx';
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

  // API login handler
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
      // Make API call using requestMethods
     // const data = await request.POST('/login', {
     //   username: username,
     //   password: password,
     // });
      const data = await request.GET('/_data/credential.json');

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data));
      
      // Store auth token if your API returns one
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Redirect based on user type selection
      if (userType === 'lms') {
        navigate('/lms/dashboard');
      } else {
        navigate('/cms/dashboard');
      }

    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes - remove this in production
  const handleDemoLogin = () => {
    setUsername('admin');
    setPassword('admin');
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

        {/* Demo credentials - remove in production */}
        <div className="login-footer">
          <button 
            className="demo-btn" 
            onClick={handleDemoLogin}
            type="button"
          >
            📋 Fill Demo Credentials
          </button>
          <p>Demo credentials: username: admin, password: admin</p>
          <p className="hint">(Works for both LMS and CMS)</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
