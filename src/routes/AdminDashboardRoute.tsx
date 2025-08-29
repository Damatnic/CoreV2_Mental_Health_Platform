import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  Settings, 
  BarChart3, 
  Shield, 
  MessageSquare,
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Mail,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalSessions: number;
  activeSessions: number;
  crisisAlerts: number;
  pendingReports: number;
  systemHealth: number;
  serverUptime: string;
  responseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'user_signup' | 'session_started' | 'crisis_alert' | 'report_submitted' | 'system_event';
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user?: string;
  metadata?: Record<string, any>;
}

interface UserReport {
  id: string;
  reportedUser: string;
  reportedBy: string;
  reason: string;
  description: string;
  timestamp: Date;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export const AdminDashboardRoute: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [pendingReports, setPendingReports] = useState<UserReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock admin stats
      setStats({
        totalUsers: 15420,
        activeUsers: 3240,
        newUsersToday: 87,
        totalSessions: 45670,
        activeSessions: 23,
        crisisAlerts: 12,
        pendingReports: 8,
        systemHealth: 97,
        serverUptime: '99.8%',
        responseTime: 245, // milliseconds
      });

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'crisis_alert',
          description: 'Crisis alert triggered for user Sarah M.',
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          severity: 'critical',
          user: 'sarah.m@example.com',
        },
        {
          id: '2',
          type: 'report_submitted',
          description: 'Harassment report submitted against user John D.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          severity: 'high',
          user: 'anonymous',
        },
        {
          id: '3',
          type: 'user_signup',
          description: 'New user registration from Maria L.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          severity: 'low',
          user: 'maria.l@example.com',
        },
        {
          id: '4',
          type: 'session_started',
          description: 'High volume: 50+ concurrent sessions detected',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          severity: 'medium',
        },
        {
          id: '5',
          type: 'system_event',
          description: 'Database backup completed successfully',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
          severity: 'low',
        },
      ]);

      // Mock pending reports
      setPendingReports([
        {
          id: '1',
          reportedUser: 'john.doe@example.com',
          reportedBy: 'anonymous',
          reason: 'Harassment',
          description: 'User has been sending inappropriate messages during therapy sessions.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          status: 'pending',
          priority: 'high',
        },
        {
          id: '2',
          reportedUser: 'fake.helper@example.com',
          reportedBy: 'client.user@example.com',
          reason: 'Impersonation',
          description: 'This user is claiming to be a licensed therapist without proper credentials.',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          status: 'investigating',
          priority: 'urgent',
        },
        {
          id: '3',
          reportedUser: 'spam.bot@example.com',
          reportedBy: 'multiple_users',
          reason: 'Spam',
          description: 'Account is sending promotional messages to multiple users.',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          status: 'pending',
          priority: 'medium',
        },
      ]);

    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  const getSeverityColor = (severity: RecentActivity['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: UserReport['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: UserReport['status']) => {
    switch (status) {
      case 'pending': return Clock;
      case 'investigating': return Eye;
      case 'resolved': return CheckCircle;
      case 'dismissed': return XCircle;
      default: return Clock;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'crisis_alert': return AlertTriangle;
      case 'report_submitted': return MessageSquare;
      case 'user_signup': return User;
      case 'session_started': return Activity;
      case 'system_event': return Settings;
      default: return Activity;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Platform overview and management tools.</p>
            </div>
            
            <div className="flex gap-3">
              <AppButton variant="outline" onClick={() => navigate('/admin/reports')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Reports ({stats?.pendingReports})
              </AppButton>
              <AppButton variant="outline" onClick={() => navigate('/admin/settings')}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers?.toLocaleString()}</p>
                <div className="flex items-center text-sm text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +{stats?.newUsersToday} today
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeSessions}</p>
                <p className="text-sm text-gray-500">{stats?.totalSessions?.toLocaleString()} total</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Crisis Alerts</p>
                <p className="text-2xl font-bold text-red-600">{stats?.crisisAlerts}</p>
                <p className="text-sm text-red-500">Requires attention</p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className="text-2xl font-bold text-green-600">{stats?.systemHealth}%</p>
                <p className="text-sm text-gray-500">Uptime: {stats?.serverUptime}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
                <AppButton
                  variant="ghost"
                  size="small"
                  onClick={() => navigate('/admin/activity')}
                >
                  View All
                </AppButton>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getSeverityColor(activity.severity)}`}>
                        <ActivityIcon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{formatTime(activity.timestamp)}</span>
                          {activity.user && (
                            <>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600">{activity.user}</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(activity.severity)}`}>
                        {activity.severity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Reports */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Pending Reports</h2>
                <AppButton
                  variant="ghost"
                  size="small"
                  onClick={() => navigate('/admin/reports')}
                >
                  Manage All
                </AppButton>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {pendingReports.map((report) => {
                  const StatusIcon = getStatusIcon(report.status);
                  
                  return (
                    <div
                      key={report.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{report.reason}</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(report.priority)}`}>
                            {report.priority}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatTime(report.timestamp)}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {report.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <strong>Reported:</strong> {report.reportedUser}
                        </div>
                        
                        <div className="flex gap-2">
                          <AppButton
                            variant="outline"
                            size="small"
                            onClick={() => navigate(`/admin/reports/${report.id}`)}
                          >
                            Review
                          </AppButton>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {pendingReports.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No pending reports</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/users')}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">User Management</div>
                  <div className="text-sm text-gray-600">Manage user accounts</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/analytics')}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Analytics</div>
                  <div className="text-sm text-gray-600">Platform insights</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/content')}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Content Moderation</div>
                  <div className="text-sm text-gray-600">Review flagged content</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/admin/system')}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <div className="font-medium">System Settings</div>
                  <div className="text-sm text-gray-600">Configure platform</div>
                </div>
              </div>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardRoute;

