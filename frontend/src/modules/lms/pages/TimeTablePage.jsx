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
  
  // Filter states
  const [examFilter, setExamFilter] = useState({
    year: '',
    semester: '',
    department: ''
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    semester: '',
    department: '',
    title: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  
  // Options
  const years = ['2024', '2025', '2026', '2027', '2028'];
  const semesters = ['Semester 1', 'Semester 2'];
  const departments = ['Computer Science', 'Information Technology', 'Software Engineering', 'Data Science'];

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

  // Load exam timetables
  useEffect(() => {
    fetchExamTimetables();
  }, []);

  const fetchExamTimetables = async () => {
    try {
      // In real app: const data = await request.GET('/api/timetables/exams');
      const mockData = [
        { id: 1, year: '2026', semester: 'Semester 1', department: 'Computer Science', title: 'CS Semester 1 Exam Timetable', fileUrl: '/exams/cs_s1_2026.pdf', uploadedAt: '2026-01-20' },
        { id: 2, year: '2026', semester: 'Semester 1', department: 'Information Technology', title: 'IT Semester 1 Exam Timetable', fileUrl: '/exams/it_s1_2026.pdf', uploadedAt: '2026-01-20' }
      ];
      setExamTimetables(mockData);
    } catch (err) {
      console.error("Failed to fetch exam timetables", err);
    }
  };

  const handleDownload = (fileUrl, title) => {
    window.open(fileUrl, '_blank');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      year: '',
      semester: '',
      department: '',
      title: '',
      file: null
    });
    setShowAddModal(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      year: item.year,
      semester: item.semester,
      department: item.department,
      title: item.title,
      file: null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam timetable?')) {
      try {
        // In real app: await request.DELETE(`/api/timetables/exams/${id}`);
        setExamTimetables(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In real app: await request.POST('/api/timetables/exams', formData);
      const newItem = {
        id: editingItem ? editingItem.id : Date.now(),
        ...formData,
        uploadedAt: new Date().toISOString(),
        fileUrl: formData.file ? URL.createObjectURL(formData.file) : (editingItem?.fileUrl || '')
      };
      
      if (editingItem) {
        setExamTimetables(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
      } else {
        setExamTimetables(prev => [...prev, newItem]);
      }
      
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExamTimetables = examTimetables.filter(item => {
    if (examFilter.year && item.year !== examFilter.year) return false;
    if (examFilter.semester && item.semester !== examFilter.semester) return false;
    if (examFilter.department && item.department !== examFilter.department) return false;
    return true;
  });

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h1>Exam Timetable Management</h1>
        <p>View and manage examination timetables</p>
      </div>

      <div className="timetable-content">
        {/* Filters */}
        <div className="filters-section">
          <div className="filters-header">
            <MdFilterList /> Filter Exam Timetables
          </div>
          <div className="filters-grid">
            <select
              value={examFilter.year}
              onChange={(e) => setExamFilter({ ...examFilter, year: e.target.value })}
            >
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              value={examFilter.semester}
              onChange={(e) => setExamFilter({ ...examFilter, semester: e.target.value })}
            >
              <option value="">All Semesters</option>
              {semesters.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={examFilter.department}
              onChange={(e) => setExamFilter({ ...examFilter, department: e.target.value })}
            >
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button className="clear-filters" onClick={() => setExamFilter({ year: '', semester: '', department: '' })}>
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

        {/* Exam Timetable List */}
        <div className="timetable-list">
          {filteredExamTimetables.length === 0 ? (
            <div className="empty-state">
              <p>No exam timetables found</p>
            </div>
          ) : (
            filteredExamTimetables.map(item => (
              <div key={item.id} className="timetable-card">
                <div className="timetable-info">
                  <h3>{item.title}</h3>
                  <div className="timetable-meta">
                    <span><MdEvent /> {item.year} • {item.semester}</span>
                    <span>{item.department}</span>
                    <span>Uploaded: {new Date(item.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="timetable-actions">
                  <button className="download-btn" onClick={() => handleDownload(item.fileUrl, item.title)}>
                    <MdDownload /> Download
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

      {/* Add/Edit Modal */}
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
                <label>Year *</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                >
                  <option value="">Select Year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., CS Semester 1 Exam Timetable"
                  required
                />
              </div>

              <div className="form-group">
                <label>PDF File *</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  required={!editingItem}
                />
                {editingItem && !formData.file && (
                  <p className="file-note">Current file: {editingItem.title}.pdf</p>
                )}
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
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
