/**
 * Moderation View Component
 * Provides moderation tools for managing content and users
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  Clock, 
  MessageSquare,
  User,
  FileText,
  Check,
  X,
  Search,
  Filter,
  ChevronDown,
  MoreVertical,
  Eye,
  Trash2,
  UserX,
  AlertCircle
} from 'lucide-react';

// Types
interface User {
  id: string;
  username: string;
  displayName?: string;
  email?: string;
  avatar?: string;
  role: 'user' | 'helper' | 'moderator' | 'admin';
  status: 'active' | 'warned' | 'suspended' | 'banned';
  joinedAt: Date;
  lastActive?: Date;
  violations: number;
  reports: number;
}

interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetId: string;
  targetType: 'user' | 'post' | 'comment' | 'message';
  targetContent?: string;
  reason: 'spam' | 'harassment' | 'hate_speech' | 'violence' | 'self_harm' | 'misinformation' | 'other';
  description: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  moderatorId?: string;
  moderatorAction?: ModerationAction;
}

interface ModerationAction {
  decision: 'no_action' | 'warning' | 'content_removed' | 'temporary_ban' | 'permanent_ban';
  reason: string;
  duration?: number; // in hours for temporary ban
  moderator: string;
  timestamp: Date;
}

interface ModerationStats {
  pendingReports: number;
  reviewingReports: number;
  resolvedToday: number;
  averageResponseTime: number; // in minutes
  activeModActions: number;
}

// Mock notification context
const useNotifications = () => ({
  addNotification: (notification: { type: string; message: string }) => {
    console.log('Notification:', notification);
  }
});

// Mock auth context
const useAuth = () => ({
  user: {
    id: 'mod-1',
    username: 'moderator',
    role: 'moderator'
  }
});

// Mock data
const MOCK_STATS: ModerationStats = {
  pendingReports: 12,
  reviewingReports: 5,
  resolvedToday: 23,
  averageResponseTime: 45,
  activeModActions: 3
};

const MOCK_REPORTS: Report[] = [
  {
    id: 'report-1',
    reporterId: 'user-1',
    reporterName: 'John Doe',
    targetId: 'post-123',
    targetType: 'post',
    targetContent: 'Offensive content example...',
    reason: 'harassment',
    description: 'User is harassing other members',
    status: 'pending',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 3600000)
  },
  {
    id: 'report-2',
    reporterId: 'user-2',
    reporterName: 'Jane Smith',
    targetId: 'user-456',
    targetType: 'user',
    reason: 'spam',
    description: 'User is posting spam links',
    status: 'reviewing',
    priority: 'medium',
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 1800000),
    moderatorId: 'mod-1'
  }
];

const MOCK_USERS: User[] = [
  {
    id: 'user-456',
    username: 'problemuser',
    displayName: 'Problem User',
    email: 'problem@example.com',
    role: 'user',
    status: 'warned',
    joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    violations: 2,
    reports: 5
  }
];

// Moderation View Component
const ModerationView: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { user: currentUser } = useAuth();
  
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState<Report['status'] | 'all'>('pending');
  const [filterPriority, setFilterPriority] = useState<Report['priority'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [moderationAction, setModerationAction] = useState<Partial<ModerationAction>>({
    decision: 'no_action',
    reason: ''
  });

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || report.priority === filterPriority;
      const matchesSearch = searchQuery === '' || 
        report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reporterName.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [reports, filterStatus, filterPriority, searchQuery]);

  // Handle report selection
  const handleSelectReport = useCallback((report: Report) => {
    setSelectedReport(report);
    if (report.status === 'pending') {
      // Mark as reviewing
      setReports(prev => prev.map(r => 
        r.id === report.id 
          ? { ...r, status: 'reviewing' as const, moderatorId: currentUser.id }
          : r
      ));
    }
  }, [currentUser.id]);

  // Handle moderation action
  const handleModerationAction = useCallback(async () => {
    if (!selectedReport || !moderationAction.decision || !moderationAction.reason) return;
    
    setIsProcessing(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const action: ModerationAction = {
        decision: moderationAction.decision as ModerationAction['decision'],
        reason: moderationAction.reason,
        duration: moderationAction.duration,
        moderator: currentUser.username,
        timestamp: new Date()
      };
      
      // Update report
      setReports(prev => prev.map(r => 
        r.id === selectedReport.id 
          ? { 
              ...r, 
              status: 'resolved' as const, 
              moderatorAction: action,
              updatedAt: new Date()
            }
          : r
      ));
      
      addNotification({
        type: 'success',
        message: `Report resolved with action: ${action.decision}`
      });
      
      setSelectedReport(null);
      setShowActionModal(false);
      setModerationAction({ decision: 'no_action', reason: '' });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Failed to process moderation action'
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedReport, moderationAction, currentUser.username, addNotification]);

  // Get priority color
  const getPriorityColor = (priority: Report['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
    }
  };

  // Get status color
  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-600 bg-gray-50';
      case 'reviewing': return 'text-blue-600 bg-blue-50';
      case 'resolved': return 'text-green-600 bg-green-50';
      case 'dismissed': return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="moderation-view min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Moderation Dashboard</h1>
                  <p className="text-gray-600">Review and manage reported content</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/moderation/history')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending Reports</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.pendingReports}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.reviewingReports}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Resolved Today</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.resolvedToday}</p>
              </div>
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.averageResponseTime}m</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Reports List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Filters */}
              <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search reports..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as Report['status'] | 'all')}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                  
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as Report['priority'] | 'all')}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Priority</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              {/* Reports */}
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {filteredReports.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No reports found</p>
                  </div>
                ) : (
                  filteredReports.map(report => (
                    <div
                      key={report.id}
                      onClick={() => handleSelectReport(report)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedReport?.id === report.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                              {report.priority}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          <div className="mb-1">
                            <span className="font-medium text-gray-900">{report.reporterName}</span>
                            <span className="text-gray-500"> reported </span>
                            <span className="font-medium text-gray-900">{report.targetType}</span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            Reason: <span className="font-medium">{report.reason}</span>
                          </p>
                          
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {report.description}
                          </p>
                        </div>
                        
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Report Details */}
          <div className="lg:col-span-1">
            {selectedReport ? (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Report Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-600">Report ID</label>
                    <p className="font-medium">{selectedReport.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Reporter</label>
                    <p className="font-medium">{selectedReport.reporterName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Target Type</label>
                    <p className="font-medium capitalize">{selectedReport.targetType}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Reason</label>
                    <p className="font-medium capitalize">{selectedReport.reason.replace('_', ' ')}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-600">Description</label>
                    <p className="text-sm">{selectedReport.description}</p>
                  </div>
                  
                  {selectedReport.targetContent && (
                    <div>
                      <label className="text-sm text-gray-600">Content</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{selectedReport.targetContent}</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedReport.moderatorAction && (
                    <div>
                      <label className="text-sm text-gray-600">Action Taken</label>
                      <div className="mt-1 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium capitalize">
                          {selectedReport.moderatorAction.decision.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {selectedReport.moderatorAction.reason}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {selectedReport.status !== 'resolved' && (
                    <div className="pt-4 border-t space-y-3">
                      <button
                        onClick={() => setShowActionModal(true)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Take Action
                      </button>
                      
                      <button
                        onClick={() => {
                          setReports(prev => prev.map(r =>
                            r.id === selectedReport.id
                              ? { ...r, status: 'dismissed' as const }
                              : r
                          ));
                          setSelectedReport(null);
                        }}
                        className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Dismiss Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a report to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Take Moderation Action</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action
                </label>
                <select
                  value={moderationAction.decision}
                  onChange={(e) => setModerationAction(prev => ({
                    ...prev,
                    decision: e.target.value as ModerationAction['decision']
                  }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="no_action">No Action</option>
                  <option value="warning">Warning</option>
                  <option value="content_removed">Remove Content</option>
                  <option value="temporary_ban">Temporary Ban</option>
                  <option value="permanent_ban">Permanent Ban</option>
                </select>
              </div>
              
              {moderationAction.decision === 'temporary_ban' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    value={moderationAction.duration || ''}
                    onChange={(e) => setModerationAction(prev => ({
                      ...prev,
                      duration: parseInt(e.target.value)
                    }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason
                </label>
                <textarea
                  value={moderationAction.reason}
                  onChange={(e) => setModerationAction(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain your decision..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowActionModal(false);
                    setModerationAction({ decision: 'no_action', reason: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handleModerationAction}
                  disabled={isProcessing || !moderationAction.reason}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModerationView;