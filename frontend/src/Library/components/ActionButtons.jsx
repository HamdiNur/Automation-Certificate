import React from "react";

const ActionButtons = ({ onApprove, onReject, onView }) => {
  return (
    <div className="action-buttons">
      <button className="btn-approve" onClick={onApprove}>Approve</button>
      <button className="btn-reject" onClick={onReject}>Reject</button>
      <button className="btn-view" onClick={onView}>View</button>
    </div>
  );
};

export default ActionButtons;
