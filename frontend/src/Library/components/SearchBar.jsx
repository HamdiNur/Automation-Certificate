import React from "react";
import "../styles/dashboard.css";

const SearchBar = ({ search, onChange, onSearch }) => {
  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search by group number or student name"
        value={search}
        onChange={onChange}
      />
      <button onClick={onSearch}>Search Now!</button>
    </div>
  );
};

export default SearchBar;

// 📁 components/StatusBadge.js
import React from "react";
