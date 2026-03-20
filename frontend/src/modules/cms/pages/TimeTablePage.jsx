import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDownload, MdAdd, MdEdit, MdDelete, MdClose, MdFilterList, MdSchool, MdScience } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './TimeTablePage.css';

const TimetablePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('semester'); // 'semester' or 'practical'
  
  // Data states
  const [semesterTimetables, setSemesterTimetables] = useState([]);
  const [practicalTimetables, setPracticalTimetables] = useState([]);
  const [modules, setModules] = useState([]);
  const [userModules, setUserModules] = useState([]);
  
  // Filter states
  const [semesterFilter, setSemesterFilter] = useState({
    year: '',
    semester: '',
    department: ''
  });
  const [practicalFilter, setPracticalFilter] = useState({
    year: '',
    semester: '',
    moduleCode: ''
  });
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    year: '',
    semester: '',
    department: '',
    moduleCode: '',
    title: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  
  // Years
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

  // Load modules
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const data = await request.GET('/_data/moduleCard.json');
        setModules(data);
        
        // Get user's assigned modules (for students)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'student') {
            // Assuming student has enrolled modules in user data
            // For now, show all modules as demo
            setUserModules(data);
          } else {
            setUserModules(data);
          }
        }
      } catch (err) {
        console.error("Failed to load modules", err);
      }
    };
    fetchModules();
  }, []);

  // Load timetables
  useEffect(() => {
    fetchSemesterTimetables();
    fetchPracticalTimetables();
  }, []);

  const fetchSemesterTimetables = async () => {
    try {
      // In real app: const data = await request.GET('/api/timetables/semester');
      const mockData = [
        { id: 1, year: '2026', semester: 'Semester 1', department: 'Computer Science', title: 'CS Semester 1 Timetable', fileUrl: '/timetables/cs_s1_2026.pdf', uploadedAt: '2026-01-15' },
        { id: 2, year: '2026', semester: 'Semester 1', department: 'Information Technology', title: 'IT Semester 1 Timetable', fileUrl: '/timetables/it_s1_2026.pdf', uploadedAt: '2026-01-15' }
      ];
      setSemesterTimetables(mockData);
    } catch (err) {
      console.error("Failed to fetch semester timetables", err);
    }
  };

  const fetchPracticalTimetables = async () => {
    try {
      // In real app: const data = await request.GET('/api/timetables/practical');
      const mockData = [
        { id: 1, year: '2026', semester: 'Semester 1', moduleCode: 'CS1012', moduleTitle: 'Programming Fundamentals', title: 'CS1012 Practical Schedule', fileUrl: '/timetables/cs1012_practical.pdf', uploadedAt: '2026-01-15' },
        { id: 2, year: '2026', semester: 'Semester 1', moduleCode: 'CS2023', moduleTitle: 'Data Structures', title: 'CS2023 Practical Schedule', fileUrl: '/timetables/cs2023_practical.pdf', uploadedAt: '2026-01-15' }
      ];
      setPracticalTimetables(mockData);
    } catch (err) {
      console.error("Failed to fetch practical timetables", err);
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
      moduleCode: '',
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
      department: item.department || '',
      moduleCode: item.moduleCode || '',
      title: item.title,
      file: null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        // In real app: await request.DELETE(`/api/timetables/${type}/${id}`);
        if (type === 'semester') {
          setSemesterTimetables(prev => prev.filter(item => item.id !== id));
        } else {
          setPracticalTimetables(prev => prev.filter(item => item.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // In real app: await request.POST('/api/timetables', formData);
      const newItem = {
        id: Date.now(),
        ...formData,
        uploadedAt: new Date().toISOString(),
        fileUrl: formData.file ? URL.createObjectURL(formData.file) : (editingItem?.fileUrl || '')
      };
      
      if (activeTab === 'semester') {
        if (editingItem) {
          setSemesterTimetables(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        } else {
          setSemesterTimetables(prev => [...prev, newItem]);
        }
      } else {
        if (editingItem) {
          setPracticalTimetables(prev => prev.map(item => item.id === editingItem.id ? newItem : item));
        } else {
          setPracticalTimetables(prev => [...prev, newItem]);
        }
      }
      
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSemesterTimetables = semesterTimetables.filter(item => {
    if (semesterFilter.year && item.year !== semesterFilter.year) return false;
    if (semesterFilter.semester && item.semester !== semesterFilter.semester) return false;
    if (semesterFilter.department && item.department !== semesterFilter.department) return false;
    return true;
  });

  const filteredPracticalTimetables = practicalTimetables.filter(item => {
    if (practicalFilter.year && item.year !== practicalFilter.year) return false;
    if (practicalFilter.semester && item.semester !== practicalFilter.semester) return false;
    if (practicalFilter.moduleCode && item.moduleCode !== practicalFilter.moduleCode) return false;
    
    // For students, only show their enrolled modules
    if (user?.role === 'student' && userModules.length > 0) {
      return userModules.some(m => m.code === item.moduleCode);
    }
    return true;
  });

  const isAdmin = user?.role === 'admin';

  return (
    <div className="timetable-container">
      <div className="timetable-header">
        <h1>Timetable Management</h1>
        <p>View and manage semester and practical timetables</p>
      </div>

      {/* Tabs */}
      <div className="timetable-tabs">
        <button
          className={`tab-btn ${activeTab === 'semester' ? 'active' : ''}`}
          onClick={() => setActiveTab('semester')}
        >
          <MdSchool /> Semester Timetables
        </button>
        <button
          className={`tab-btn ${activeTab === 'practical' ? 'active' : ''}`}
          onClick={() => setActiveTab('practical')}
        >
          <MdScience /> Practical Timetables
        </button>
      </div>

      {/* Semester Timetables */}
      {activeTab === 'semester' && (
        <div className="timetable-content">
          {/* Filters */}
          <div className="filters-section">
            <div className="filters-header">
              <MdFilterList /> Filter Timetables
            </div>
            <div className="filters-grid">
              <select
                value={semesterFilter.year}
                onChange={(e) => setSemesterFilter({ ...semesterFilter, year: e.target.value })}
              >
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={semesterFilter.semester}
                onChange={(e) => setSemesterFilter({ ...semesterFilter, semester: e.target.value })}
              >
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={semesterFilter.department}
                onChange={(e) => setSemesterFilter({ ...semesterFilter, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <button className="clear-filters" onClick={() => setSemesterFilter({ year: '', semester: '', department: '' })}>
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
            {filteredSemesterTimetables.length === 0 ? (
              <div className="empty-state">
                <p>No semester timetables found</p>
              </div>
            ) : (
              filteredSemesterTimetables.map(item => (
                <div key={item.id} className="timetable-card">
                  <div className="timetable-info">
                    <h3>{item.title}</h3>
                    <div className="timetable-meta">
                      <span>{item.year} • {item.semester}</span>
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
                        <button className="delete-btn" onClick={() => handleDelete(item.id, 'semester')}>
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
      )}

      {/* Practical Timetables */}
      {activeTab === 'practical' && (
        <div className="timetable-content">
          {/* Filters */}
          <div className="filters-section">
            <div className="filters-header">
              <MdFilterList /> Filter Timetables
            </div>
            <div className="filters-grid">
              <select
                value={practicalFilter.year}
                onChange={(e) => setPracticalFilter({ ...practicalFilter, year: e.target.value })}
              >
                <option value="">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select
                value={practicalFilter.semester}
                onChange={(e) => setPracticalFilter({ ...practicalFilter, semester: e.target.value })}
              >
                <option value="">All Semesters</option>
                {semesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={practicalFilter.moduleCode}
                onChange={(e) => setPracticalFilter({ ...practicalFilter, moduleCode: e.target.value })}
              >
                <option value="">All Modules</option>
                {userModules.map(m => <option key={m.code} value={m.code}>{m.code} - {m.title}</option>)}
              </select>
              <button className="clear-filters" onClick={() => setPracticalFilter({ year: '', semester: '', moduleCode: '' })}>
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
            {filteredPracticalTimetables.length === 0 ? (
              <div className="empty-state">
                <p>No practical timetables found</p>
              </div>
            ) : (
              filteredPracticalTimetables.map(item => (
                <div key={item.id} className="timetable-card">
                  <div className="timetable-info">
                    <h3>{item.title}</h3>
                    <div className="timetable-meta">
                      <span>{item.year} • {item.semester}</span>
                      <span>{item.moduleCode} - {item.moduleTitle}</span>
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
                        <button className="delete-btn" onClick={() => handleDelete(item.id, 'practical')}>
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
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Timetable' : 'Add New Timetable'}</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Year</label>
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
                <label>Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {activeTab === 'semester' ? (
                <div className="form-group">
                  <label>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label>Module</label>
                  <select
                    value={formData.moduleCode}
                    onChange={(e) => setFormData({ ...formData, moduleCode: e.target.value })}
                    required
                  >
                    <option value="">Select Module</option>
                    {modules.map(m => <option key={m.code} value={m.code}>{m.code} - {m.title}</option>)}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., CS Semester 1 Timetable"
                  required
                />
              </div>

              <div className="form-group">
                <label>PDF File</label>
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

export default TimetablePage;
