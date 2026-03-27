import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdAdd, MdEdit, MdDelete, MdClose, MdColorLens,
  MdPerson, MdPlayArrow, MdSave, MdCancel, MdFilterList,
  MdClear
} from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import { jwtDecode } from "jwt-decode";
import ModuleCard from '../../cms/components/ModuleCard';
import './MyCoursesPage.css';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Filter states for admin
  const [filters, setFilters] = useState({
    semester: '',
    instructor: '',
    program: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3,
    color: '#6c5ce7',
    instructor: '',
    semester: 1,
    program: '',
    department: 1,
    gpa_applicable: true,
    offering_type: 'compulsory'
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [instructors, setInstructors] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [departments, setDepartments] = useState([]);

  // Color options for quick selection
  const colorOptions = [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#16a085', '#27ae60', '#2980b9',
    '#8e44ad', '#2c3e50', '#d35400', '#c0392b', '#7f8c8d'
  ];

  // Get user role from token
  useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem("access_token");
        if (!token) {
          setUserRole('student');
          setRoleLoading(false);
          return;
        }
        const decoded = jwtDecode(token);
        const role = decoded.role || decoded.user_role || 'student';
        setUserRole(role);
        setUserInfo({
          username: decoded.username || decoded.user_username,
          userId: decoded.user_id || decoded.id,
          email: decoded.email
        });
      } catch (err) {
        console.error('Error getting user role:', err);
        setUserRole('student');
      } finally {
        setRoleLoading(false);
      }
    };
    getUserRole();
  }, []);

  // Fetch courses based on role
  useEffect(() => {
    if (!roleLoading && userRole && (userRole === 'admin' || userRole === 'instructor')) {
      fetchCourses();
    }
  }, [userRole, roleLoading]);

  // Apply filters when courses or filters change
  useEffect(() => {
    if (userRole === 'admin' && courses.length > 0) {
      applyFilters();
    } else {
      setFilteredCourses(courses);
    }
  }, [courses, filters, userRole]);

  // Fetch additional data for admin
  useEffect(() => {
    if (userRole === 'admin') {
      fetchInstructors();
      fetchPrograms();
      fetchDepartments();
    }
  }, [userRole]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await request.GET('/lms/courses/');
      setCourses(data);
      setFilteredCourses(data);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructors = async () => {
    setLoadingInstructors(true);
    try {
      const data = await request.GET('/users/instructors/');
      setInstructors(data);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      setInstructors([]);
    } finally {
      setLoadingInstructors(false);
    }
  };

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const data = await request.GET('/lms/programs/');
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setPrograms([]);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await request.GET('/lms/departments/');
      setDepartments(data);
      if (data && data.length > 0 && !formData.department) {
        setFormData(prev => ({ ...prev, department: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const applyFilters = () => {
    let filtered = [...courses];
    
    // Filter by semester
    if (filters.semester) {
      filtered = filtered.filter(course => course.semester === parseInt(filters.semester));
    }
    
    // Filter by instructor
    if (filters.instructor) {
      filtered = filtered.filter(course => course.instructor?.id === parseInt(filters.instructor) || course.instructor === parseInt(filters.instructor));
    }
    
    // Filter by program
    if (filters.program) {
      filtered = filtered.filter(course => course.program?.id === parseInt(filters.program) || course.program === parseInt(filters.program));
    }
    
    setFilteredCourses(filtered);
  };

  const clearFilters = () => {
    setFilters({
      semester: '',
      instructor: '',
      program: ''
    });
    setFilteredCourses(courses);
  };

  const handleContinue = (courseId) => {
    navigate(`/cms/course-content/${courseId}`);
  };

  const handleAddCourse = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const courseData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        credits: parseInt(formData.credits),
        color: formData.color,
        instructor: formData.instructor ? parseInt(formData.instructor) : null,
        semester: parseInt(formData.semester),
        program: formData.program ? parseInt(formData.program) : null,
        department: formData.department ? parseInt(formData.department) : 1,
        gpa_applicable: formData.gpa_applicable,
        offering_type: formData.offering_type,
      };

      await request.POST('/lms/courses/', courseData);
      setShowAddModal(false);
      resetForm();
      await fetchCourses();
    } catch (err) {
      console.error('Error adding course:', err);
      setFormError(err.message || 'Failed to add course');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditCourse = async () => {
    setFormLoading(true);
    setFormError('');
    try {
      const courseData = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        credits: parseInt(formData.credits),
        color: formData.color,
        instructor: formData.instructor ? parseInt(formData.instructor) : null,
        semester: parseInt(formData.semester),
        program: formData.program ? parseInt(formData.program) : null,
        department: formData.department ? parseInt(formData.department) : 1,
        gpa_applicable: formData.gpa_applicable,
        offering_type: formData.offering_type,
      };

      await request.PUT(`/lms/courses/${editingCourse.id}/`, courseData);
      setShowEditModal(false);
      resetForm();
      await fetchCourses();
    } catch (err) {
      console.error('Error editing course:', err);
      setFormError(err.message || 'Failed to edit course');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (window.confirm(`Are you sure you want to delete "${courseName}"? This action cannot be undone.`)) {
      try {
        await request.DELETE(`/lms/courses/${courseId}/`);
        await fetchCourses();
      } catch (err) {
        console.error('Error deleting course:', err);
        alert('Failed to delete course. Please try again.');
      }
    }
  };

  const openEditModal = (course, isInstructor = false) => {
    setEditingCourse({ ...course, isInstructor });
    setFormData({
      code: course.code || '',
      name: course.name || '',
      description: course.description || '',
      credits: course.credits || 3,
      color: course.color || '#6c5ce7',
      instructor: course.instructor?.id || course.instructor || '',
      semester: course.semester || 1,
      program: course.program?.id || course.program || '',
      department: course.department?.id || course.department || 1,
      gpa_applicable: course.gpa_applicable !== undefined ? course.gpa_applicable : true,
      offering_type: course.offering_type || 'compulsory'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      credits: 3,
      color: '#6c5ce7',
      instructor: '',
      semester: 1,
      program: '',
      department: departments.length > 0 ? departments[0].id : 1,
      gpa_applicable: true,
      offering_type: 'compulsory'
    });
    setEditingCourse(null);
    setFormError('');
  };

  // Course Card Component using ModuleCard
  const CourseCard = ({ course, showActions = false, onEdit, onDelete, onContinue, isInstructor = false }) => {
    return (
      <div className="course-card-wrapper">
        <div onClick={() => !showActions && onContinue(course.id)} style={{ cursor: !showActions ? 'pointer' : 'default' }}>
          <ModuleCard
            code={course.code}
            title={course.name}
            color={course.color}
          />
        </div>
        {showActions && (
          <div className="course-actions-overlay">
            <button
              className="overlay-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(course, isInstructor);
              }}
              title="Edit Course"
            >
              <MdEdit />
            </button>
            {!isInstructor && (
              <button
                className="overlay-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(course.id, course.name);
                }}
                title="Delete Course"
              >
                <MdDelete />
              </button>
            )}
          </div>
        )}
        {course.instructor_name && (
          <div className="instructor-info">
            <MdPerson className="icon-small" /> {course.instructor_name}
          </div>
        )}
      </div>
    );
  };

  // Redirect students to dashboard or show access denied
  if (!roleLoading && userRole === 'student') {
    return (
      <div className="my-courses-container">
        <div className="access-denied">
          <div className="access-denied-icon">🔒</div>
          <h2>Access Denied</h2>
          <p>You don't have permission to view this page.</p>
          <button className="back-btn" onClick={() => navigate('/lms/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (roleLoading || loading) {
    return (
      <div className="my-courses-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  // Admin View with Filters
  if (userRole === 'admin') {
    // Get unique semesters from courses for filter dropdown
    const semesters = [...new Set(courses.map(c => c.semester))].sort((a, b) => a - b);
    
    return (
      <div className="my-courses-container">
        <div className="my-courses-header">
          <div className="header-left">
            <h1>Course Management</h1>
            <p className="course-welcome">Manage all courses in the system</p>
          </div>
          <div className="header-actions">
            <button className="filter-toggle-btn" onClick={() => setShowFilters(!showFilters)}>
              <MdFilterList /> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button className="add-course-btn" onClick={() => setShowAddModal(true)}>
              <MdAdd /> Add New Course
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {showFilters && (
          <div className="filters-section">
            <div className="filters-header">
              <MdFilterList /> Filter Courses
              <button className="clear-filters-btn" onClick={clearFilters}>
                <MdClear /> Clear All
              </button>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>Semester</label>
                <select
                  value={filters.semester}
                  onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
                >
                  <option value="">All Semesters</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Instructor</label>
                <select
                  value={filters.instructor}
                  onChange={(e) => setFilters({ ...filters, instructor: e.target.value })}
                >
                  <option value="">All Instructors</option>
                  {instructors.map(instructor => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name} ({instructor.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Program</label>
                <select
                  value={filters.program}
                  onChange={(e) => setFilters({ ...filters, program: e.target.value })}
                >
                  <option value="">All Programs</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="filter-results">
              Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        <div className="courses-grid">
          {filteredCourses.length === 0 ? (
            <div className="empty-state">
              <p>No courses found matching the selected filters.</p>
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            filteredCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                showActions={true}
                onEdit={openEditModal}
                onDelete={handleDeleteCourse}
                onContinue={handleContinue}
                isInstructor={false}
              />
            ))
          )}
        </div>

        {/* Add Course Modal (same as before) */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Course</h2>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  <MdClose />
                </button>
              </div>
              <div className="modal-body">
                {formError && <div className="error-message">{formError}</div>}
                <form onSubmit={(e) => { e.preventDefault(); handleAddCourse(); }}>
                  {/* Form fields remain the same */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Course Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        required
                        placeholder="e.g., CS101"
                      />
                    </div>
                    <div className="form-group">
                      <label>Course Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g., Programming Fundamentals"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Course Color</label>
                    <div className="color-picker-section">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="color-picker"
                      />
                      <div className="color-options">
                        {colorOptions.map(color => (
                          <div
                            key={color}
                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Credits *</label>
                      <input
                        type="number"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        min="1"
                        max="6"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Semester *</label>
                      <input
                        type="number"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        min="1"
                        max="8"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Instructor</label>
                      <select
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      >
                        <option value="">Select Instructor</option>
                        {loadingInstructors ? (
                          <option disabled>Loading instructors...</option>
                        ) : (
                          instructors.map(instructor => (
                            <option key={instructor.id} value={instructor.id}>
                              {instructor.first_name} {instructor.last_name} ({instructor.username})
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Program</label>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      >
                        <option value="">Select Program</option>
                        {loadingPrograms ? (
                          <option disabled>Loading programs...</option>
                        ) : (
                          programs.map(program => (
                            <option key={program.id} value={program.id}>
                              {program.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      placeholder="Course description..."
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>GPA Applicable</label>
                      <select
                        value={formData.gpa_applicable}
                        onChange={(e) => setFormData({ ...formData, gpa_applicable: e.target.value === 'true' })}
                      >
                        <option value="true">Yes (Counts toward GPA)</option>
                        <option value="false">No (Non-GPA)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Offering Type</label>
                      <select
                        value={formData.offering_type}
                        onChange={(e) => setFormData({ ...formData, offering_type: e.target.value })}
                      >
                        <option value="compulsory">Compulsory</option>
                        <option value="elective">Elective</option>
                      </select>
                    </div>
                  </div>

                  <div className="preview-section">
                    <label>Preview</label>
                    <div className="preview-card">
                      <ModuleCard
                        code={formData.code || 'CODE'}
                        title={formData.name || 'Course Title'}
                        color={formData.color}
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                      <MdCancel /> Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={formLoading}>
                      {formLoading ? 'Saving...' : <><MdSave /> Save Course</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Course Modal */}
        {showEditModal && !editingCourse?.isInstructor && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Course</h2>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  <MdClose />
                </button>
              </div>
              <div className="modal-body">
                {formError && <div className="error-message">{formError}</div>}
                <form onSubmit={(e) => { e.preventDefault(); handleEditCourse(); }}>
                  {/* Edit form fields remain the same */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Course Code</label>
                      <input type="text" value={formData.code} disabled />
                    </div>
                    <div className="form-group">
                      <label>Course Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Course Color</label>
                    <div className="color-picker-section">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="color-picker"
                      />
                      <div className="color-options">
                        {colorOptions.map(color => (
                          <div
                            key={color}
                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Credits</label>
                      <input
                        type="number"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                        min="1"
                        max="6"
                      />
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <input
                        type="number"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        min="1"
                        max="8"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Instructor</label>
                      <select
                        value={formData.instructor}
                        onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                      >
                        <option value="">Select Instructor</option>
                        {instructors.map(instructor => (
                          <option key={instructor.id} value={instructor.id}>
                            {instructor.first_name} {instructor.last_name} ({instructor.username})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Program</label>
                      <select
                        value={formData.program}
                        onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      >
                        <option value="">Select Program</option>
                        {programs.map(program => (
                          <option key={program.id} value={program.id}>
                            {program.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>GPA Applicable</label>
                      <select
                        value={formData.gpa_applicable}
                        onChange={(e) => setFormData({ ...formData, gpa_applicable: e.target.value === 'true' })}
                      >
                        <option value="true">Yes (Counts toward GPA)</option>
                        <option value="false">No (Non-GPA)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Offering Type</label>
                      <select
                        value={formData.offering_type}
                        onChange={(e) => setFormData({ ...formData, offering_type: e.target.value })}
                      >
                        <option value="compulsory">Compulsory</option>
                        <option value="elective">Elective</option>
                      </select>
                    </div>
                  </div>

                  <div className="preview-section">
                    <label>Preview</label>
                    <div className="preview-card">
                      <ModuleCard
                        code={formData.code || 'CODE'}
                        title={formData.name || 'Course Title'}
                        color={formData.color}
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                      <MdCancel /> Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={formLoading}>
                      {formLoading ? 'Saving...' : <><MdSave /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Instructor View
  if (userRole === 'instructor') {
    return (
      <div className="my-courses-container">
        <div className="my-courses-header">
          <h1>My Courses</h1>
          <p className="course-welcome">Manage your assigned courses</p>
        </div>

        <div className="courses-grid">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              showActions={true}
              onEdit={openEditModal}
              onDelete={handleDeleteCourse}
              onContinue={handleContinue}
              isInstructor={true}
            />
          ))}
        </div>

        {/* Edit Course Modal for Instructor */}
        {showEditModal && editingCourse?.isInstructor && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Edit Course</h2>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  <MdClose />
                </button>
              </div>
              <div className="modal-body">
                {formError && <div className="error-message">{formError}</div>}
                <form onSubmit={(e) => { e.preventDefault(); handleEditCourse(); }}>
                  {/* Same as before - instructor edit form */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Course Code</label>
                      <input type="text" value={formData.code} disabled />
                    </div>
                    <div className="form-group">
                      <label>Course Name</label>
                      <input type="text" value={formData.name} disabled />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Course Color (Editable)</label>
                    <div className="color-picker-section">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="color-picker"
                      />
                      <div className="color-options">
                        {colorOptions.map(color => (
                          <div
                            key={color}
                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                    </div>
                    <small className="helper-text">Only the course color can be edited</small>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Credits</label>
                      <input type="number" value={formData.credits} disabled />
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <input type="number" value={formData.semester} disabled />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Instructor</label>
                      <input 
                        type="text" 
                        value={instructors.find(i => i.id === parseInt(formData.instructor))?.first_name + ' ' + instructors.find(i => i.id === parseInt(formData.instructor))?.last_name || 'Not Assigned'} 
                        disabled 
                      />
                    </div>
                    <div className="form-group">
                      <label>Program</label>
                      <input 
                        type="text" 
                        value={programs.find(p => p.id === parseInt(formData.program))?.name || 'Not Selected'} 
                        disabled 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea value={formData.description} rows="3" disabled />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>GPA Applicable</label>
                      <select value={formData.gpa_applicable} disabled>
                        <option value="true">Yes (Counts toward GPA)</option>
                        <option value="false">No (Non-GPA)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Offering Type</label>
                      <select value={formData.offering_type} disabled>
                        <option value="compulsory">Compulsory</option>
                        <option value="elective">Elective</option>
                      </select>
                    </div>
                  </div>

                  <div className="preview-section">
                    <label>Preview</label>
                    <div className="preview-card">
                      <ModuleCard
                        code={formData.code || 'CODE'}
                        title={formData.name || 'Course Title'}
                        color={formData.color}
                      />
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)}>
                      <MdCancel /> Cancel
                    </button>
                    <button type="submit" className="submit-btn" disabled={formLoading}>
                      {formLoading ? 'Saving...' : <><MdSave /> Save Changes</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // If role is not recognized, show access denied
  return (
    <div className="my-courses-container">
      <div className="access-denied">
        <div className="access-denied-icon">🔒</div>
        <h2>Access Denied</h2>
        <p>You don't have permission to view this page.</p>
        <button className="back-btn" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default MyCoursesPage;