/**
 * Cultural Integration Demo Component
 * 
 * Demonstrates the integration of cultural assessment components with crisis detection
 * 
 * @module CulturalIntegrationDemo
 */

import React, { useState } from 'react';
import { CulturalAssessmentWizard, CulturalProfile } from './CulturalAssessmentWizard';
import { useCulturalContext, CulturalContextProvider } from '../hooks/useCulturalContext';
import { useCulturalCrisisDetection } from '../hooks/useCulturalCrisisDetection';
// Simple icon components (replace with actual icons when available)
const Globe = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>🌍</span>;
const Users = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>👥</span>;
const Shield = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>🛡️</span>;
const CheckCircle = ({ className }: { className?: string }) => <span className={`inline-block ${className || ''}`}>✅</span>;

/**
 * Demo component showing cultural assessment integration
 */
const CulturalIntegrationDemoContent: React.FC = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [completedProfile, setCompletedProfile] = useState<CulturalProfile | null>(null);
  
  // Use cultural context hook
  const {
    profile,
    adaptContent,
    getRecommendedInterventions,
    assessCulturalRisk,
    culturalSensitivity
  } = useCulturalContext();

  // Use cultural crisis detection
  const culturalCrisisDetection = useCulturalCrisisDetection({
    enableBiasCorrection: true,
    enableCulturalProfiling: true
  });
  
  const { state: crisisState, actions: crisisActions } = culturalCrisisDetection;

  const handleAssessmentComplete = (profile: CulturalProfile) => {
    setCompletedProfile(profile);
    setShowWizard(false);
    
    // Set the cultural profile for crisis detection
    crisisActions.setCulturalProfile({
      primaryCulture: profile.primaryCulture,
      secondaryCultures: profile.secondaryCultures,
      language: profile.languagePreferences[0],
      region: profile.primaryCulture,
      familyStructure: profile.familyStructure,
      communicationStyle: profile.communicationStyle as any,
      collectivismLevel: profile.familyInvolvementLevel / 5,
      hierarchyRespect: 0.5,
      emotionalExpression: 'contextual',
      crisisConceptualization: []
    });
  };

  const sampleText = "I've been feeling very stressed and my family doesn't understand.";
  const culturalRisk = assessCulturalRisk(sampleText);
  const adaptedContent = adaptContent("Depression is a common mental health condition that affects many people.");
  const interventions = getRecommendedInterventions();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {!showWizard ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Cultural Assessment System
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Providing culturally-sensitive mental health support
            </p>
          </div>

          {/* Current Profile Status */}
          {completedProfile ? (
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-2" />
                <h2 className="text-xl font-semibold text-green-800 dark:text-green-200">
                  Cultural Profile Complete
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Primary Culture</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {completedProfile.primaryCulture}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Language</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {completedProfile.languagePreferences.join(', ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Family Structure</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {completedProfile.familyStructure}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Communication</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {completedProfile.communicationStyle}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                No cultural profile configured. Complete the assessment to enable culturally-sensitive support.
              </p>
            </div>
          )}

          {/* Start Assessment Button */}
          <button
            onClick={() => setShowWizard(true)}
            className="mb-8 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
          >
            <Globe className="w-5 h-5 mr-2" />
            {completedProfile ? 'Update Cultural Assessment' : 'Start Cultural Assessment'}
          </button>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <Globe className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Multi-dimensional Assessment</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive cultural profiling including language, family structure, and spiritual considerations
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <Users className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Family & Community Support</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Understand and respect family involvement preferences and community support systems
              </p>
            </div>
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <Shield className="w-8 h-8 text-primary-600 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Cultural Stigma Awareness</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sensitive approach to cultural stigma with appropriate mitigation strategies
              </p>
            </div>
          </div>

          {/* Demo Results */}
          {completedProfile && (
            <div className="space-y-6">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Cultural Adaptations</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Original Content:</p>
                    <p className="text-gray-900 dark:text-white">
                      "Depression is a common mental health condition that affects many people."
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Culturally Adapted:</p>
                    <p className="text-gray-900 dark:text-white italic">{adaptedContent}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Cultural Risk Assessment</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Sample text: "{sampleText}"
                </p>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full"
                      style={{ width: `${culturalRisk * 100}%` }}
                    />
                  </div>
                  <span className="ml-3 font-medium">
                    {Math.round(culturalRisk * 100)}% Risk
                  </span>
                </div>
                {culturalSensitivity.stigmaLevel > 0.6 && (
                  <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                    Note: High cultural stigma detected - using sensitive approach
                  </p>
                )}
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Recommended Interventions</h3>
                <ul className="space-y-2">
                  {interventions.slice(0, 5).map((intervention, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{intervention}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-4">Cultural Sensitivity Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Family Involvement</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      culturalSensitivity.familyInvolvement 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {culturalSensitivity.familyInvolvement ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Community Oriented</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      culturalSensitivity.communityOriented 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {culturalSensitivity.communityOriented ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Spiritual Considerations</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      culturalSensitivity.spiritualConsiderations 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {culturalSensitivity.spiritualConsiderations ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Stigma Level</span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      culturalSensitivity.stigmaLevel > 0.6 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : culturalSensitivity.stigmaLevel > 0.3
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {culturalSensitivity.stigmaLevel > 0.6 ? 'High' : 
                       culturalSensitivity.stigmaLevel > 0.3 ? 'Medium' : 'Low'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <CulturalAssessmentWizard
          onComplete={handleAssessmentComplete}
          onExit={() => setShowWizard(false)}
          initialProfile={completedProfile || undefined}
        />
      )}
    </div>
  );
};

/**
 * Wrapper component with provider
 */
export const CulturalIntegrationDemo: React.FC = () => {
  return (
    <CulturalContextProvider>
      <CulturalIntegrationDemoContent />
    </CulturalContextProvider>
  );
};

export default CulturalIntegrationDemo;