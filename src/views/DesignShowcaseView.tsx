/**
 * Design Showcase View
 * 
 * Demonstrates the design system components and patterns
 * used throughout the mental health platform
 */

import React, { useState } from 'react';
import { 
  HeartIcon, 
  StarIcon, 
  CalendarIcon, 
  MessageCircleIcon, 
  SettingsIcon, 
  UsersIcon, 
  ActivityIcon, 
  AlertTriangleIcon,
  CheckIcon,
  InfoIcon,
  XIcon,
  PlusIcon,
  DownloadIcon,
  UploadIcon,
  SearchIcon,
  FilterIcon,
  EyeIcon,
  BellIcon
} from '../components/icons.dynamic';

import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { ProgressBar } from '../components/ui/Progress';
import { Tabs } from '../components/ui/Tabs';
import { Toast } from '../components/Toast';
import { Modal } from '../components/Modal';

const DesignShowcaseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('buttons');
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [progress, setProgress] = useState(45);
  const [inputValue, setInputValue] = useState('');

  const componentSections = [
    { id: 'buttons', label: 'Buttons', icon: PlusIcon },
    { id: 'cards', label: 'Cards', icon: CalendarIcon },
    { id: 'forms', label: 'Forms', icon: MessageCircleIcon },
    { id: 'navigation', label: 'Navigation', icon: FilterIcon },
    { id: 'feedback', label: 'Feedback', icon: BellIcon },
    { id: 'data', label: 'Data Display', icon: ActivityIcon }
  ];

  const renderButtonSection = () => (
    <div className="space-y-8">
      {/* Button Variants */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Variants</h3>
        <div className="flex flex-wrap gap-4">
          <AppButton variant="primary">Primary</AppButton>
          <AppButton variant="secondary">Secondary</AppButton>
          <AppButton variant="outline">Outline</AppButton>
          <AppButton variant="ghost">Ghost</AppButton>
          <AppButton variant="danger">Danger</AppButton>
        </div>
      </div>

      {/* Button Sizes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Sizes</h3>
        <div className="flex items-center gap-4">
          <AppButton size="sm">Small</AppButton>
          <AppButton size="md">Medium</AppButton>
          <AppButton size="lg">Large</AppButton>
        </div>
      </div>

      {/* Button States */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Button States</h3>
        <div className="flex flex-wrap gap-4">
          <AppButton>Default</AppButton>
          <AppButton loading>Loading</AppButton>
          <AppButton disabled>Disabled</AppButton>
          <AppButton>With Icon</AppButton>
          <AppButton>Download</AppButton>
        </div>
      </div>

      {/* Icon Buttons */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Icon Buttons</h3>
        <div className="flex gap-4">
          <AppButton variant="outline" size="sm" icon={<SearchIcon />} />
          <AppButton variant="outline" size="sm" icon={<SettingsIcon />} />
          <AppButton variant="danger" size="sm" icon={<XIcon />} />
        </div>
      </div>
    </div>
  );

  const renderCardsSection = () => (
    <div className="space-y-8">
      {/* Basic Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Simple Card</h4>
            <p className="text-gray-600">This is a basic card with simple content.</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-5 h-5 text-red-500">
                <HeartIcon />
              </div>
              <h4 className="font-semibold text-gray-900">Card with Icon</h4>
            </div>
            <p className="text-gray-600">Card featuring an icon in the header.</p>
          </Card>

          <Card className="p-6">
            <h4 className="font-semibold text-gray-900 mb-2">Interactive Card</h4>
            <p className="text-gray-600 mb-4">This card has interactive elements.</p>
            <div className="flex gap-2">
              <AppButton size="sm" variant="outline">Action</AppButton>
              <AppButton size="sm">Primary</AppButton>
            </div>
          </Card>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">2,847</p>
                <p className="text-sm text-green-600">+12% from last month</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <div className="w-6 h-6 text-blue-600">
                  <UsersIcon />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">1,234</p>
                <p className="text-sm text-orange-600">+8% from yesterday</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <div className="w-6 h-6 text-green-600">
                  <ActivityIcon />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">15.2k</p>
                <p className="text-sm text-blue-600">+23% from last week</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <div className="w-6 h-6 text-purple-600">
                  <MessageCircleIcon />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Satisfaction</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-sm text-yellow-600">⭐⭐⭐⭐⭐</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <div className="w-6 h-6 text-yellow-600">
                  <StarIcon />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );

  const renderFormsSection = () => (
    <div className="space-y-8">
      {/* Form Elements */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Elements</h3>
        <Card className="p-6 max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Input
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter some text..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Textarea
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter a longer message..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option>Choose an option</option>
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkbox-example"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="checkbox-example" className="text-sm text-gray-700">
                I agree to the terms and conditions
              </label>
            </div>

            <div className="flex gap-2">
              <AppButton variant="outline" className="flex-1">Cancel</AppButton>
              <AppButton className="flex-1">Submit</AppButton>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderNavigationSection = () => (
    <div className="space-y-8">
      {/* Tabs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tabs</h3>
        <Card className="p-6">
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview', content: 'Overview content' },
              { id: 'analytics', label: 'Analytics', content: 'Analytics content' },
              { id: 'settings', label: 'Settings', content: 'Settings content' }
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Content for {activeTab} tab would go here.</p>
          </div>
        </Card>
      </div>

      {/* Breadcrumbs */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Breadcrumbs</h3>
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <a href="#" className="text-gray-500 hover:text-gray-700">Home</a>
            </li>
            <li>/</li>
            <li>
              <a href="#" className="text-gray-500 hover:text-gray-700">Design System</a>
            </li>
            <li>/</li>
            <li className="text-gray-900">Showcase</li>
          </ol>
        </nav>
      </div>

      {/* Pagination */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagination</h3>
        <nav className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex flex-1 justify-between sm:hidden">
            <AppButton variant="outline">Previous</AppButton>
            <AppButton variant="outline">Next</AppButton>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of{' '}
                <span className="font-medium">97</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Previous
                </button>
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  1
                </button>
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 ring-1 ring-inset ring-gray-300">
                  2
                </button>
                <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  3
                </button>
                <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  Next
                </button>
              </nav>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );

  const renderFeedbackSection = () => (
    <div className="space-y-8">
      {/* Badges */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="warning">Warning</Badge>
        </div>
      </div>

      {/* Alerts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-green-600">
                <CheckIcon />
              </div>
              <h4 className="font-medium text-green-900">Success Alert</h4>
            </div>
            <p className="text-green-700 mt-1">Your changes have been saved successfully.</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-blue-600">
                <InfoIcon />
              </div>
              <h4 className="font-medium text-blue-900">Info Alert</h4>
            </div>
            <p className="text-blue-700 mt-1">Here's some helpful information for you.</p>
          </div>

          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-red-600">
                <AlertTriangleIcon />
              </div>
              <h4 className="font-medium text-red-900">Error Alert</h4>
            </div>
            <p className="text-red-700 mt-1">Something went wrong. Please try again.</p>
          </div>
        </div>
      </div>

      {/* Toast Demo */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Toast Notifications</h3>
        <div className="flex gap-4">
          <AppButton onClick={() => setShowToast(true)}>Show Toast</AppButton>
        </div>
        {showToast && (
          <div className="p-4 bg-green-100 text-green-800 rounded-lg">
            <div className="flex justify-between items-center">
              <span>This is a toast notification!</span>
              <button onClick={() => setShowToast(false)} className="ml-4 font-bold">
                ×
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Demo */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modal</h3>
        <AppButton onClick={() => setShowModal(true)}>Open Modal</AppButton>
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Example Modal"
        >
          <p className="text-gray-600 mb-4">
            This is an example modal dialog. You can put any content here.
          </p>
          <div className="flex gap-2 justify-end">
            <AppButton variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </AppButton>
            <AppButton onClick={() => setShowModal(false)}>
              Confirm
            </AppButton>
          </div>
        </Modal>
      </div>
    </div>
  );


  const renderDataSection = () => (
    <div className="space-y-8">
      {/* Progress Bars */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Indicators</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <ProgressBar value={progress} max={100} />
          </div>
          
          <div className="flex gap-2">
            <AppButton 
              size="sm" 
              variant="outline"
              onClick={() => setProgress(Math.max(0, progress - 10))}
            >
              -10%
            </AppButton>
            <AppButton 
              size="sm" 
              variant="outline"
              onClick={() => setProgress(Math.min(100, progress + 10))}
            >
              +10%
            </AppButton>
          </div>
        </div>
      </div>

      {/* Avatars */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Avatars</h3>
        <div className="flex items-center gap-4">
          <Avatar size="sm" />
          <Avatar size="md" />
          <Avatar size="lg" />
          <Avatar 
            size="md" 
            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150" 
            alt="User Avatar" 
          />
        </div>
      </div>

      {/* Data Table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Table</h3>
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar size="sm" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Jane Cooper</div>
                        <div className="text-sm text-gray-500">jane@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Admin
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar size="sm" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">Tom Cook</div>
                        <div className="text-sm text-gray-500">tom@example.com</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline">Pending</Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    User
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'buttons': return renderButtonSection();
      case 'cards': return renderCardsSection();
      case 'forms': return renderFormsSection();
      case 'navigation': return renderNavigationSection();
      case 'feedback': return renderFeedbackSection();
      case 'data': return renderDataSection();
      default: return renderButtonSection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Design System Showcase</h1>
          <p className="text-gray-600">
            Explore the components and patterns used throughout the mental health platform.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64">
            <Card className="p-4">
              <nav className="space-y-2">
                {componentSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === section.id
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-5 h-5">
                        <Icon />
                      </div>
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card className="p-8">
              {renderContent()}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignShowcaseView;



