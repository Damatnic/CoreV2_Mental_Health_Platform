import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Heart, Phone, MessageCircle, HeadphonesIcon } from 'lucide-react';

interface Custom404PageProps {
  title?: string;
  message?: string;
  showCrisisSupport?: boolean;
  showSuggestions?: boolean;
  className?: string;
}

export const Custom404Page: React.FC<Custom404PageProps> = ({
  title = "Page Not Found",
  message = "We couldn't find the page you're looking for.",
  showCrisisSupport = true,
  showSuggestions = true,
  className = ''
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleSearch = () => {
    navigate('/search');
  };

  const handleCrisisSupport = () => {
    navigate('/crisis-support');
  };

  const quickLinks = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: MessageCircle, label: 'AI Chat', path: '/chat' },
    { icon: Heart, label: 'Mood Tracker', path: '/mood' },
    { icon: HeadphonesIcon, label: 'Meditation', path: '/meditation' },
    { icon: Phone, label: 'Crisis Support', path: '/crisis-support' },
    { icon: Search, label: 'Resources', path: '/resources' }
  ];

  const crisisResources = [
    {
      name: 'National Suicide Prevention Lifeline',
      number: '988',
      description: '24/7 crisis support',
      action: () => window.location.href = 'tel:988'
    },
    {
      name: 'Crisis Text Line',
      number: 'Text HOME to 741741',
      description: 'Free 24/7 text support',
      action: () => window.location.href = 'sms:741741'
    },
    {
      name: 'Emergency Services',
      number: '911',
      description: 'Immediate emergency help',
      action: () => window.location.href = 'tel:911'
    }
  ];

  return (
    <div className={`custom-404-page min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="relative">
              {/* Large 404 Background */}
              <div className="text-gray-100 text-9xl font-bold select-none pointer-events-none">
                404
              </div>
              
              {/* Heart Icon Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl">
                  <Heart className="w-12 h-12 text-white fill-current" />
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4 mt-8">
              {title}
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {message} But don't worry – we're here to help you find what you need and support you along the way.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <button
                onClick={handleGoHome}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
              
              <button
                onClick={handleGoBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
              
              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
          </div>

          {/* Crisis Support Section */}
          {showCrisisSupport && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-12">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-semibold text-red-800 mb-2">
                  Need Immediate Support?
                </h2>
                <p className="text-red-700">
                  If you're experiencing a crisis, help is available 24/7. You're not alone.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {crisisResources.map((resource, index) => (
                  <button
                    key={index}
                    onClick={resource.action}
                    className="p-4 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors text-left group"
                  >
                    <div className="font-semibold text-red-800 mb-2 group-hover:text-red-900">
                      {resource.name}
                    </div>
                    <div className="text-lg font-bold text-red-600 mb-1 group-hover:text-red-700">
                      {resource.number}
                    </div>
                    <div className="text-sm text-red-600 group-hover:text-red-700">
                      {resource.description}
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center mt-6">
                <button
                  onClick={handleCrisisSupport}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  <Heart className="w-5 h-5" />
                  Access Crisis Support Tools
                </button>
              </div>
            </div>
          )}

          {/* Quick Links Section */}
          {showSuggestions && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                Popular Mental Health Resources
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quickLinks.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => navigate(link.path)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center">
                      <link.icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-700">
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Supportive Message */}
          <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Remember: You're Not Alone
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Even when things feel overwhelming or you can't find what you're looking for, 
              there are people who care and resources available to help. Your mental health 
              journey matters, and every step forward is progress.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/resources')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Browse Resources
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                Start AI Chat
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-12 text-center text-gray-500">
            <p className="mb-2">
              Still can't find what you're looking for?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/contact')}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Contact Support
              </button>
              <button
                onClick={() => navigate('/help')}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Help Center
              </button>
              <button
                onClick={() => navigate('/feedback')}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Send Feedback
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Custom404Page;
