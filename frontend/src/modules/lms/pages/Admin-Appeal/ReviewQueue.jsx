// src/modules/lms/pages/Admin-Appeal/ReviewQueue.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import request from '../../../../utils/requestMethods';
import { MdRefresh, MdAssignment, MdCheckCircle, MdWarning, MdVisibility } from 'react-icons/md';
import './ReviewQueue.css';

const ReviewQueue = () => {
  const navigate = useNavigate();
  const [queueItems, setQueueItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    department: '',
  });

  useEffect(() => {
    fetchQueueItems();
  }, [filters]);

  const fetchQueueItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.department) params.append('department', filters.department);
      
      const queryString = params.toString();
      const url = `/lms/review-queue/${queryString ? `?${queryString}` : ''}`;
      const response = await request.GET(url);
      setQueueItems(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching review queue:', err);
      setError(err.message || 'Failed to load review queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (queueId) => {
    setProcessingId(queueId);
    try {
      await request.POST(`/lms/review-queue/${queueId}/assign/`, {});
      fetchQueueItems();
    } catch (error) {
      console.error('Error assigning review:', error);
      alert(error.message || 'Failed to assign review.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcess = async (queueId) => {
    setProcessingId(queueId);
    try {
      await request.POST(`/lms/review-queue/${queueId}/process/`, {});
      fetchQueueItems();
    } catch (error) {
      console.error('Error processing review:', error);
      alert(error.message || 'Failed to mark as processed.');
    } finally {
      setProcessingId(null);
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'HIGH': return 'priority-high';
      case 'MEDIUM': return 'priority-medium';
      case 'LOW': return 'priority-low';
      default: return '';
    }
  };

  const getCategoryDisplay = (category) => {
    const categories = {
      'financial': 'Financial',
      'welfare': 'Welfare',
      'academic': 'Academic',
      'medical': 'Medical',
    };
    return categories[category] || category;
  };

  const handleViewAppeal = (queueItem) => {
    const categoryMap = {
      'financial': 'bursary',
      'welfare': 'hostel',
      'academic': 'exam-rewrite',
      'medical': 'medical-leave',
    };
    const appealType = categoryMap[queueItem.category] || 'bursary';
    navigate(`/lms/admin/appeals/${appealType}/${queueItem.object_id}`);
  };

  if (loading) {
    return;
  }

  return (
    <div className="rq-review-queue-container">
      <div className="rq-queue-header">
        <h1>Appeal Review Queue</h1>
        <button className="rq-refresh-btn" onClick={fetchQueueItems}>
          <MdRefresh /> Refresh
        </button>
      </div>

      <div className="rq-filters-section">
        <div className="rq-filter-group">
          <label>Category:</label>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="">All</option>
            <option value="financial">Financial</option>
            <option value="welfare">Welfare</option>
            <option value="academic">Academic</option>
            <option value="medical">Medical</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rq-error-alert">
          <MdWarning />
          <span>{error}</span>
        </div>
      )}

      {queueItems.length === 0 ? (
        <div className="rq-empty-state">
          <p>No items in the review queue.</p>
        </div>
      ) : (
        <div className="rq-queue-table-container">
          <table className="rq-queue-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Faculty</th>
                <th>Academic Year</th>
                <th>Batch</th>
                <th>Assigned To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queueItems.map((item) => (
                <tr key={item.id}>
                  <td className="rq-queue-id">{item.id}</td>
                  <td>{getCategoryDisplay(item.category)}</td>
                  <td>
                    <span className={`priority-badge ${getPriorityBadgeClass(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td>{item.department_name || 'N/A'}</td>
                  <td>{item.faculty_name || 'N/A'}</td>
                  <td>{item.academic_year || 'N/A'}</td>
                  <td>{item.batch_name || 'N/A'}</td>
                  <td>{item.assigned_to_name || 'Unassigned'}</td>
                  <td className="rq-actions">
                    <button
                      className="rq-action-btn-view-btn"
                      onClick={() => handleViewAppeal(item)}
                      title="View Appeal"
                    >
                      <MdVisibility />
                    </button>
                    {!item.assigned_to && (
                      <button
                        className="rq-action-btn-assign-btn"
                        onClick={() => handleAssign(item.id)}
                        disabled={processingId === item.id}
                        title="Assign to me"
                      >
                        <MdAssignment />
                      </button>
                    )}
                    {!item.is_processed && (
                      <button
                        className="rq-action-btn-process-btn"
                        onClick={() => handleProcess(item.id)}
                        disabled={processingId === item.id}
                        title="Mark as Processed"
                      >
                        <MdCheckCircle />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;