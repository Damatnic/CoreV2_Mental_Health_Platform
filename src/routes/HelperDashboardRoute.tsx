import React, { useState, useEffect } from 'react';
import { Users, Calendar, MessageCircle, Award, TrendingUp, Clock, Star, Phone, Video, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppButton } from '../components/AppButton';

interface HelperStats {
  totalClients: number;
  activeClients: number;
  completedSessions: number;
  averageRating: number;
  totalReviews: number;
  responseTime: string;
  earnings: {
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
}

interface UpcomingSession {
  id: string;
  clientName: string;
  time: Date;
  duration: number;
  type: 'video' | 'phone' | 'message';
  isFirstTime: boolean;
}

interface RecentMessage {
  id: string;
  clientName: string;
  message: string;
  time: Date;
  unread: boolean;
  priority: 'normal' | 'high' | 'urgent';
}

export const HelperDashboardRoute: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<HelperStats | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      setStats({
        totalClients: 45,
        activeClients: 23,
        completedSessions: 234,
        averageRating: 4.8,
        totalReviews: 89,
        responseTime: '< 2 hours',
        earnings: {
          thisMonth: 3240,
          lastMonth: 2890,
          total: 12450
        }
      });

      setUpcomingSessions([
        {
          id: '1',
          clientName: 'Sarah M.',
          time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
          duration: 50,
          type: 'video',
          isFirstTime: false
        },
        {
          id: '2', 
          clientName: 'John D.',
          time: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          duration: 50,
          type: 'phone',
          isFirstTime: true
        },
        {
          id: '3',
          clientName: 'Maria L.',
          time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          duration: 50,
          type: 'video',
          isFirstTime: false
        }
      ]);

      setRecentMessages([
        {
          id: '1',
          clientName: 'Alex R.',
          message: 'Thank you for the session today. I feel much better about the situation.',
          time: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          unread: false,
          priority: 'normal'
        },
        {
          id: '2',
          clientName: 'Jennifer K.',
          message: 'Hi, I\'m having a difficult day and could use some guidance...',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          unread: true,
          priority: 'high'
        },
        {
          id: '3',
          clientName: 'Michael T.',
          message: 'Can we reschedule our session tomorrow to later in the day?',
          time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          unread: true,
          priority: 'normal'
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString();
    }
  };

  const getPriorityColor = (priority: RecentMessage['priority']) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSessionIcon = (type: UpcomingSession['type']) => {
    switch (type) {
      case 'video': return Video;
      case 'phone': return Phone;
      case 'message': return MessageCircle;
      default: return Video;
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
              <h1 className="text-2xl font-bold text-gray-900">Helper Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's your overview for today.</p>
            </div>
            
            <div className="flex gap-3">
              <AppButton variant="outline" onClick={() => navigate('/helper/training')}>
                View Training
              </AppButton>
              <AppButton variant="primary" onClick={() => navigate('/helper/sessions')}>
                All Sessions
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
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalClients}</p>
                <p className="text-sm text-green-600">+{stats?.activeClients} active</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completedSessions}</p>
                <p className="text-sm text-gray-500">All time</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageRating}</p>
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-sm text-gray-500">{stats?.totalReviews} reviews</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">${stats?.earnings.thisMonth}</p>
                <p className="text-sm text-green-600">
                  +${(stats?.earnings.thisMonth || 0) - (stats?.earnings.lastMonth || 0)} vs last month
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
                <AppButton
                  variant="ghost"
                  size="small"
                  onClick={() => navigate('/helper/sessions')}
                >
                  View All
                </AppButton>
              </div>
            </div>
            
            <div className="p-6">
              {upcomingSessions.length > 0 ? (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => {
                    const SessionIcon = getSessionIcon(session.type);
                    
                    return (
                      <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <SessionIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{session.clientName}</p>
                              {session.isFirstTime && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  New Client
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatDate(session.time)} at {formatTime(session.time)} • {session.duration}min
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <AppButton
                            variant="outline"
                            size="small"
                            onClick={() => navigate(`/helper/sessions/${session.id}`)}
                          >
                            View
                          </AppButton>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No upcoming sessions</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                <AppButton
                  variant="ghost"
                  size="small"
                  onClick={() => navigate('/messages')}
                >
                  View All
                </AppButton>
              </div>
            </div>
            
            <div className="p-6">
              {recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        message.unread ? 'bg-blue-50 border-l-blue-500' : 'bg-gray-50 border-l-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={`font-medium ${message.unread ? 'text-blue-900' : 'text-gray-900'}`}>
                              {message.clientName}
                            </p>
                            {message.priority !== 'normal' && (
                              <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(message.priority)}`}>
                                {message.priority}
                              </span>
                            )}
                            {message.unread && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{message.message}</p>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">
                              {formatDate(message.time)} at {formatTime(message.time)}
                            </p>
                          </div>
                        </div>
                        
                        <AppButton
                          variant="outline"
                          size="small"
                          onClick={() => navigate(`/messages/${message.id}`)}
                        >
                          Reply
                        </AppButton>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No recent messages</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/helper/availability')}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Update Availability</div>
                  <div className="text-sm text-gray-600">Manage your schedule</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/helper/profile')}
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Edit Profile</div>
                  <div className="text-sm text-gray-600">Update your information</div>
                </div>
              </div>
            </AppButton>
            
            <AppButton
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={() => navigate('/helper/resources')}
            >
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Resources</div>
                  <div className="text-sm text-gray-600">Training and support</div>
                </div>
              </div>
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelperDashboardRoute;

