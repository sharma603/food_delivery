// Select Component
// This file structure created as per requested organization
import React from 'react';

const Select = ({ options = [], ...props }) => {
  return (
    <select {...props}>
      {options.map((option, index) => (
        <option key={index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default Select;
