import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdEdit, MdDelete, MdClose, MdColorLens, MdBook } from 'react-icons/md';
import ModuleCard from '../../cms/components/ModuleCard';
import './CourseManagement.css';

const CourseManagement = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    color: '#6c5ce7'
  });

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // In real app: const data = await request.GET('/courses/');
      const mockData = [
        { id: 1, code: 'CS1012', title: 'Programming Fundamentals', color: '#3498db' },
        { id: 2, code: 'CS1040', title: 'Program Construction', color: '#00ffff' },
        { id: 3, code: 'CS2023', title: 'Data Structures', color: '#2ecc71' },
        { id: 4, code: 'CS3050', title: 'Database Systems', color: '#e74c3c' },
        { id: 5, code: 'CS4010', title: 'Software Engineering', color: '#f39c12' },
      ];
      setCourses(mockData);
    } catch (err) {
      console.error("Failed to fetch courses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setFormData({
      code: '',
      title: '',
      color: '#6c5ce7'
    });
    setShowModal(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      title: course.title,
      color: course.color
    });
    setShowModal(true);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        // In real app: await request.DELETE(`/courses/${courseId}/`);
        setCourses(prev => prev.filter(course => course.id !== courseId));
      } catch (err) {
        console.error("Failed to delete course", err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingCourse) {
        // Update existing course
        // In real app: await request.PUT(`/courses/${editingCourse.id}/`, formData);
        const updatedCourse = {
          ...editingCourse,
          ...formData
        };
        setCourses(prev => prev.map(course => course.id === editingCourse.id ? updatedCourse : course));
      } else {
        // Create new course
        // In real app: const data = await request.POST('/courses/', formData);
        const newCourse = {
          id: Date.now(),
          ...formData
        };
        setCourses(prev => [...prev, newCourse]);
      }
      setShowModal(false);
    } catch (err) {
      console.error("Failed to save course", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (course) => {
    // Navigate to course details page or open edit modal
    // You can customize this based on your needs
    if (window.confirm(`Do you want to edit ${course.code}?`)) {
      handleEditCourse(course);
    }
  };

  return (
    <div className="course-management-container">
      <div className="course-management-header">
        <h1>Course Management</h1>
        <p>Add, edit, and manage course offerings</p>
        <button className="add-course-btn" onClick={handleAddCourse}>
          <MdAdd /> Add New Course
        </button>
      </div>

      <div className="courses-grid">
        {loading && courses.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading courses...</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="course-card-wrapper">
              <ModuleCard
                code={course.code}
                title={course.title}
                color={course.color}
              />
              <div className="course-actions-overlay">
                <button 
                  className="overlay-edit-btn"
                  onClick={() => handleEditCourse(course)}
                  title="Edit Course"
                >
                  <MdEdit />
                </button>
                <button 
                  className="overlay-delete-btn"
                  onClick={() => handleDeleteCourse(course.id)}
                  title="Delete Course"
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="course-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-group">
                <label>Course Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS1012"
                  required
                  maxLength="10"
                />
                <small className="form-hint">Example: CS1012, MATH1001</small>
              </div>

              <div className="form-group">
                <label>Course Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Programming Fundamentals"
                  required
                />
              </div>

              <div className="form-group">
                <label><MdColorLens /> Course Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="native-color-picker"
                  />
                  <div className="color-info">
                    <div className="color-value">{formData.color}</div>
                    <div className="color-preview" style={{ backgroundColor: formData.color }}></div>
                  </div>
                </div>
                <small className="form-hint">Click the color box to open the color picker</small>
              </div>

              {/* Preview Section */}
              <div className="preview-section">
                <label>Preview</label>
                <div className="preview-card">
                  <ModuleCard
                    code={formData.code || 'CODE'}
                    title={formData.title || 'Course Title'}
                    color={formData.color}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingCourse ? 'Update Course' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
