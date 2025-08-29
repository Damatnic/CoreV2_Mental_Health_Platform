import React, { useState, useEffect } from 'react';
import { X, Shield, Phone, Heart, AlertTriangle, CheckCircle, Star, Clock, Users, MessageSquare, ExternalLink } from 'lucide-react';

interface SafetyTip {
  id: string;
  title: string;
  content: string;
  category: 'immediate' | 'grounding' | 'self_care' | 'crisis' | 'professional' | 'emergency';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ComponentType<any>;
  actionable: boolean;
  estimatedTime?: string;
  effectiveness?: number; // 1-5 rating
  prerequisites?: string[];
  relatedTips?: string[];
}

interface EmergencyResource {
  id: string;
  name: string;
  description: string;
  contact: string;
  type: 'phone' | 'text' | 'chat' | 'website';
  availability: '24/7' | 'business_hours' | 'limited';
  specialties?: string[];
  location?: 'national' | 'regional' | 'local';
}

interface SafetyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  userCrisisLevel?: 'low' | 'medium' | 'high' | 'critical';
  showEmergencyResources?: boolean;
  customTips?: SafetyTip[];
  onTipUsed?: (tipId: string) => void;
  className?: string;
}

const SAFETY_TIPS: SafetyTip[] = [
  // Immediate Crisis Tips
  {
    id: 'crisis-breathe',
    title: 'Take Slow, Deep Breaths',
    content: 'Focus on your breathing. Inhale for 4 counts, hold for 4, exhale for 6. Repeat until you feel calmer.',
    category: 'immediate',
    urgency: 'critical',
    icon: Heart,
    actionable: true,
    estimatedTime: '2-5 minutes',
    effectiveness: 4,
    relatedTips: ['grounding-5-4-3-2-1', 'safe-space']
  },
  {
    id: 'crisis-call-help',
    title: 'Reach Out for Immediate Support',
    content: 'Call 988 (Suicide & Crisis Lifeline) or text HOME to 741741. You don\'t have to face this alone.',
    category: 'crisis',
    urgency: 'critical',
    icon: Phone,
    actionable: true,
    estimatedTime: 'Immediate',
    effectiveness: 5
  },
  {
    id: 'safe-space',
    title: 'Get to a Safe Space',
    content: 'Move to a location where you feel secure - your bedroom, a friend\'s house, or any place that brings you comfort.',
    category: 'immediate',
    urgency: 'high',
    icon: Shield,
    actionable: true,
    estimatedTime: 'Immediate',
    effectiveness: 4
  },

  // Grounding Techniques
  {
    id: 'grounding-5-4-3-2-1',
    title: '5-4-3-2-1 Grounding Technique',
    content: 'Name: 5 things you can see, 4 things you can touch, 3 things you can hear, 2 things you can smell, 1 thing you can taste.',
    category: 'grounding',
    urgency: 'medium',
    icon: Star,
    actionable: true,
    estimatedTime: '3-5 minutes',
    effectiveness: 4,
    relatedTips: ['crisis-breathe', 'mindful-observation']
  },
  {
    id: 'mindful-observation',
    title: 'Mindful Observation',
    content: 'Pick one object near you. Study it carefully - its color, texture, weight. Describe it in detail to yourself.',
    category: 'grounding',
    urgency: 'medium',
    icon: Star,
    actionable: true,
    estimatedTime: '2-3 minutes',
    effectiveness: 3
  },
  {
    id: 'cold-water',
    title: 'Cold Water Technique',
    content: 'Splash cold water on your face or hold ice cubes. The shock can help interrupt overwhelming emotions.',
    category: 'grounding',
    urgency: 'medium',
    icon: AlertTriangle,
    actionable: true,
    estimatedTime: '1-2 minutes',
    effectiveness: 4
  },

  // Self-Care
  {
    id: 'self-care-routine',
    title: 'Engage in Self-Care',
    content: 'Do something kind for yourself: take a warm shower, listen to calming music, or drink a warm beverage.',
    category: 'self_care',
    urgency: 'low',
    icon: Heart,
    actionable: true,
    estimatedTime: '10-30 minutes',
    effectiveness: 3,
    relatedTips: ['mindful-observation', 'social-connection']
  },
  {
    id: 'social-connection',
    title: 'Connect with Someone You Trust',
    content: 'Reach out to a friend, family member, or mentor. Sometimes just talking helps put things in perspective.',
    category: 'self_care',
    urgency: 'medium',
    icon: Users,
    actionable: true,
    estimatedTime: '15-60 minutes',
    effectiveness: 4
  },
  {
    id: 'write-feelings',
    title: 'Write Down Your Feelings',
    content: 'Express your thoughts and emotions in writing. Don\'t worry about grammar - just let it flow.',
    category: 'self_care',
    urgency: 'low',
    icon: MessageSquare,
    actionable: true,
    estimatedTime: '10-20 minutes',
    effectiveness: 3
  },

  // Professional Help
  {
    id: 'schedule-therapy',
    title: 'Schedule Professional Support',
    content: 'Consider scheduling an appointment with a therapist, counselor, or your healthcare provider.',
    category: 'professional',
    urgency: 'low',
    icon: CheckCircle,
    actionable: true,
    estimatedTime: '15-30 minutes to schedule',
    effectiveness: 5,
    prerequisites: ['Access to healthcare', 'Insurance or payment method']
  },
  {
    id: 'medication-check',
    title: 'Review Your Medications',
    content: 'If you take medications for mental health, ensure you\'re taking them as prescribed. Contact your doctor with questions.',
    category: 'professional',
    urgency: 'medium',
    icon: CheckCircle,
    actionable: true,
    estimatedTime: '5-10 minutes',
    effectiveness: 4,
    prerequisites: ['Prescribed mental health medications']
  }
];

