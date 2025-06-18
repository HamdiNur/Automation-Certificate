import React from "react";
import "./skeletonTable.css";

const SkeletonTable = ({ rows = 5, cols = 7 }) => {
  return (
    <div className="skeleton-table">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-row">
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="skeleton-cell"
              style={{ width: `${100 / cols - 2}%` }} // Auto width
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;
