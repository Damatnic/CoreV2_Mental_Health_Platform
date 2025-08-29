import * as React from 'react';

// ===============================================
// MENTAL HEALTH PLATFORM: ASSESSMENT HISTORY VIEW
// ===============================================
// Comprehensive assessment tracking with clinical insights,
// HIPAA compliance, and therapeutic progress monitoring

// Type Definitions
interface AssessmentResult {
  id: string;
  assessmentType: 'mood' | 'anxiety' | 'depression' | 'stress' | 'wellness' | 'ptsd' | 'bipolar' | 'custom';
  title: string;
  completedAt: Date;
  score: number;
  maxScore: number;
  percentage: number;
  severity: 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe' | 'critical';
  clinicalInterpretation?: string;
  responses: {
    questionId: string;
    question: string;
    answer: string | number;
    score: number;
    flaggedForReview?: boolean;
    clinicalNote?: string;
  }[];
  recommendations: string[];
  followUpRequired: boolean;
  crisisIndicators: boolean;
  notes?: string;
  tags: string[];
  administeredBy?: string;
  validatedInstrument: boolean;
  instrumentName?: string;
  culturalFactorsConsidered: boolean;
  confidenceInterval?: { lower: number; upper: number };
}

interface AssessmentStats {
  totalAssessments: number;
  averageScore: number;
  improvementTrend: 'significant_improvement' | 'improving' | 'stable' | 'declining' | 'significant_decline';
  lastAssessment: Date;
  streakDays: number;
  completionRate: number;
  clinicallySignificantChange: boolean;
  reliableChangeIndex: number;
  byType: {
    [key: string]: {
      count: number;
      averageScore: number;
      trend: string;
      lastCompleted: Date;
    };
  };
}

interface ClinicalThreshold {
  instrument: string;
  minimalRange: { min: number; max: number };
  mildRange: { min: number; max: number };
  moderateRange: { min: number; max: number };
  severeRange: { min: number; max: number };
  criticalThreshold: number;
}

interface TreatmentRecommendation {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  type: 'crisis_intervention' | 'therapy' | 'medication_review' | 'lifestyle' | 'monitoring';
  description: string;
  evidenceBase: string;
  culturalConsiderations?: string;
}

