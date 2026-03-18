import React from 'react';
import './DashboardCard.css';

const DashboardCard = ({ title, icon, children }) => {
  return (
    <div className="dashboard-card">
      <h3>
        {icon && <span className="card-icon">{icon}</span>}
        {title}
      </h3>
      <div className="card-content">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;