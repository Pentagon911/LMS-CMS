// requestMethods.jsx - API request handler

// Base URL - change this based on your environment
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

// Helper to get auth token
const getToken = () => localStorage.getItem('token');

// Helper to get headers
const getHeaders = (customHeaders = {}, isFormData = false) => {
  const headers = {
    'Accept': 'application/json',
    ...customHeaders
  };

  // Add Authorization token if exists
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser will set it with boundary)
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// Handle response
const handleResponse = async (response) => {
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
    // Handle specific error cases
    if (response.status === 401) {
      // Unauthorized - clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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

// GET request
const GET = async (url, options = {}) => {
  try {
    const { headers = {}, params = {} } = options;
    
    // Add query parameters to URL
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${BASE_URL}${url}?${queryString}` : `${BASE_URL}${url}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: getHeaders(headers),
      ...options,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`GET request failed for ${url}:`, error);
    throw error;
  }
};

// POST request
const POST = async (url, data = {}, options = {}) => {
  try {
    const { headers = {}, isFormData = false, ...restOptions } = options;
    
    // Prepare body
    let body;
    if (isFormData) {
      body = data; // data should be FormData object
    } else {
      body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: getHeaders(headers, isFormData),
      body: body,
      ...restOptions,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`POST request failed for ${url}:`, error);
    throw error;
  }
};

// PUT request
const PUT = async (url, data = {}, options = {}) => {
  try {
    const { headers = {}, isFormData = false, ...restOptions } = options;
    
    // Prepare body
    let body;
    if (isFormData) {
      body = data; // data should be FormData object
    } else {
      body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PUT',
      headers: getHeaders(headers, isFormData),
      body: body,
      ...restOptions,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`PUT request failed for ${url}:`, error);
    throw error;
  }
};

// PATCH request
const PATCH = async (url, data = {}, options = {}) => {
  try {
    const { headers = {}, isFormData = false, ...restOptions } = options;
    
    // Prepare body
    let body;
    if (isFormData) {
      body = data; // data should be FormData object
    } else {
      body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PATCH',
      headers: getHeaders(headers, isFormData),
      body: body,
      ...restOptions,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`PATCH request failed for ${url}:`, error);
    throw error;
  }
};

// DELETE request
const DELETE = async (url, options = {}) => {
  try {
    const { headers = {}, ...restOptions } = options;
    
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: getHeaders(headers),
      ...restOptions,
    });
    
    return await handleResponse(response);
  } catch (error) {
    console.error(`DELETE request failed for ${url}:`, error);
    throw error;
  }
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
  // Base URL getter/setter
  getBaseUrl: () => BASE_URL,
};

export default request;
