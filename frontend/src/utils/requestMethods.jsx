const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Helper to get auth tokens
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

// Helper to set tokens
const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

// Helper to clear tokens
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Refresh token function
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${BASE_URL}/users/token/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    // Update tokens in localStorage
    if (data.access) {
      localStorage.setItem('access_token', data.access);
    }
    
    return data.access;
  } catch (error) {
    console.error('Token refresh error:', error);
    clearTokens();
    throw error;
  }
};

// Helper to get headers
const getHeaders = (customHeaders = {}, isFormData = false) => {
  const headers = {
    'Accept': 'application/json',
    ...customHeaders
  };

  // Add Authorization token if exists
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Handle response with automatic token refresh
const handleResponse = async (response, originalRequest = null, retryCount = 0) => {
  const contentType = response.headers.get('content-type');
  
  // Parse response based on content type
  let data;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  // Check if response is ok
  if (!response.ok) {
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retryCount === 0 && originalRequest) {
      try {
        // Try to refresh the access token
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken && originalRequest) {
          // Retry the original request with new token
          return await retryRequest(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        clearTokens();
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }
    
    // Handle specific error cases
    if (response.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      clearTokens();
      window.location.href = '/login';
    }
    
    // Create error object with details
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Retry request function
const retryRequest = async (originalRequest) => {
  const { url, method, headers, body, options } = originalRequest;
  
  const response = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: getHeaders(headers, options?.isFormData),
    body,
    ...options,
  });
  
  return await handleResponse(response, null, 1);
};

// Main request function with token refresh support
const makeRequest = async (method, url, data = null, options = {}) => {
  try {
    const { headers = {}, params = {}, isFormData = false, ...restOptions } = options;
    
    // Build URL with query parameters for GET requests
    let fullUrl = `${BASE_URL}${url}`;
    if (method === 'GET' && Object.keys(params).length > 0) {
      const queryString = new URLSearchParams(params).toString();
      fullUrl = `${fullUrl}?${queryString}`;
    }
    
    // Prepare body
    let body;
    if (data !== null) {
      if (isFormData) {
        body = data; // data should be FormData object
      } else {
        body = JSON.stringify(data);
      }
    }
    
    const requestConfig = {
      method,
      headers: getHeaders(headers, isFormData),
      ...restOptions,
    };
    
    if (body) {
      requestConfig.body = body;
    }
    
    const response = await fetch(fullUrl, requestConfig);
    
    // Store original request details for potential retry
    const originalRequest = {
      url,
      method,
      headers,
      body,
      options,
    };
    
    return await handleResponse(response, originalRequest);
  } catch (error) {
    console.error(`${method} request failed for ${url}:`, error);
    throw error;
  }
};

// GET request
const GET = async (url, options = {}) => {
  return makeRequest('GET', url, null, options);
};

// POST request
const POST = async (url, data = {}, options = {}) => {
  return makeRequest('POST', url, data, options);
};

// PUT request
const PUT = async (url, data = {}, options = {}) => {
  return makeRequest('PUT', url, data, options);
};

// PATCH request
const PATCH = async (url, data = {}, options = {}) => {
  return makeRequest('PATCH', url, data, options);
};

// DELETE request
const DELETE = async (url, options = {}) => {
  return makeRequest('DELETE', url, null, options);
};

// Upload file helper (uses FormData)
const UPLOAD = async (url, fileData, options = {}) => {
  const formData = new FormData();
  
  // If fileData is FormData, use it directly
  if (fileData instanceof FormData) {
    return POST(url, fileData, { ...options, isFormData: true });
  }
  
  // If fileData is an object, append each field to FormData
  Object.keys(fileData).forEach(key => {
    if (Array.isArray(fileData[key])) {
      fileData[key].forEach(item => formData.append(`${key}[]`, item));
    } else {
      formData.append(key, fileData[key]);
    }
  });
  
  return POST(url, formData, { ...options, isFormData: true });
};

// Export all methods
const request = {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
  UPLOAD,
  // Token management helpers
  setTokens,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
  // Base URL getter/setter
  getBaseUrl: () => BASE_URL,
};

export default request;
