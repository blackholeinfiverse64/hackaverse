import React from 'react';

const Glassy = ({ className = '', children, ...rest }) => {
  const cls = `glass-card ${className}`.trim();
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
};

export default Glassy;
