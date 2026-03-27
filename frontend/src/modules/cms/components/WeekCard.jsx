import { useState } from "react";
import AddContentModal from "./AddContentModal.jsx";
import {MdDescription,MdQuiz,MdCampaign,MdFolder,MdAttachFile,MdLink,MdAccessTime,MdAssignment,MdCalendarToday,MdClose,MdAdd,MdExpandMore,MdChevronRight} from "react-icons/md";
import "./WeekCard.css";

const WeekCard = ({ data, weekNumber, weekIndex, isLecturer, onContentClick, onAddContent }) => {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [items, setItems] = useState(data.items || []);

  const toggleWeek = () => setExpanded(!expanded);
  
  const addContent = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  const handleAddContent = (newContent) => {
    if (onAddContent) {
      onAddContent(newContent);
    }
    setItems([...items, newContent]);
    closeModal();
  };

  const removeContent = (indexToRemove) => {
    if (window.confirm("Are you sure you want to remove this item?")) {
      const updatedItems = items.filter((_, index) => index !== indexToRemove);
      setItems(updatedItems);
    }
  };

  const handleItemClick = (item) => {
    if (onContentClick) {
      onContentClick(item);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'content': return <MdDescription />;
      case 'quiz': return <MdQuiz />;
      case 'announcement': return <MdCampaign />;
      default: return <MdFolder />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'content': return '#433AC2';
      case 'quiz': return '#B01D1D';
      case 'announcement': return '#05B010';
      default: return '#95a5a6'; 
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const renderContentItem = (item, index) => {
    const typeColor = getTypeColor(item.type);
    const typeIcon = getTypeIcon(item.type);

    return (
      <div 
        key={index} 
        className="cms-week-content-card"
        style={{ borderLeftColor: typeColor }}
        onClick={() => handleItemClick(item)}
      >
        <div className="cms-week-content-icon" style={{ backgroundColor: typeColor + '20', color: typeColor }}>
          {typeIcon}
        </div>
        
        <div className="cms-week-content-details">
          <div className="cms-week-content-title">
            {item.title}
            <span className="cms-week-content-type-badge" style={{ backgroundColor: typeColor + '20', color: typeColor }}>
              {item.type}
            </span>
          </div>
          
          <div className="cms-week-content-meta">
            {item.type === 'content' && (
              <>
                <span className="cms-week-meta-item"><MdAttachFile /> {item.format || 'File'}</span>
                {item.fileSize && <span className="cms-week-meta-item">{formatFileSize(item.fileSize)}</span>}
                {item.fileUrl && <span className="cms-week-meta-item"><MdLink /> View</span>}
              </>
            )}

            {item.type === 'quiz' && (
              <>
                <span className="cms-week-meta-item"><MdAccessTime /> {item.duration || '15 min'}</span>
                {item.questionsCount && <span className="cms-week-meta-item">{item.questionsCount} questions</span>}
                <span className="cms-week-meta-item"><MdAssignment /> {item.quizId ? 'Available' : 'No ID'}</span>
              </>
            )}

            {item.type === 'announcement' && (
              <>
                <span className="cms-week-meta-item"><MdCalendarToday /> {item.date || new Date().toLocaleDateString()}</span>
                {item.message && (
                  <span className="cms-week-meta-item">
                    {item.message.length > 30 ? item.message.substring(0, 30) + '...' : item.message}
                  </span>
                )}
              </>
            )}
          </div>

          {item.type === 'announcement' && item.message && (
            <div className="cms-week-announcement-preview">
              {item.message.length > 100 ? item.message.substring(0, 100) + '...' : item.message}
            </div>
          )}
        </div>

        {isLecturer && (
          <button
            className="cms-week-content-remove"
            onClick={(e) => {
              e.stopPropagation();
              removeContent(index);
            }}
            title="Remove item"
          >
            <MdClose size={20} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`cms-week-container ${expanded ? 'cms-week-expanded' : ''}`}>
      <div className="cms-week-header" onClick={toggleWeek}>
        <div className="cms-week-title">
          <span className="cms-week-number">{weekNumber || data.week || 'Week'}</span>
          <span className="cms-week-item-count">{items.length} items</span>
        </div>
        
        <div className="cms-week-actions">
          {isLecturer && (
            <button 
              className="cms-week-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                addContent();
              }}
              title="Add content"
            >
              <MdAdd />
            </button>
          )}
          
          <button className="cms-week-expand-btn">
            {expanded ? <MdExpandMore /> : <MdChevronRight />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="cms-week-content">
          {items.length === 0 ? (
            <div className="cms-week-empty-state">
              <p>No items in this week yet.</p>
              {isLecturer && (
                <button className="cms-week-add-first-btn" onClick={addContent}>
                  + Add First Item
                </button>
              )}
            </div>
          ) : (
            <div className="cms-week-content-grid">
              {items.map((item, index) => renderContentItem(item, index))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <AddContentModal 
          closeModal={closeModal} 
          onAdd={handleAddContent}
          weekId={weekIndex}  // Pass the week index (0-based) as weekId
          weekNumber={weekNumber || data.week}
          courseId={data.courseId}
        />
      )}
    </div>
  );
};

export default WeekCard;
