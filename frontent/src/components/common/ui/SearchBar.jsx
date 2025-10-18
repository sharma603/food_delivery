// SearchBar Component
// This file structure created as per requested organization
import React, { useState, useEffect } from 'react';

const SearchBar = ({ onSearch, placeholder = "Search...", value = "", debounceMs = 300 }) => {
  const [searchTerm, setSearchTerm] = useState(value);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearch, debounceMs]);

  return (
    <div className="search-bar">
      <div className="search-input-wrapper">
        <i className="fas fa-search search-icon"></i>
        <input 
          type="text" 
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            className="clear-search"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
