import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { Modal } from '../components/Modal';
import { AppInput, AppTextArea } from '../components/AppInput';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import {
  Shield,
  User,
  AlertTriangle,
  TrendingUp,
  Settings,
  Check,
  X,
  Eye,
  MessageSquare,
  Users,
  Activity,
  BarChart3,
  Database
} from 'lucide-react';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalHelpers: number;
  activeHelpers: number;
  pendingApplications: number;
  flaggedContent: number;
  crisisInterventions: number;
  systemUptime: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
}

interface HelperApplication {
  id: string;
  applicantName: string;
  email: string;
  applicationDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  specializations: string[];
  experience: string;
  backgroundCheck: 'pending' | 'completed' | 'failed';
  references: boolean;
  riskAssessment: 'low' | 'medium' | 'high';
  reviewNotes?: string;
  documents: string[];
}

interface ModerationCase {
  id: string;
  type: 'harassment' | 'inappropriate_content' | 'spam' | 'safety_concern' | 'other';
  reportedBy: string;
  reportedUser: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  actionsTaken: string[];
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'security';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  affectedSystems: string[];
}

export const AdminDashboardViewEnhanced: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'moderation' | 'analytics' | 'system'>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [applications, setApplications] = useState<HelperApplication[]>([]);
  const [moderationCases, setModerationCases] = useState<ModerationCase[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<HelperApplication | null>(null);
  const [selectedCase, setSelectedCase] = useState<ModerationCase | null>(null);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [caseAction, setCaseAction] = useState('');

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate API call for admin metrics
      const mockMetrics: AdminMetrics = {
        totalUsers: 15847,
        activeUsers: 3421,
        totalHelpers: 892,
        activeHelpers: 156,
        pendingApplications: 23,
        flaggedContent: 7,
        crisisInterventions: 12,
        systemUptime: 99.8,
        averageResponseTime: 2.3,
        userSatisfactionScore: 4.7
      };

      // Mock helper applications
      const mockApplications: HelperApplication[] = [
        {
          id: '1',
          applicantName: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          applicationDate: new Date('2024-01-15'),
          status: 'pending',
          specializations: ['Anxiety', 'Depression', 'PTSD'],
          experience: '5 years peer counseling, certified in crisis intervention',
          backgroundCheck: 'completed',
          references: true,
          riskAssessment: 'low',
          documents: ['resume.pdf', 'certifications.pdf', 'references.pdf']
        },
        {
          id: '2',
          applicantName: 'Michael Chen',
          email: 'mike.chen@email.com',
          applicationDate: new Date('2024-01-12'),
          status: 'under_review',
          specializations: ['Addiction Recovery', 'Family Issues'],
          experience: '3 years volunteering at local support groups',
          backgroundCheck: 'pending',
          references: true,
          riskAssessment: 'low',
          documents: ['application.pdf', 'id.pdf']
        }
      ];

      // Mock moderation cases
      const mockCases: ModerationCase[] = [
        {
          id: '1',
          type: 'inappropriate_content',
          reportedBy: 'user_789',
          reportedUser: 'user_456',
          description: 'User posted inappropriate content in support group',
          status: 'open',
          priority: 'medium',
          createdAt: new Date('2024-01-16'),
          updatedAt: new Date('2024-01-16'),
          actionsTaken: []
        },
        {
          id: '2',
          type: 'safety_concern',
          reportedBy: 'helper_123',
          reportedUser: 'user_321',
          description: 'User expressing concerning thoughts about self-harm',
          status: 'escalated',
          priority: 'critical',
          assignedTo: 'crisis_team',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-16'),
          actionsTaken: ['Escalated to crisis team', 'User contacted by professional']
        }
      ];

      // Mock system alerts
      const mockAlerts: SystemAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High Server Load',
          message: 'Server load is at 85% capacity',
          severity: 'medium',
          timestamp: new Date('2024-01-16T10:30:00'),
          resolved: false,
          affectedSystems: ['web-server-1', 'database-primary']
        }
      ];

      setMetrics(mockMetrics);
      setApplications(mockApplications);
      setModerationCases(mockCases);
      setSystemAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      showNotification('Failed to load admin data', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: action === 'approve' ? 'approved' : 'rejected', reviewNotes: notes }
            : app
        )
      );
      
      showNotification(`Application ${action}d successfully`, 'success');
      setIsApplicationModalOpen(false);
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Failed to update application:', error);
      showNotification('Failed to update application', 'error');
    }
  };

  const handleCaseAction = async (caseId: string, action: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setModerationCases(prev => 
        prev.map(case_ => 
          case_.id === caseId 
            ? { 
                ...case_, 
                actionsTaken: [...case_.actionsTaken, action],
                updatedAt: new Date(),
                status: action.includes('resolve') ? 'resolved' : case_.status
              }
            : case_
        )
      );
      
      showNotification('Case action recorded successfully', 'success');
      setIsCaseModalOpen(false);
      setSelectedCase(null);
      setCaseAction('');
    } catch (error) {
      console.error('Failed to update case:', error);
      showNotification('Failed to update case', 'error');
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.totalUsers.toLocaleString()}</p>
            </div>
            <div className="w-8 h-8 text-blue-600">
              <Users className="w-full h-full" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics?.activeUsers.toLocaleString()} active today</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Helpers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.activeHelpers}</p>
            </div>
            <div className="w-8 h-8 text-green-600">
              <User className="w-full h-full" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">of {metrics?.totalHelpers} total</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Applications</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.pendingApplications}</p>
            </div>
            <div className="w-8 h-8 text-yellow-600">
              <AlertTriangle className="w-full h-full" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Require review</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Health</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metrics?.systemUptime}%</p>
            </div>
            <div className="w-8 h-8 text-purple-600">
              <Activity className="w-full h-full" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Uptime</p>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Applications</h3>
          <div className="space-y-3">
            {applications.slice(0, 3).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{app.applicantName}</p>
                  <p className="text-sm text-gray-500">{formatTimeAgo(app.applicationDate)}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  app.status === 'approved' ? 'bg-green-100 text-green-800' :
                  app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {app.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Alerts</h3>
          <div className="space-y-3">
            {systemAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`w-5 h-5 mt-0.5 ${
                  alert.severity === 'critical' ? 'text-red-600' :
                  alert.severity === 'high' ? 'text-orange-600' :
                  alert.severity === 'medium' ? 'text-yellow-600' :
                  'text-blue-600'
                }`}>
                  <AlertTriangle className="w-full h-full" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{alert.title}</p>
                  <p className="text-sm text-gray-500">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(alert.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderApplications = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Helper Applications</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{applications.length} total applications</span>
        </div>
      </div>

      <div className="grid gap-6">
        {applications.map((application) => (
          <Card key={application.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{application.applicantName}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    application.status === 'approved' ? 'bg-green-100 text-green-800' :
                    application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {application.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium">{application.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Applied</p>
                    <p className="font-medium">{formatTimeAgo(application.applicationDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Specializations</p>
                    <p className="font-medium">{application.specializations.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Risk Assessment</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      application.riskAssessment === 'low' ? 'bg-green-100 text-green-800' :
                      application.riskAssessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {application.riskAssessment}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <div className={`w-4 h-4 ${application.backgroundCheck === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="w-full h-full" />
                    </div>
                    <span>Background Check</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-4 h-4 ${application.references ? 'text-green-600' : 'text-gray-400'}`}>
                      <Check className="w-full h-full" />
                    </div>
                    <span>References</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedApplication(application);
                    setIsApplicationModalOpen(true);
                  }}
                  icon={<Eye className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Review
                </AppButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderModeration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Moderation Cases</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{moderationCases.length} active cases</span>
        </div>
      </div>

      <div className="grid gap-6">
        {moderationCases.map((case_) => (
          <Card key={case_.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {case_.type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    case_.priority === 'critical' ? 'bg-red-100 text-red-800' :
                    case_.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    case_.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {case_.priority}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    case_.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                    case_.status === 'investigating' ? 'bg-blue-100 text-blue-800' :
                    case_.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {case_.status}
                  </span>
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 mb-4">{case_.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reported by</p>
                    <p className="font-medium">{case_.reportedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Reported user</p>
                    <p className="font-medium">{case_.reportedUser}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
                    <p className="font-medium">{formatTimeAgo(case_.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last updated</p>
                    <p className="font-medium">{formatTimeAgo(case_.updatedAt)}</p>
                  </div>
                </div>

                {case_.actionsTaken.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Actions Taken:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {case_.actionsTaken.map((action, index) => (
                        <li key={index} className="text-sm text-gray-700 dark:text-gray-300">{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 ml-4">
                <AppButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCase(case_);
                    setIsCaseModalOpen(true);
                  }}
                  icon={<MessageSquare className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Take Action
                </AppButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Platform Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Engagement</h3>
            <div className="w-6 h-6 text-blue-600">
              <TrendingUp className="w-full h-full" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Average Response Time</span>
              <span className="font-medium">{metrics?.averageResponseTime}min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">User Satisfaction</span>
              <span className="font-medium">{metrics?.userSatisfactionScore}/5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Crisis Interventions</span>
              <span className="font-medium">{metrics?.crisisInterventions}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Content Moderation</h3>
            <div className="w-6 h-6 text-green-600">
              <Shield className="w-full h-full" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Flagged Content</span>
              <span className="font-medium">{metrics?.flaggedContent}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Open Cases</span>
              <span className="font-medium">{moderationCases.filter(c => c.status === 'open').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Resolved Today</span>
              <span className="font-medium">{moderationCases.filter(c => c.status === 'resolved').length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Performance</h3>
            <div className="w-6 h-6 text-purple-600">
              <BarChart3 className="w-full h-full" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">System Uptime</span>
              <span className="font-medium">{metrics?.systemUptime}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</span>
              <span className="font-medium">{systemAlerts.filter(a => !a.resolved).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Server Load</span>
              <span className="font-medium">Normal</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Management</h2>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">System Health</h3>
            <div className="w-6 h-6 text-green-600">
              <Database className="w-full h-full" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{metrics?.systemUptime}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">Normal</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Server Load</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">Fast</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active System Alerts</h3>
          <div className="space-y-4">
            {systemAlerts.filter(alert => !alert.resolved).map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'high' ? 'text-orange-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    <AlertTriangle className="w-full h-full" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{alert.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(alert.timestamp)}</p>
                  </div>
                </div>
                <AppButton variant="outline" size="sm">
                  Resolve
                </AppButton>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <ViewHeader
          title="Enhanced Admin Dashboard"
          subtitle="Advanced platform management and oversight tools"
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { key: 'overview', label: 'Overview', icon: Activity },
            { key: 'applications', label: 'Applications', icon: User },
            { key: 'moderation', label: 'Moderation', icon: Shield },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 },
            { key: 'system', label: 'System', icon: Settings }
          ].map(({ key, label, icon: Icon }) => (
            <AppButton
              key={key}
              variant={activeTab === key ? 'primary' : 'outline'}
              onClick={() => setActiveTab(key as typeof activeTab)}
              icon={<Icon className="w-4 h-4" />}
              iconPosition="left"
            >
              {label}
            </AppButton>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'applications' && renderApplications()}
          {activeTab === 'moderation' && renderModeration()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'system' && renderSystem()}
        </div>

        {/* Application Review Modal */}
        <Modal
          isOpen={isApplicationModalOpen}
          onClose={() => setIsApplicationModalOpen(false)}
          title={`Review Application: ${selectedApplication?.applicantName}`}
        >
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedApplication.applicantName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Specializations</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedApplication.specializations.join(', ')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Assessment</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedApplication.riskAssessment}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Experience</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedApplication.experience}</p>
              </div>

              <AppTextArea
                label="Review Notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                rows={3}
              />

              <div className="flex justify-end space-x-3">
                <AppButton
                  variant="outline"
                  onClick={() => setIsApplicationModalOpen(false)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  variant="danger"
                  onClick={() => handleApplicationAction(selectedApplication.id, 'reject', reviewNotes)}
                  icon={<X className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Reject
                </AppButton>
                <AppButton
                  variant="success"
                  onClick={() => handleApplicationAction(selectedApplication.id, 'approve', reviewNotes)}
                  icon={<Check className="w-4 h-4" />}
                  iconPosition="left"
                >
                  Approve
                </AppButton>
              </div>
            </div>
          )}
        </Modal>

        {/* Case Action Modal */}
        <Modal
          isOpen={isCaseModalOpen}
          onClose={() => setIsCaseModalOpen(false)}
          title={`Take Action: ${selectedCase?.type.replace('_', ' ').toUpperCase()}`}
        >
          {selectedCase && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedCase.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedCase.priority}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedCase.status}</p>
                </div>
              </div>

              <AppTextArea
                label="Action Taken"
                value={caseAction}
                onChange={(e) => setCaseAction(e.target.value)}
                placeholder="Describe the action you're taking..."
                rows={3}
              />

              <div className="flex justify-end space-x-3">
                <AppButton
                  variant="outline"
                  onClick={() => setIsCaseModalOpen(false)}
                >
                  Cancel
                </AppButton>
                <AppButton
                  onClick={() => handleCaseAction(selectedCase.id, caseAction)}
                  disabled={!caseAction.trim()}
                >
                  Record Action
                </AppButton>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminDashboardViewEnhanced;