import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, MdClose, MdPeople, MdSchool, MdClass, 
  MdUpload, MdFileUpload, MdCheckCircle, MdError, 
  MdWarning, MdDelete, MdDownload, MdContentPaste,
  MdAssignment, MdGroupAdd
} from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './BatchStudentManagement.css';

const BatchStudentManagement = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [studentInput, setStudentInput] = useState('');
  const [parsedStudents, setParsedStudents] = useState([]);

  // Fetch all batches on component mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch batch details when batch is selected
  useEffect(() => {
    if (selectedBatch) {
      fetchBatchDetails(selectedBatch);
    }
  }, [selectedBatch]);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await request.GET('/lms/batches/');
      setBatches(data);
    } catch (err) {
      console.error('Failed to fetch batches', err);
      setError('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatchDetails = async (batchId) => {
    try {
      const data = await request.GET(`/lms/batches/${batchId}/`);
      setBatchDetails(data);
    } catch (err) {
      console.error('Failed to fetch batch details', err);
      setError('Failed to load batch details');
    }
  };

  const handleBatchSelect = (e) => {
    const batchId = parseInt(e.target.value);
    setSelectedBatch(batchId);
    setResult(null);
    setError(null);
    setStudentInput('');
    setParsedStudents([]);
  };

  const parseStudentData = (input) => {
    const lines = input.trim().split('\n');
    const parsed = [];
    const errors = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Expected format: username|email|first_name|last_name|password
      // or username,email,first_name,last_name,password
      const parts = line.includes('|') ? line.split('|') : line.split(',');
      
      if (parts.length < 5) {
        errors.push(`Line ${i + 1}: Invalid format. Expected: username|email|first_name|last_name|password`);
        continue;
      }

      const [username, email, firstName, lastName, password, phoneNumber = ''] = parts;
      
      if (!username || !email || !firstName || !lastName || !password) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      parsed.push({
        username: username.trim(),
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password: password.trim(),
        password2: password.trim(),
        phone_number: phoneNumber.trim(),
        current_semester: 1
      });
    }

    return { parsed, errors };
  };

  const handleTextareaChange = (e) => {
    const value = e.target.value;
    setStudentInput(value);
    
    if (value.trim()) {
      const { parsed, errors } = parseStudentData(value);
      setParsedStudents(parsed);
      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        setError(null);
      }
    } else {
      setParsedStudents([]);
      setError(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      setStudentInput(content);
      const { parsed, errors } = parseStudentData(content);
      setParsedStudents(parsed);
      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        setError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setStudentInput(text);
      const { parsed, errors } = parseStudentData(text);
      setParsedStudents(parsed);
      if (errors.length > 0) {
        setError(errors.join('\n'));
      } else {
        setError(null);
      }
    } catch (err) {
      setError('Failed to read from clipboard. Please paste manually.');
    }
  };

  const handleClearInput = () => {
    setStudentInput('');
    setParsedStudents([]);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedBatch) {
      setError('Please select a batch');
      return;
    }

    if (parsedStudents.length === 0) {
      setError('Please add at least one student');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await request.POST(`/lms/batches/${selectedBatch}/create-students/`, {
        students: parsedStudents
      });
      
      setResult(response);
      setShowModal(true);
      
      // Clear form on success
      if (response.created_students.length > 0) {
        setStudentInput('');
        setParsedStudents([]);
      }
    } catch (err) {
      console.error('Failed to create students', err);
      setError(err.response?.data?.error || 'Failed to create students');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `username|email|first_name|last_name|password|phone_number
john.doe|john.doe@example.com|John|Doe|password123|
jane.smith|jane.smith@example.com|Jane|Smith|password123|+1234567890
mike.brown|mike.brown@example.com|Mike|Brown|password123|`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPreviewClass = () => {
    if (parsedStudents.length > 0) return 'bsm-preview-success';
    if (studentInput.trim() && parsedStudents.length === 0) return 'bsm-preview-error';
    return 'bsm-preview-empty';
  };

  return (
    <div className="bsm-container">
      <div className="bsm-header">
        <h1><MdGroupAdd /> Batch Student Management</h1>
        <p>Create multiple students for a specific batch at once</p>
      </div>

      {/* Batch Selection Card */}
      <div className="bsm-card">
        <div className="bsm-card-header">
          <MdSchool className="bsm-card-icon" />
          <h3>Select Batch</h3>
        </div>
        <div className="bsm-card-content">
          <select 
            className="bsm-select" 
            value={selectedBatch || ''} 
            onChange={handleBatchSelect}
            disabled={loading}
          >
            <option value="">-- Select a batch --</option>
            {batches.map(batch => (
              <option key={batch.id} value={batch.id}>
                {batch.name} ({batch.year}) - {batch.department_name}
              </option>
            ))}
          </select>

          {batchDetails && (
            <div className="bsm-batch-info">
              <div className="bsm-info-row">
                <span className="bsm-info-label">Department:</span>
                <span className="bsm-info-value">{batchDetails.department_name}</span>
              </div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Faculty:</span>
                <span className="bsm-info-value">{batchDetails.faculty_name}</span>
              </div>
              <div className="bsm-info-row">
                <span className="bsm-info-label">Year:</span>
                <span className="bsm-info-value">{batchDetails.year}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Data Input Card */}
      <div className="bsm-card">
        <div className="bsm-card-header">
          <MdAssignment className="bsm-card-icon" />
          <h3>Student Data Input</h3>
          <div className="bsm-card-actions">
            <button className="bsm-icon-btn" onClick={downloadTemplate} title="Download Template">
              <MdDownload />
            </button>
            <button className="bsm-icon-btn" onClick={handlePasteFromClipboard} title="Paste from Clipboard">
              <MdContentPaste />
            </button>
            <label className="bsm-icon-btn bsm-file-label" title="Upload File">
              <MdFileUpload />
              <input type="file" accept=".txt,.csv" onChange={handleFileUpload} className="bsm-file-input" />
            </label>
          </div>
        </div>
        <div className="bsm-card-content">
          <div className="bsm-format-info">
            <strong>Format:</strong> username|email|first_name|last_name|password|phone_number
            <br />
            <small>Separate fields with | or , (comma). One student per line. Phone number is optional.</small>
          </div>
          
          <textarea
            className="bsm-textarea"
            rows="10"
            placeholder={`john.doe|john.doe@example.com|John|Doe|password123|
jane.smith|jane.smith@example.com|Jane|Smith|password123|+1234567890`}
            value={studentInput}
            onChange={handleTextareaChange}
          />
          
          {parsedStudents.length > 0 && (
            <div className={`bsm-preview ${getPreviewClass()}`}>
              <div className="bsm-preview-header">
                <strong>Preview: {parsedStudents.length} student(s) ready</strong>
                <button className="bsm-clear-btn" onClick={handleClearInput}>
                  <MdDelete /> Clear
                </button>
              </div>
              <div className="bsm-preview-list">
                {parsedStudents.slice(0, 5).map((student, index) => (
                  <div key={index} className="bsm-preview-item">
                    <span className="bsm-preview-name">{student.first_name} {student.last_name}</span>
                    <span className="bsm-preview-username">@{student.username}</span>
                    <span className="bsm-preview-email">{student.email}</span>
                  </div>
                ))}
                {parsedStudents.length > 5 && (
                  <div className="bsm-preview-more">
                    ... and {parsedStudents.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <div className="bsm-error-message">
              <MdWarning />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="bsm-actions">
        <button 
          className="bsm-cancel-btn" 
          onClick={() => navigate('/admin/users')}
        >
          Cancel
        </button>
        <button 
          className="bsm-submit-btn" 
          onClick={handleSubmit}
          disabled={!selectedBatch || parsedStudents.length === 0 || submitting}
        >
          {submitting ? 'Creating Students...' : `Create ${parsedStudents.length} Student(s)`}
        </button>
      </div>

      {/* Result Modal */}
      {showModal && result && (
        <div className="bsm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bsm-modal" onClick={e => e.stopPropagation()}>
            <div className="bsm-modal-header">
              <h3>Student Creation Results</h3>
              <button className="bsm-modal-close" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>
            <div className="bsm-modal-content">
              <div className="bsm-result-summary">
                <div className="bsm-result-success">
                  <MdCheckCircle />
                  <span>Successfully Created: {result.total_created}</span>
                </div>
                {result.total_errors > 0 && (
                  <div className="bsm-result-error">
                    <MdError />
                    <span>Failed: {result.total_errors}</span>
                  </div>
                )}
              </div>

              {result.created_students && result.created_students.length > 0 && (
                <div className="bsm-created-list">
                  <h4>Created Students:</h4>
                  <div className="bsm-created-items">
                    {result.created_students.map((student, idx) => (
                      <div key={idx} className="bsm-created-item">
                        <span>{student.user.first_name} {student.user.last_name}</span>
                        <span className="bsm-student-id">{student.student_id}</span>
                        <span className="bsm-student-username">@{student.user.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors && result.errors.length > 0 && (
                <div className="bsm-error-list">
                  <h4>Errors:</h4>
                  <div className="bsm-error-items">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="bsm-error-item">
                        <strong>Student {err.index + 1}:</strong> {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bsm-modal-footer">
              <button className="bsm-modal-btn" onClick={() => setShowModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchStudentManagement;