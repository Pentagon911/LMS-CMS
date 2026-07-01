import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDownload, MdAdd, MdEdit, MdDelete, MdClose, MdFilterList, MdEvent } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './TimeTableCustom.css';

const ExamTimetablePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Data states
  const [examTimetables, setExamTimetables] = useState([]);
  const [courses, setCourses] = useState([]);

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [examFilter, setExamFilter] = useState({
    semester: '',
    course: ''   // now stores course ID (string or number)
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    semester: '',
    course: '',
    title: '',
    pdf: null
  });
  const [submitting, setSubmitting] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Static options
  const semesters = [
    { value: 1, label: 'Semester 1' },
    { value: 2, label: 'Semester 2' }
  ];

  // Get user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (err) {
        console.error("Failed to parse user", err);
      }
    }
  }, []);

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [timetables, coursesData] = await Promise.all([
        request.GET('/lms/exam-timetables/'),
        request.GET('/lms/courses/')
      ]);
      console.log('Fetched timetables:', timetables);
      console.log('Fetched courses:', coursesData);
      setExamTimetables(timetables);
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ----- Download -----
  const handleDownload = async (item) => {
    setDownloadLoading(true);
    try {
      const response = await request.GET(`/lms/exam-timetables/${item.id}/download/`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = item.pdf ? item.pdf.split('/').pop() : `${item.title}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download the file. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  // ----- CRUD -----
  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ semester: '', course: '', title: '', pdf: null });
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      semester: item.semester,
      course: typeof item.course === 'object' ? item.course.id : item.course,
      title: item.title,
      pdf: null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam timetable?')) return;
    try {
      await request.DELETE(`/lms/exam-timetables/${id}/`);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete", err);
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  // ----- handleSubmit with auto‑refresh -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formData.pdf) {
        const file = formData.pdf;
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          alert('Please select a PDF file.');
          setSubmitting(false);
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be under 5 MB.');
          setSubmitting(false);
          return;
        }
      } else if (!editingItem) {
        alert('Please select a PDF file.');
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('semester', Number(formData.semester));
      formDataToSend.append('course', formData.course);
      formDataToSend.append('title', formData.title);
      if (formData.pdf) {
        formDataToSend.append('pdf', formData.pdf);
      }

      if (editingItem) {
        await request.PUT(`/lms/exam-timetables/${editingItem.id}/`, formDataToSend, {
          isFormData: true
        });
      } else {
        await request.POST('/lms/exam-timetables/', formDataToSend, {
          isFormData: true
        });
      }

      setShowAddModal(false);
      await fetchData();

    } catch (err) {
      console.error("Failed to save – full error:", err);
      let errorMsg = 'Failed to save exam timetable. Please check your input.';
      if (err.data) {
        const data = err.data;
        if (typeof data === 'object') {
          const messages = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          if (messages) errorMsg = messages;
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (err.response && err.response.data) {
        const data = err.response.data;
        if (typeof data === 'object') {
          const messages = Object.entries(data)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
            .join('\n');
          if (messages) errorMsg = messages;
        } else if (typeof data === 'string') {
          errorMsg = data;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      alert(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ----- Filtering (fixed) -----
  const filteredExamTimetables = examTimetables.filter(item => {
    // Semester filter
    if (examFilter.semester && Number(item.semester) !== Number(examFilter.semester)) {
      return false;
    }

    // Course filter – compare IDs (convert both to number)
    if (examFilter.course) {
      const itemCourseId = typeof item.course === 'object' ? item.course.id : Number(item.course);
      if (itemCourseId !== Number(examFilter.course)) {
        return false;
      }
    }

    return true;
  });

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  // ---- Loading / Error states ----
  if (loading) {
    return (
      <div className="timetable-container">
        <div className="loading-state">Loading exam timetables...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="timetable-container">
        <div className="error-state">
          <p>⚠️ {error}</p>
          <button onClick={fetchData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h1 className="timetable-headertitle">Exam Timetable Management</h1>
        <p className="timetable-headerdescription">View and manage examination timetables</p>
      </div>

      <div className="timetable-content">
        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <select
              value={examFilter.semester}
              onChange={(e) => setExamFilter({ ...examFilter, semester: e.target.value })}
            >
              <option value="">All Semesters</option>
              {semesters.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={examFilter.course}
              onChange={(e) => setExamFilter({ ...examFilter, course: e.target.value })}
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
              ))}
            </select>

            <button className="clear-filters" onClick={() => setExamFilter({ semester: '', course: '' })}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Add Button */}
        {isAdmin && (
          <button className="add-btn" onClick={handleAdd}>
            <MdAdd /> Add
          </button>
        )}

        {/* Timetable List */}
        <div className="timetable-list">
          {filteredExamTimetables.length === 0 ? (
            <div className="empty-state">
              <p>No exam timetables found</p>
            </div>
          ) : (
            filteredExamTimetables.map(item => (
              <div key={item.id} className="timetable-card">
                <div className="timetable-info">
                  <h3 className="module-title">{item.title}</h3>
                  <div className="timetable-meta">
                    <span><MdEvent /> Semester {item.semester}</span>
                    <span>
                      {typeof item.course === 'object'
                        ? item.course.code
                        : (courses.find(c => c.id === item.course)?.code || item.course)}
                    </span>
                    <span>Uploaded: {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="timetable-actions">
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(item)}
                    disabled={downloadLoading}
                  >
                    <MdDownload /> {downloadLoading ? 'Downloading...' : 'Download'}
                  </button>
                  {isAdmin && (
                    <>
                      <button className="edit-btn" onClick={() => handleEdit(item)}>
                        <MdEdit />
                      </button>
                      <button className="delete-btn" onClick={() => handleDelete(item.id)}>
                        <MdDelete />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal (unchanged) */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Exam Timetable' : 'Add New Exam Timetable'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Course *</label>
                <select
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                >
                  <option value="">Select Course</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., CS101 Exam Timetable"
                  required
                />
              </div>

              <div className="form-group">
                <label>PDF File {!editingItem && '*'}</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...formData, pdf: e.target.files[0] })}
                  required={!editingItem}
                />
                {editingItem && !formData.pdf && (
                  <p className="file-note">Current file: {editingItem.title}.pdf</p>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={submitting}>
                  {submitting ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamTimetablePage;
