import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDownload, MdAdd, MdEdit, MdDelete, MdClose, MdFilterList, MdSchool, MdScience } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './TimeTablePage.css';
import { getUserFromToken } from "../../../utils/auth.jsx";

const TimetablePage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [activeTab, setActiveTab] = useState('semester');
  
  // Data states
  const [semesterTimetables, setSemesterTimetables] = useState([]);
  const [practicalTimetables, setPracticalTimetables] = useState([]);
  const [modules, setModules] = useState([]);
  const [userModules, setUserModules] = useState([]);
  const [faculties, setFaculties] = useState([]);
  
  const [semesterFilter, setSemesterFilter] = useState({
    year: '',
    semester: '',
    faculty: ''
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
    faculty: '',
    moduleCode: '',
    title: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  
  // Years
  const years = ['2024', '2025', '2026', '2027', '2028'];
  const semesters = ['1', '2','3','4','5','6','7','8'];

  useEffect(() => {
    const tokenData = getUserFromToken();
    setRole(tokenData.role);
  }, []);

  // Load faculties
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const data = await request.GET('/lms/faculties/');
        setFaculties(data.results || data);
      } catch (err) {
        console.error("Failed to load faculties", err);
      }
    };
    fetchFaculties();
  }, []);

  // Load modules
  useEffect(() => {
    const fetchModules = async () => {
    
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
      const data = await request.GET("/cms/academic-calendars/");
      setSemesterTimetables(data.results || data);
    } catch (err) {
      console.error("Failed to fetch semester timetables", err);
    }
  };

  const fetchPracticalTimetables = async () => {
    try {
      const data = await request.GET('/cms/practical-timetables/');
      setPracticalTimetables(data.results || data);
    } catch (err) {
      console.error("Failed to fetch practical timetables", err);
    }
  };

  const handleDownload = (fileUrl, title) => {
    const newBaseUrl = `${request.getBaseUrl()}${fileUrl}`;
    window.open(newBaseUrl, '_blank');
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      year: '',
      semester: '',
      faculty: '',
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
      faculty: item.faculty || '',
      moduleCode: item.moduleCode || '',
      title: item.title,
      file: null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        const endpoint = type === 'semester' 
          ? `/cms/academic-calendars/${id}/`
          : `/cms/practical-timetables/${id}/`;
        
        await request.DELETE(endpoint);
        
        if (type === 'semester') {
          setSemesterTimetables(prev => prev.filter(item => item.id !== id));
        } else {
          setPracticalTimetables(prev => prev.filter(item => item.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete", err);
        alert("Failed to delete. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      year: '',
      semester: '',
      faculty: '',
      moduleCode: '',
      title: '',
      file: null
    });
    setEditingItem(null);
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const formDataObj = new FormData();
    formDataObj.append('year', formData.year);
    formDataObj.append('semester', formData.semester);

    if (activeTab === 'semester') {
      if (!formData.faculty) throw new Error("Please select a faculty");
      formDataObj.append('faculty', formData.faculty);
    } else {
      if (!formData.moduleCode) throw new Error("Please select a module");
      formDataObj.append('faculty', formData.moduleCode); 
    }

    if (formData.title) {
      formDataObj.append('title', formData.title);
    }

    if (formData.file) {
      formDataObj.append('pdf', formData.file);
    } else if (!editingItem) {
      throw new Error("Please select a PDF file");
    }

    let response;
    let endpoint;

    if (activeTab === 'semester') {
      if (editingItem) {
        endpoint = `/cms/academic-calendars/${editingItem.id}/`;
        response = await request.UPDATE_FILE(endpoint, formDataObj);
      } else {
        endpoint = '/cms/academic-calendars/';
        response = await request.UPLOAD(endpoint, formDataObj);
      }
    } else {
      if (editingItem) {
        endpoint = `/cms/practical-timetables/${editingItem.id}/`;
        response = await request.UPDATE_FILE(endpoint, formDataObj);
      } else {
        endpoint = '/cms/practical-timetables/';
        response = await request.UPLOAD(endpoint, formDataObj);
      }
    }

const responseData = response.data || response;
const newItem = {
  id: responseData.id,
  year: responseData.year,
  semester: responseData.semester,
  title: responseData.title || formData.title || null,
  pdf_url: responseData.pdf_url,         
  uploaded_at: responseData.uploaded_at,   
};

if (activeTab === 'semester') {
  newItem.faculty = responseData.faculty;
} else {
  newItem.faculty = responseData.faculty;  
  newItem.moduleCode = responseData.faculty;
  const module = modules.find(m => (m.code || m.id) === responseData.faculty);
  if (module) newItem.moduleTitle = module.title;
}

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
    resetForm();

  } catch (err) {
  } finally {
    setLoading(false);
  }
};

  const filteredSemesterTimetables = semesterTimetables.filter(item => {
    if (semesterFilter.year && item.year !== semesterFilter.year) return false;
    if (semesterFilter.semester && item.semester !== semesterFilter.semester) return false;
    if (semesterFilter.faculty && item.faculty !== semesterFilter.faculty) return false;
    return true;
  });

  const filteredPracticalTimetables = practicalTimetables.filter(item => {
    if (practicalFilter.year && item.year !== practicalFilter.year) return false;
    if (practicalFilter.semester && item.semester !== practicalFilter.semester) return false;
    if (practicalFilter.moduleCode && item.moduleCode !== practicalFilter.moduleCode) return false;
    
    // For students, only show their enrolled modules
    if (role === 'student' && userModules.length > 0) {
      return userModules.some(m => m.code === item.moduleCode);
    }
    return true;
  });

  const isAdmin = role === 'admin';

  return (
    <div className="tt-main-container">
      <div className="tt-header">
        <h1>Timetable Management</h1>
        <p>View and manage semester and practical timetables</p>
      </div>

      {/* Tabs */}
      <div className="tt-tabs">
        <button
          className={`tt-tab-btn ${activeTab === 'semester' ? 'active' : ''}`}
          onClick={() => setActiveTab('semester')}
        >
          <MdSchool /> Semester Timetables
        </button>
        <button
          className={`tt-tab-btn ${activeTab === 'practical' ? 'active' : ''}`}
          onClick={() => setActiveTab('practical')}
        >
          <MdScience /> Practical Timetables
        </button>
      </div>

      {/* Semester Timetables */}
      {activeTab === 'semester' && (
        <div className="tt-content">
          {/* Filters */}
          <div className="tt-filters-section">
            <div className="tt-filters-header">
              <MdFilterList /> Filter Timetables
            </div>
            <div className="tt-filters-grid">
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
                {semesters.map(s => <option key={s} value={s}> Semesters {s}</option>)}
              </select>
              <select
                value={semesterFilter.faculty}
                onChange={(e) => setSemesterFilter({ ...semesterFilter, faculty: e.target.value })}
              >
                <option value="">All Faculties</option>
                {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>
              <button className="tt-clear-filters" onClick={() => setSemesterFilter({ year: '', semester: '', faculty: '' })}>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Add Button */}
          {isAdmin && (
            <button className="tt-add-btn" onClick={handleAdd}>
              <MdAdd /> Add
            </button>
          )}

          {/* Timetable List */}
          <div className="tt-list">
            {filteredSemesterTimetables.length === 0 ? (
              <div className="tt-empty-state">
                <p>No semester timetables found</p>
                {isAdmin && (
                  <button className="tt-add-first-btn" onClick={handleAdd}>
                    Add your first timetable
                  </button>
                )}
              </div>
            ) : (
              filteredSemesterTimetables.map(item => (
                <div key={item.id} className="tt-card">
                  <div className="tt-info">
                    <h3>{`${item.faculty}  -  [ Semester ${item.semester}  ,  Year ${item.year} ]`}</h3>
                    <div className="tt-meta">
                      <span>Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="tt-actions">
                    <button className="tt-download-btn" onClick={() => handleDownload(item.pdf_url, item.title)}>
                      <MdDownload /> Download
                    </button>
                    {isAdmin && (
                      <>
                        <button className="tt-edit-btn" onClick={() => handleEdit(item)}>
                          <MdEdit />
                        </button>
                        <button className="tt-delete-btn" onClick={() => handleDelete(item.id, 'semester')}>
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
        <div className="tt-content">
          {/* Filters */}
          <div className="tt-filters-section">
            <div className="tt-filters-header">
              <MdFilterList /> Filter Timetables
            </div>
            <div className="tt-filters-grid">
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
                {semesters.map(s => <option key={s} value={s}> Semester {s}</option>)}
              </select>
              <select
                value={practicalFilter.moduleCode}
                onChange={(e) => setPracticalFilter({ ...practicalFilter, moduleCode: e.target.value })}
              >
                <option value="">All Modules</option>
                {userModules.map(m => <option key={m.code || m.id} value={m.code || m.id}>{m.code} - {m.name}</option>)}
              </select>
              <button className="tt-clear-filters" onClick={() => setPracticalFilter({ year: '', semester: '', moduleCode: '' })}>
                Clear Filters
              </button>
            </div>
          </div>

          {/* Add Button */}
          {isAdmin && (
            <button className="tt-add-btn" onClick={handleAdd}>
              <MdAdd /> Add 
            </button>
          )}

          {/* Timetable List */}
          <div className="tt-list">
            {filteredPracticalTimetables.length === 0 ? (
              <div className="tt-empty-state">
                <p>No practical timetables found</p>
                {isAdmin && (
                  <button className="tt-add-first-btn" onClick={handleAdd}>
                    Add your first timetable
                  </button>
                )}
              </div>
            ) : (
              filteredPracticalTimetables.map(item => (
                <div key={item.id} className="tt-card">
                  <div className="tt-info">
                    <h3>{`${item.title} - [ Semester ${item.semester} , Year ${item.year} ]`}</h3>
                    <div className="tt-meta">
                      <span>Module {item.faculty}</span>
                      <span>Uploaded: {new Date(item.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="tt-actions">
                    <button className="tt-download-btn" onClick={() => handleDownload(item.pdf_url, item.title)}>
                      <MdDownload /> Download
                    </button>
                    {isAdmin && (
                      <>
                        <button className="tt-edit-btn" onClick={() => handleEdit(item)}>
                          <MdEdit />
                        </button>
                        <button className="tt-delete-btn" onClick={() => handleDelete(item.id, 'practical')}>
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
        <div className="tt-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="tt-modal-content" onClick={e => e.stopPropagation()}>
            <div className="tt-modal-header">
              <h3>{editingItem ? 'Edit Timetable' : 'Add New Timetable'}</h3>
              <button className="tt-close-btn" onClick={() => setShowAddModal(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="tt-modal-form">
              <div className="tt-form-group">
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

              <div className="tt-form-group">
                <label>Semester *</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              {activeTab === 'semester' ? (
                <div className="tt-form-group">
                  <label>Faculty *</label>
                  <select
                    value={formData.faculty}
                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                    required
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="tt-form-group">
                  <label>Module *</label>
                  <select
                    value={formData.moduleCode}
                    onChange={(e) => setFormData({ ...formData, moduleCode: e.target.value })}
                    required
                  >
                    <option value="">Select Module</option>
                    {modules.map(m => <option key={m.code || m.id} value={m.code || m.id}>{m.code} - {m.name}</option>)}
                  </select>
                </div>
              )}

          {activeTab == "practical" && <div className="tt-form-group">
                <label>Title (Optional)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., CS Semester 1 Timetable 2024"
                />
              </div>}

              <div className="tt-form-group">
                <label>PDF File {!editingItem && '*'}</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                  required={!editingItem}
                />
                {editingItem && !formData.file && (
                  <p className="tt-file-note">Leave empty to keep existing file</p>
                )}
              </div>

              <div className="tt-modal-actions">
                <button type="button" className="tt-cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="tt-save-btn" disabled={loading}>
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
