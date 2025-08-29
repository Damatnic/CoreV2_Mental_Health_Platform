import React, { useState, useEffect } from 'react';
import { Heart, Brain, Shield, Users, CheckCircle, ArrowRight, Star, Sparkles, ChevronRight } from 'lucide-react';
import { AppButton } from './AppButton';

interface WelcomeScreenProps {
  user: {
    id: string;
    displayName: string;
    isAnonymous: boolean;
    isFirstVisit?: boolean;
  };
  onComplete: () => void;
  onSkip?: () => void;
  className?: string;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  completed: boolean;
  optional?: boolean;
}

const INITIAL_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Safe Space',
    description: 'This platform is designed to support your mental health journey with privacy and care.',
    icon: Heart,
    color: 'bg-pink-100 text-pink-600',
    completed: false
  },
  {
    id: 'features',
    title: 'Explore Key Features',
    description: 'Discover AI support, peer connections, wellness tracking, and crisis resources.',
    icon: Brain,
    color: 'bg-purple-100 text-purple-600',
    completed: false
  },
  {
    id: 'privacy',
    title: 'Your Privacy Matters',
    description: 'Learn about our privacy-first approach and data protection measures.',
    icon: Shield,
    color: 'bg-green-100 text-green-600',
    completed: false
  },
  {
    id: 'community',
    title: 'Connect & Support',
    description: 'Join a supportive community of peers and trained helpers.',
    icon: Users,
    color: 'bg-blue-100 text-blue-600',
    completed: false,
    optional: true
  }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  user,
  onComplete,
  onSkip,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState(INITIAL_STEPS);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [preferences, setPreferences] = useState({
    interests: [] as string[],
    supportTypes: [] as string[],
    goals: [] as string[]
  });

  const interests = [
    { id: 'anxiety', label: 'Anxiety Support', icon: Brain },
    { id: 'depression', label: 'Depression Support', icon: Heart },
    { id: 'stress', label: 'Stress Management', icon: Shield },
    { id: 'mindfulness', label: 'Mindfulness', icon: Sparkles },
    { id: 'relationships', label: 'Relationships', icon: Users },
    { id: 'self_care', label: 'Self-Care', icon: Star }
  ];

  const supportTypes = [
    { id: 'ai_chat', label: 'AI Support Chat' },
    { id: 'peer_support', label: 'Peer Support Groups' },
    { id: 'professional', label: 'Professional Resources' },
    { id: 'crisis', label: 'Crisis Support' },
    { id: 'tracking', label: 'Wellness Tracking' },
    { id: 'education', label: 'Educational Content' }
  ];

  const goals = [
    { id: 'mood_improvement', label: 'Improve Daily Mood' },
    { id: 'stress_reduction', label: 'Reduce Stress Levels' },
    { id: 'better_sleep', label: 'Get Better Sleep' },
    { id: 'social_connection', label: 'Build Social Connections' },
    { id: 'self_awareness', label: 'Increase Self-Awareness' },
    { id: 'healthy_habits', label: 'Develop Healthy Habits' }
  ];

  useEffect(() => {
    // Mark welcome step as completed immediately
    setSteps(prev => prev.map((step, index) => 
      index === 0 ? { ...step, completed: true } : step
    ));
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
      setSteps(prev => prev.map((step, index) => 
        index === currentStep ? { ...step, completed: true } : step
      ));
      setCurrentStep(currentStep + 1);
    } else {
      // Show personalization or complete
      if (!showPersonalization && !user.isAnonymous) {
        setShowPersonalization(true);
      } else {
        handleComplete();
      }
    }
  };

  const handleSkipToEnd = () => {
    setCurrentStep(steps.length - 1);
    setSteps(prev => prev.map(step => ({ ...step, completed: true })));
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    
    try {
      // Save user preferences if they were collected
      if (preferences.interests.length > 0 || preferences.supportTypes.length > 0) {
        await saveUserPreferences(preferences);
      }

      // Mark onboarding as complete
      await markOnboardingComplete();
      
      // Trigger completion
      onComplete();
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const saveUserPreferences = async (prefs: typeof preferences) => {
    // In a real app, this would save to the backend
    localStorage.setItem(`user_preferences_${user.id}`, JSON.stringify({
      ...prefs,
      completedAt: new Date().toISOString()
    }));
  };

  const markOnboardingComplete = async () => {
    // Mark onboarding as complete
    localStorage.setItem(`onboarding_complete_${user.id}`, 'true');
  };

  const togglePreference = (category: keyof typeof preferences, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  if (showPersonalization) {
    return (
      <div className={`welcome-screen min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Personalize Your Experience
              </h1>
              <p className="text-gray-600 text-lg">
                Help us tailor the platform to your needs and interests
              </p>
            </div>

            <div className="space-y-8">
              {/* Interests */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What areas interest you most?
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {interests.map(interest => {
                    const IconComponent = interest.icon;
                    const isSelected = preferences.interests.includes(interest.id);
                    
                    return (
                      <button
                        key={interest.id}
                        onClick={() => togglePreference('interests', interest.id)}
                        className={`
                          p-4 rounded-lg border-2 transition-all duration-200 text-left
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50 text-blue-900' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="font-medium">{interest.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Support Types */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Which types of support appeal to you?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {supportTypes.map(type => {
                    const isSelected = preferences.supportTypes.includes(type.id);
                    
                    return (
                      <button
                        key={type.id}
                        onClick={() => togglePreference('supportTypes', type.id)}
                        className={`
                          p-4 rounded-lg border-2 transition-all duration-200 text-left
                          ${isSelected 
                            ? 'border-green-500 bg-green-50 text-green-900' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{type.label}</span>
                          {isSelected && <CheckCircle className="w-5 h-5 text-green-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Goals */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  What are your wellness goals?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {goals.map(goal => {
                    const isSelected = preferences.goals.includes(goal.id);
                    
                    return (
                      <button
                        key={goal.id}
                        onClick={() => togglePreference('goals', goal.id)}
                        className={`
                          p-4 rounded-lg border-2 transition-all duration-200 text-left
                          ${isSelected 
                            ? 'border-purple-500 bg-purple-50 text-purple-900' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{goal.label}</span>
                          {isSelected && <CheckCircle className="w-5 h-5 text-purple-600" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <AppButton
                variant="ghost"
                onClick={() => setShowPersonalization(false)}
              >
                Back to Tour
              </AppButton>

              <div className="flex gap-3">
                <AppButton
                  variant="secondary"
                  onClick={handleComplete}
                  disabled={isCompleting}
                >
                  Skip Personalization
                </AppButton>
                <AppButton
                  variant="primary"
                  onClick={handleComplete}
                  loading={isCompleting}
                  loadingText="Setting up..."
                  icon={<CheckCircle className="w-4 h-4" />}
                >
                  Complete Setup
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`welcome-screen min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 ${className}`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={onSkip}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip Tour
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Welcome Message */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome, {user.displayName}! 👋
            </h1>
            <p className="text-xl text-gray-600">
              {user.isAnonymous 
                ? "Let's explore what this platform can do for you"
                : "We're excited to support your mental health journey"
              }
            </p>
          </div>

          {/* Current Step */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Step Header */}
            <div className={`p-8 ${currentStepData.color} bg-opacity-10`}>
              <div className="flex items-center justify-center mb-6">
                <div className={`w-20 h-20 rounded-full ${currentStepData.color} bg-opacity-20 flex items-center justify-center`}>
                  <IconComponent className={`w-10 h-10 ${currentStepData.color.split(' ')[1]}`} />
                </div>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
                {currentStepData.title}
              </h2>
              
              <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto">
                {currentStepData.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="p-8">
              {currentStep === 0 && <WelcomeContent />}
              {currentStep === 1 && <FeaturesContent />}
              {currentStep === 2 && <PrivacyContent />}
              {currentStep === 3 && <CommunityContent />}
            </div>

            {/* Navigation */}
            <div className="px-8 pb-8">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index <= currentStep
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex gap-3">
                  {currentStep < steps.length - 1 && (
                    <AppButton
                      variant="ghost"
                      onClick={handleSkipToEnd}
                    >
                      Skip to End
                    </AppButton>
                  )}
                  
                  <AppButton
                    variant="primary"
                    onClick={handleNext}
                    icon={currentStep < steps.length - 1 ? <ArrowRight className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    iconPosition="right"
                    loading={isCompleting}
                    loadingText="Completing..."
                  >
                    {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
                  </AppButton>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = step.completed;
              
              return (
                <div
                  key={step.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${isActive ? 'border-blue-500 bg-blue-50' : 
                      isCompleted ? 'border-green-500 bg-green-50' : 
                      'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <StepIcon className={`w-5 h-5 ${
                      isActive ? 'text-blue-600' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`} />
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                    )}
                  </div>
                  <h4 className={`font-semibold text-sm ${
                    isActive ? 'text-blue-900' : 
                    isCompleted ? 'text-green-900' : 
                    'text-gray-700'
                  }`}>
                    {step.title}
                  </h4>
                  {step.optional && (
                    <span className="text-xs text-gray-500 italic">Optional</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual step content components
const WelcomeContent: React.FC = () => (
  <div className="text-center space-y-6">
    <p className="text-lg text-gray-700">
      This is a safe, supportive space designed specifically for your mental health and wellbeing.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="flex flex-col items-center p-4">
        <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
          <Heart className="w-6 h-6 text-pink-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Compassionate</h3>
        <p className="text-sm text-gray-600 text-center">Built with empathy and understanding</p>
      </div>
      <div className="flex flex-col items-center p-4">
        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-purple-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Safe</h3>
        <p className="text-sm text-gray-600 text-center">Your privacy and security are our priority</p>
      </div>
      <div className="flex flex-col items-center p-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="font-semibold text-gray-900">Supportive</h3>
        <p className="text-sm text-gray-600 text-center">Connect with caring people who understand</p>
      </div>
    </div>
  </div>
);

const FeaturesContent: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
        <Brain className="w-8 h-8 text-blue-600 mt-1" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">AI Support Chat</h3>
          <p className="text-gray-700 text-sm">Get 24/7 support from our trained AI companion that understands mental health.</p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
        <Users className="w-8 h-8 text-green-600 mt-1" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Peer Support</h3>
          <p className="text-gray-700 text-sm">Connect with others who share similar experiences and challenges.</p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
        <Heart className="w-8 h-8 text-purple-600 mt-1" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Wellness Tracking</h3>
          <p className="text-gray-700 text-sm">Monitor your mood, habits, and progress with intuitive tracking tools.</p>
        </div>
      </div>
      <div className="flex items-start gap-4 p-4 bg-red-50 rounded-lg">
        <Shield className="w-8 h-8 text-red-600 mt-1" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Crisis Support</h3>
          <p className="text-gray-700 text-sm">Immediate access to crisis resources and professional help when you need it most.</p>
        </div>
      </div>
    </div>
  </div>
);

const PrivacyContent: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="w-8 h-8 text-green-600" />
        <h3 className="text-xl font-semibold text-green-900">Your Privacy is Protected</h3>
      </div>
      <ul className="space-y-3 text-gray-700">
        <li className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>End-to-end encryption for all sensitive communications</span>
        </li>
        <li className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>Anonymous options available - no personal information required</span>
        </li>
        <li className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>Data minimization - we only collect what's necessary</span>
        </li>
        <li className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>Full control over your data - export or delete anytime</span>
        </li>
        <li className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span>HIPAA-compliant security standards</span>
        </li>
      </ul>
    </div>
  </div>
);

const CommunityContent: React.FC = () => (
  <div className="space-y-6">
    <div className="text-center mb-8">
      <Users className="w-16 h-16 text-blue-600 mx-auto mb-4" />
      <h3 className="text-2xl font-semibold text-gray-900 mb-4">Join Our Caring Community</h3>
      <p className="text-gray-700 text-lg">
        Connect with others who understand your journey and trained helpers who care.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Peer Support Groups</h4>
        <p className="text-blue-800 text-sm mb-4">
          Join topic-based groups where you can share experiences and support each other.
        </p>
        <div className="flex items-center gap-2 text-blue-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Moderated for safety</span>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg p-6">
        <h4 className="font-semibold text-purple-900 mb-3">Trained Helpers</h4>
        <p className="text-purple-800 text-sm mb-4">
          Connect with verified peer supporters and mental health professionals.
        </p>
        <div className="flex items-center gap-2 text-purple-700 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Background checked</span>
        </div>
      </div>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800 text-sm flex items-center gap-2">
        <Star className="w-4 h-4 text-yellow-600" />
        <strong>Optional:</strong> You can always use the platform without joining community features.
      </p>
    </div>
  </div>
);

export default WelcomeScreen;
