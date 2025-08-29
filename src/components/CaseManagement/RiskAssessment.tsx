import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, TrendingDown, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RiskAssessmentProps {
  patientId: string;
}

interface RiskFactor {
  id: string;
  category: string;
  factor: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  present: boolean;
  notes?: string;
}

interface ProtectiveFactor {
  id: string;
  factor: string;
  strength: 'weak' | 'moderate' | 'strong';
  notes?: string;
}

interface AssessmentHistory {
  id: string;
  date: Date;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  suicidalIdeation: boolean;
  homicidalIdeation: boolean;
  selfHarmRisk: boolean;
  assessedBy: string;
  notes: string;
}

export const RiskAssessment: React.FC<RiskAssessmentProps> = ({ patientId }) => {
  const [currentRiskLevel, setCurrentRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [protectiveFactors, setProtectiveFactors] = useState<ProtectiveFactor[]>([]);
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRiskAssessment();
  }, [patientId]);

  const loadRiskAssessment = async () => {
    setLoading(true);
    try {
      // Mock data - in production, this would fetch from the API
      setRiskFactors([
        {
          id: '1',
          category: 'Historical',
          factor: 'Previous suicide attempt',
          severity: 'high',
          present: false,
          notes: 'No history of attempts'
        },
        {
          id: '2',
          category: 'Clinical',
          factor: 'Current suicidal ideation',
          severity: 'critical',
          present: false,
          notes: 'Denies current SI'
        },
        {
          id: '3',
          category: 'Clinical',
          factor: 'Depression symptoms',
          severity: 'medium',
          present: true,
          notes: 'Moderate depression, PHQ-9 score: 12'
        },
        {
          id: '4',
          category: 'Situational',
          factor: 'Recent loss or stressor',
          severity: 'medium',
          present: true,
          notes: 'Job loss 2 months ago'
        },
        {
          id: '5',
          category: 'Situational',
          factor: 'Social isolation',
          severity: 'medium',
          present: false,
          notes: 'Good family support'
        }
      ]);

      setProtectiveFactors([
        {
          id: '1',
          factor: 'Family support',
          strength: 'strong',
          notes: 'Very supportive spouse and children'
        },
        {
          id: '2',
          factor: 'Treatment engagement',
          strength: 'strong',
          notes: 'Excellent attendance and participation'
        },
        {
          id: '3',
          factor: 'Coping skills',
          strength: 'moderate',
          notes: 'Developing healthy coping strategies'
        },
        {
          id: '4',
          factor: 'Reasons for living',
          strength: 'strong',
          notes: 'Strong commitment to family'
        }
      ]);

      setAssessmentHistory([
        {
          id: '1',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          overallRisk: 'medium',
          suicidalIdeation: false,
          homicidalIdeation: false,
          selfHarmRisk: false,
          assessedBy: 'Dr. Smith',
          notes: 'Stable, continue monitoring'
        },
        {
          id: '2',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          overallRisk: 'medium',
          suicidalIdeation: false,
          homicidalIdeation: false,
          selfHarmRisk: false,
          assessedBy: 'Dr. Smith',
          notes: 'Slight improvement in mood'
        }
      ]);

      setSafetyPlan('1. Warning signs: Increased isolation, hopelessness\n2. Coping strategies: Deep breathing, call friend\n3. Support contacts: Spouse (555-0123), Sister (555-0124)\n4. Professional contacts: Dr. Smith (555-0199), Crisis line (988)\n5. Safe environment: Medications secured, no firearms in home');
      
      // Calculate current risk level based on factors
      const presentHighRisk = riskFactors.filter(f => f.present && (f.severity === 'high' || f.severity === 'critical'));
      if (presentHighRisk.length > 0) {
        setCurrentRiskLevel('high');
      } else {
        const presentMediumRisk = riskFactors.filter(f => f.present && f.severity === 'medium');
        if (presentMediumRisk.length > 2) {
          setCurrentRiskLevel('medium');
        } else {
          setCurrentRiskLevel('low');
        }
      }
    } catch (error) {
      console.error('Error loading risk assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'weak': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Risk Assessment
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Current Risk Level */}
      <div className={`p-4 rounded-lg border-2 mb-4 ${getRiskLevelColor(currentRiskLevel)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Current Risk Level: {currentRiskLevel.toUpperCase()}</span>
          </div>
          <span className="text-sm">
            Last assessed: {format(assessmentHistory[0]?.date || new Date(), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-900 dark:text-red-300">Risk Factors</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {riskFactors.filter(f => f.present).length}
          </p>
          <p className="text-xs text-red-700 dark:text-red-500">Active factors</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-300">Protective Factors</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {protectiveFactors.filter(f => f.strength === 'strong').length}
          </p>
          <p className="text-xs text-green-700 dark:text-green-500">Strong factors</p>
        </div>
      </div>

      {/* Detailed Assessment */}
      {showDetails && (
        <div className="space-y-4">
          {/* Risk Factors */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Risk Factors Assessment
            </h4>
            <div className="space-y-2">
              {riskFactors.map(factor => (
                <div
                  key={factor.id}
                  className={`flex items-center justify-between p-2 rounded ${
                    factor.present ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {factor.present ? (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {factor.factor}
                      </p>
                      {factor.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{factor.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(factor.severity)}`}>
                    {factor.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Protective Factors */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Protective Factors
            </h4>
            <div className="space-y-2">
              {protectiveFactors.map(factor => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {factor.factor}
                      </p>
                      {factor.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">{factor.notes}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStrengthColor(factor.strength)}`}>
                    {factor.strength}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Plan */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Safety Plan
            </h4>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                {safetyPlan}
              </pre>
            </div>
          </div>

          {/* Assessment History */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Recent Assessments
            </h4>
            <div className="space-y-2">
              {assessmentHistory.slice(0, 3).map(assessment => (
                <div
                  key={assessment.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(assessment.date, 'MMM d, yyyy')}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {assessment.notes} - {assessment.assessedBy}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getRiskLevelColor(assessment.overallRisk)}`}>
                    {assessment.overallRisk}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
          Update Assessment
        </button>
        <button className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
          View Full History
        </button>
      </div>
    </div>
  );
};