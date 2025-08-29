/**
 * Crisis Prediction Dashboard Component
 * Visualizes ML-based crisis risk assessments with ethical safeguards
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Activity, Brain, Shield, User, Clock, BarChart, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useCrisisPrediction } from '../../hooks/useCrisisPrediction';
import type { CrisisRiskAssessment, RiskFactor, InterventionRecommendation } from '../../services/ml/crisisPredictionML';

interface CrisisPredictionDashboardProps {
  userId: string;
  onInterventionRequired?: (assessment: CrisisRiskAssessment) => void;
  showAdminControls?: boolean;
  autoRefreshInterval?: number; // milliseconds
}

export const CrisisPredictionDashboard: React.FC<CrisisPredictionDashboardProps> = ({
  userId,
  onInterventionRequired,
  showAdminControls = false,
  autoRefreshInterval = 300000 // 5 minutes default
}) => {
  const {
    currentAssessment,
    assessmentHistory,
    isLoading,
    error,
    updatePrediction,
    reportFalsePositive,
    requestHumanReview,
    getModelPerformance,
    ethicalStatus
  } = useCrisisPrediction(userId);

  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  const [showDetails, setShowDetails] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [interventionAcknowledged, setInterventionAcknowledged] = useState(false);

  // Auto-refresh predictions
  useEffect(() => {
    const interval = setInterval(() => {
      updatePrediction();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, updatePrediction]);

  // Alert for high-risk assessments
  useEffect(() => {
    if (currentAssessment && 
        (currentAssessment.riskLevel === 'critical' || currentAssessment.riskLevel === 'high') &&
        !interventionAcknowledged) {
      onInterventionRequired?.(currentAssessment);
    }
  }, [currentAssessment, interventionAcknowledged, onInterventionRequired]);

  // Risk level styling
  const getRiskLevelStyle = useCallback((level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-900 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'elevated':
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'moderate':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'low':
        return 'bg-green-100 text-green-900 border-green-300';
      default:
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  }, []);

  // Risk level icon
  const getRiskLevelIcon = useCallback((level: string) => {
    switch (level) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case 'elevated':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'moderate':
        return <Info className="w-6 h-6 text-blue-600" />;
      case 'low':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      default:
        return <Activity className="w-6 h-6 text-gray-600" />;
    }
  }, []);

  // Format confidence percentage
  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  // Format risk score
  const formatRiskScore = (score: number): string => {
    return score.toFixed(1);
  };

  if (isLoading && !currentAssessment) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Analyzing risk patterns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Error loading predictions: {error}</span>
        </div>
      </div>
    );
  }

  if (!currentAssessment) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No risk assessment available</p>
        <button
          onClick={updatePrediction}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Generate Assessment
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Risk Overview */}
      <div className={`rounded-lg border-2 p-6 ${getRiskLevelStyle(currentAssessment.riskLevel)}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {getRiskLevelIcon(currentAssessment.riskLevel)}
            <div className="ml-4">
              <h2 className="text-2xl font-bold capitalize">
                {currentAssessment.riskLevel} Risk
              </h2>
              <p className="text-sm opacity-75 mt-1">
                Score: {formatRiskScore(currentAssessment.riskScore)} / 100
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium">
              Confidence: {formatConfidence(currentAssessment.confidence)}
            </div>
            <div className="text-xs opacity-75 mt-1">
              Updated: {new Date(currentAssessment.timestamp).toLocaleTimeString()}
            </div>
            {currentAssessment.requiresHumanReview && (
              <div className="mt-2 flex items-center text-sm font-medium text-orange-700">
                <User className="w-4 h-4 mr-1" />
                Human Review Required
              </div>
            )}
          </div>
        </div>

        {/* Ethical Safeguards Status */}
        {ethicalStatus && (
          <div className="mt-4 pt-4 border-t border-current border-opacity-20">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span className="font-medium">Ethical Safeguards</span>
              </div>
              <span className={ethicalStatus.allPassed ? 'text-green-700' : 'text-orange-700'}>
                {ethicalStatus.allPassed ? 'All Passed' : 'Review Required'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Critical/High Risk Alert */}
      {(currentAssessment.riskLevel === 'critical' || currentAssessment.riskLevel === 'high') && !interventionAcknowledged && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
            <div className="ml-3 flex-1">
              <h3 className="font-semibold text-red-900">Immediate Attention Required</h3>
              <p className="text-red-700 mt-1">
                The risk assessment indicates a need for immediate intervention. 
                Please review the recommendations below and take appropriate action.
              </p>
              <button
                onClick={() => setInterventionAcknowledged(true)}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Acknowledge & Review Recommendations
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors Analysis */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <BarChart className="w-5 h-5 mr-2" />
          Contributing Factors
        </h3>
        <div className="space-y-3">
          {currentAssessment.factors.map((factor, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{factor.name}</span>
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100">
                      {factor.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{factor.description}</p>
                </div>
                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {(factor.value * 100).toFixed(0)}%
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    {factor.trend === 'increasing' ? (
                      <TrendingUp className="w-3 h-3 mr-1 text-red-500" />
                    ) : factor.trend === 'decreasing' ? (
                      <TrendingDown className="w-3 h-3 mr-1 text-green-500" />
                    ) : (
                      <Activity className="w-3 h-3 mr-1 text-gray-400" />
                    )}
                    {factor.trend}
                  </div>
                </div>
              </div>
              
              {/* Factor weight indicator */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${factor.weight * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  Weight: {(factor.weight * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Intervention Recommendations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Recommended Interventions</h3>
        <div className="space-y-3">
          {currentAssessment.recommendations
            .sort((a, b) => {
              const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
        </div>
      </div>

      {/* Historical Trend */}
      {assessmentHistory.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Risk Trend
            </h3>
            <div className="flex space-x-2">
              {(['24h', '7d', '30d'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setSelectedTimeRange(range)}
                  className={`px-3 py-1 text-sm rounded-lg ${
                    selectedTimeRange === range
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          
          <RiskTrendChart 
            history={assessmentHistory} 
            timeRange={selectedTimeRange}
          />
        </div>
      )}

      {/* Admin Controls */}
      {showAdminControls && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Admin Controls</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => requestHumanReview()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Request Human Review
            </button>
            <button
              onClick={() => setShowModelInfo(true)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              View Model Info
            </button>
            <button
              onClick={() => reportFalsePositive(currentAssessment.riskLevel)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Report False Positive
            </button>
            <button
              onClick={updatePrediction}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Refresh Assessment
            </button>
          </div>
        </div>
      )}

      {/* Model Information Modal */}
      {showModelInfo && (
        <ModelInfoModal
          modelPerformance={getModelPerformance()}
          onClose={() => setShowModelInfo(false)}
        />
      )}
    </div>
  );
};

