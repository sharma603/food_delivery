import React, { useState } from 'react';


const Form = ({ fields, onSubmit, submitLabel = 'Submit', initialValues = {} }) => {
  const [formData, setFormData] = useState(initialValues);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleMultiSelectChange = (e) => {
    const { name, options } = e.target;
    const values = Array.from(options).filter(option => option.selected).map(option => option.value);
    setFormData({
      ...formData,
      [name]: values,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name} className="form-label">
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="form-textarea"
              required={field.required}
              rows="4"
            />
          ) : field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="form-select"
              required={field.required}
            >
              <option value="">Select {field.label}</option>
              {field.options.map(option => {
                // Handle both string options and object options with value/label
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value}>{label}</option>
                );
              })}
            </select>
          ) : field.type === 'multiselect' ? (
            <select
              id={field.name}
              name={field.name}
              multiple
              value={formData[field.name] || []}
              onChange={handleMultiSelectChange}
              className="form-multiselect"
              required={field.required}
            >
              {field.options.map(option => {
                // Handle both string options and object options with value/label
                const value = typeof option === 'string' ? option : option.value;
                const label = typeof option === 'string' ? option : option.label;
                return (
                  <option key={value} value={value}>{label}</option>
                );
              })}
            </select>
          ) : (
            <input
              type={field.type || 'text'}
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className="form-input"
              required={field.required}
            />
          )}
        </div>
      ))}
      <button type="submit" className="form-submit">
        {submitLabel}
      </button>
    </form>
  );
};

export default Form;
