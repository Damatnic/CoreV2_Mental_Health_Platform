/**
 * Application Progress Tracker Component
 * TODO: Implement complete progress tracking UI
 */

import * as React from 'react';

interface ApplicationProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  applicationScore: number;
  completionPercentage: number;
}

const ApplicationProgressTracker: React.FC<ApplicationProgressTrackerProps> = ({
  currentStep,
  totalSteps,
  applicationScore,
  completionPercentage
}) => {
  return React.createElement('div', {
    className: 'bg-white p-4 rounded-lg shadow-sm border border-gray-200'
  },
    React.createElement('div', { className: 'flex justify-between items-center mb-2' },
      React.createElement('span', { className: 'text-sm font-medium text-gray-700' },
        `Step ${currentStep} of ${totalSteps}`
      ),
      React.createElement('span', { className: 'text-sm font-medium text-blue-600' },
        `${completionPercentage}% Complete`
      )
    ),
    React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
      React.createElement('div', {
        className: 'bg-blue-600 h-2 rounded-full transition-all duration-300',
        style: { width: `${completionPercentage}%` }
      })
    ),
    applicationScore > 0 && React.createElement('div', { className: 'mt-2 text-sm text-gray-600' },
      `Application Score: ${applicationScore}/100`
    )
  );
};

export default ApplicationProgressTracker;