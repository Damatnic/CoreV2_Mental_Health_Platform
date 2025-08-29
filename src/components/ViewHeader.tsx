import React from 'react';

export const ViewHeader: React.FC<{
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  return (
    <div className="view-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="view-subheader">{subtitle}</p>}
      </div>
      {children && <div className="view-header-actions">{children}</div>}
    </div>
  );
};