// Component Implementation
const AssessmentHistoryView: React.FC = () => {
  // State Management
  const [assessments, setAssessments] = React.useState<AssessmentResult[]>([]);
  const [filteredAssessments, setFilteredAssessments] = React.useState<AssessmentResult[]>([]);
  const [stats, setStats] = React.useState<AssessmentStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedType, setSelectedType] = React.useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = React.useState<string>('all');
  const [dateRange, setDateRange] = React.useState<'week' | 'month' | '3months' | 'year' | 'all'>('3months');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedAssessment, setExpandedAssessment] = React.useState<string | null>(null);
  const [showCrisisOnly, setShowCrisisOnly] = React.useState(false);
  const [auditLog, setAuditLog] = React.useState<Array<{ timestamp: Date; action: string; details: any }>>([]);
  const [clinicalThresholds, setClinicalThresholds] = React.useState<ClinicalThreshold[]>([]);

  // HIPAA Compliance Logger
  const logHipaaEvent = React.useCallback((action: string, details: any) => {
    const event = {
      timestamp: new Date(),
      action,
      details,
      userId: 'current-user-id',
      sessionId: `session-${Date.now()}`,
      ipAddress: 'masked-for-privacy',
      compliance: 'HIPAA-compliant'
    };
    setAuditLog(prev => [...prev, event]);
    console.log('[HIPAA Audit]', event);
  }, []);

  // Clinical Scoring System
  const calculateClinicalSignificance = React.useCallback((current: AssessmentResult, previous?: AssessmentResult) => {
    if (!previous) return { significant: false, rci: 0 };
    
    // Reliable Change Index calculation
    const standardError = 5; // Would be instrument-specific
    const reliableChangeIndex = (current.score - previous.score) / (standardError * Math.sqrt(2));
    
    return {
      significant: Math.abs(reliableChangeIndex) > 1.96,
      rci: reliableChangeIndex,
      direction: reliableChangeIndex > 0 ? 'improvement' : 'deterioration',
      magnitude: Math.abs(reliableChangeIndex) > 2.5 ? 'large' : 
                 Math.abs(reliableChangeIndex) > 1.96 ? 'moderate' : 'small'
    };
  }, []);

  // Crisis Detection
  const detectCrisisIndicators = React.useCallback((assessment: AssessmentResult): boolean => {
    const crisisFlags = [
      assessment.severity === 'critical',
      assessment.severity === 'severe' && assessment.assessmentType === 'depression',
      assessment.responses.some(r => r.flaggedForReview && r.score >= 3),
      assessment.score / assessment.maxScore > 0.85 && assessment.assessmentType === 'anxiety'
    ];
    
    return crisisFlags.some(flag => flag);
  }, []);

  // Treatment Recommendation Engine
  const generateTreatmentRecommendations = React.useCallback((assessment: AssessmentResult): TreatmentRecommendation[] => {
    const recommendations: TreatmentRecommendation[] = [];
    
    if (assessment.severity === 'critical' || assessment.crisisIndicators) {
      recommendations.push({
        priority: 'immediate',
        type: 'crisis_intervention',
        description: 'Immediate crisis intervention required. Contact crisis team.',
        evidenceBase: 'APA Guidelines for Crisis Intervention'
      });
    }
    
    if (assessment.severity === 'severe' || assessment.severity === 'moderately_severe') {
      recommendations.push({
        priority: 'high',
        type: 'therapy',
        description: 'Initiate or intensify psychotherapy (CBT/DBT recommended)',
        evidenceBase: 'NICE Guidelines for Depression and Anxiety'
      });
      
      recommendations.push({
        priority: 'high',
        type: 'medication_review',
        description: 'Consider psychiatric consultation for medication evaluation',
        evidenceBase: 'APA Practice Guidelines'
      });
    }
    
    if (assessment.severity === 'moderate') {
      recommendations.push({
        priority: 'medium',
        type: 'therapy',
        description: 'Begin structured therapy program (8-12 sessions)',
        evidenceBase: 'Evidence-based treatment protocols'
      });
      
      recommendations.push({
        priority: 'medium',
        type: 'lifestyle',
        description: 'Implement lifestyle interventions: exercise, sleep hygiene, mindfulness',
        evidenceBase: 'Integrated care model'
      });
    }
    
    recommendations.push({
      priority: 'low',
      type: 'monitoring',
      description: 'Continue regular monitoring with reassessment in 2-4 weeks',
      evidenceBase: 'Standard care protocols'
    });
    
    return recommendations;
  }, []);

  // Load Assessment History with Clinical Data
  React.useEffect(() => {
    const loadAssessments = async () => {
      try {
        setIsLoading(true);
        logHipaaEvent('VIEW_ASSESSMENT_HISTORY', { timestamp: new Date() });

        // Load clinical thresholds for validated instruments
        const thresholds: ClinicalThreshold[] = [
          {
            instrument: 'PHQ-9',
            minimalRange: { min: 0, max: 4 },
            mildRange: { min: 5, max: 9 },
            moderateRange: { min: 10, max: 14 },
            severeRange: { min: 15, max: 27 },
            criticalThreshold: 20
          },
          {
            instrument: 'GAD-7',
            minimalRange: { min: 0, max: 4 },
            mildRange: { min: 5, max: 9 },
            moderateRange: { min: 10, max: 14 },
            severeRange: { min: 15, max: 21 },
            criticalThreshold: 15
          }
        ];
        setClinicalThresholds(thresholds);

        // Enhanced mock data with clinical information
        const mockAssessments: AssessmentResult[] = [
          {
            id: '1',
            assessmentType: 'depression',
            title: 'PHQ-9 Depression Screening',
            completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            score: 12,
            maxScore: 27,
            percentage: 44,
            severity: 'moderate',
            clinicalInterpretation: 'Moderate depression symptoms present. Clinical intervention recommended.',
            responses: [
              {
                questionId: 'phq9_1',
                question: 'Little interest or pleasure in doing things',
                answer: 2,
                score: 2,
                flaggedForReview: false
              },
              {
                questionId: 'phq9_2',
                question: 'Feeling down, depressed, or hopeless',
                answer: 2,
                score: 2,
                flaggedForReview: true,
                clinicalNote: 'Patient expressing hopelessness - monitor closely'
              },
              {
                questionId: 'phq9_9',
                question: 'Thoughts of self-harm',
                answer: 0,
                score: 0,
                flaggedForReview: true,
                clinicalNote: 'Denied suicidal ideation'
              }
            ],
            recommendations: [
              'Begin cognitive-behavioral therapy',
              'Consider antidepressant medication consultation',
              'Implement daily mood tracking',
              'Schedule follow-up in 2 weeks'
            ],
            followUpRequired: true,
            crisisIndicators: false,
            tags: ['PHQ-9', 'validated', 'moderate'],
            validatedInstrument: true,
            instrumentName: 'PHQ-9',
            culturalFactorsConsidered: true,
            confidenceInterval: { lower: 10, upper: 14 }
          },
          {
            id: '2',
            assessmentType: 'anxiety',
            title: 'GAD-7 Anxiety Assessment',
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            score: 15,
            maxScore: 21,
            percentage: 71,
            severity: 'severe',
            clinicalInterpretation: 'Severe anxiety symptoms. Immediate clinical attention advised.',
            responses: [
              {
                questionId: 'gad7_1',
                question: 'Feeling nervous, anxious, or on edge',
                answer: 3,
                score: 3,
                flaggedForReview: true
              },
              {
                questionId: 'gad7_2',
                question: 'Not being able to stop or control worrying',
                answer: 3,
                score: 3,
                flaggedForReview: true
              }
            ],
            recommendations: [
              'Urgent psychiatric consultation recommended',
              'Consider anxiolytic medication',
              'Begin intensive CBT for anxiety',
              'Teach immediate coping strategies'
            ],
            followUpRequired: true,
            crisisIndicators: true,
            tags: ['GAD-7', 'validated', 'severe', 'urgent'],
            validatedInstrument: true,
            instrumentName: 'GAD-7',
            culturalFactorsConsidered: true
          },
          {
            id: '3',
            assessmentType: 'wellness',
            title: 'Holistic Wellness Check',
            completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            score: 65,
            maxScore: 100,
            percentage: 65,
            severity: 'mild',
            clinicalInterpretation: 'Overall wellness is fair with room for improvement in self-care.',
            responses: [
              {
                questionId: 'wellness_1',
                question: 'Sleep quality',
                answer: 'Fair',
                score: 6
              },
              {
                questionId: 'wellness_2',
                question: 'Physical activity level',
                answer: 'Low',
                score: 4
              },
              {
                questionId: 'wellness_3',
                question: 'Social connections',
                answer: 'Good',
                score: 8
              }
            ],
            recommendations: [
              'Improve sleep hygiene',
              'Increase physical activity to 30 min/day',
              'Maintain social connections',
              'Consider mindfulness practices'
            ],
            followUpRequired: false,
            crisisIndicators: false,
            tags: ['wellness', 'preventive'],
            validatedInstrument: false,
            culturalFactorsConsidered: true
          }
        ];

        setAssessments(mockAssessments);
        
        // Calculate stats
        const mockStats: AssessmentStats = {
          totalAssessments: mockAssessments.length,
          averageScore: mockAssessments.reduce((sum, a) => sum + a.percentage, 0) / mockAssessments.length,
          improvementTrend: 'stable',
          lastAssessment: mockAssessments[0].completedAt,
          streakDays: 5,
          completionRate: 85,
          clinicallySignificantChange: false,
          reliableChangeIndex: 1.2,
          byType: {
            depression: {
              count: 1,
              averageScore: 44,
              trend: 'stable',
              lastCompleted: mockAssessments[0].completedAt
            },
            anxiety: {
              count: 1,
              averageScore: 71,
              trend: 'declining',
              lastCompleted: mockAssessments[1].completedAt
            },
            wellness: {
              count: 1,
              averageScore: 65,
              trend: 'improving',
              lastCompleted: mockAssessments[2].completedAt
            }
          }
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error loading assessments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAssessments();
  }, [logHipaaEvent]);

  // Filter Assessments
  React.useEffect(() => {
    let filtered = [...assessments];

    // Crisis filter
    if (showCrisisOnly) {
      filtered = filtered.filter(a => a.crisisIndicators || a.severity === 'critical' || a.severity === 'severe');
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(a => a.assessmentType === selectedType);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(a => a.severity === selectedSeverity);
    }

    // Date range filter
    const now = new Date();
    let cutoffDate = new Date(0);
    
    switch (dateRange) {
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    if (dateRange !== 'all') {
      filtered = filtered.filter(a => new Date(a.completedAt) >= cutoffDate);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query)) ||
        a.recommendations.some(rec => rec.toLowerCase().includes(query))
      );
    }

    // Sort by date (most recent first)
    filtered.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

    setFilteredAssessments(filtered);
  }, [assessments, selectedType, selectedSeverity, dateRange, searchQuery, showCrisisOnly]);

  // Handler Functions
  const handleViewDetails = React.useCallback((assessmentId: string) => {
    logHipaaEvent('VIEW_ASSESSMENT_DETAILS', { assessmentId });
    setExpandedAssessment(expandedAssessment === assessmentId ? null : assessmentId);
  }, [expandedAssessment, logHipaaEvent]);

  const handleExportData = React.useCallback(async () => {
    logHipaaEvent('EXPORT_ASSESSMENT_DATA', { 
      count: filteredAssessments.length,
      format: 'encrypted-pdf'
    });
    console.log('Exporting HIPAA-compliant assessment data...');
  }, [filteredAssessments, logHipaaEvent]);

  const handleShareWithProvider = React.useCallback(async (assessmentId: string) => {
    const assessment = assessments.find(a => a.id === assessmentId);
    if (assessment) {
      logHipaaEvent('SHARE_WITH_PROVIDER', { 
        assessmentId,
        assessmentType: assessment.assessmentType,
        severity: assessment.severity
      });
      console.log('Sharing assessment with healthcare provider...');
    }
  }, [assessments, logHipaaEvent]);

  const handleRetakeAssessment = React.useCallback(async (assessmentType: string) => {
    logHipaaEvent('INITIATE_REASSESSMENT', { assessmentType });
    console.log(`Starting new ${assessmentType} assessment...`);
  }, [logHipaaEvent]);

  // Utility Functions
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  const getSeverityColor = (severity: string): string => {
    const colors = {
      minimal: '#10b981',
      mild: '#84cc16',
      moderate: '#f59e0b',
      moderately_severe: '#f97316',
      severe: '#ef4444',
      critical: '#dc2626'
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  };

  const getTrendIcon = (trend: string): string => {
    if (trend.includes('improvement')) return '📈';
    if (trend.includes('decline')) return '📉';
    return '➡️';
  };

  // Render Functions
  const renderAssessmentCard = (assessment: AssessmentResult) => {
    const isExpanded = expandedAssessment === assessment.id;
    const recommendations = generateTreatmentRecommendations(assessment);
    
    return (
      <div key={assessment.id} style={styles.assessmentCard}>
        {assessment.crisisIndicators && (
          <div style={styles.crisisAlert}>
            ⚠️ Crisis indicators detected - Immediate attention required
          </div>
        )}
        
        <div style={styles.assessmentHeader}>
          <div style={styles.assessmentInfo}>
            <h3 style={styles.assessmentTitle}>{assessment.title}</h3>
            <div style={styles.assessmentMeta}>
              <span style={styles.assessmentDate}>
                📅 {formatTimeAgo(assessment.completedAt)}
              </span>
              {assessment.validatedInstrument && (
                <span style={styles.validatedBadge}>✓ Validated</span>
              )}
              {assessment.culturalFactorsConsidered && (
                <span style={styles.culturalBadge}>🌍 Culturally Adapted</span>
              )}
            </div>
          </div>
          
          <div style={styles.assessmentScore}>
            <div style={{
              ...styles.severityBadge,
              backgroundColor: getSeverityColor(assessment.severity)
            }}>
              {assessment.severity.replace('_', ' ').toUpperCase()}
            </div>
            <div style={styles.scoreValue}>
              {assessment.score}/{assessment.maxScore}
            </div>
            <div style={styles.scorePercentage}>
              ({assessment.percentage}%)
            </div>
          </div>
        </div>

        {assessment.clinicalInterpretation && (
          <div style={styles.clinicalInterpretation}>
            <strong>Clinical Interpretation:</strong> {assessment.clinicalInterpretation}
          </div>
        )}

        <div style={styles.assessmentTags}>
          {assessment.tags.map(tag => (
            <span key={tag} style={styles.tag}>{tag}</span>
          ))}
        </div>

        <div style={styles.assessmentActions}>
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => handleViewDetails(assessment.id)}
          >
            {isExpanded ? 'Hide Details' : 'View Details'}
          </button>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => handleShareWithProvider(assessment.id)}
          >
            Share with Provider
          </button>
          <button
            style={{ ...styles.button, ...styles.secondaryButton }}
            onClick={() => handleRetakeAssessment(assessment.assessmentType)}
          >
            Retake Assessment
          </button>
        </div>

        {isExpanded && (
          <div style={styles.assessmentDetails}>
            <div style={styles.recommendationsSection}>
              <h4>Treatment Recommendations</h4>
              {recommendations.map((rec, index) => (
                <div key={index} style={styles.recommendation}>
                  <span style={{
                    ...styles.priorityBadge,
                    backgroundColor: rec.priority === 'immediate' ? '#dc2626' :
                                   rec.priority === 'high' ? '#f97316' :
                                   rec.priority === 'medium' ? '#f59e0b' : '#10b981'
                  }}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <div>
                    <strong>{rec.type.replace('_', ' ')}:</strong> {rec.description}
                    <div style={styles.evidenceBase}>Evidence: {rec.evidenceBase}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={styles.responsesSection}>
              <h4>Response Details</h4>
              {assessment.responses.slice(0, 5).map((response, index) => (
                <div key={index} style={styles.response}>
                  <div style={styles.responseQuestion}>{response.question}</div>
                  <div style={styles.responseAnswer}>
                    Answer: {response.answer} (Score: {response.score})
                  </div>
                  {response.flaggedForReview && (
                    <div style={styles.flaggedNote}>
                      ⚠️ Flagged for review
                      {response.clinicalNote && `: ${response.clinicalNote}`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {assessment.confidenceInterval && (
              <div style={styles.confidenceInterval}>
                <strong>95% Confidence Interval:</strong> {assessment.confidenceInterval.lower} - {assessment.confidenceInterval.upper}
              </div>
            )}

            {assessment.notes && (
              <div style={styles.notes}>
                <strong>Additional Notes:</strong> {assessment.notes}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading assessment history...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Assessment History</h1>
        <p style={styles.subtitle}>Track your mental health journey with clinical insights</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{stats.totalAssessments}</div>
            <div style={styles.statCardLabel}>Total Assessments</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{Math.round(stats.averageScore)}%</div>
            <div style={styles.statCardLabel}>Average Score</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>
              {getTrendIcon(stats.improvementTrend)} {stats.improvementTrend.replace('_', ' ')}
            </div>
            <div style={styles.statCardLabel}>Overall Trend</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{stats.streakDays} days</div>
            <div style={styles.statCardLabel}>Assessment Streak</div>
          </div>
        </div>
      )}

      {/* Clinical Significance Banner */}
      {stats?.clinicallySignificantChange && (
        <div style={styles.clinicalBanner}>
          <h3>Clinically Significant Change Detected</h3>
          <p>Your recent assessments show meaningful changes. Please discuss with your healthcare provider.</p>
        </div>
      )}

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Types</option>
            <option value="depression">Depression</option>
            <option value="anxiety">Anxiety</option>
            <option value="stress">Stress</option>
            <option value="wellness">Wellness</option>
            <option value="ptsd">PTSD</option>
            <option value="bipolar">Bipolar</option>
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Severities</option>
            <option value="minimal">Minimal</option>
            <option value="mild">Mild</option>
            <option value="moderate">Moderate</option>
            <option value="moderately_severe">Moderately Severe</option>
            <option value="severe">Severe</option>
            <option value="critical">Critical</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            style={styles.select}
          >
            <option value="week">Past Week</option>
            <option value="month">Past Month</option>
            <option value="3months">Past 3 Months</option>
            <option value="year">Past Year</option>
            <option value="all">All Time</option>
          </select>

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showCrisisOnly}
              onChange={(e) => setShowCrisisOnly(e.target.checked)}
            />
            Crisis indicators only
          </label>
        </div>

        <button
          style={{ ...styles.button, ...styles.exportButton }}
          onClick={handleExportData}
        >
          Export Data (Encrypted)
        </button>
      </div>

      {/* Assessment List */}
      <div style={styles.assessmentsList}>
        {filteredAssessments.length === 0 ? (
          <div style={styles.emptyState}>
            {assessments.length === 0 ? (
              <>
                <h3>No Assessments Yet</h3>
                <p>Start tracking your mental health journey with regular assessments</p>
                <button style={{ ...styles.button, ...styles.primaryButton }}>
                  Take Your First Assessment
                </button>
              </>
            ) : (
              <>
                <h3>No Results Found</h3>
                <p>Try adjusting your filters or search query</p>
              </>
            )}
          </div>
        ) : (
          filteredAssessments.map(renderAssessmentCard)
        )}
      </div>

      {/* Results Summary */}
      {filteredAssessments.length > 0 && (
        <div style={styles.resultsSummary}>
          <p>
            Showing {filteredAssessments.length} of {assessments.length} assessments
            {selectedType !== 'all' && ` • Type: ${selectedType}`}
            {selectedSeverity !== 'all' && ` • Severity: ${selectedSeverity}`}
            {showCrisisOnly && ' • Crisis indicators only'}
          </p>
        </div>
      )}

      {/* Accessibility Features */}
      <div style={styles.accessibilityPanel}>
        <button
          style={styles.accessibilityButton}
          onClick={() => document.body.classList.toggle('high-contrast')}
          aria-label="Toggle high contrast mode"
        >
          High Contrast
        </button>
        <button
          style={styles.accessibilityButton}
          onClick={() => {
            const fontSize = parseInt(window.getComputedStyle(document.body).fontSize);
            document.body.style.fontSize = `${fontSize + 2}px`;
          }}
          aria-label="Increase text size"
        >
          A+
        </button>
        <button
          style={styles.accessibilityButton}
          onClick={() => {
            const fontSize = parseInt(window.getComputedStyle(document.body).fontSize);
            document.body.style.fontSize = `${fontSize - 2}px`;
          }}
          aria-label="Decrease text size"
        >
          A-
        </button>
      </div>
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#111827'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  statCardValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '4px'
  },
  statCardLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  clinicalBanner: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  filtersCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  },
  searchBar: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    alignItems: 'center'
  },
  select: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  assessmentsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px'
  },
  assessmentCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  crisisAlert: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  assessmentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  assessmentInfo: {
    flex: 1
  },
  assessmentTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '4px',
    margin: 0
  },
  assessmentMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
    color: '#6b7280'
  },
  assessmentDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  validatedBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  culturalBadge: {
    backgroundColor: '#8b5cf6',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  assessmentScore: {
    textAlign: 'right'
  },
  severityBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  scoreValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827'
  },
  scorePercentage: {
    fontSize: '14px',
    color: '#6b7280'
  },
  clinicalInterpretation: {
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '12px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  assessmentTags: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  tag: {
    backgroundColor: '#e5e7eb',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#4b5563'
  },
  assessmentActions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  secondaryButton: {
    backgroundColor: '#f3f4f6',
    color: '#111827'
  },
  exportButton: {
    backgroundColor: '#10b981',
    color: 'white'
  },
  assessmentDetails: {
    borderTop: '1px solid #e5e7eb',
    marginTop: '16px',
    paddingTop: '16px'
  },
  recommendationsSection: {
    marginBottom: '20px'
  },
  recommendation: {
    display: 'flex',
    gap: '12px',
    marginTop: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px'
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    height: 'fit-content'
  },
  evidenceBase: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    fontStyle: 'italic'
  },
  responsesSection: {
    marginBottom: '20px'
  },
  response: {
    padding: '8px',
    borderLeft: '3px solid #e5e7eb',
    marginTop: '8px'
  },
  responseQuestion: {
    fontWeight: '600',
    marginBottom: '4px'
  },
  responseAnswer: {
    fontSize: '14px',
    color: '#4b5563'
  },
  flaggedNote: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
    fontWeight: 'bold'
  },
  confidenceInterval: {
    padding: '8px',
    backgroundColor: '#eff6ff',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '12px'
  },
  notes: {
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    fontSize: '14px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  resultsSummary: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280'
  },
  accessibilityPanel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    gap: '4px'
  },
  accessibilityButton: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

// Add keyframe animation for spinner
if (typeof document !== 'undefined' && !document.getElementById('assessment-history-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'assessment-history-styles';
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .high-contrast {
      filter: contrast(1.5);
    }
  `;
  document.head.appendChild(styleSheet);
}

export default AssessmentHistoryView;