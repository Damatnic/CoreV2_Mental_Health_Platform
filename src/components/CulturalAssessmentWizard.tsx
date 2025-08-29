/**
 * Cultural Assessment Wizard Component
 * 
 * A step-by-step assessment flow for gathering cultural context and preferences
 * to provide culturally-sensitive mental health support.
 * 
 * @module CulturalAssessmentWizard
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { culturalAssessmentService } from '../services/culturalAssessmentService';
import { useCulturalContext } from '../hooks/useCulturalContext';
import { motion, AnimatePresence } from 'framer-motion';

// Simple icon components (replace with actual icons when available)
const ChevronLeft = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>‹</span>;
const ChevronRight = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>›</span>;
const Globe = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>🌍</span>;
const Users = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>👥</span>;
const Heart = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>❤️</span>;
const MessageCircle = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>💬</span>;
const Shield = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>🛡️</span>;
const CheckCircle = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>✅</span>;

// Component interfaces
interface CulturalAssessmentWizardProps {
  onComplete?: (profile: CulturalProfile) => void;
  onExit?: () => void;
  initialProfile?: Partial<CulturalProfile>;
  isAnonymous?: boolean;
}

export interface CulturalProfile {
  primaryCulture: string;
  secondaryCultures: string[];
  languagePreferences: string[];
  religiousAffiliation?: string;
  familyStructure: 'nuclear' | 'extended' | 'single_parent' | 'chosen_family' | 'community';
  familyInvolvementLevel: number; // 1-5 scale
  communicationStyle: 'direct' | 'indirect' | 'physical' | 'behavioral' | 'artistic';
  emotionalExpressionPreference: string;
  supportSystemMapping: {
    family: number; // 0-1 strength
    friends: number;
    community: number;
    professional: number;
    spiritual: number;
  };
  culturalStigmaAwareness: number; // 1-5 scale
  privacyPreferences: {
    dataSharing: 'minimal' | 'moderate' | 'full';
    familyAccess: boolean;
    anonymousMode: boolean;
  };
}

interface AssessmentStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  category: 'cultural_background' | 'family_structure' | 'religious_spiritual' | 'communication_style' | 'support_system' | 'privacy';
}

const ASSESSMENT_STEPS: AssessmentStep[] = [
  {
    id: 'cultural_background',
    title: 'Cultural Background',
    subtitle: 'Help us understand your cultural context',
    icon: <Globe className="w-6 h-6" />,
    category: 'cultural_background'
  },
  {
    id: 'family_structure',
    title: 'Family & Relationships',
    subtitle: 'Your family structure and involvement preferences',
    icon: <Users className="w-6 h-6" />,
    category: 'family_structure'
  },
  {
    id: 'religious_spiritual',
    title: 'Spiritual Beliefs',
    subtitle: 'Religious or spiritual considerations',
    icon: <Heart className="w-6 h-6" />,
    category: 'religious_spiritual'
  },
  {
    id: 'communication_style',
    title: 'Communication Style',
    subtitle: 'How you prefer to express yourself',
    icon: <MessageCircle className="w-6 h-6" />,
    category: 'communication_style'
  },
  {
    id: 'support_system',
    title: 'Support System',
    subtitle: 'Map your support network',
    icon: <Shield className="w-6 h-6" />,
    category: 'support_system'
  },
  {
    id: 'privacy_preferences',
    title: 'Privacy & Data',
    subtitle: 'Control your information',
    icon: <CheckCircle className="w-6 h-6" />,
    category: 'privacy'
  }
];

/**
 * Cultural Assessment Wizard Component
 */
