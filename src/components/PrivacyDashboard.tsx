/**
 * Privacy Dashboard Component
 * 
 * Comprehensive privacy control center for users to manage their data,
 * consent preferences, and view privacy metrics. Provides GDPR, CCPA,
 * HIPAA, and COPPA compliant controls.
 * 
 * @fileoverview User privacy control dashboard
 * @version 3.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Download, 
  Trash2, 
  Settings,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  Users,
  Activity,
  Database,
  Clock
} from 'lucide-react';
import { consentManager, ConsentType, ConsentRecord } from '../services/consentManager';
import { dataMinimizationService, MinimizationMetrics } from '../services/dataMinimizationService';
import { privacyPreservingAnalyticsService } from '../services/privacyPreservingAnalyticsService';
import { usePrivacyAnalytics } from '../hooks/usePrivacyAnalytics';
import { logger } from '../utils/logger';

interface PrivacyDashboardProps {
  userId: string;
  userAge?: number;
  isMinor?: boolean;
  className?: string;
}

interface ConsentCardProps {
  consent: ConsentRecord;
  onGrant: () => void;
  onDeny: () => void;
  onWithdraw: () => void;
  isRequired?: boolean;
}

interface PrivacyMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  color?: string;
}

const CONSENT_CATEGORIES: {
  type: ConsentType;
  title: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
  dataTypes: string[];
}[] = [
  {
    type: 'essential',
    title: 'Essential Services',
    description: 'Core functionality required for the platform to work',
    icon: <Shield className="w-5 h-5" />,
    required: true,
    dataTypes: ['Account data', 'Authentication', 'Security logs']
  },
  {
    type: 'functional',
    title: 'Enhanced Features',
    description: 'Additional features for improved experience',
    icon: <Settings className="w-5 h-5" />,
    required: false,
    dataTypes: ['Preferences', 'Settings', 'Usage patterns']
  },
  {
    type: 'analytics',
    title: 'Analytics & Insights',
    description: 'Anonymous usage data to improve our services',
    icon: <Activity className="w-5 h-5" />,
    required: false,
    dataTypes: ['Interaction data', 'Feature usage', 'Performance metrics']
  },
  {
    type: 'personalization',
    title: 'Personalization',
    description: 'Customize your experience based on your preferences',
    icon: <Users className="w-5 h-5" />,
    required: false,
    dataTypes: ['Behavioral data', 'Preferences', 'History']
  },
  {
    type: 'research',
    title: 'Mental Health Research',
    description: 'Contribute to mental health research studies',
    icon: <FileText className="w-5 h-5" />,
    required: false,
    dataTypes: ['Anonymized health data', 'Outcomes', 'Patterns']
  }
];

const ConsentCard: React.FC<ConsentCardProps> = ({
  consent,
  onGrant,
  onDeny,
  onWithdraw,
  isRequired = false
}) => {
  const getStatusColor = () => {
    switch (consent.status) {
      case 'granted': return 'bg-green-100 text-green-800 border-green-300';
      case 'denied': return 'bg-red-100 text-red-800 border-red-300';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getStatusIcon = () => {
    switch (consent.status) {
      case 'granted': return <CheckCircle className="w-4 h-4" />;
      case 'denied': return <XCircle className="w-4 h-4" />;
      case 'withdrawn': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium capitalize">{consent.type.replace('_', ' ')}</span>
          {isRequired && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Required</span>
          )}
        </div>
        <span className="text-xs text-gray-600">
          Last updated: {new Date(consent.timestamp).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm mb-3">{consent.description}</p>

      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
        <span>Data categories: {consent.dataCategories.join(', ')}</span>
      </div>

      <div className="flex gap-2">
        {consent.status !== 'granted' && (
          <button
            onClick={onGrant}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            disabled={false}
          >
            Grant Consent
          </button>
        )}
        
        {consent.status === 'granted' && consent.withdrawable && !isRequired && (
          <button
            onClick={onWithdraw}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
          >
            Withdraw
          </button>
        )}
        
        {consent.status === 'pending' && !isRequired && (
          <button
            onClick={onDeny}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
          >
            Deny
          </button>
        )}
      </div>
    </div>
  );
};

export const PrivacyDashboard: React.FC<PrivacyDashboardProps> = ({
  userId,
  userAge,
  isMinor = false,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'consent' | 'data' | 'metrics' | 'settings'>('consent');
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [privacyMetrics, setPrivacyMetrics] = useState<MinimizationMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportInProgress, setExportInProgress] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const {
    updatePrivacySettings,
    requestDataExport,
    requestDataDeletion,
    getAnalyticsMetrics,
    privacySettings
  } = usePrivacyAnalytics();

  // Load user consents and metrics
  useEffect(() => {
    loadPrivacyData();
  }, [userId]);

  const loadPrivacyData = async () => {
    try {
      setLoading(true);
      
      // Load consents
      const userConsents = await consentManager.getUserConsents(userId);
      
      // Ensure all consent types have records
      const consentMap = new Map(userConsents.map(c => [c.type, c]));
      
      for (const category of CONSENT_CATEGORIES) {
        if (!consentMap.has(category.type)) {
          const newConsent = await consentManager.requestConsent(
            userId,
            category.type,
            'global',
            {
              dataCategories: category.dataTypes,
              description: category.description
            }
          );
          consentMap.set(category.type, newConsent);
        }
      }
      
      setConsents(Array.from(consentMap.values()));
      
      // Load privacy metrics
      const metrics = dataMinimizationService.getMetrics();
      setPrivacyMetrics(metrics);
      
    } catch (err) {
      logger.error('Failed to load privacy data:', err);
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async (consentType: ConsentType) => {
    try {
      await consentManager.grantConsent(userId, consentType);
      await loadPrivacyData();
    } catch (err) {
      logger.error('Failed to grant consent:', err);
      setError('Failed to update consent');
    }
  };

  const handleDenyConsent = async (consentType: ConsentType) => {
    try {
      await consentManager.denyConsent(userId, consentType);
      await loadPrivacyData();
    } catch (err) {
      logger.error('Failed to deny consent:', err);
      setError('Failed to update consent');
    }
  };

  const handleWithdrawConsent = async (consentType: ConsentType) => {
    try {
      await consentManager.withdrawConsent(userId, consentType);
      await loadPrivacyData();
    } catch (err) {
      logger.error('Failed to withdraw consent:', err);
      setError('Failed to update consent');
    }
  };

  const handleGlobalOptOut = async () => {
    if (confirm('This will opt you out of all data collection and may limit functionality. Continue?')) {
      try {
        await consentManager.globalOptOut(userId);
        await loadPrivacyData();
      } catch (err) {
        logger.error('Failed to opt out:', err);
        setError('Failed to process opt-out request');
      }
    }
  };

  const handleDataExport = async () => {
    try {
      setExportInProgress(true);
      
      const exportData = await requestDataExport({
        format: 'json',
        includePersonalData: true,
        anonymizeExport: false
      });
      
      // Create download link
      const url = URL.createObjectURL(exportData);
      const a = document.createElement('a');
      a.href = url;
      a.download = `privacy-data-${userId}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      logger.error('Failed to export data:', err);
      setError('Failed to export data');
    } finally {
      setExportInProgress(false);
    }
  };

  const handleDataDeletion = async () => {
    if (confirm('This will permanently delete all your data. This action cannot be undone. Continue?')) {
      try {
        setDeleteInProgress(true);
        const success = await requestDataDeletion();
        if (success) {
          alert('Your data has been successfully deleted.');
          await loadPrivacyData();
        }
      } catch (err) {
        logger.error('Failed to delete data:', err);
        setError('Failed to delete data');
      } finally {
        setDeleteInProgress(false);
      }
    }
  };

  const renderConsentTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Consent Management</h3>
        <button
          onClick={handleGlobalOptOut}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          Global Opt-Out
        </button>
      </div>

      {isMinor && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Parental Consent Required</span>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            As a minor, parental consent is required for certain data processing activities.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {consents.map(consent => {
          const category = CONSENT_CATEGORIES.find(c => c.type === consent.type);
          return (
            <ConsentCard
              key={consent.id}
              consent={consent}
              onGrant={() => handleGrantConsent(consent.type)}
              onDeny={() => handleDenyConsent(consent.type)}
              onWithdraw={() => handleWithdrawConsent(consent.type)}
              isRequired={category?.required}
            />
          );
        })}
      </div>
    </div>
  );

  const renderDataTab = () => {
    const analyticsMetrics = getAnalyticsMetrics();
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Your Data</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Data Points Collected</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{analyticsMetrics.totalEvents}</p>
              <p className="text-sm text-gray-600 mt-1">
                {analyticsMetrics.anonymizedEvents} anonymized
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-medium">Privacy Compliance</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {((analyticsMetrics.privacyCompliantEvents / analyticsMetrics.totalEvents) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Events meet privacy standards
              </p>
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium">Data Management Actions</h4>
            
            <div className="flex gap-3">
              <button
                onClick={handleDataExport}
                disabled={exportInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {exportInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Export My Data
              </button>

              <button
                onClick={handleDataDeletion}
                disabled={deleteInProgress}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteInProgress ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete All Data
              </button>
            </div>

            <p className="text-sm text-gray-600">
              You have the right to access and delete your personal data at any time.
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Data Retention Policy</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Essential data: Retained for 30 days
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Functional data: Retained for 90 days
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Analytics data: Retained for 180 days
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                Research data: Retained for 1 year (with consent)
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderMetricsTab = () => {
    if (!privacyMetrics) return null;

    const metrics: PrivacyMetric[] = [
      {
        label: 'Data Reduction',
        value: `${privacyMetrics.dataReductionPercentage.toFixed(1)}%`,
        icon: <Database className="w-5 h-5" />,
        color: 'text-blue-600'
      },
      {
        label: 'Fields Anonymized',
        value: privacyMetrics.fieldsAnonymized,
        icon: <EyeOff className="w-5 h-5" />,
        color: 'text-green-600'
      },
      {
        label: 'Fields Encrypted',
        value: privacyMetrics.fieldsEncrypted,
        icon: <Lock className="w-5 h-5" />,
        color: 'text-purple-600'
      },
      {
        label: 'Compliance Score',
        value: `${privacyMetrics.complianceScore.toFixed(1)}%`,
        icon: <Shield className="w-5 h-5" />,
        color: 'text-indigo-600'
      }
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Privacy Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`${metric.color}`}>{metric.icon}</span>
                <span className="text-xs text-gray-500">{metric.trend}</span>
              </div>
              <p className="text-2xl font-bold mb-1">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-3">Data Processing Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total Fields Processed:</span>
              <span className="font-medium">{privacyMetrics.totalFieldsProcessed}</span>
            </div>
            <div className="flex justify-between">
              <span>Fields Removed:</span>
              <span className="font-medium">{privacyMetrics.fieldsRemoved}</span>
            </div>
            <div className="flex justify-between">
              <span>Last Audit:</span>
              <span className="font-medium">
                {new Date(privacyMetrics.lastAudit).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Privacy by Design</span>
          </div>
          <p className="text-sm text-blue-700">
            Our platform implements privacy-preserving techniques including differential privacy,
            k-anonymity, and automatic data minimization to protect your information.
          </p>
        </div>
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Privacy Settings</h3>
      
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium">Do Not Track</h4>
              <p className="text-sm text-gray-600">Prevent tracking across sessions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.consentLevel === 'none'}
                onChange={(e) => updatePrivacySettings({
                  consentLevel: e.target.checked ? 'none' : 'essential'
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium">Anonymize Data</h4>
              <p className="text-sm text-gray-600">Always anonymize collected data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.anonymizeData}
                onChange={(e) => updatePrivacySettings({
                  anonymizeData: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium">Encrypt Data</h4>
              <p className="text-sm text-gray-600">Encrypt all stored data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.encryptData}
                onChange={(e) => updatePrivacySettings({
                  encryptData: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium">Research Participation</h4>
              <p className="text-sm text-gray-600">Contribute anonymized data to research</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={privacySettings.allowResearchParticipation}
                onChange={(e) => updatePrivacySettings({
                  allowResearchParticipation: e.target.checked
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Data Retention Period</h4>
        <select
          value={privacySettings.dataRetentionDays}
          onChange={(e) => updatePrivacySettings({
            dataRetentionDays: parseInt(e.target.value)
          })}
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="30">30 days</option>
          <option value="90">90 days</option>
          <option value="180">180 days</option>
          <option value="365">1 year</option>
        </select>
        <p className="text-sm text-gray-600 mt-2">
          Data older than this period will be automatically deleted.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="border-b">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Privacy Control Center</h2>
              <p className="text-gray-600">Manage your data and privacy preferences</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-1 px-6">
          {(['consent', 'data', 'metrics', 'settings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {activeTab === 'consent' && renderConsentTab()}
        {activeTab === 'data' && renderDataTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
};

export default PrivacyDashboard;