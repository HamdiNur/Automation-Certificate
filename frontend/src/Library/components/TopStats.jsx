import React from "react";

const TopStats = ({ stats }) => {
  return (
    <div className="stats-boxes">
      <div className="stat-card pending">
        <div>PENDING</div>
        <p>{stats.pending}</p>
      </div>
      <div className="stat-card rejected">
        <div>DENIED</div>
        <p>{stats.rejected}</p>
      </div>
      <div className="stat-card approved">
        <div>CLEARED</div>
        <p>{stats.approved}</p>
      </div>
    </div>
  );
};

export default TopStats;

