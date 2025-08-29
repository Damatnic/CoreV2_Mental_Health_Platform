import React, { useState } from 'react';
import { Heart, Shield, Users, MessageCircle, AlertCircle, CheckCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';

interface GuidelineSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
  examples?: {
    good: string[];
    avoid: string[];
  };
  importance: 'essential' | 'important' | 'helpful';
}

export const CommunityGuidelinesView: React.FC = () => {
  const navigate = useNavigate();
  const [acknowledgedSections, setAcknowledgedSections] = useState<Set<string>>(new Set());
  const [expandedSection, setExpandedSection] = useState<string | null>('safety-first');

  const guidelines: GuidelineSection[] = [
    {
      id: 'safety-first',
      title: 'Safety and Crisis Support',
      icon: <Shield className="w-6 h-6 text-red-500" />,
      importance: 'essential',
      content: [
        'If you or someone else is in immediate danger, please call emergency services (911) right away.',
        'For mental health crises, contact the 988 Suicide & Crisis Lifeline (call or text 988).',
        'Our platform provides support resources, but is not a substitute for professional medical care.',
        'Crisis support is available 24/7 through our emergency contacts and trained moderators.',
        'Never hesitate to seek help - your safety is our top priority.'
      ],
      examples: {
        good: [
          '"I\'m struggling today and could use some support"',
          '"Has anyone else experienced anxiety like this?"',
          'Sharing coping strategies that have helped you'
        ],
        avoid: [
          'Detailed descriptions of self-harm methods',
          'Encouraging harmful behaviors',
          'Dismissing someone\'s crisis situation'
        ]
      }
    },
    {
      id: 'respectful-communication',
      title: 'Respectful and Supportive Communication',
      icon: <Heart className="w-6 h-6 text-pink-500" />,
      importance: 'essential',
      content: [
        'Treat everyone with kindness, empathy, and respect.',
        'Use "I" statements when sharing experiences (e.g., "I felt..." rather than "You should...").',
        'Avoid giving direct medical advice - share experiences, not prescriptions.',
        'Listen actively and validate others\' feelings without trying to "fix" everything.',
        'Remember that everyone\'s mental health journey is different and valid.'
      ],
      examples: {
        good: [
          '"I understand how difficult that must be for you"',
          '"In my experience, talking to a therapist helped me with similar feelings"',
          'Offering encouragement and hope while acknowledging pain'
        ],
        avoid: [
          '"Just think positive thoughts"',
          '"Others have it worse"',
          'Minimizing someone\'s struggles or offering quick fixes'
        ]
      }
    },
    {
      id: 'privacy-confidentiality',
      title: 'Privacy and Confidentiality',
      icon: <Users className="w-6 h-6 text-blue-500" />,
      importance: 'essential',
      content: [
        'Respect others\' privacy and confidentiality at all times.',
        'Do not share personal information (names, locations, contact details) of other members.',
        'What is shared in our community stays in our community.',
        'Use our anonymous features when you need extra privacy.',
        'Report any privacy violations to our moderation team immediately.'
      ],
      examples: {
        good: [
          'Sharing your own experiences without identifying details',
          'Using pseudonyms or general descriptions',
          'Keeping discussions within the platform'
        ],
        avoid: [
          'Screenshots or sharing conversations outside the platform',
          'Revealing personal details about other members',
          'Attempting to contact members through other means without consent'
        ]
      }
    },
    {
      id: 'constructive-sharing',
      title: 'Constructive and Healing-Focused Sharing',
      icon: <MessageCircle className="w-6 h-6 text-green-500" />,
      importance: 'important',
      content: [
        'Share experiences in ways that promote healing and growth.',
        'Focus on recovery, coping strategies, and positive progress.',
        'Be mindful that your words can deeply impact others who are vulnerable.',
        'When discussing difficult topics, consider using content warnings.',
        'Celebrate successes, both big and small, in your mental health journey.'
      ],
      examples: {
        good: [
          'Sharing what coping strategies have worked for you',
          'Celebrating therapy breakthroughs or medication adjustments',
          'Offering hope while acknowledging current struggles'
        ],
        avoid: [
          'Graphic descriptions of trauma without warnings',
          'Promoting unhealthy coping mechanisms',
          'Focusing solely on negative aspects without balance'
        ]
      }
    },
    {
      id: 'professional-boundaries',
      title: 'Professional Boundaries and Limitations',
      icon: <AlertCircle className="w-6 h-6 text-yellow-500" />,
      importance: 'important',
      content: [
        'Peer support complements but does not replace professional mental health care.',
        'Do not provide specific medical, psychological, or psychiatric advice.',
        'Encourage others to consult with qualified mental health professionals.',
        'Share resources and experiences, not diagnoses or treatment recommendations.',
        'Respect when someone chooses not to take advice or suggestions.'
      ],
      examples: {
        good: [
          '"My therapist suggested this technique, maybe it could work for you too"',
          '"Have you considered talking to a professional about this?"',
          'Sharing general resources and helplines'
        ],
        avoid: [
          '"You definitely have [specific condition]"',
          '"You should stop/start taking [medication]"',
          'Acting as a therapist or medical professional'
        ]
      }
    }
  ];

  const toggleAcknowledgment = (sectionId: string) => {
    const newAcknowledged = new Set(acknowledgedSections);
    if (newAcknowledged.has(sectionId)) {
      newAcknowledged.delete(sectionId);
    } else {
      newAcknowledged.add(sectionId);
    }
    setAcknowledgedSections(newAcknowledged);
  };

  const toggleExpanded = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const allEssentialAcknowledged = guidelines
    .filter(g => g.importance === 'essential')
    .every(g => acknowledgedSections.has(g.id));

  const getImportanceColor = (importance: GuidelineSection['importance']) => {
    switch (importance) {
      case 'essential': return 'text-red-600 bg-red-50 border-red-200';
      case 'important': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'helpful': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImportanceLabel = (importance: GuidelineSection['importance']) => {
    switch (importance) {
      case 'essential': return 'Essential';
      case 'important': return 'Important';
      case 'helpful': return 'Helpful';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <AppButton
              variant="ghost"
              size="small"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </AppButton>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Community Guidelines
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our guidelines ensure a safe, supportive, and healing-focused environment 
              for everyone in our mental health community.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <Heart className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                Welcome to Our Supportive Community
              </h2>
              <p className="text-blue-800 leading-relaxed">
                You've joined a community dedicated to mental health support, healing, and growth. 
                These guidelines help us maintain a space where everyone feels safe to share, 
                learn, and support each other on their mental health journey.
              </p>
            </div>
          </div>
        </div>

        {/* Guidelines Sections */}
        <div className="space-y-6">
          {guidelines.map((guideline) => {
            const isExpanded = expandedSection === guideline.id;
            const isAcknowledged = acknowledgedSections.has(guideline.id);

            return (
              <div
                key={guideline.id}
                className={`bg-white rounded-lg border-2 transition-all ${
                  isAcknowledged ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                {/* Section Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleExpanded(guideline.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {guideline.icon}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {guideline.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            getImportanceColor(guideline.importance)
                          }`}>
                            {getImportanceLabel(guideline.importance)}
                          </span>
                          {isAcknowledged && (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Acknowledged
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-gray-400">
                      <svg
                        className={`w-6 h-6 transform transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    {/* Main Content */}
                    <div className="space-y-4 mb-6">
                      {guideline.content.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                          <p className="text-gray-700 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>

                    {/* Examples */}
                    {guideline.examples && (
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Helpful Examples
                          </h4>
                          <ul className="space-y-2">
                            {guideline.examples.good.map((example, index) => (
                              <li key={index} className="text-green-800 text-sm">
                                • {example}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <h4 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Please Avoid
                          </h4>
                          <ul className="space-y-2">
                            {guideline.examples.avoid.map((example, index) => (
                              <li key={index} className="text-red-800 text-sm">
                                • {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Acknowledgment */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <p className="text-sm text-gray-600">
                        {guideline.importance === 'essential' && (
                          <span className="text-red-600 font-medium">Required: </span>
                        )}
                        Please acknowledge that you have read and understand this guideline.
                      </p>
                      
                      <AppButton
                        variant={isAcknowledged ? 'success' : 'primary'}
                        size="small"
                        onClick={() => toggleAcknowledgment(guideline.id)}
                        icon={isAcknowledged ? <CheckCircle className="w-4 h-4" /> : undefined}
                      >
                        {isAcknowledged ? 'Acknowledged' : 'I Understand'}
                      </AppButton>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Emergency Resources */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-3">
                Crisis Resources - Always Available
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Immediate Help</h4>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <strong>Emergency Services:</strong> 911
                    </li>
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <strong>Crisis Lifeline:</strong> 988
                    </li>
                    <li className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      <strong>Crisis Text Line:</strong> Text HOME to 741741
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-red-800 mb-2">Online Support</h4>
                  <ul className="space-y-2 text-sm text-red-700">
                    <li>• 24/7 Crisis Chat (link in menu)</li>
                    <li>• Emergency Contact Form</li>
                    <li>• Immediate Safety Resources</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {allEssentialAcknowledged ? (
              <span className="text-green-600 font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                All essential guidelines acknowledged
              </span>
            ) : (
              <span className="text-orange-600 font-medium">
                Please acknowledge all essential guidelines to continue
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <AppButton
              variant="ghost"
              onClick={() => window.print()}
            >
              Print Guidelines
            </AppButton>
            
            <AppButton
              variant="primary"
              disabled={!allEssentialAcknowledged}
              onClick={() => {
                // In a real app, this would save acknowledgment and redirect
                localStorage.setItem('guidelines_acknowledged', JSON.stringify({
                  acknowledged: true,
                  timestamp: new Date().toISOString(),
                  sections: Array.from(acknowledgedSections)
                }));
                navigate('/dashboard');
              }}
            >
              Continue to Community
            </AppButton>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 bg-white border-t py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 mb-4">
            These guidelines help us maintain a supportive community. They may be updated 
            occasionally to better serve our members' needs.
          </p>
          <p className="text-xs text-gray-500">
            Last updated: {new Date().toLocaleDateString()} • 
            Questions? Contact our{' '}
            <button className="text-blue-600 hover:underline">support team</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelinesView;