const EMERGENCY_RESOURCES: EmergencyResource[] = [
  {
    id: 'suicide-crisis-lifeline',
    name: '988 Suicide & Crisis Lifeline',
    description: 'Free, confidential support for people in distress and prevention resources',
    contact: '988',
    type: 'phone',
    availability: '24/7',
    location: 'national',
    specialties: ['suicide prevention', 'crisis intervention', 'emotional support']
  },
  {
    id: 'crisis-text-line',
    name: 'Crisis Text Line',
    description: 'Free, 24/7 support for people in crisis via text',
    contact: 'Text HOME to 741741',
    type: 'text',
    availability: '24/7',
    location: 'national',
    specialties: ['crisis intervention', 'text-based support']
  },
  {
    id: 'emergency-services',
    name: 'Emergency Services',
    description: 'For immediate physical safety or medical emergencies',
    contact: '911',
    type: 'phone',
    availability: '24/7',
    location: 'national',
    specialties: ['medical emergency', 'physical safety', 'police response']
  },
  {
    id: 'samhsa-helpline',
    name: 'SAMHSA National Helpline',
    description: 'Treatment referral and information service for mental health and substance abuse',
    contact: '1-800-662-4357',
    type: 'phone',
    availability: '24/7',
    location: 'national',
    specialties: ['treatment referrals', 'mental health information', 'substance abuse']
  },
  {
    id: 'nami-helpline',
    name: 'NAMI HelpLine',
    description: 'Information, support, and referrals for mental health concerns',
    contact: '1-800-950-6264',
    type: 'phone',
    availability: 'business_hours',
    location: 'national',
    specialties: ['mental health education', 'support groups', 'local resources']
  }
];

