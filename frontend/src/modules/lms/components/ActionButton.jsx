import React from 'react';
import './ActionButton.css';

const ActionButton = ({ icon, label, onClick }) => {
  return (
    <button className="action-button" onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
    </button>
  );
};

export default ActionButton;