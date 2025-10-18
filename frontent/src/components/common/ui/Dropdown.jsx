// Dropdown Component
// This file structure created as per requested organization
import React, { useState } from 'react';

const Dropdown = ({ options, onSelect, placeholder = "Select..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  return (
    <div className="dropdown">
      <button onClick={() => setIsOpen(!isOpen)}>
        {selected || placeholder}
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option, index) => (
            <div
              key={index}
              onClick={() => {
                setSelected(option.label);
                onSelect(option);
                setIsOpen(false);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
