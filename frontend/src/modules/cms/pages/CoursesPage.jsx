import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ModuleCard from "../components/ModuleCard";
import request from "../../../utils/requestMethods.jsx";
import "./CoursesPage.css";

// Announcement Card component
const AnnouncementCard = ({ announcement }) => {
  const [expanded, setExpanded] = useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Function to strip HTML tags for preview
  const getPlainTextPreview = (html, maxLength = 100) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || tempDiv.innerText || '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={`announcement-card ${expanded ? 'expanded' : ''}`}>
      <div className="announcement-header" onClick={() => setExpanded(!expanded)}>
        <div className="announcement-title-section">
          <span className="announcement-badge">📢</span>
          <h3 className="announcement-title">{announcement.title}</h3>
        </div>
        <span className="announcement-time">{formatDate(announcement.createdAt)}</span>
      </div>
      
      
      {/* Content with HTML rendering */}
      <div 
        className="announcement-content"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
        ) : (
          <div dangerouslySetInnerHTML={{ 
            __html: getPlainTextPreview(announcement.content, 150) 
          }} />
        )}
      </div>
      
      {/* Attachments */}
      {expanded && announcement.attachments?.length > 0 && (
        <div className="announcement-attachments">
          <span className="attachments-label">📎 Attachments:</span>
          <div className="attachments-list">
            {announcement.attachments.map((att, idx) => (
              <a 
                key={idx} 
                href={att.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="attachment-link"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="attachment-icon">📄</span>
                {att.fileName}
                {att.fileSize && (
                  <span className="file-size">({(att.fileSize / 1024).toFixed(0)} KB)</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
      
      <div className="announcement-footer">
        <span className="posted-by">Posted by {announcement.postedBy}</span>
        <button className="read-more-btn" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Show less' : 'Read more'}
        </button>
      </div>
    </div>
  );
};

// Announcements list component
const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        // Using your request.GET method
        const data = await request.GET('/_data/announcement.json');
        console.log("Announcements loaded:", data);
        
        // Ensure data is an array
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load announcements", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return (
      <div className="announcements-loading">
        <p>Loading announcements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="announcements-loading error">
        <p>Error loading announcements: {error}</p>
      </div>
    );
  }

  return (
    <div className="announcements-container">
      <div className="announcements-header">
        <h2 className="announcements-title">📢 Announcements</h2>
        <span className="announcements-count">{announcements.length} total</span>
      </div>
      
      {announcements.length === 0 ? (
        <p className="no-announcements">No announcements yet.</p>
      ) : (
        <div className="announcements-list">
          {announcements.map((announcement, idx) => (
            <AnnouncementCard 
              key={announcement.id || idx} 
              announcement={announcement} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CoursesPage = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);

  const scrollRef = useRef(null);
  const navigate = useNavigate();

  // Fetch modules JSON
  useEffect(() => {
    fetch("/_data/moduleCard.json")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setModules(data);
        setLoading(false);
        setTimeout(checkScrollButtons, 100);
      })
      .catch((err) => {
        console.error("Failed to load modules", err);
        setError(err.message);
        setLoading(false);
      });

    window.addEventListener("resize", checkScrollButtons);
    return () => window.removeEventListener("resize", checkScrollButtons);
  }, []);

  const checkScrollButtons = () => {
    if (scrollRef.current) {
      const hasScroll = scrollRef.current.scrollWidth > scrollRef.current.clientWidth;
      setShowScrollButtons(hasScroll);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const cardWidth = 220;
      const scrollAmount = direction === "left" ? -cardWidth * 2 : cardWidth * 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleCardClick = (code) => {
    navigate(`/module/${code}`);
  };

  if (loading) {
    return (
      <div className="courses-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your modules...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="courses-page-container">
        <div className="error-container">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page-container">
      <div className="courses-header">
        <h1 className="courses-title">Available Modules</h1>
        <p className="courses-subtitle">
          {modules.length} {modules.length === 1 ? "module" : "modules"} available
        </p>
      </div>

      <div className="carousel-container">
        {showScrollButtons && (
          <button className="scroll-button scroll-left" onClick={() => scroll("left")}>
            ←
          </button>
        )}

        <div className="modules-carousel" ref={scrollRef} onScroll={checkScrollButtons}>
          {modules.map((mod, index) => (
            <div
              key={mod.code}
              className="module-card-wrapper"
              onClick={() => handleCardClick(mod.code)}
            >
              <ModuleCard code={mod.code} title={mod.title} color={mod.color} />
            </div>
          ))}
        </div>

        {showScrollButtons && (
          <button className="scroll-button scroll-right" onClick={() => scroll("right")}>
            →
          </button>
        )}
      </div>

      {/* Announcements section - vertical list */}
      <Announcements />
    </div>
  );
};

export default CoursesPage;
