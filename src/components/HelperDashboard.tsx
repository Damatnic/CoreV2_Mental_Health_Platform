/**
 * Helper Dashboard Component - Simple Version
 */

import React from 'react';

const HelperDashboard: React.FC = () => {
  return React.createElement('div', { className: 'p-4' }, 
    React.createElement('h2', { className: 'text-xl font-bold' }, 'Helper Dashboard'),
    React.createElement('p', null, 'Dashboard functionality will be implemented when recharts dependency is available.')
  );
};

export default HelperDashboard;
