/**
 * Constellation Guide Dashboard View
 * Advanced crisis management dashboard for constellation guides and crisis responders
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AlertTriangleIcon,
  UsersIcon,
  ShieldIcon,
  BookIcon,
  MessageCircleIcon,
  SettingsIcon,
  CheckIcon,
  PostsIcon,
  ClockIcon,
  PhoneIcon,
  MapPinIcon,
  TrendingUpIcon,
  BellIcon,
  EyeIcon,
  UserCheckIcon,
  AlertCircleIcon,
  CalendarIcon
} from '../components/icons.dynamic';
import { AppButton } from '../components/AppButton';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { Card } from '../components/ui/Card';
import { ViewHeader } from '../components/ViewHeader';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/LoadingStates';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export interface CrisisAlertItem {
  id: string;
  userId: string;
  username: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'self-harm' | 'suicide-ideation' | 'panic-attack' | 'crisis-escalation' | 'substance-abuse';
  timestamp: string;
  status: 'active' | 'responded' | 'escalated' | 'resolved';
  description: string;
  location?: string;
  contactInfo?: string;
  assignedGuide?: string;
  responseTime?: number;
  notes?: string;
}

export interface AssignedUser {
  id: string;
  username: string;
  email: string;
  lastContact: string;
  status: 'active' | 'at-risk' | 'stable' | 'needs-attention' | 'crisis';
  caseType: 'ongoing-support' | 'crisis-follow-up' | 'weekly-check-in' | 'escalated-case';
  nextSession?: string;
  unreadMessages: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastMoodScore?: number;
  completedAssessments: number;
}

export interface ModerationCase {
  id: string;
  type: 'inappropriate-content' | 'harassment' | 'spam' | 'crisis-content' | 'safety-concern';
  reportedBy: string;
  targetUser: string;
  content: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedModerator?: string;
  resolution?: string;
  actionTaken?: string;
}

export interface GuideStats {
  totalAssignedUsers: number;
  activeAlerts: number;
  resolvedToday: number;
  averageResponseTime: number;
  satisfactionRating: number;
  completedSessions: number;
  escalatedCases: number;
  onlineHours: number;
}

export interface SystemHealth {
  totalUsers: number;
  activeUsers: number;
  crisisAlerts: number;
  systemLoad: number;
  responseTime: number;
  uptime: number;
}

// Mock data for demonstration
const MOCK_CRISIS_ALERTS: CrisisAlertItem[] = [
  {
    id: 'alert-001',
    userId: 'user-123',
    username: 'Sarah M.',
    severity: 'critical',
    type: 'suicide-ideation',
    timestamp: '2024-01-15T10:30:00Z',
    status: 'active',
    description: 'User expressed thoughts of self-harm in chat. Immediate intervention required.',
    location: 'Seattle, WA',
    contactInfo: '+1-555-0123',
    responseTime: 0
  },
  {
    id: 'alert-002',
    userId: 'user-456',
    username: 'Michael R.',
    severity: 'high',
    type: 'panic-attack',
    timestamp: '2024-01-15T09:45:00Z',
    status: 'responded',
    description: 'Severe panic attack reported through mobile app.',
    assignedGuide: 'guide-001',
    responseTime: 3
  },
  {
    id: 'alert-003',
    userId: 'user-789',
    username: 'Jessica L.',
    severity: 'medium',
    type: 'crisis-escalation',
    timestamp: '2024-01-15T08:15:00Z',
    status: 'escalated',
    description: 'Escalating anxiety symptoms over past 24 hours.',
    assignedGuide: 'guide-002',
    responseTime: 8
  }
];

const MOCK_ASSIGNED_USERS: AssignedUser[] = [
  {
    id: 'user-001',
    username: 'Alex Johnson',
    email: 'alex.j@example.com',
    lastContact: '2024-01-15T08:00:00Z',
    status: 'stable',
    caseType: 'weekly-check-in',
    nextSession: '2024-01-18T14:00:00Z',
    unreadMessages: 2,
    riskLevel: 'low',
    lastMoodScore: 7,
    completedAssessments: 3
  },
  {
    id: 'user-002',
    username: 'Taylor Smith',
    email: 'taylor.s@example.com',
    lastContact: '2024-01-14T16:30:00Z',
    status: 'at-risk',
    caseType: 'ongoing-support',
    nextSession: '2024-01-16T10:00:00Z',
    unreadMessages: 5,
    riskLevel: 'medium',
    lastMoodScore: 4,
    completedAssessments: 1
  },
  {
    id: 'user-003',
    username: 'Jordan Davis',
    email: 'jordan.d@example.com',
    lastContact: '2024-01-15T12:00:00Z',
    status: 'needs-attention',
    caseType: 'crisis-follow-up',
    unreadMessages: 0,
    riskLevel: 'high',
    lastMoodScore: 3,
    completedAssessments: 0
  }
];

const MOCK_MODERATION_CASES: ModerationCase[] = [
  {
    id: 'mod-001',
    type: 'crisis-content',
    reportedBy: 'user-456',
    targetUser: 'user-789',
    content: 'Post containing concerning language about self-harm',
    timestamp: '2024-01-15T11:00:00Z',
    status: 'pending',
    priority: 'urgent'
  },
  {
    id: 'mod-002',
    type: 'harassment',
    reportedBy: 'user-123',
    targetUser: 'user-456',
    content: 'Inappropriate messages in peer support chat',
    timestamp: '2024-01-15T09:30:00Z',
    status: 'investigating',
    priority: 'high',
    assignedModerator: 'mod-001'
  }
];

const ConstellationGuideDashboardView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [selectedAlert, setSelectedAlert] = useState<CrisisAlertItem | null>(null);
  const [selectedUser, setSelectedUser] = useState<AssignedUser | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'resolved'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Mock stats - in real app, these would come from API
  const guideStats: GuideStats = {
    totalAssignedUsers: MOCK_ASSIGNED_USERS.length,
    activeAlerts: MOCK_CRISIS_ALERTS.filter(a => a.status === 'active').length,
    resolvedToday: 8,
    averageResponseTime: 4.2,
    satisfactionRating: 4.7,
    completedSessions: 12,
    escalatedCases: 2,
    onlineHours: 6.5
  };

  const systemHealth: SystemHealth = {
    totalUsers: 2847,
    activeUsers: 186,
    crisisAlerts: MOCK_CRISIS_ALERTS.length,
    systemLoad: 67,
    responseTime: 1.2,
    uptime: 99.8
  };

  const filteredAlerts = useMemo(() => {
    if (filterStatus === 'all') return MOCK_CRISIS_ALERTS;
    return MOCK_CRISIS_ALERTS.filter(alert => alert.status === filterStatus);
  }, [filterStatus]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return '#dc2626';
      case 'responded': return '#2563eb';
      case 'escalated': return '#ea580c';
      case 'resolved': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const getRiskLevelColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#16a34a';
      default: return '#6b7280';
    }
  };

  const handleAlertClick = useCallback((alert: CrisisAlertItem) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  }, []);

  const handleUserClick = useCallback((user: AssignedUser) => {
    setSelectedUser(user);
    setShowUserModal(true);
  }, []);

  const handleRespondToAlert = useCallback((alertId: string) => {
    // In real app, this would make API call
    showNotification('Crisis response initiated', 'success');
    setShowAlertModal(false);
  }, [showNotification]);

  const handleEscalateAlert = useCallback((alertId: string) => {
    // In real app, this would make API call
    showNotification('Alert escalated to crisis team', 'warning');
    setShowAlertModal(false);
  }, [showNotification]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    showNotification('Latest data loaded', 'info');
  }, [showNotification]);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Get display name from user object
  const displayName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user?.username 
    ? user.username
    : user?.email
    ? user.email.split('@')[0]
    : 'Guide';

  return (
    <div className="constellation-guide-dashboard">
      <ViewHeader 
        title="Constellation Guide Dashboard"
        subtitle={`Welcome back, ${displayName}. You have ${guideStats.activeAlerts} active alerts.`}
      />

      {/* Quick Stats Overview */}
      <div className="stats-overview-grid">
        <Card className="stat-card critical">
          <div className="stat-icon">
            <AlertTriangleIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={guideStats.activeAlerts} />
            </div>
            <div className="stat-label">Active Alerts</div>
          </div>
        </Card>

        <Card className="stat-card success">
          <div className="stat-icon">
            <CheckIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={guideStats.resolvedToday} />
            </div>
            <div className="stat-label">Resolved Today</div>
          </div>
        </Card>

        <Card className="stat-card info">
          <div className="stat-icon">
            <UsersIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={guideStats.totalAssignedUsers} />
            </div>
            <div className="stat-label">Assigned Users</div>
          </div>
        </Card>

        <Card className="stat-card warning">
          <div className="stat-icon">
            <ClockIcon />
          </div>
          <div className="stat-content">
            <div className="stat-value">
              <AnimatedNumber value={guideStats.averageResponseTime} decimals={1} />m
            </div>
            <div className="stat-label">Avg Response Time</div>
          </div>
        </Card>
      </div>

      {/* System Health Indicators */}
      <Card className="system-health-card">
        <div className="card-header">
          <h3>System Health</h3>
          <AppButton
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            icon={<TrendingUpIcon />}
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </AppButton>
        </div>
        <div className="health-metrics">
          <div className="health-metric">
            <span className="metric-label">System Load</span>
            <ProgressBar progress={systemHealth.systemLoad} />
            <span className="metric-value">{systemHealth.systemLoad}%</span>
          </div>
          <div className="health-metric">
            <span className="metric-label">Uptime</span>
            <ProgressBar progress={systemHealth.uptime} />
            <span className="metric-value">{systemHealth.uptime}%</span>
          </div>
          <div className="health-stats">
            <div className="health-stat">
              <span className="stat-value">{systemHealth.activeUsers}</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="health-stat">
              <span className="stat-value">{systemHealth.responseTime}s</span>
              <span className="stat-label">Response Time</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Crisis Alerts Section */}
      <Card className="crisis-alerts-card">
        <div className="card-header">
          <h3>Crisis Alerts</h3>
          <div className="alert-filters">
            {(['all', 'active', 'pending', 'resolved'] as const).map((status) => (
              <button
                key={status}
                className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                onClick={() => setFilterStatus(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="alerts-list">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-item severity-${alert.severity} status-${alert.status}`}
              onClick={() => handleAlertClick(alert)}
            >
              <div className="alert-priority">
                <div 
                  className="severity-indicator"
                  style={{ backgroundColor: getSeverityColor(alert.severity) }}
                />
                <AlertTriangleIcon />
              </div>
              
              <div className="alert-content">
                <div className="alert-header">
                  <h4>{alert.username}</h4>
                  <span className="alert-type">{alert.type.replace('-', ' ')}</span>
                  <span 
                    className="alert-status"
                    style={{ color: getStatusColor(alert.status) }}
                  >
                    {alert.status}
                  </span>
                </div>
                <p className="alert-description">{alert.description}</p>
                <div className="alert-meta">
                  <span className="alert-time">{formatTimeAgo(alert.timestamp)}</span>
                  {alert.location && (
                    <span className="alert-location">
                      <MapPinIcon />
                      {alert.location}
                    </span>
                  )}
                  {alert.responseTime !== undefined && (
                    <span className="response-time">
                      Response: {alert.responseTime}m
                    </span>
                  )}
                </div>
              </div>
              
              <div className="alert-actions">
                <AppButton
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRespondToAlert(alert.id);
                  }}
                >
                  Respond
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Assigned Users Section */}
      <Card className="assigned-users-card">
        <div className="card-header">
          <h3>Assigned Users</h3>
          <span className="user-count">{MOCK_ASSIGNED_USERS.length} users</span>
        </div>
        
        <div className="users-list">
          {MOCK_ASSIGNED_USERS.map((assignedUser) => (
            <div
              key={assignedUser.id}
              className={`user-item status-${assignedUser.status} risk-${assignedUser.riskLevel}`}
              onClick={() => handleUserClick(assignedUser)}
            >
              <div className="user-avatar">
                <UserCheckIcon />
                {assignedUser.unreadMessages > 0 && (
                  <div className="unread-badge">{assignedUser.unreadMessages}</div>
                )}
              </div>
              
              <div className="user-content">
                <div className="user-header">
                  <h4>{assignedUser.username}</h4>
                  <span 
                    className="risk-level"
                    style={{ color: getRiskLevelColor(assignedUser.riskLevel) }}
                  >
                    {assignedUser.riskLevel} risk
                  </span>
                </div>
                <p className="user-case-type">{assignedUser.caseType.replace('-', ' ')}</p>
                <div className="user-meta">
                  <span>Last contact: {formatTimeAgo(assignedUser.lastContact)}</span>
                  {assignedUser.lastMoodScore && (
                    <span>Mood: {assignedUser.lastMoodScore}/10</span>
                  )}
                  {assignedUser.nextSession && (
                    <span>Next: {new Date(assignedUser.nextSession).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              
              <div className="user-actions">
                <AppButton
                  variant="secondary"
                  size="sm"
                  icon={<MessageCircleIcon />}
                >
                  Message
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Moderation Queue */}
      <Card className="moderation-queue-card">
        <div className="card-header">
          <h3>Moderation Queue</h3>
          <span className="queue-count">{MOCK_MODERATION_CASES.length} pending</span>
        </div>
        
        <div className="moderation-list">
          {MOCK_MODERATION_CASES.map((moderationCase) => (
            <div key={moderationCase.id} className={`moderation-item priority-${moderationCase.priority}`}>
              <div className="moderation-icon">
                <EyeIcon />
              </div>
              <div className="moderation-content">
                <div className="moderation-header">
                  <span className="case-type">{moderationCase.type.replace('-', ' ')}</span>
                  <span className={`priority-badge priority-${moderationCase.priority}`}>
                    {moderationCase.priority}
                  </span>
                </div>
                <p className="moderation-description">{moderationCase.content}</p>
                <div className="moderation-meta">
                  <span>Reported by: {moderationCase.reportedBy}</span>
                  <span>{formatTimeAgo(moderationCase.timestamp)}</span>
                </div>
              </div>
              <div className="moderation-actions">
                <AppButton variant="secondary" size="sm">
                  Review
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Alert Detail Modal */}
      {showAlertModal && selectedAlert && (
        <Modal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          title="Crisis Alert Details"
          size="lg"
        >
          <div className="alert-modal-content">
            <div className="alert-summary">
              <div className="severity-header">
                <AlertTriangleIcon />
                <h3>{selectedAlert.severity.toUpperCase()} ALERT</h3>
              </div>
              <div className="alert-details">
                <div className="detail-row">
                  <span className="label">User:</span>
                  <span className="value">{selectedAlert.username}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{selectedAlert.type.replace('-', ' ')}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Time:</span>
                  <span className="value">{formatTimeAgo(selectedAlert.timestamp)}</span>
                </div>
                {selectedAlert.location && (
                  <div className="detail-row">
                    <span className="label">Location:</span>
                    <span className="value">{selectedAlert.location}</span>
                  </div>
                )}
                {selectedAlert.contactInfo && (
                  <div className="detail-row">
                    <span className="label">Contact:</span>
                    <span className="value">{selectedAlert.contactInfo}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="alert-description">
              <h4>Description</h4>
              <p>{selectedAlert.description}</p>
            </div>
            
            <div className="alert-actions-modal">
              <AppButton
                variant="danger"
                onClick={() => handleRespondToAlert(selectedAlert.id)}
                icon={<PhoneIcon />}
              >
                Respond Immediately
              </AppButton>
              <AppButton
                variant="secondary"
                onClick={() => handleEscalateAlert(selectedAlert.id)}
                icon={<AlertCircleIcon />}
              >
                Escalate to Crisis Team
              </AppButton>
              <AppButton
                variant="secondary"
                icon={<MessageCircleIcon />}
              >
                Send Message
              </AppButton>
            </div>
          </div>
        </Modal>
      )}

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <Modal
          isOpen={showUserModal}
          onClose={() => setShowUserModal(false)}
          title="User Details"
          size="lg"
        >
          <div className="user-modal-content">
            <div className="user-summary">
              <div className="user-header-modal">
                <h3>{selectedUser.username}</h3>
                <span 
                  className="risk-badge"
                  style={{ backgroundColor: getRiskLevelColor(selectedUser.riskLevel) }}
                >
                  {selectedUser.riskLevel} risk
                </span>
              </div>
              
              <div className="user-details-grid">
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">{selectedUser.status.replace('-', ' ')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Case Type:</span>
                  <span className="value">{selectedUser.caseType.replace('-', ' ')}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Last Contact:</span>
                  <span className="value">{formatTimeAgo(selectedUser.lastContact)}</span>
                </div>
                {selectedUser.lastMoodScore && (
                  <div className="detail-item">
                    <span className="label">Last Mood:</span>
                    <span className="value">{selectedUser.lastMoodScore}/10</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="label">Completed Assessments:</span>
                  <span className="value">{selectedUser.completedAssessments}</span>
                </div>
                {selectedUser.nextSession && (
                  <div className="detail-item">
                    <span className="label">Next Session:</span>
                    <span className="value">{new Date(selectedUser.nextSession).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="user-actions-modal">
              <AppButton
                variant="primary"
                icon={<MessageCircleIcon />}
              >
                Send Message
              </AppButton>
              <AppButton
                variant="secondary"
                icon={<CalendarIcon />}
              >
                Schedule Session
              </AppButton>
              <AppButton
                variant="secondary"
                icon={<BookIcon />}
              >
                View History
              </AppButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ConstellationGuideDashboardView;