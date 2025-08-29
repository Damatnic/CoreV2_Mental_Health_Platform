import React, { useState, useEffect, useCallback } from 'react';
import { UserStatus } from '../types';
import { PostCard } from '../components/PostCard';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { ApiClient } from '../utils/ApiClient';
import { Card } from '../components/Card';
import { useNotification } from '../contexts/NotificationContext';

interface ReportedContent {
  id: string;
  type: 'post' | 'comment' | 'message';
  content: string;
  authorId: string;
  authorUsername: string;
  reportedBy: string;
  reportReason: string;
  reportDetails?: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  moderatorId?: string;
  moderatorAction?: string;
  moderatorNotes?: string;
}

interface ModerationAction {
  id: string;
  type: 'warning' | 'temporary_suspension' | 'permanent_ban' | 'content_removal' | 'no_action';
  reason: string;
  duration?: number; // in days for temporary actions
  notes?: string;
}

interface UserModerationHistory {
  userId: string;
  username: string;
  warningsCount: number;
  suspensionsCount: number;
  lastAction?: {
    type: string;
    date: string;
    reason: string;
  };
  accountStatus: UserStatus;
}

export const ModerationDashboardView: React.FC = () => {
  const { showNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'history'>('reports');
  const [reportedContent, setReportedContent] = useState<ReportedContent[]>([]);
  const [userHistory, setUserHistory] = useState<UserModerationHistory[]>([]);
  const [selectedContent, setSelectedContent] = useState<ReportedContent | null>(null);
  const [moderationAction, setModerationAction] = useState<ModerationAction>({
    id: '',
    type: 'no_action',
    reason: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  useEffect(() => {
    loadModerationData();
  }, []);

  const loadModerationData = async () => {
    try {
      setIsLoading(true);
      
      // Mock data for demonstration
      const mockReports: ReportedContent[] = [
        {
          id: 'report-1',
          type: 'post',
          content: 'This is inappropriate content that violates community guidelines...',
          authorId: 'user-123',
          authorUsername: 'ProblematicUser',
          reportedBy: 'user-456',
          reportReason: 'inappropriate_content',
          reportDetails: 'Contains offensive language and harassment',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 'report-2',
          type: 'comment',
          content: 'Spam comment with promotional links...',
          authorId: 'user-789',
          authorUsername: 'SpammerAccount',
          reportedBy: 'user-101',
          reportReason: 'spam',
          reportDetails: 'Multiple promotional links and irrelevant content',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        },
        {
          id: 'report-3',
          type: 'message',
          content: 'Harassment via private message...',
          authorId: 'user-111',
          authorUsername: 'HarassmentUser',
          reportedBy: 'user-222',
          reportReason: 'harassment',
          reportDetails: 'Sending threatening messages',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          status: 'reviewed',
          moderatorId: 'mod-1',
          moderatorAction: 'temporary_suspension',
          moderatorNotes: 'User suspended for 7 days due to harassment'
        }
      ];

      const mockUserHistory: UserModerationHistory[] = [
        {
          userId: 'user-123',
          username: 'ProblematicUser',
          warningsCount: 2,
          suspensionsCount: 1,
          lastAction: {
            type: 'warning',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Inappropriate language'
          },
          accountStatus: 'active'
        },
        {
          userId: 'user-789',
          username: 'SpammerAccount',
          warningsCount: 3,
          suspensionsCount: 0,
          lastAction: {
            type: 'warning',
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Spam content'
          },
          accountStatus: 'active'
        },
        {
          userId: 'user-111',
          username: 'HarassmentUser',
          warningsCount: 1,
          suspensionsCount: 1,
          lastAction: {
            type: 'temporary_suspension',
            date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            reason: 'Harassment'
          },
          accountStatus: 'suspended'
        }
      ];

      setReportedContent(mockReports);
      setUserHistory(mockUserHistory);
      
    } catch (error) {
      console.error('Error loading moderation data:', error);
      showNotification('Failed to load moderation data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModerationAction = useCallback(async (contentId: string, action: ModerationAction) => {
    try {
      setIsSubmittingAction(true);
      
      // Update the reported content status
      setReportedContent(prev => prev.map(content => 
        content.id === contentId
          ? {
              ...content,
              status: 'resolved',
              moderatorAction: action.type,
              moderatorNotes: action.notes
            }
          : content
      ));

      // Update user history if action affects user
      if (action.type !== 'no_action' && selectedContent) {
        setUserHistory(prev => {
          const existingUser = prev.find(user => user.userId === selectedContent.authorId);
          if (existingUser) {
            return prev.map(user => 
              user.userId === selectedContent.authorId
                ? {
                    ...user,
                    warningsCount: action.type === 'warning' ? user.warningsCount + 1 : user.warningsCount,
                    suspensionsCount: action.type.includes('suspension') || action.type === 'permanent_ban' 
                      ? user.suspensionsCount + 1 
                      : user.suspensionsCount,
                    lastAction: {
                      type: action.type,
                      date: new Date().toISOString(),
                      reason: action.reason
                    },
                    accountStatus: action.type === 'permanent_ban' ? 'banned' : 
                                  action.type === 'temporary_suspension' ? 'suspended' : 'active'
                  }
                : user
            );
          } else {
            return [...prev, {
              userId: selectedContent.authorId,
              username: selectedContent.authorUsername,
              warningsCount: action.type === 'warning' ? 1 : 0,
              suspensionsCount: action.type.includes('suspension') || action.type === 'permanent_ban' ? 1 : 0,
              lastAction: {
                type: action.type,
                date: new Date().toISOString(),
                reason: action.reason
              },
              accountStatus: action.type === 'permanent_ban' ? 'banned' : 
                            action.type === 'temporary_suspension' ? 'suspended' : 'active'
            }];
          }
        });
      }

      showNotification('Moderation action completed successfully', 'success');
      setSelectedContent(null);
      setModerationAction({ id: '', type: 'no_action', reason: '' });
      
    } catch (error) {
      console.error('Error applying moderation action:', error);
      showNotification('Failed to apply moderation action', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  }, [selectedContent, showNotification]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'reviewed': return '#3b82f6';
      case 'resolved': return '#10b981';
      case 'dismissed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getAccountStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'suspended': return '#f59e0b';
      case 'banned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredReports = reportedContent.filter(report =>
    report.authorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reportReason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = userHistory.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="moderation-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading moderation dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="moderation-dashboard">
      <div className="dashboard-header">
        <h1>Moderation Dashboard</h1>
        <p>Review reported content and manage community standards</p>
      </div>

      <div className="dashboard-controls">
        <div className="search-section">
          <AppInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports, users, or content..."
            className="search-input"
          />
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reported Content ({reportedContent.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          User History
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Action History
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'reports' && (
          <div className="reports-section">
            {filteredReports.length === 0 ? (
              <Card className="empty-state">
                <div className="empty-content">
                  <h3>No reports found</h3>
                  <p>No reported content matches your search criteria.</p>
                </div>
              </Card>
            ) : (
              <div className="reports-list">
                {filteredReports.map(report => (
                  <Card key={report.id} className="report-card">
                    <div className="report-header">
                      <div className="report-info">
                        <div className="report-type">{report.type.toUpperCase()}</div>
                        <div className="report-author">by {report.authorUsername}</div>
                        <div className="report-time">{formatTimeAgo(report.timestamp)}</div>
                      </div>
                      <div 
                        className="report-status"
                        style={{ backgroundColor: getStatusColor(report.status) }}
                      >
                        {report.status}
                      </div>
                    </div>

                    <div className="report-content">
                      <div className="reported-content">
                        <h4>Reported Content:</h4>
                        <p>{report.content}</p>
                      </div>

                      <div className="report-details">
                        <div className="report-reason">
                          <strong>Reason:</strong> {report.reportReason.replace('_', ' ')}
                        </div>
                        {report.reportDetails && (
                          <div className="report-description">
                            <strong>Details:</strong> {report.reportDetails}
                          </div>
                        )}
                        <div className="reported-by">
                          <strong>Reported by:</strong> {report.reportedBy}
                        </div>
                      </div>

                      {report.status === 'resolved' && report.moderatorAction && (
                        <div className="moderation-result">
                          <div className="action-taken">
                            <strong>Action Taken:</strong> {report.moderatorAction.replace('_', ' ')}
                          </div>
                          {report.moderatorNotes && (
                            <div className="moderator-notes">
                              <strong>Notes:</strong> {report.moderatorNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {report.status === 'pending' && (
                      <div className="report-actions">
                        <AppButton
                          variant="secondary"
                          onClick={() => {
                            setSelectedContent(report);
                            setModerationAction({ id: report.id, type: 'no_action', reason: '' });
                          }}
                        >
                          Review & Take Action
                        </AppButton>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="users-list">
              {filteredUsers.map(user => (
                <Card key={user.userId} className="user-card">
                  <div className="user-header">
                    <div className="user-info">
                      <div className="username">{user.username}</div>
                      <div className="user-id">ID: {user.userId}</div>
                    </div>
                    <div 
                      className="account-status"
                      style={{ backgroundColor: getAccountStatusColor(user.accountStatus) }}
                    >
                      {user.accountStatus}
                    </div>
                  </div>

                  <div className="user-stats">
                    <div className="stat-item">
                      <span className="stat-label">Warnings:</span>
                      <span className="stat-value">{user.warningsCount}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Suspensions:</span>
                      <span className="stat-value">{user.suspensionsCount}</span>
                    </div>
                  </div>

                  {user.lastAction && (
                    <div className="last-action">
                      <div className="action-type">
                        Last Action: {user.lastAction.type.replace('_', ' ')}
                      </div>
                      <div className="action-reason">
                        Reason: {user.lastAction.reason}
                      </div>
                      <div className="action-date">
                        {formatTimeAgo(user.lastAction.date)}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <Card title="Action History" className="history-card">
              <div className="history-content">
                <h3>Coming Soon</h3>
                <p>Detailed moderation action history will be available here.</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Moderation Action Modal */}
      {selectedContent && (
        <div className="moderation-modal-overlay">
          <div className="moderation-modal">
            <div className="modal-header">
              <h3>Take Moderation Action</h3>
              <button 
                className="close-button"
                onClick={() => {
                  setSelectedContent(null);
                  setModerationAction({ id: '', type: 'no_action', reason: '' });
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="content-preview">
                <h4>Reported Content:</h4>
                <p>{selectedContent.content}</p>
                <div className="report-info">
                  <strong>Author:</strong> {selectedContent.authorUsername}<br />
                  <strong>Reason:</strong> {selectedContent.reportReason}<br />
                  <strong>Details:</strong> {selectedContent.reportDetails}
                </div>
              </div>

              <div className="action-selection">
                <h4>Select Action:</h4>
                <div className="action-options">
                  <label>
                    <input
                      type="radio"
                      name="action"
                      value="no_action"
                      checked={moderationAction.type === 'no_action'}
                      onChange={(e) => setModerationAction(prev => ({ ...prev, type: e.target.value as any }))}
                    />
                    No Action Required
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action"
                      value="warning"
                      checked={moderationAction.type === 'warning'}
                      onChange={(e) => setModerationAction(prev => ({ ...prev, type: e.target.value as any }))}
                    />
                    Issue Warning
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action"
                      value="content_removal"
                      checked={moderationAction.type === 'content_removal'}
                      onChange={(e) => setModerationAction(prev => ({ ...prev, type: e.target.value as any }))}
                    />
                    Remove Content
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action"
                      value="temporary_suspension"
                      checked={moderationAction.type === 'temporary_suspension'}
                      onChange={(e) => setModerationAction(prev => ({ ...prev, type: e.target.value as any }))}
                    />
                    Temporary Suspension
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="action"
                      value="permanent_ban"
                      checked={moderationAction.type === 'permanent_ban'}
                      onChange={(e) => setModerationAction(prev => ({ ...prev, type: e.target.value as any }))}
                    />
                    Permanent Ban
                  </label>
                </div>

                {moderationAction.type === 'temporary_suspension' && (
                  <div className="duration-input">
                    <label>Duration (days):</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={moderationAction.duration || 7}
                      onChange={(e) => setModerationAction(prev => ({ 
                        ...prev, 
                        duration: parseInt(e.target.value) 
                      }))}
                    />
                  </div>
                )}

                <div className="reason-input">
                  <label>Reason:</label>
                  <textarea
                    value={moderationAction.reason}
                    onChange={(e) => setModerationAction(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Explain the reason for this action..."
                    rows={3}
                  />
                </div>

                <div className="notes-input">
                  <label>Additional Notes (optional):</label>
                  <textarea
                    value={moderationAction.notes || ''}
                    onChange={(e) => setModerationAction(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <AppButton
                variant="secondary"
                onClick={() => {
                  setSelectedContent(null);
                  setModerationAction({ id: '', type: 'no_action', reason: '' });
                }}
              >
                Cancel
              </AppButton>
              <AppButton
                onClick={() => handleModerationAction(selectedContent.id, moderationAction)}
                disabled={!moderationAction.reason && moderationAction.type !== 'no_action'}
                loading={isSubmittingAction}
              >
                Apply Action
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
