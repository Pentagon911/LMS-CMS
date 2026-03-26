// UserManagement.jsx (updated with stats)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdEdit, MdDelete, MdClose, MdPerson, MdEmail, MdPhone, MdSchool, MdBadge, MdPeople, MdTrendingUp, MdTrendingDown, MdAdminPanelSettings, MdSchool as MdInstructor, MdAccountCircle } from 'react-icons/md';
import request from '../../../utils/requestMethods.jsx';
import './UserManagement.css';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'student',
    phone_number: '',
    department: '',
    program: '',
    current_semester: 1
  });

  const departments = ['Computer Science', 'Information Technology', 'Software Engineering', 'Data Science'];
  const roles = ['student', 'instructor', 'admin'];

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await request.GET('/users/');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await request.GET('/users/stats/');
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'student',
      phone_number: '',
      department: '',
      program: '',
      current_semester: 1
    });
    setShowModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone_number: user.phone_number || '',
      department: user.department_name || (user.profile?.department ? String(user.profile.department) : ''),
      program: user.profile?.program ? String(user.profile.program) : '',
      current_semester: user.profile?.current_semester || 1
    });
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await request.DELETE(`users/profile/${userId}/`);
        setUsers(prev => prev.filter(user => user.id !== userId));
        // Refresh stats after deletion
        fetchStats();
      } catch (err) {
        console.error('Failed to delete user', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      username: formData.username,
      email: formData.email,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      phone_number: formData.phone_number,
    };

    if (!editingUser) {
      payload.password = formData.password;
    }

    if (formData.role === 'student') {
      payload.profile = {
        department: formData.department,
        program: formData.program,
        current_semester: formData.current_semester,
      };
    }

    try {
      if (editingUser) {
        const updated = await request.PUT(`/users/${editingUser.id}/`, payload);
        setUsers(prev => prev.map(user => user.id === editingUser.id ? updated : user));
      } else {
        const created = await request.POST('/users/register/', payload);
        setUsers(prev => [...prev, created]);
      }
      setShowModal(false);
      // Refresh stats after create/update
      fetchStats();
    } catch (err) {
      console.error('Failed to save user', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'admin': return 'role-admin';
      case 'instructor': return 'role-instructor';
      default: return 'role-student';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1>User Management</h1>
        <p>Add, edit, and manage system users</p>
        <button className="add-user-btn" onClick={handleAddUser}>
          <MdAdd /> Add New User
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        {loadingStats ? (
          <div className="stats-loading">Loading stats...</div>
        ) : stats ? (
          <>
            <div className="stat-card">
              <div className="stat-icon"><MdPeople /></div>
              <div className="stat-info">
                <h3>Total Users</h3>
                <p className="stat-number">{stats.total_users}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MdTrendingUp /></div>
              <div className="stat-info">
                <h3>Active</h3>
                <p className="stat-number">{stats.active_users}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MdTrendingDown /></div>
              <div className="stat-info">
                <h3>Inactive</h3>
                <p className="stat-number">{stats.inactive_users}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MdAccountCircle /></div>
              <div className="stat-info">
                <h3>Students</h3>
                <p className="stat-number">{stats.by_role?.students || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MdInstructor /></div>
              <div className="stat-info">
                <h3>Instructors</h3>
                <p className="stat-number">{stats.by_role?.instructors || 0}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MdAdminPanelSettings /></div>
              <div className="stat-info">
                <h3>Admins</h3>
                <p className="stat-number">{stats.by_role?.admins || 0}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="stats-error">Failed to load statistics</div>
        )}
      </div>

      <div className="user-table-container">
        {loading && users.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    <div className="user-name">
                      <span className="user-initials">
                        {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                      </span>
                      {user.first_name} {user.last_name}
                    </div>
                  </td>
                  <td>@{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.department_name || user.profile?.department || '-'}</td>
                  <td>{formatDate(user.date_joined)}</td>
                  <td className="actions-cell">
                    <button className="edit-btn" onClick={() => handleEditUser(user)}>
                      <MdEdit />
                    </button>
                    <button className="delete-btn" onClick={() => handleDeleteUser(user.id)}>
                      <MdDelete />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal (unchanged) */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="user-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <MdClose />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label><MdPerson /> First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label><MdPerson /> Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label><MdBadge /> Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><MdEmail /> Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label><MdPhone /> Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                  ))}
                </select>
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    placeholder="Enter password"
                  />
                </div>
              )}

              {formData.role === 'student' && (
                <>
                  <div className="form-group">
                    <label><MdSchool /> Department</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Program</label>
                    <input
                      type="text"
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      placeholder="e.g., BSc Computer Science"
                    />
                  </div>

                  <div className="form-group">
                    <label>Current Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={formData.current_semester}
                      onChange={(e) => setFormData({ ...formData, current_semester: parseInt(e.target.value) })}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={loading}>
                  {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;