import React, { useState } from 'react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    try {
      // Replace this with your actual login API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Login successful:', formData);
      alert('Login successful!');
      // Redirect or handle successful login here
      
    } catch (error) {
      console.error('Login failed:', error);
      setErrors({ general: 'Login failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Please login to your account</p>
        
        {errors.general && (
          <div className="error-message general-error">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <span className="error-text">{errors.email}</span>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <a href="/forgot-password" className="forgot-password">
              Forgot password?
            </a>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
