import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  AlertTriangle,
  Eye,
  UserX,
  CheckCircle,
  XCircle,
  MessageSquare,
  Flag,
  Clock,
  TrendingUp,
  Users,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  AlertCircle,
  PhoneCall,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  Pin,
  UserCheck,
  Info,
  FileText,
  Activity
} from 'lucide-react';
import { 
  forumService, 
  ForumPost, 
  ForumReport, 
  ModerationItem,
  ForumUser,
  ForumStats 
} from '../../services/forumService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import ErrorState from '../ErrorState';
import Card from '../Card';
import Modal from '../Modal';
import '../../styles/ModeratorTools.css';

interface ModeratorToolsProps {
  onCrisisEscalation?: (item: ModerationItem) => void;
}

interface ModerationStats {
  pendingItems: number;
  resolvedToday: number;
  averageResponseTime: number;
  crisisInterventions: number;
  falsePositives: number;
  accuracyRate: number;
}

const ModeratorTools: React.FC<ModeratorToolsProps> = ({ onCrisisEscalation }) => {
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState<'queue' | 'reports' | 'users' | 'analytics'>('queue');
  const [moderationQueue, setModerationQueue] = useState<ModerationItem[]>([]);
  const [reports, setReports] = useState<ForumReport[]>([]);
  const [flaggedUsers, setFlaggedUsers] = useState<ForumUser[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<ForumReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState('');

  // Real-time crisis alerts
  const [crisisAlerts, setCrisisAlerts] = useState<Array<{
    id: string;
    postId: string;
    level: 'high' | 'critical';
    timestamp: Date;
    resolved: boolean;
  }>>([]);

  // Load moderation data
  useEffect(() => {
    loadModerationData();
    
    // Set up real-time listeners
    const handleCrisisDetected = (data: any) => {
      setCrisisAlerts(prev => [...prev, {
        id: Date.now().toString(),
        postId: data.post.id,
        level: data.level,
        timestamp: new Date(),
        resolved: false
      }]);
      
      // Auto-escalate critical cases
      if (data.level === 'critical' && onCrisisEscalation) {
        onCrisisEscalation(data);
      }
    };

    forumService.on('crisis_detected', handleCrisisDetected);
    forumService.on('moderation_item_added', handleNewModerationItem);
    
    return () => {
      forumService.off('crisis_detected', handleCrisisDetected);
      forumService.off('moderation_item_added', handleNewModerationItem);
    };
  }, [filterPriority]);

  const loadModerationData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Simulate loading moderation data
      // In production, this would fetch from the API
      const mockQueue: ModerationItem[] = [
        {
          id: '1',
          type: 'post',
          targetId: 'post-1',
          reason: 'Crisis content detected: high level',
          priority: 'high',
          flags: ['crisis', 'self-harm'],
          autoDetected: true,
          detectionConfidence: 0.92,
          suggestedAction: 'escalate',
          createdAt: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
        },
        {
          id: '2',
          type: 'reply',
          targetId: 'reply-1',
          reason: 'Multiple reports received',
          priority: 'medium',
          flags: ['harassment', 'inappropriate'],
          autoDetected: false,
          detectionConfidence: 0,
          suggestedAction: 'flag',
          createdAt: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
        },
        {
          id: '3',
          type: 'post',
          targetId: 'post-2',
          reason: 'Potential spam content',
          priority: 'low',
          flags: ['spam', 'urls'],
          autoDetected: true,
          detectionConfidence: 0.65,
          suggestedAction: 'remove',
          createdAt: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        }
      ];

      const mockReports: ForumReport[] = [
        {
          id: '1',
          reporterId: 'user-1',
          targetType: 'post',
          targetId: 'post-1',
          reason: 'crisis',
          description: 'User expressing suicidal thoughts',
          status: 'pending',
          createdAt: new Date(Date.now() - 1000 * 60 * 20)
        },
        {
          id: '2',
          reporterId: 'user-2',
          targetType: 'reply',
          targetId: 'reply-2',
          reason: 'harassment',
          description: 'Bullying behavior towards another user',
          status: 'reviewing',
          createdAt: new Date(Date.now() - 1000 * 60 * 45)
        }
      ];

      const mockStats: ModerationStats = {
        pendingItems: 12,
        resolvedToday: 28,
        averageResponseTime: 15, // minutes
        crisisInterventions: 3,
        falsePositives: 2,
        accuracyRate: 94.5
      };

      // Apply filters
      let filteredQueue = mockQueue;
      if (filterPriority !== 'all') {
        filteredQueue = mockQueue.filter(item => item.priority === filterPriority);
      }

      setModerationQueue(filteredQueue);
      setReports(mockReports);
      setStats(mockStats);

    } catch (err) {
      console.error('Failed to load moderation data:', err);
      setError('Failed to load moderation data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewModerationItem = (item: ModerationItem) => {
    setModerationQueue(prev => [item, ...prev]);
    
    // Show notification for high-priority items
    if (item.priority === 'critical' || item.priority === 'high') {
      showNotification(`New ${item.priority} priority item requires attention`, 'warning');
    }
  };

  // Moderation actions
  const handleApprove = async (itemId: string) => {
    try {
      const item = moderationQueue.find(i => i.id === itemId);
      if (!item) return;

      // Approve the content
      await forumService.updatePost(item.targetId, {
        moderationStatus: 'approved',
        isFlagged: false,
        moderatedBy: user?.id,
        moderatedAt: new Date(),
        moderationNotes: actionNotes
      });

      // Remove from queue
      setModerationQueue(prev => prev.filter(i => i.id !== itemId));
      showNotification('Content approved successfully', 'success');
    } catch (err) {
      console.error('Failed to approve content:', err);
      showNotification('Failed to approve content', 'error');
    }
  };

  const handleFlag = async (itemId: string) => {
    try {
      const item = moderationQueue.find(i => i.id === itemId);
      if (!item) return;

      // Flag the content
      await forumService.updatePost(item.targetId, {
        moderationStatus: 'flagged',
        isFlagged: true,
        moderatedBy: user?.id,
        moderatedAt: new Date(),
        moderationNotes: actionNotes
      });

      // Update queue
      setModerationQueue(prev => prev.map(i => 
        i.id === itemId ? { ...i, priority: 'high' as const } : i
      ));
      showNotification('Content flagged for further review', 'warning');
    } catch (err) {
      console.error('Failed to flag content:', err);
      showNotification('Failed to flag content', 'error');
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const item = moderationQueue.find(i => i.id === itemId);
      if (!item) return;

      // Remove the content
      await forumService.deletePost(item.targetId, actionNotes);

      // Remove from queue
      setModerationQueue(prev => prev.filter(i => i.id !== itemId));
      showNotification('Content removed successfully', 'success');
    } catch (err) {
      console.error('Failed to remove content:', err);
      showNotification('Failed to remove content', 'error');
    }
  };

  const handleEscalate = async (itemId: string) => {
    try {
      const item = moderationQueue.find(i => i.id === itemId);
      if (!item) return;

      // Escalate to crisis team
      if (onCrisisEscalation) {
        onCrisisEscalation(item);
      }

      // Update status
      setModerationQueue(prev => prev.map(i => 
        i.id === itemId ? { ...i, priority: 'critical' as const } : i
      ));
      
      showNotification('Escalated to crisis intervention team', 'critical');
    } catch (err) {
      console.error('Failed to escalate:', err);
      showNotification('Failed to escalate content', 'error');
    }
  };

  const handleUserAction = async (userId: string, action: 'warn' | 'suspend' | 'ban') => {
    try {
      // Implement user moderation action
      showNotification(`User ${action} action completed`, 'success');
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      showNotification(`Failed to ${action} user`, 'error');
    }
  };

  // Helper functions
  const showNotification = (message: string, type: 'success' | 'warning' | 'error' | 'critical') => {
    // This would integrate with your notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve': return <CheckCircle size={16} />;
      case 'flag': return <Flag size={16} />;
      case 'remove': return <Trash2 size={16} />;
      case 'escalate': return <AlertTriangle size={16} />;
      default: return <Info size={16} />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading moderation tools..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadModerationData} />;
  }

  // Check permissions
  if (!user || !['moderator', 'admin'].includes(user.role || '')) {
    return (
      <div className="access-denied">
        <Shield size={48} />
        <h2>Access Denied</h2>
        <p>You don't have permission to access moderator tools.</p>
      </div>
    );
  }

  return (
    <div className="moderator-tools">
      {/* Header */}
      <div className="mod-header">
        <div className="header-content">
          <h1>
            <Shield className="header-icon" />
            Moderator Dashboard
          </h1>
          <p>Monitor and moderate community content to ensure safety</p>
        </div>

        {/* Crisis Alerts */}
        {crisisAlerts.filter(a => !a.resolved).length > 0 && (
          <div className="crisis-alerts">
            <AlertTriangle className="alert-icon" />
            <span>{crisisAlerts.filter(a => !a.resolved).length} active crisis alerts</span>
            <button className="view-alerts-btn">View All</button>
          </div>
        )}
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="mod-stats">
          <Card className="stat-card">
            <div className="stat-content">
              <Clock className="stat-icon" />
              <div>
                <span className="stat-value">{stats.pendingItems}</span>
                <span className="stat-label">Pending Items</span>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <CheckCircle className="stat-icon" />
              <div>
                <span className="stat-value">{stats.resolvedToday}</span>
                <span className="stat-label">Resolved Today</span>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <Activity className="stat-icon" />
              <div>
                <span className="stat-value">{stats.averageResponseTime}m</span>
                <span className="stat-label">Avg Response Time</span>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <AlertCircle className="stat-icon" />
              <div>
                <span className="stat-value">{stats.crisisInterventions}</span>
                <span className="stat-label">Crisis Interventions</span>
              </div>
            </div>
          </Card>
          
          <Card className="stat-card">
            <div className="stat-content">
              <BarChart3 className="stat-icon" />
              <div>
                <span className="stat-value">{stats.accuracyRate}%</span>
                <span className="stat-label">Accuracy Rate</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="mod-tabs">
        <button
          className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          <MessageSquare size={18} />
          Moderation Queue
          {moderationQueue.length > 0 && (
            <span className="badge">{moderationQueue.length}</span>
          )}
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <Flag size={18} />
          Reports
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <span className="badge">{reports.filter(r => r.status === 'pending').length}</span>
          )}
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          User Management
        </button>
        
        <button
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 size={18} />
          Analytics
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="priority-filter"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as any)}
        >
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <button className="refresh-btn" onClick={loadModerationData}>
          <Activity size={18} />
          Refresh
        </button>
      </div>

      {/* Main Content Area */}
      <div className="mod-content">
        {/* Moderation Queue Tab */}
        {activeTab === 'queue' && (
          <div className="moderation-queue">
            {moderationQueue.length > 0 ? (
              <div className="queue-list">
                {moderationQueue.map(item => (
                  <Card key={item.id} className="queue-item">
                    <div className="item-header">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(item.priority) }}
                      >
                        {item.priority.toUpperCase()}
                      </span>
                      
                      <span className="item-type">
                        {item.type === 'post' ? <MessageSquare size={16} /> : <FileText size={16} />}
                        {item.type}
                      </span>
                      
                      <span className="timestamp">
                        <Clock size={14} />
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      
                      {item.autoDetected && (
                        <span className="auto-detected">
                          Auto-detected ({Math.round(item.detectionConfidence * 100)}% confidence)
                        </span>
                      )}
                    </div>

                    <div className="item-content">
                      <p className="reason">{item.reason}</p>
                      
                      <div className="flags">
                        {item.flags.map(flag => (
                          <span key={flag} className="flag-tag">
                            <Flag size={12} />
                            {flag}
                          </span>
                        ))}
                      </div>

                      <div className="suggested-action">
                        <span>Suggested action:</span>
                        <span className={`action-badge ${item.suggestedAction}`}>
                          {getActionIcon(item.suggestedAction)}
                          {item.suggestedAction}
                        </span>
                      </div>
                    </div>

                    <div className="item-actions">
                      <button
                        className="action-btn approve"
                        onClick={() => handleApprove(item.id)}
                        title="Approve"
                      >
                        <CheckCircle size={18} />
                      </button>
                      
                      <button
                        className="action-btn flag"
                        onClick={() => handleFlag(item.id)}
                        title="Flag"
                      >
                        <Flag size={18} />
                      </button>
                      
                      <button
                        className="action-btn remove"
                        onClick={() => handleRemove(item.id)}
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                      
                      {(item.priority === 'critical' || item.priority === 'high') && (
                        <button
                          className="action-btn escalate"
                          onClick={() => handleEscalate(item.id)}
                          title="Escalate"
                        >
                          <AlertTriangle size={18} />
                        </button>
                      )}
                      
                      <button
                        className="action-btn view"
                        onClick={() => setSelectedItem(item)}
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <CheckCircle size={48} />
                <h3>Queue is Clear!</h3>
                <p>No items require moderation at this time.</p>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="reports-section">
            {reports.length > 0 ? (
              <div className="reports-list">
                {reports.map(report => (
                  <Card key={report.id} className="report-item">
                    <div className="report-header">
                      <span className={`status-badge ${report.status}`}>
                        {report.status}
                      </span>
                      
                      <span className="report-type">
                        {report.targetType}
                      </span>
                      
                      <span className="report-time">
                        {formatTimeAgo(report.createdAt)}
                      </span>
                    </div>

                    <div className="report-content">
                      <p className="report-reason">
                        <strong>Reason:</strong> {report.reason}
                      </p>
                      <p className="report-description">{report.description}</p>
                    </div>

                    <div className="report-actions">
                      <button className="action-btn">View Content</button>
                      <button className="action-btn">Review</button>
                      <button className="action-btn">Dismiss</button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Flag size={48} />
                <h3>No Reports</h3>
                <p>No user reports to review.</p>
              </div>
            )}
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="user-management">
            <div className="user-actions-bar">
              <button className="user-action-btn">
                <Search size={18} />
                Search Users
              </button>
              <button className="user-action-btn">
                <UserX size={18} />
                Banned Users
              </button>
              <button className="user-action-btn">
                <UserCheck size={18} />
                Verified Users
              </button>
            </div>

            <div className="flagged-users">
              <h3>Recently Flagged Users</h3>
              {flaggedUsers.length > 0 ? (
                <div className="users-list">
                  {/* User list would be rendered here */}
                  <p>User management interface would be displayed here</p>
                </div>
              ) : (
                <p>No flagged users at this time.</p>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <h3>Moderation Analytics</h3>
            <div className="analytics-grid">
              <Card className="analytics-card">
                <h4>Content Moderation Trends</h4>
                <p>Charts and graphs would be displayed here</p>
              </Card>
              
              <Card className="analytics-card">
                <h4>Crisis Detection Performance</h4>
                <p>Crisis detection metrics would be shown here</p>
              </Card>
              
              <Card className="analytics-card">
                <h4>Community Health Score</h4>
                <p>Overall community health metrics</p>
              </Card>
              
              <Card className="analytics-card">
                <h4>Moderator Activity</h4>
                <p>Team performance statistics</p>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Action Notes Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setActionNotes('');
        }}
        title="Add Moderation Notes"
      >
        <div className="action-modal">
          <p>Please provide notes for this moderation action:</p>
          <textarea
            className="action-notes"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            placeholder="Enter notes about this moderation decision..."
            rows={4}
          />
          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowActionModal(false)}>
              Cancel
            </button>
            <button className="btn-primary">
              Confirm Action
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModeratorTools;