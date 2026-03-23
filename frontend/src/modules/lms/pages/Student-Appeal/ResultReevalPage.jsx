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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Extract IDs from profile (these are the IDs sent to backend)
  const departmentId = user.profile?.department || '';
  const facultyId = user.profile?.faculty || '';
  const batchId = user.profile?.batch || '';
  
  // Extract display names from user object (these are from JWT response)
  const departmentName = user.department_name || 'Not assigned';
  const facultyName = user.faculty_name || 'Not assigned';
  const batchName = user.batch_name || 'Not assigned';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    academic_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
    department: departmentId,
    faculty: facultyId,
    batch: batchId,
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
      
      // Handle the response structure
      if (response) {
        setStudentData(response.student);
        
        // Flatten all semester results into a single array for selection
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

    // Validate required fields
    if (!formData.department || !formData.faculty || !formData.batch) {
      setError('Student profile information is incomplete. Please contact support.');
      setLoading(false);
      return;
    }

    if (!formData.exam_result) {
      setError('Please select an exam result to appeal.');
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        ...formData,
        department: parseInt(formData.department),
        faculty: parseInt(formData.faculty),
        batch: parseInt(formData.batch),
        exam_result: parseInt(formData.exam_result)
      };
      
      await request.POST('/lms/appeals/result-reeval/', submitData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/lms/appeals-and-welfare/my-appeals');
      }, 2000);
    } catch (err) {
      console.error('Error submitting reevaluation appeal:', err);
      setError(err.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="appeal-form-container">
        <div className="success-message">
          <MdCheckCircle className="success-icon" />
          <h2>Appeal Submitted Successfully!</h2>
          <p>Your result re-evaluation appeal has been submitted. You can track its status in My Appeals.</p>
          <button onClick={() => navigate('/lms/appeals-and-welfare/my-appeals')} className="view-appeals-btn">
            View My Appeals
          </button>
        </div>
      </div>
    );
  }

  const selectedResult = getSelectedExamResult();

  return (
    <div className="appeal-form-container">
      <div className="form-header">
        <h1><MdGrade /> Result Re-evaluation Appeal</h1>
        <p>Request a review of your exam results</p>
      </div>

      {error && (
        <div className="error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="appeal-form">
        {/* Student Information Section */}
        <div className="form-section">
          <h3>Student Information</h3>
          
          <div className="form-group">
            <label>Student Name</label>
            <input
              type="text"
              value={studentData?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username || ''}
              disabled
              className="readonly-field"
            />
          </div>

          <div className="form-group">
            <label>Index Number / Username</label>
            <input
              type="text"
              value={studentData?.index_number || user?.username || ''}
              disabled
              className="readonly-field"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <input
                type="text"
                value={departmentName}
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Faculty</label>
              <input
                type="text"
                value={facultyName}
                disabled
                className="readonly-field"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Batch</label>
              <input
                type="text"
                value={studentData?.intake_batch || batchName}
                disabled
                className="readonly-field"
              />
            </div>

            <div className="form-group">
              <label>Program</label>
              <input
                type="text"
                value={studentData?.program || ''}
                disabled
                className="readonly-field"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
              <label>Current CGPA</label>
              <input
                type="text"
                value={studentData?.final_cgpa || '0.00'}
                disabled
                className="readonly-field"
              />
            </div>
          </div>
        </div>

        {/* Appeal Details Section */}
        <div className="form-section">
          <h3>Appeal Details</h3>
          
          <div className="form-group">
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

          <div className="form-group">
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

        {/* Result Details Section */}
        <div className="form-section">
          <h3>Result Details</h3>

          <div className="form-group">
            <label>Select Exam Result <span className="required">*</span></label>
            {fetchingResults ? (
              <div className="loading-placeholder">Loading your exam results...</div>
            ) : (
              <select
                name="exam_result"
                value={formData.exam_result}
                onChange={handleInputChange}
                required
              >
                <option value="">Select exam result</option>
                {semesterResults.map(semester => (
                  <optgroup key={semester.semester} label={`Semester ${semester.semester} - ${semester.academic_year || ''}`}>
                    {semester.results && semester.results.map(result => (
                      <option key={result.id} value={result.id}>
                        {result.course_name || result.course_code || 'Course'} - {result.assessment_name || 'Exam'}: {result.marks_obtained || result.score || 0} ({result.grade || 'N/A'})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            {allResults.length === 0 && !fetchingResults && (
              <small className="warning-text">No exam results found. Make sure you have enrolled in courses with published results.</small>
            )}
          </div>

          {selectedResult && (
            <div className="selected-result-info">
              <h4>Selected Result Details:</h4>
              <div className="result-details-grid">
                <div className="result-detail-item">
                  <span className="detail-label">Course:</span>
                  <span className="detail-value">{selectedResult.course_name || selectedResult.course_code || 'N/A'}</span>
                </div>
                <div className="result-detail-item">
                  <span className="detail-label">Assessment:</span>
                  <span className="detail-value">{selectedResult.assessment_name || 'Exam'}</span>
                </div>
                <div className="result-detail-item">
                  <span className="detail-label">Semester:</span>
                  <span className="detail-value">{selectedResult.semester_name || `Semester ${selectedResult.semester}`}</span>
                </div>
                <div className="result-detail-item">
                  <span className="detail-label">Score:</span>
                  <span className="detail-value">{selectedResult.marks_obtained || selectedResult.score || 0} / {selectedResult.total_marks || 100}</span>
                </div>
                <div className="result-detail-item">
                  <span className="detail-label">Grade:</span>
                  <span className="detail-value grade-value">{selectedResult.grade || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Reason Type <span className="required">*</span></label>
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

          <div className="form-group">
            <label>Specific Concerns <span className="required">*</span></label>
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

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/lms/student/appeals')}>
            <MdCancel /> Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading || fetchingResults}>
            <MdSave /> {loading ? 'Submitting...' : 'Submit Appeal'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ResultReevalPage;