export const CulturalAssessmentWizard: React.FC<CulturalAssessmentWizardProps> = ({
  onComplete,
  onExit,
  initialProfile,
  isAnonymous = false
}) => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<CulturalProfile>>(initialProfile || {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Use cultural context hook
  const { updateCulturalContext, getCulturalAdaptations } = useCulturalContext();

  // Get current step data
  const currentStepData = ASSESSMENT_STEPS[currentStep];
  const progress = ((currentStep + 1) / ASSESSMENT_STEPS.length) * 100;

  // Validate current step
  const validateStep = useCallback((stepIndex: number): boolean => {
    const step = ASSESSMENT_STEPS[stepIndex];
    const newErrors: Record<string, string> = {};

    switch (step.category) {
      case 'cultural_background':
        if (!profile.primaryCulture) {
          newErrors.primaryCulture = 'Please select your primary cultural background';
        }
        if (!profile.languagePreferences || profile.languagePreferences.length === 0) {
          newErrors.languagePreferences = 'Please select at least one language preference';
        }
        break;
      case 'family_structure':
        if (!profile.familyStructure) {
          newErrors.familyStructure = 'Please select your family structure';
        }
        break;
      case 'communication_style':
        if (!profile.communicationStyle) {
          newErrors.communicationStyle = 'Please select your communication style';
        }
        break;
      case 'support_system':
        if (!profile.supportSystemMapping) {
          newErrors.supportSystemMapping = 'Please map your support system';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profile]);

  // Handle navigation
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCompletedSteps(prev => new Set(prev).add(currentStep));
      if (currentStep < ASSESSMENT_STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  }, [currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleStepClick = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
    }
  }, [currentStep, completedSteps]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      // Create complete profile
      const completeProfile: CulturalProfile = {
        primaryCulture: profile.primaryCulture || 'western',
        secondaryCultures: profile.secondaryCultures || [],
        languagePreferences: profile.languagePreferences || ['en'],
        religiousAffiliation: profile.religiousAffiliation,
        familyStructure: profile.familyStructure || 'nuclear',
        familyInvolvementLevel: profile.familyInvolvementLevel || 3,
        communicationStyle: profile.communicationStyle || 'direct',
        emotionalExpressionPreference: profile.emotionalExpressionPreference || 'verbal',
        supportSystemMapping: profile.supportSystemMapping || {
          family: 0.5,
          friends: 0.5,
          community: 0.3,
          professional: 0.2,
          spiritual: 0.1
        },
        culturalStigmaAwareness: profile.culturalStigmaAwareness || 3,
        privacyPreferences: profile.privacyPreferences || {
          dataSharing: 'moderate',
          familyAccess: false,
          anonymousMode: isAnonymous
        }
      };

      // Update cultural context
      await updateCulturalContext(completeProfile);

      // Create assessment if not anonymous
      if (!isAnonymous) {
        await culturalAssessmentService.createCulturalAssessment(
          'CULTURAL_PROFILE',
          completeProfile.primaryCulture,
          completeProfile.languagePreferences[0]
        );
      }

      onComplete?.(completeProfile);
    } catch (error) {
      console.error('Failed to submit cultural assessment:', error);
      setErrors({ submit: 'Failed to save assessment. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  }, [profile, isAnonymous, updateCulturalContext, onComplete]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStepData.category) {
      case 'cultural_background':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Primary Cultural Background
              </label>
              <select
                value={profile.primaryCulture || ''}
                onChange={(e) => setProfile({ ...profile, primaryCulture: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
                aria-label="Primary cultural background"
              >
                <option value="">Select your cultural background</option>
                <option value="western">Western/European</option>
                <option value="east_asian">East Asian</option>
                <option value="south_asian">South Asian</option>
                <option value="middle_eastern">Middle Eastern</option>
                <option value="african">African</option>
                <option value="latin_american">Latin American</option>
                <option value="indigenous">Indigenous</option>
                <option value="nordic">Nordic</option>
                <option value="mixed">Mixed Heritage</option>
              </select>
              {errors.primaryCulture && (
                <p className="mt-1 text-sm text-red-600">{errors.primaryCulture}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language Preferences
              </label>
              <div className="space-y-2">
                {['English', 'Spanish', 'Chinese', 'Hindi', 'Arabic', 'Portuguese', 'French'].map(lang => (
                  <label key={lang} className="flex items-center">
                    <input
                      type="checkbox"
                      value={lang.toLowerCase()}
                      checked={profile.languagePreferences?.includes(lang.toLowerCase()) || false}
                      onChange={(e) => {
                        const langs = profile.languagePreferences || [];
                        if (e.target.checked) {
                          setProfile({ ...profile, languagePreferences: [...langs, e.target.value] });
                        } else {
                          setProfile({ ...profile, languagePreferences: langs.filter(l => l !== e.target.value) });
                        }
                      }}
                      className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{lang}</span>
                  </label>
                ))}
              </div>
              {errors.languagePreferences && (
                <p className="mt-1 text-sm text-red-600">{errors.languagePreferences}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How does your community view mental health?
              </label>
              <div className="space-y-2">
                {[
                  { value: 1, label: 'Very supportive and understanding' },
                  { value: 2, label: 'Somewhat supportive' },
                  { value: 3, label: 'Neutral or varies' },
                  { value: 4, label: 'Some stigma exists' },
                  { value: 5, label: 'Significant stigma' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="stigmaAwareness"
                      value={option.value}
                      checked={profile.culturalStigmaAwareness === option.value}
                      onChange={(e) => setProfile({ ...profile, culturalStigmaAwareness: parseInt(e.target.value) })}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'family_structure':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Family Structure
              </label>
              <select
                value={profile.familyStructure || ''}
                onChange={(e) => setProfile({ ...profile, familyStructure: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select family structure</option>
                <option value="nuclear">Nuclear family (parents and children)</option>
                <option value="extended">Extended family (multiple generations)</option>
                <option value="single_parent">Single parent household</option>
                <option value="chosen_family">Chosen family/close friends</option>
                <option value="community">Community-based support</option>
              </select>
              {errors.familyStructure && (
                <p className="mt-1 text-sm text-red-600">{errors.familyStructure}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Family Involvement in Mental Health Journey
              </label>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">None</span>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={profile.familyInvolvementLevel || 3}
                  onChange={(e) => setProfile({ ...profile, familyInvolvementLevel: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">Central</span>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Level {profile.familyInvolvementLevel || 3}: {
                  ['Not involved', 'Minimal', 'Moderate', 'Significant', 'Central to healing'][
                    (profile.familyInvolvementLevel || 3) - 1
                  ]
                }
              </p>
            </div>
          </div>
        );

      case 'religious_spiritual':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Religious/Spiritual Affiliation (Optional)
              </label>
              <input
                type="text"
                value={profile.religiousAffiliation || ''}
                onChange={(e) => setProfile({ ...profile, religiousAffiliation: e.target.value })}
                placeholder="e.g., Christianity, Islam, Buddhism, None..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role of Spiritual Beliefs in Mental Health
              </label>
              <div className="space-y-2">
                {[
                  'Central to my worldview',
                  'Important but not central',
                  'Some influence',
                  'Minimal influence',
                  'No religious/spiritual influence'
                ].map((option, index) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="radio"
                      name="spiritualRole"
                      value={5 - index}
                      checked={profile.supportSystemMapping?.spiritual === (5 - index) / 5}
                      onChange={(e) => setProfile({
                        ...profile,
                        supportSystemMapping: {
                          ...profile.supportSystemMapping!,
                          spiritual: parseInt(e.target.value) / 5
                        }
                      })}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 'communication_style':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                How do you prefer to express emotional distress?
              </label>
              <div className="space-y-2">
                {[
                  { value: 'direct', label: 'Direct verbal expression' },
                  { value: 'indirect', label: 'Indirect hints or metaphors' },
                  { value: 'physical', label: 'Physical symptoms or complaints' },
                  { value: 'behavioral', label: 'Through actions or behavior changes' },
                  { value: 'artistic', label: 'Through art, music, or creative expression' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="communicationStyle"
                      value={option.value}
                      checked={profile.communicationStyle === option.value}
                      onChange={(e) => setProfile({ ...profile, communicationStyle: e.target.value as any })}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.communicationStyle && (
                <p className="mt-1 text-sm text-red-600">{errors.communicationStyle}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Preferred way to receive support
              </label>
              <input
                type="text"
                value={profile.emotionalExpressionPreference || ''}
                onChange={(e) => setProfile({ ...profile, emotionalExpressionPreference: e.target.value })}
                placeholder="e.g., One-on-one conversations, group support, written communication..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        );

      case 'support_system':
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Rate the strength of each support system in your life (0 = None, 10 = Very Strong)
            </p>
            {[
              { key: 'family', label: 'Family Support' },
              { key: 'friends', label: 'Friends/Peers' },
              { key: 'community', label: 'Community/Cultural Groups' },
              { key: 'professional', label: 'Professional Support' },
              { key: 'spiritual', label: 'Spiritual/Religious Community' }
            ].map(system => (
              <div key={system.key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {system.label}
                </label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500 w-8">0</span>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={(profile.supportSystemMapping?.[system.key as keyof typeof profile.supportSystemMapping] || 0) * 10}
                    onChange={(e) => setProfile({
                      ...profile,
                      supportSystemMapping: {
                        ...profile.supportSystemMapping!,
                        [system.key]: parseInt(e.target.value) / 10
                      }
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500 w-8">10</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8">
                    {Math.round((profile.supportSystemMapping?.[system.key as keyof typeof profile.supportSystemMapping] || 0) * 10)}
                  </span>
                </div>
              </div>
            ))}
            {errors.supportSystemMapping && (
              <p className="mt-1 text-sm text-red-600">{errors.supportSystemMapping}</p>
            )}
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Data Sharing Preference
              </label>
              <div className="space-y-2">
                {[
                  { value: 'minimal', label: 'Minimal - Only essential data' },
                  { value: 'moderate', label: 'Moderate - Standard privacy' },
                  { value: 'full', label: 'Full - Help improve services' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="dataSharing"
                      value={option.value}
                      checked={profile.privacyPreferences?.dataSharing === option.value}
                      onChange={(e) => setProfile({
                        ...profile,
                        privacyPreferences: {
                          ...profile.privacyPreferences!,
                          dataSharing: e.target.value as any
                        }
                      })}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={profile.privacyPreferences?.familyAccess || false}
                  onChange={(e) => setProfile({
                    ...profile,
                    privacyPreferences: {
                      ...profile.privacyPreferences!,
                      familyAccess: e.target.checked
                    }
                  })}
                  className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  Allow family members to access my progress (with permission)
                </span>
              </label>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Your data is protected with enterprise-grade encryption and complies with HIPAA standards.
                You can change these preferences at any time.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Cultural Assessment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Help us understand your cultural context to provide better support
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Step {currentStep + 1} of {ASSESSMENT_STEPS.length}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className="bg-primary-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8">
        {ASSESSMENT_STEPS.map((step, index) => (
          <button
            key={step.id}
            onClick={() => handleStepClick(index)}
            disabled={index > currentStep && !completedSteps.has(index - 1)}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              index === currentStep
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : index < currentStep || completedSteps.has(index)
                ? 'text-green-600 dark:text-green-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            }`}
          >
            <div className={`p-2 rounded-full mb-1 ${
              index === currentStep
                ? 'bg-primary-200 dark:bg-primary-800'
                : index < currentStep || completedSteps.has(index)
                ? 'bg-green-200 dark:bg-green-800'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}>
              {index < currentStep || completedSteps.has(index) ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                step.icon
              )}
            </div>
            <span className="text-xs hidden sm:block">{step.title}</span>
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {currentStepData.subtitle}
            </p>
          </div>

          {renderStepContent()}

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200">{errors.submit}</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={currentStep === 0 ? onExit : handlePrevious}
          className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          {currentStep === 0 ? 'Exit' : 'Previous'}
        </button>

        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : currentStep === ASSESSMENT_STEPS.length - 1 ? (
            <>
              Complete
              <CheckCircle className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </>
          )}
        </button>
      </div>

      {/* Skip Option for Anonymous Users */}
      {isAnonymous && (
        <div className="mt-4 text-center">
          <button
            onClick={() => onComplete?.(profile as CulturalProfile)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Skip assessment (use default settings)
          </button>
        </div>
      )}
    </div>
  );
};

export default CulturalAssessmentWizard;