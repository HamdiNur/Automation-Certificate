import React from "react";
import "./skeletonProfile.css"; // make sure to create this too

const SkeletonProfile = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-line short" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-line" />
      <div className="skeleton-button" />
    </div>
  );
};

export default SkeletonProfile;