export const SafetyTipsModal: React.FC<SafetyTipsModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  userCrisisLevel = 'low',
  showEmergencyResources = true,
  customTips = [],
  onTipUsed,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'tips' | 'resources'>('tips');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [usedTips, setUsedTips] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'effectiveness' | 'time'>('urgency');

  const allTips = [...SAFETY_TIPS, ...customTips];

  // Auto-select appropriate tab based on crisis level
  useEffect(() => {
    if (userCrisisLevel === 'critical' && showEmergencyResources) {
      setActiveTab('resources');
    } else {
      setActiveTab('tips');
    }
  }, [userCrisisLevel, showEmergencyResources]);

  // Filter tips based on selection criteria
  const filteredTips = allTips.filter(tip => {
    const matchesCategory = selectedCategory === 'all' || tip.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      tip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCrisisLevel = userCrisisLevel === 'critical' ? 
      tip.urgency === 'critical' || tip.urgency === 'high' : true;
    
    return matchesCategory && matchesSearch && matchesCrisisLevel;
  });

  // Sort tips
  const sortedTips = [...filteredTips].sort((a, b) => {
    switch (sortBy) {
      case 'urgency':
        const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      case 'effectiveness':
        return (b.effectiveness || 0) - (a.effectiveness || 0);
      case 'time':
        const timeA = a.estimatedTime?.includes('minutes') ? 
          parseInt(a.estimatedTime.match(/(\d+)/)?.[0] || '0') : 0;
        const timeB = b.estimatedTime?.includes('minutes') ? 
          parseInt(b.estimatedTime.match(/(\d+)/)?.[0] || '0') : 0;
        return timeA - timeB;
      default:
        return 0;
    }
  });

  const handleTipUse = (tipId: string) => {
    setUsedTips(prev => new Set([...prev, tipId]));
    onTipUsed?.(tipId);
  };

  const handleResourceContact = (resource: EmergencyResource) => {
    if (resource.type === 'phone') {
      window.open(`tel:${resource.contact.replace(/\D/g, '')}`);
    } else if (resource.type === 'text') {
      const textMatch = resource.contact.match(/Text\s+(\w+)\s+to\s+(\d+)/);
      if (textMatch) {
        window.open(`sms:${textMatch[2]}?body=${textMatch[1]}`);
      }
    } else if (resource.type === 'website') {
      window.open(resource.contact, '_blank');
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'immediate': return 'text-red-600 bg-red-50 border-red-200';
      case 'crisis': return 'text-red-700 bg-red-100 border-red-300';
      case 'grounding': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'self_care': return 'text-green-600 bg-green-50 border-green-200';
      case 'professional': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'emergency': return 'text-red-800 bg-red-200 border-red-400';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
        
        <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Safety Tips & Resources
              </h2>
              {userCrisisLevel === 'critical' && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                  Crisis Mode
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex-1 px-6 py-3 font-medium transition-colors ${
                activeTab === 'tips'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Safety Tips ({sortedTips.length})
            </button>
            {showEmergencyResources && (
              <button
                onClick={() => setActiveTab('resources')}
                className={`flex-1 px-6 py-3 font-medium transition-colors ${
                  activeTab === 'resources'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Emergency Resources
              </button>
            )}
          </div>

          <div className="p-6">
            {/* Tips Tab */}
            {activeTab === 'tips' && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-64">
                    <input
                      type="text"
                      placeholder="Search tips..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    <option value="immediate">Immediate Help</option>
                    <option value="crisis">Crisis</option>
                    <option value="grounding">Grounding</option>
                    <option value="self_care">Self-Care</option>
                    <option value="professional">Professional</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="urgency">By Urgency</option>
                    <option value="effectiveness">By Effectiveness</option>
                    <option value="time">By Time Needed</option>
                  </select>
                </div>

                {/* Tips List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sortedTips.map((tip) => {
                    const IconComponent = tip.icon;
                    const isUsed = usedTips.has(tip.id);
                    
                    return (
                      <div
                        key={tip.id}
                        className={`p-4 border rounded-lg transition-all ${
                          getCategoryColor(tip.category)
                        } ${isUsed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-medium text-gray-900">
                                {tip.title}
                                {isUsed && <CheckCircle className="inline w-4 h-4 ml-2 text-green-600" />}
                              </h3>
                              
                              <div className="flex gap-2">
                                <span className={`px-2 py-1 text-xs rounded-full ${getUrgencyColor(tip.urgency)}`}>
                                  {tip.urgency}
                                </span>
                                {tip.effectiveness && (
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: tip.effectiveness }).map((_, i) => (
                                      <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-gray-700 mb-3">{tip.content}</p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                {tip.estimatedTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {tip.estimatedTime}
                                  </div>
                                )}
                                <span className="capitalize">{tip.category.replace('_', ' ')}</span>
                              </div>
                              
                              {tip.actionable && (
                                <button
                                  onClick={() => handleTipUse(tip.id)}
                                  disabled={isUsed}
                                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                    isUsed 
                                      ? 'bg-green-100 text-green-800 cursor-default'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {isUsed ? 'Used' : 'Try This'}
                                </button>
                              )}
                            </div>
                            
                            {tip.prerequisites && tip.prerequisites.length > 0 && (
                              <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                                <strong>Prerequisites:</strong> {tip.prerequisites.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {sortedTips.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No tips found matching your criteria.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-red-800 mb-1">
                        Emergency Resources Available 24/7
                      </h3>
                      <p className="text-red-700 text-sm">
                        If you're having thoughts of self-harm or suicide, please reach out immediately. 
                        Help is available and you don't have to go through this alone.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {EMERGENCY_RESOURCES.map((resource) => (
                    <div
                      key={resource.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900 mb-1">
                            {resource.name}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            {resource.description}
                          </p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            resource.availability === '24/7' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {resource.availability}
                          </span>
                          
                          <button
                            onClick={() => handleResourceContact(resource)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                          >
                            {resource.type === 'phone' ? <Phone className="w-4 h-4" /> : 
                             resource.type === 'text' ? <MessageSquare className="w-4 h-4" /> :
                             <ExternalLink className="w-4 h-4" />}
                            Contact
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold text-blue-600">
                          {resource.contact}
                        </div>
                        
                        {resource.specialties && (
                          <div className="flex flex-wrap gap-1">
                            {resource.specialties.slice(0, 2).map((specialty, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                              >
                                {specialty}
                              </span>
                            ))}
                            {resource.specialties.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                +{resource.specialties.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyTipsModal;
