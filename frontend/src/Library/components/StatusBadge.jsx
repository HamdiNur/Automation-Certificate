import React from "react";

const StatusBadge = ({ label }) => {
  let className = "badge ";

  switch (label) {
    case "Approved":
    case "Cleared":
    case "Received":
    case true:
      className += "badge-success";
      break;
    case "Pending":
    case "Not Received":
    case false:
      className += "badge-pending";
      break;
    case "Rejected":
      className += "badge-danger";
      break;
    default:
      className += "badge-default";
      break;
  }

  const displayText = label === true
    ? "Cleared"
    : label === false
    ? "Pending"
    : label;

  return <span className={className}>{displayText}</span>;
};

export default StatusBadge;