// Recommendation Card Component
const RecommendationCard: React.FC<{ recommendation: InterventionRecommendation }> = ({ 
  recommendation 
}) => {
  const [expanded, setExpanded] = useState(false);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getPriorityStyle(recommendation.priority)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
              recommendation.type === 'immediate' ? 'bg-red-200' :
              recommendation.type === 'preventive' ? 'bg-orange-200' :
              recommendation.type === 'supportive' ? 'bg-blue-200' :
              'bg-gray-200'
            }`}>
              {recommendation.type}
            </span>
            <span className="ml-2 text-sm font-medium capitalize">
              {recommendation.priority} Priority
            </span>
          </div>
          <h4 className="font-semibold mt-2">{recommendation.action}</h4>
          <p className="text-sm mt-1 opacity-75">{recommendation.rationale}</p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-4 text-gray-500 hover:text-gray-700"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="text-sm">
            <div className="font-medium mb-1">Resources:</div>
            <ul className="list-disc list-inside space-y-1">
              {recommendation.resources.map((resource, idx) => (
                <li key={idx} className="opacity-75">{resource}</li>
              ))}
            </ul>
            <div className="mt-2">
              <span className="font-medium">Timeframe:</span>
              <span className="ml-2 opacity-75">{recommendation.timeframe}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Risk Trend Chart Component
const RiskTrendChart: React.FC<{
  history: CrisisRiskAssessment[];
  timeRange: '24h' | '7d' | '30d';
}> = ({ history, timeRange }) => {
  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - ranges[timeRange];
    return history.filter(assessment => 
      new Date(assessment.timestamp).getTime() > cutoff
    );
  }, [history, timeRange]);

  const maxScore = Math.max(...filteredHistory.map(a => a.riskScore), 100);

  return (
    <div className="relative h-48">
      <div className="absolute inset-0 flex items-end justify-between">
        {filteredHistory.map((assessment, index) => {
          const height = (assessment.riskScore / maxScore) * 100;
          const color = 
            assessment.riskLevel === 'critical' ? 'bg-red-500' :
            assessment.riskLevel === 'high' ? 'bg-orange-500' :
            assessment.riskLevel === 'elevated' ? 'bg-yellow-500' :
            assessment.riskLevel === 'moderate' ? 'bg-blue-500' :
            'bg-green-500';
          
          return (
            <div
              key={index}
              className="flex-1 mx-0.5 relative group"
            >
              <div
                className={`${color} rounded-t transition-all duration-300 hover:opacity-80`}
                style={{ height: `${height}%` }}
              />
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                            bg-gray-800 text-white text-xs rounded px-2 py-1 
                            opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Score: {assessment.riskScore.toFixed(1)}
                <br />
                {new Date(assessment.timestamp).toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
        <span>{maxScore}</span>
        <span>{(maxScore / 2).toFixed(0)}</span>
        <span>0</span>
      </div>
    </div>
  );
};

// Model Information Modal
const ModelInfoModal: React.FC<{
  modelPerformance: any;
  onClose: () => void;
}> = ({ modelPerformance, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Model Information</h3>
        <div className="space-y-3">
          <div>
            <span className="font-medium">Model Version:</span>
            <span className="ml-2">{modelPerformance?.version || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium">Accuracy:</span>
            <span className="ml-2">{modelPerformance?.accuracy || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium">Last Updated:</span>
            <span className="ml-2">{modelPerformance?.lastUpdated || 'N/A'}</span>
          </div>
          <div>
            <span className="font-medium">Total Predictions:</span>
            <span className="ml-2">{modelPerformance?.totalPredictions || 'N/A'}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default CrisisPredictionDashboard;