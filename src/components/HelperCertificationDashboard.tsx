/**
 * Helper Certification Dashboard Component
 * Displays certification progress, available courses, and training management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  certificationService, 
  CertificationLevel, 
  TrainingModule, 
  TrainingProgress,
  HelperCertification,
  Badge,
  ModuleCategory,
  CERTIFICATION_REQUIREMENTS
} from '../services/certificationService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Card } from './Card';
import { AppButton } from './AppButton';
import { Modal } from './Modal';

interface CertificationDashboardProps {
  helperId?: string;
  onModuleSelect?: (moduleId: string) => void;
  onExamSchedule?: (moduleId: string) => void;
}

const HelperCertificationDashboard: React.FC<CertificationDashboardProps> = ({
  helperId: propHelperId,
  onModuleSelect,
  onExamSchedule
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  // Use provided helperId or current user's ID
  const helperId = propHelperId || user?.id || '';
  
  // State management
  const [certification, setCertification] = useState<HelperCertification | null>(null);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [availableModules, setAvailableModules] = useState<TrainingModule[]>([]);
  const [completedModules, setCompletedModules] = useState<TrainingModule[]>([]);
  const [upcomingModules, setUpcomingModules] = useState<TrainingModule[]>([]);
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null);
  const [showModuleDetails, setShowModuleDetails] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'certificates' | 'badges'>('overview');

  /**
   * Load certification data on mount
   */
  useEffect(() => {
    if (helperId) {
      loadCertificationData();
      
      // Subscribe to certification events
      const handleModuleCompleted = (data: any) => {
        if (data.helperId === helperId) {
          loadCertificationData();
          showNotification('success', 'Module completed successfully!');
        }
      };
      
      const handleLevelAdvanced = (data: any) => {
        if (data.helperId === helperId) {
          loadCertificationData();
          showNotification('success', `Congratulations! You've advanced to ${data.newLevel} level!`);
        }
      };
      
      const handleBadgesAwarded = (data: any) => {
        if (data.helperId === helperId) {
          loadCertificationData();
          const badgeNames = data.badges.map((b: Badge) => b.name).join(', ');
          showNotification('success', `New badges earned: ${badgeNames}`);
        }
      };
      
      certificationService.on('moduleCompleted', handleModuleCompleted);
      certificationService.on('levelAdvanced', handleLevelAdvanced);
      certificationService.on('badgesAwarded', handleBadgesAwarded);
      
      return () => {
        certificationService.off('moduleCompleted', handleModuleCompleted);
        certificationService.off('levelAdvanced', handleLevelAdvanced);
        certificationService.off('badgesAwarded', handleBadgesAwarded);
      };
    }
  }, [helperId]);

  /**
   * Load certification and progress data
   */
  const loadCertificationData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get certification data
      const cert = certificationService.getCertification(helperId);
      setCertification(cert);
      
      // Get progress data
      const prog = certificationService.getProgress(helperId);
      setProgress(prog || null);
      
      // Get all modules
      const allModules = certificationService.getModules();
      
      // Categorize modules
      const completedIds = new Set(cert.completedModules.map(cm => cm.moduleId));
      const completed: TrainingModule[] = [];
      const available: TrainingModule[] = [];
      const upcoming: TrainingModule[] = [];
      
      allModules.forEach(module => {
        if (completedIds.has(module.id)) {
          completed.push(module);
        } else if (module.prerequisites.every(prereq => completedIds.has(prereq))) {
          available.push(module);
        } else {
          upcoming.push(module);
        }
      });
      
      setCompletedModules(completed);
      setAvailableModules(available);
      setUpcomingModules(upcoming);
      
    } catch (error) {
      console.error('Error loading certification data:', error);
      showNotification('error', 'Failed to load certification data');
    } finally {
      setIsLoading(false);
    }
  }, [helperId]);

  /**
   * Start a training module
   */
  const startModule = useCallback((module: TrainingModule) => {
    if (onModuleSelect) {
      onModuleSelect(module.id);
    } else {
      setSelectedModule(module);
      setShowModuleDetails(true);
    }
  }, [onModuleSelect]);

  /**
   * Schedule an exam
   */
  const scheduleExam = useCallback((moduleId: string) => {
    if (onExamSchedule) {
      onExamSchedule(moduleId);
    } else {
      showNotification('info', 'Exam scheduling will be available soon');
    }
  }, [onExamSchedule]);

  /**
   * Generate certificate for completed module
   */
  const generateCertificate = useCallback(async (moduleId: string) => {
    try {
      const certificateUrl = await certificationService.generateCertificate(helperId, moduleId);
      setSelectedCertificate(certificateUrl);
      setShowCertificateModal(true);
      showNotification('success', 'Certificate generated successfully!');
    } catch (error) {
      console.error('Error generating certificate:', error);
      showNotification('error', 'Failed to generate certificate');
    }
  }, [helperId]);

  /**
   * Calculate progress percentage for next level
   */
  const calculateNextLevelProgress = (): number => {
    if (!certification || !progress) return 0;
    
    const nextLevel = progress.nextLevel;
    if (!nextLevel) return 100; // Already at highest level
    
    const requirements = CERTIFICATION_REQUIREMENTS[nextLevel];
    const currentModules = certification.completedModules.length;
    const requiredModules = requirements.minModules;
    
    return Math.min(100, (currentModules / requiredModules) * 100);
  };

  /**
   * Get color for certification level
   */
  const getLevelColor = (level: CertificationLevel): string => {
    switch (level) {
      case CertificationLevel.PEER:
        return 'bg-green-500';
      case CertificationLevel.TRAINED:
        return 'bg-blue-500';
      case CertificationLevel.PROFESSIONAL:
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  /**
   * Get icon for module category
   */
  const getCategoryIcon = (category: ModuleCategory): string => {
    const icons: Record<ModuleCategory, string> = {
      [ModuleCategory.CRISIS_INTERVENTION]: '🚨',
      [ModuleCategory.ACTIVE_LISTENING]: '👂',
      [ModuleCategory.CULTURAL_COMPETENCY]: '🌍',
      [ModuleCategory.ETHICAL_BOUNDARIES]: '⚖️',
      [ModuleCategory.SELF_CARE]: '💚',
      [ModuleCategory.MENTAL_HEALTH_LITERACY]: '📚',
      [ModuleCategory.TRAUMA_INFORMED_CARE]: '🫂',
      [ModuleCategory.DE_ESCALATION]: '🕊️',
      [ModuleCategory.SUBSTANCE_USE]: '💊',
      [ModuleCategory.SUICIDE_PREVENTION]: '🆘'
    };
    return icons[category] || '📖';
  };

  /**
   * Format duration for display
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <div className="certification-dashboard-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  /**
   * Render empty state
   */
  if (!certification || !progress) {
    return (
      <div className="certification-dashboard-empty">
        <Card className="text-center p-8">
          <h3 className="text-xl font-semibold mb-4">No Certification Data</h3>
          <p className="text-gray-600 mb-6">
            Start your journey to become a certified helper
          </p>
          <AppButton variant="primary" onClick={loadCertificationData}>
            Get Started
          </AppButton>
        </Card>
      </div>
    );
  }

  return (
    <div className="helper-certification-dashboard">
      {/* Header Section */}
      <div className="dashboard-header mb-6">
        <h2 className="text-2xl font-bold mb-2">Certification Dashboard</h2>
        <p className="text-gray-600">
          Track your progress towards helper certification
        </p>
      </div>

      {/* Current Level Card */}
      <Card className="level-card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Current Level</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-white text-sm ${getLevelColor(certification.level)}`}>
                {certification.level.toUpperCase()}
              </span>
              {certification.status === 'active' && (
                <span className="text-green-600 text-sm">✓ Active</span>
              )}
            </div>
          </div>
          
          {progress.nextLevel && (
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">
                Progress to {progress.nextLevel}
              </p>
              <div className="w-48 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateNextLevelProgress()}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {certification.completedModules.length} / {CERTIFICATION_REQUIREMENTS[progress.nextLevel].minModules} modules
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="tabs mb-6">
        <div className="flex space-x-1 border-b">
          {(['overview', 'modules', 'certificates', 'badges'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="stat-card">
                <div className="text-3xl font-bold text-blue-600">
                  {progress.completedModules}
                </div>
                <div className="text-sm text-gray-600">Modules Completed</div>
              </Card>
              
              <Card className="stat-card">
                <div className="text-3xl font-bold text-green-600">
                  {progress.completedHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Training Hours</div>
              </Card>
              
              <Card className="stat-card">
                <div className="text-3xl font-bold text-purple-600">
                  {progress.averageScore.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Average Score</div>
              </Card>
              
              <Card className="stat-card">
                <div className="text-3xl font-bold text-yellow-600">
                  {certification.badges.length}
                </div>
                <div className="text-sm text-gray-600">Badges Earned</div>
              </Card>
            </div>

            {/* Learning Path */}
            {progress.learningPath && (
              <Card className="learning-path mb-6">
                <h3 className="text-lg font-semibold mb-4">Your Learning Path</h3>
                
                {/* Milestones */}
                <div className="milestones mb-4">
                  {progress.learningPath.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="milestone-item flex items-start mb-3">
                      <div className={`milestone-indicator ${
                        milestone.completed ? 'bg-green-500' : 'bg-gray-300'
                      } w-8 h-8 rounded-full flex items-center justify-center text-white mr-3`}>
                        {milestone.completed ? '✓' : index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Target: {new Date(milestone.targetDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recommended Modules */}
                {progress.recommendedModules.length > 0 && (
                  <div className="recommended-modules">
                    <h4 className="font-medium mb-2">Recommended Next Steps</h4>
                    <div className="flex flex-wrap gap-2">
                      {progress.recommendedModules.map(moduleId => {
                        const module = certificationService.getModule(moduleId);
                        return module ? (
                          <button
                            key={moduleId}
                            onClick={() => startModule(module)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors"
                          >
                            {module.title}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress.strengths.length > 0 && (
                <Card className="strengths">
                  <h3 className="text-lg font-semibold mb-3">Your Strengths</h3>
                  <ul className="space-y-2">
                    {progress.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="capitalize">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
              
              {progress.areasForImprovement.length > 0 && (
                <Card className="improvements">
                  <h3 className="text-lg font-semibold mb-3">Areas for Growth</h3>
                  <ul className="space-y-2">
                    {progress.areasForImprovement.map((area, index) => (
                      <li key={index} className="flex items-center">
                        <span className="text-yellow-500 mr-2">→</span>
                        <span>{area}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Modules Tab */}
        {activeTab === 'modules' && (
          <div className="modules-content">
            {/* Available Modules */}
            {availableModules.length > 0 && (
              <div className="available-modules mb-6">
                <h3 className="text-lg font-semibold mb-4">Available Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableModules.map(module => (
                    <Card key={module.id} className="module-card hover:shadow-lg transition-shadow">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{getCategoryIcon(module.category)}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            module.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                            module.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {module.difficulty}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{module.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>⏱ {formatDuration(module.duration)}</span>
                          <span>{module.creditHours} credit hours</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <AppButton
                          variant="primary"
                          size="small"
                          onClick={() => startModule(module)}
                          className="flex-1"
                        >
                          Start Module
                        </AppButton>
                        <AppButton
                          variant="secondary"
                          size="small"
                          onClick={() => {
                            setSelectedModule(module);
                            setShowModuleDetails(true);
                          }}
                        >
                          Details
                        </AppButton>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Modules */}
            {completedModules.length > 0 && (
              <div className="completed-modules mb-6">
                <h3 className="text-lg font-semibold mb-4">Completed Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedModules.map(module => {
                    const completion = certification.completedModules.find(
                      cm => cm.moduleId === module.id
                    );
                    return (
                      <Card key={module.id} className="module-card completed">
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{getCategoryIcon(module.category)}</span>
                            <span className="text-green-600">✓ Completed</span>
                          </div>
                          <h4 className="font-semibold mb-1">{module.title}</h4>
                          {completion && (
                            <div className="text-sm text-gray-600">
                              <p>Score: {completion.score}%</p>
                              <p>Completed: {new Date(completion.completionDate).toLocaleDateString()}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <AppButton
                            variant="secondary"
                            size="small"
                            onClick={() => startModule(module)}
                            className="flex-1"
                          >
                            Review
                          </AppButton>
                          {completion?.certificateId && (
                            <AppButton
                              variant="success"
                              size="small"
                              onClick={() => generateCertificate(module.id)}
                            >
                              Certificate
                            </AppButton>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Modules */}
            {upcomingModules.length > 0 && (
              <div className="upcoming-modules">
                <h3 className="text-lg font-semibold mb-4">Upcoming Modules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingModules.map(module => (
                    <Card key={module.id} className="module-card locked opacity-60">
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{getCategoryIcon(module.category)}</span>
                          <span className="text-gray-500">🔒 Locked</span>
                        </div>
                        <h4 className="font-semibold mb-1">{module.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                        <div className="text-xs text-gray-500">
                          <p>Prerequisites:</p>
                          <ul className="ml-4">
                            {module.prerequisites.map(prereqId => {
                              const prereq = certificationService.getModule(prereqId);
                              return prereq ? (
                                <li key={prereqId}>• {prereq.title}</li>
                              ) : null;
                            })}
                          </ul>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div className="certificates-content">
            <h3 className="text-lg font-semibold mb-4">Your Certificates</h3>
            {certification.completedModules.filter(cm => cm.certificateId).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {certification.completedModules
                  .filter(cm => cm.certificateId)
                  .map(cm => {
                    const module = certificationService.getModule(cm.moduleId);
                    return module ? (
                      <Card key={cm.certificateId} className="certificate-card">
                        <div className="text-center mb-4">
                          <div className="text-4xl mb-2">🏆</div>
                          <h4 className="font-semibold">{module.title}</h4>
                        </div>
                        <div className="text-sm text-gray-600 mb-4">
                          <p>Score: {cm.score}%</p>
                          <p>Earned: {new Date(cm.completionDate).toLocaleDateString()}</p>
                          <p>Certificate ID: {cm.certificateId}</p>
                        </div>
                        <AppButton
                          variant="primary"
                          size="small"
                          onClick={() => generateCertificate(module.id)}
                          className="w-full"
                        >
                          View Certificate
                        </AppButton>
                      </Card>
                    ) : null;
                  })}
              </div>
            ) : (
              <Card className="text-center p-8">
                <p className="text-gray-600">
                  Complete modules to earn certificates
                </p>
              </Card>
            )}

            {/* Credentials Section */}
            {certification.credentials.length > 0 && (
              <div className="credentials-section mt-6">
                <h3 className="text-lg font-semibold mb-4">External Credentials</h3>
                <div className="space-y-3">
                  {certification.credentials.map(credential => (
                    <Card key={credential.id} className="credential-item">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{credential.name}</h4>
                          <p className="text-sm text-gray-600">
                            {credential.issuer} • Issued {new Date(credential.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          credential.verificationStatus === 'verified' 
                            ? 'bg-green-100 text-green-700'
                            : credential.verificationStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {credential.verificationStatus}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === 'badges' && (
          <div className="badges-content">
            <h3 className="text-lg font-semibold mb-4">Achievement Badges</h3>
            {certification.badges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {certification.badges.map(badge => (
                  <Card key={badge.id} className="badge-card text-center p-4 hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h4 className="font-semibold text-sm mb-1">{badge.name}</h4>
                    <p className="text-xs text-gray-600 mb-2">{badge.description}</p>
                    <div className={`text-xs px-2 py-1 rounded inline-block ${
                      badge.rarity === 'legendary' ? 'bg-purple-100 text-purple-700' :
                      badge.rarity === 'epic' ? 'bg-indigo-100 text-indigo-700' :
                      badge.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                      badge.rarity === 'uncommon' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {badge.rarity}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Earned {new Date(badge.earnedDate).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center p-8">
                <p className="text-gray-600">
                  Complete modules and achievements to earn badges
                </p>
              </Card>
            )}

            {/* Specializations */}
            {certification.specializations.length > 0 && (
              <div className="specializations-section mt-6">
                <h3 className="text-lg font-semibold mb-4">Specializations</h3>
                <div className="flex flex-wrap gap-2">
                  {certification.specializations.map((spec, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Module Details Modal */}
      {showModuleDetails && selectedModule && (
        <Modal
          isOpen={showModuleDetails}
          onClose={() => setShowModuleDetails(false)}
          title={selectedModule.title}
        >
          <div className="module-details">
            <div className="mb-4">
              <p className="text-gray-600 mb-3">{selectedModule.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-500">Duration</span>
                  <p className="font-semibold">{formatDuration(selectedModule.duration)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Credit Hours</span>
                  <p className="font-semibold">{selectedModule.creditHours}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Difficulty</span>
                  <p className="font-semibold capitalize">{selectedModule.difficulty}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Category</span>
                  <p className="font-semibold">
                    {getCategoryIcon(selectedModule.category)} {selectedModule.category.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>

              {/* Module Content */}
              <div className="module-content mb-4">
                <h4 className="font-semibold mb-2">Module Content</h4>
                <div className="space-y-2">
                  {selectedModule.content.map((content, index) => (
                    <div key={content.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <span className="mr-2 text-gray-500">{index + 1}.</span>
                        <div>
                          <p className="font-medium">{content.title}</p>
                          <p className="text-sm text-gray-600">{content.description}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {content.estimatedTime} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prerequisites */}
              {selectedModule.prerequisites.length > 0 && (
                <div className="prerequisites mb-4">
                  <h4 className="font-semibold mb-2">Prerequisites</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {selectedModule.prerequisites.map(prereqId => {
                      const prereq = certificationService.getModule(prereqId);
                      return prereq ? (
                        <li key={prereqId}>{prereq.title}</li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {selectedModule.tags.length > 0 && (
                <div className="tags mb-4">
                  <h4 className="font-semibold mb-2">Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <AppButton
                variant="primary"
                onClick={() => {
                  startModule(selectedModule);
                  setShowModuleDetails(false);
                }}
                className="flex-1"
              >
                Start Module
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => scheduleExam(selectedModule.id)}
              >
                Schedule Exam
              </AppButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && selectedCertificate && (
        <Modal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          title="Certificate"
        >
          <div className="certificate-viewer">
            <div className="text-center p-8 border-2 border-gray-300 rounded">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold mb-2">Certificate of Completion</h3>
              <p className="text-gray-600 mb-4">
                This certifies that you have successfully completed the training module
              </p>
              <p className="text-sm text-gray-500">
                Certificate URL: {selectedCertificate}
              </p>
            </div>
            <div className="mt-4 flex gap-3">
              <AppButton
                variant="primary"
                onClick={() => {
                  // In production, would download the certificate
                  showNotification('success', 'Certificate downloaded!');
                }}
                className="flex-1"
              >
                Download Certificate
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => setShowCertificateModal(false)}
              >
                Close
              </AppButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HelperCertificationDashboard;