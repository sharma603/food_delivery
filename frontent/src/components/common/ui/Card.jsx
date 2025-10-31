import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title, 
  subtitle, 
  actions,
  padding = 'p-6',
  shadow = 'shadow-lg',
  rounded = 'rounded-xl',
  border = 'border border-gray-200',
  background = 'bg-white'
}) => {
  return (
    <div className={`${background} ${border} ${rounded} ${shadow} ${padding} ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
