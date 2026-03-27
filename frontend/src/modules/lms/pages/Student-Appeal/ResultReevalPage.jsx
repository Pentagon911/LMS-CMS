// src/modules/lms/pages/ResultReevalPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdSave, MdCancel, MdWarning, MdCheckCircle, MdGrade } from 'react-icons/md';
import './AppealFormPage.css';

const ResultReevalPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [semesterResults, setSemesterResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [fetchingResults, setFetchingResults] = useState(true);
  
  // Get user data from localStorage
  const [user, setUser] = useState(null);
  const [departmentId, setDepartmentId] = useState(null);
  const [facultyId, setFacultyId] = useState(null);
  const [batchId, setBatchId] = useState(null);
  const [studentId, setStudentId] = useState(null);
  const [departmentName, setDepartmentName] = useState('Not assigned');
  const [facultyName, setFacultyName] = useState('Not assigned');
  const [batchName, setBatchName] = useState('Not assigned');

  // Define appeal type constant
  const APPEAL_TYPE = 'RESULT_RE_EVALUATION';

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setStudentId(parsedUser.id);
      
      if (parsedUser.profile) {
        setDepartmentId(parsedUser.profile.department);
        setFacultyId(parsedUser.profile.faculty);
        setBatchId(parsedUser.profile.batch);
        setDepartmentName(parsedUser.department_name || 'Not assigned');
        setFacultyName(parsedUser.faculty_name || 'Not assigned');
        setBatchName(parsedUser.batch_name || 'Not assigned');
      } else {
        setDepartmentId(parsedUser.department);
        setFacultyId(parsedUser.faculty);
        setBatchId(parsedUser.batch);
        setDepartmentName(parsedUser.department_name || 'Not assigned');
        setFacultyName(parsedUser.faculty_name || 'Not assigned');
        setBatchName(parsedUser.batch_name || 'Not assigned');
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    exam_result: '',
    reason_type: '',
    specific_concerns: ''
  });

  useEffect(() => {
    fetchExamResults();
  }, []);

  const fetchExamResults = async () => {
    try {
      setFetchingResults(true);
      const response = await request.GET('/lms/exam_results/my_results/');
      
      if (response) {
        setStudentData(response.student);
        
        const flattenedResults = [];
        if (response.semester_results && Array.isArray(response.semester_results)) {
          response.semester_results.forEach(semester => {
            if (semester.results && Array.isArray(semester.results)) {
              semester.results.forEach(result => {
                flattenedResults.push({
                  ...result,
                  semester: semester.semester,
                  semester_name: semester.semester_name || `Semester ${semester.semester}`,
                  academic_year: semester.academic_year
                });
              });
            }
          });
        }
        setSemesterResults(response.semester_results || []);
        setAllResults(flattenedResults);
      }
    } catch (err) {
      console.error('Error fetching exam results:', err);
      setError('Failed to load exam results. Please try again.');
    } finally {
      setFetchingResults(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const getSelectedExamResult = () => {
    return allResults.find(result => result.id === parseInt(formData.exam_result));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('You are not logged in. Please login again.');
      setLoading(false);
      navigate('/login');
      return;
    }

    if (!studentId) {
      setError('Student information is missing. Please log in again.');
      setLoading(false);
      return;
    }

    if (!departmentId || !facultyId || !batchId) {
      setError('Student profile information is incomplete. Please contact support.');
      setLoading(false);
      return;
    }

    if (!formData.title.trim()) {
      setError('Please provide a title for your application.');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a description for your application.');
      setLoading(false);
      return;
    }

    if (!formData.exam_result) {
      setError('Please select an exam result to appeal.');
      setLoading(false);
      return;
    }

    if (!formData.reason_type) {
      setError('Please select a reason type.');
      setLoading(false);
      return;
    }

    if (!formData.specific_concerns.trim()) {
      setError('Please provide specific concerns for the re-evaluation.');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      formDataToSend.append('appeal_type', APPEAL_TYPE);
      formDataToSend.append('student', studentId.toString());
      formDataToSend.append('department', departmentId.toString());
      formDataToSend.append('faculty', facultyId.toString());
      if (batchId) {
        formDataToSend.append('batch', batchId.toString());
      }
      
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('academic_year', formData.academic_year);
      formDataToSend.append('exam_result', formData.exam_result);
      formDataToSend.append('reason_type', formData.reason_type);
      formDataToSend.append('specific_concerns', formData.specific_concerns);
      
      await request.POST('/lms/appeals/result-reeval/', formDataToSend, { isFormData: true });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/lms/appeals-and-welfare/my-appeals');
      }, 2000);
    } catch (err) {
      console.error('Error submitting reevaluation appeal:', err);
      
      let errorMessage = 'Failed to submit appeal. Please try again.';
      
      if (err.status === 401) {
        errorMessage = 'Your session has expired. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.data) {
        if (typeof err.data === 'object') {
          const errorMessages = [];
          for (const [key, value] of Object.entries(err.data)) {
            if (Array.isArray(value)) {
              errorMessages.push(`${key}: ${value.join(', ')}`);
            } else if (typeof value === 'string') {
              errorMessages.push(`${key}: ${value}`);
            } else {
              errorMessages.push(`${key}: ${JSON.stringify(value)}`);
            }
          }
          errorMessage = errorMessages.join('; ');
        } else if (typeof err.data === 'string') {
          errorMessage = err.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="afp-appeal-form-container">
        <div className="afp-success-message">
          <MdCheckCircle className="afp-success-icon" />
          <h2>Appeal Submitted Successfully!</h2>
          <p>Your result re-evaluation appeal has been submitted. You can track its status in My Appeals.</p>
          <button onClick={() => navigate('/lms/appeals-and-welfare/my-appeals')} className="afp-view-appeals-btn">
            View My Appeals
          </button>
        </div>
      </div>
    );
  }

  const selectedResult = getSelectedExamResult();

  return (
    <div className="afp-appeal-form-container">
      <div className="afp-form-header">
        <h1><MdGrade /> Result Re-evaluation Appeal</h1>
        <p>Request a review of your exam results</p>
      </div>

      {error && (
        <div className="afp-error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="afp-appeal-form">
        <div className="afp-form-section">
          <h3>Student Information</h3>
          
          <div className="afp-form-group">
            <label>Student Name</label>
            <input
              type="text"
              value={studentData?.name || (user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || '' : '')}
              disabled
              className="afp-readonly-field"
            />
          </div>

          <div className="afp-form-row">
            <div className="afp-form-group">
              <label>Department</label>
              <input
                type="text"
                value={departmentName}
                disabled
                className="afp-readonly-field"
              />
            </div>

            <div className="afp-form-group">
              <label>Faculty</label>
              <input
                type="text"
                value={facultyName}
                disabled
                className="afp-readonly-field"
              />
            </div>
          </div>

          <div className="afp-form-row">
            <div className="afp-form-group">
              <label>Batch</label>
              <input
                type="text"
                value={studentData?.intake_batch || batchName}
                disabled
                className="afp-readonly-field"
              />
            </div>

            <div className="afp-form-group">
              <label>Academic Year *</label>
              <input
                type="text"
                name="academic_year"
                value={formData.academic_year}
                onChange={handleInputChange}
                required
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>
        </div>

        <div className="afp-form-section">
          <h3>Appeal Details</h3>
          
          <div className="afp-form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Request for Grade Review - CS101"
            />
          </div>

          <div className="afp-form-group">
            <label>Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Provide details about why you're requesting re-evaluation..."
            />
          </div>
        </div>

        <div className="afp-form-section">
          <h3>Result Details</h3>

          <div className="afp-form-group">
            <label>Select Exam Result <span className="afp-required">*</span></label>
            {fetchingResults ? (
              <div className="afp-loading-placeholder">Loading your exam results...</div>
            ) : (
              <select
                name="exam_result"
                value={formData.exam_result}
                onChange={handleInputChange}
                required
              >
                <option value="">Select exam result</option>
                {semesterResults.map(semester => (
                  <optgroup key={semester.semester} label={`Semester ${semester.semester}`}>
                    {semester.results && semester.results.map(result => (
                      <option key={result.id} value={result.id}>
                        {result.course_name || result.course_code || 'Course'} - {result.assessment_name || 'Exam'}: {result.marks_obtained || result.score || 0} ({result.grade || 'N/A'})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {selectedResult && (
            <div className="afp-selected-result-info">
              <h4>Selected Result Details:</h4>
              <div className="afp-result-details-grid">
                <div className="afp-result-detail-item">
                  <span className="afp-detail-label">Course:</span>
                  <span className="afp-detail-value">{selectedResult.course_name || selectedResult.course_code || 'N/A'}</span>
                </div>
                <div className="afp-result-detail-item">
                  <span className="afp-detail-label">Assessment:</span>
                  <span className="afp-detail-value">{selectedResult.assessment_name || 'Exam'}</span>
                </div>
                <div className="afp-result-detail-item">
                  <span className="afp-detail-label">Semester:</span>
                  <span className="afp-detail-value">{selectedResult.semester_name || `Semester ${selectedResult.semester}`}</span>
                </div>
                <div className="afp-result-detail-item">
                  <span className="afp-detail-label">Score:</span>
                  <span className="afp-detail-value">{selectedResult.marks_obtained || selectedResult.score || 0} / {selectedResult.total_marks || 100}</span>
                </div>
                <div className="afp-result-detail-item">
                  <span className="afp-detail-label">Grade:</span>
                  <span className="afp-detail-value grade-value">{selectedResult.grade || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="afp-form-group">
            <label>Reason Type <span className="afp-required">*</span></label>
            <select
              name="reason_type"
              value={formData.reason_type}
              onChange={handleInputChange}
              required
            >
              <option value="">Select reason</option>
              <option value="CALCULATION">Marks Calculation Error</option>
              <option value="PAPER_REVIEW">Paper Review Request</option>
              <option value="GRADE_BOUNDARY">Grade Boundary Issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="afp-form-group">
            <label>Specific Concerns <span className="afp-required">*</span></label>
            <textarea
              name="specific_concerns"
              value={formData.specific_concerns}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Provide specific details about what you believe is incorrect and why. Include question numbers, sections, or any specific points you'd like reviewed..."
            />
          </div>
        </div>

        <div className="afp-form-actions">
          <button type="button" className="afp-cancel-btn" onClick={() => navigate('/lms/student/appeals')}>
            <MdCancel /> Cancel
          </button>
          <button type="submit" className="afp-submit-btn" disabled={loading || fetchingResults}>
            <MdSave /> {loading ? 'Submitting...' : 'Submit Appeal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResultReevalPage;