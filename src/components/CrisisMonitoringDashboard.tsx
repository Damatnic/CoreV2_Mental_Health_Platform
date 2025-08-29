/**
 * 🚨 CRISIS MONITORING DASHBOARD
 * Real-time crisis monitoring and emergency response coordination center
 * 
 * CRITICAL FEATURES:
 * - Live crisis event tracking
 * - Emergency service status monitoring
 * - Risk level visualization
 * - Response team coordination
 * - Multi-user crisis management
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, Phone, MessageSquare, Activity, 
  Users, MapPin, Clock, Shield, Heart, AlertCircle,
  PhoneCall, Wifi, WifiOff, CheckCircle, XCircle
} from 'lucide-react';
import emergencyEscalationService, { 
  CrisisEvent, EscalationResponse, CrisisMonitoringData, CrisisLevel 
} from '../services/emergencyEscalationService';

interface CrisisMonitoringDashboardProps {
  userId?: string;
  isAdmin?: boolean;
}

const CrisisMonitoringDashboard: React.FC<CrisisMonitoringDashboardProps> = ({ 
  userId, 
  isAdmin = false 
}) => {
  const [activeEvents, setActiveEvents] = useState<CrisisEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CrisisEvent | null>(null);
  const [eventResponses, setEventResponses] = useState<EscalationResponse[]>([]);
  const [monitoringData, setMonitoringData] = useState<CrisisMonitoringData | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Initialize dashboard
  useEffect(() => {
    const handleCrisisDetected = (event: CrisisEvent) => {
      console.log('Crisis detected:', event);
      loadActiveEvents();
    };

    const handle988Connected = ({ event, response }: any) => {
      console.log('988 connected:', event, response);
      if (selectedEvent?.id === event.id) {
        loadEventResponses(event.id);
      }
    };

    const handleMonitoringUpdate = ({ userId: uid, data }: any) => {
      if (uid === userId || isAdmin) {
        setMonitoringData(data);
        setLastUpdate(new Date());
      }
    };

    const handleEventResolved = ({ eventId }: any) => {
      console.log('Event resolved:', eventId);
      loadActiveEvents();
    };

    // Subscribe to events
    emergencyEscalationService.on('crisis-detected', handleCrisisDetected);
    emergencyEscalationService.on('988-connected', handle988Connected);
    emergencyEscalationService.on('monitoring-update', handleMonitoringUpdate);
    emergencyEscalationService.on('event-resolved', handleEventResolved);

    // Load initial data
    loadActiveEvents();
    if (userId) {
      loadMonitoringData(userId);
    }

    // Cleanup
    return () => {
      emergencyEscalationService.off('crisis-detected', handleCrisisDetected);
      emergencyEscalationService.off('988-connected', handle988Connected);
      emergencyEscalationService.off('monitoring-update', handleMonitoringUpdate);
      emergencyEscalationService.off('event-resolved', handleEventResolved);
    };
  }, [userId, isAdmin, selectedEvent]);

  // Auto-refresh monitoring data
  useEffect(() => {
    const interval = setInterval(() => {
      loadActiveEvents();
      if (userId) {
        loadMonitoringData(userId);
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [userId]);

  const loadActiveEvents = useCallback(() => {
    const events = emergencyEscalationService.getActiveEvents();
    const filteredEvents = isAdmin ? events : events.filter(e => e.userId === userId);
    setActiveEvents(filteredEvents);
  }, [userId, isAdmin]);

  const loadEventResponses = useCallback((eventId: string) => {
    const responses = emergencyEscalationService.getEventResponses(eventId);
    setEventResponses(responses);
  }, []);

  const loadMonitoringData = useCallback((uid: string) => {
    const data = emergencyEscalationService.getMonitoringData(uid);
    if (data) {
      setMonitoringData(data);
    }
  }, []);

  const handleEventSelect = (event: CrisisEvent) => {
    setSelectedEvent(event);
    loadEventResponses(event.id);
    if (event.userId) {
      loadMonitoringData(event.userId);
    }
  };

  const handleConnect988 = async () => {
    if (!selectedEvent) return;
    await emergencyEscalationService.connect988Lifeline(selectedEvent);
    loadEventResponses(selectedEvent.id);
  };

  const handleConnectCrisisText = async () => {
    if (!selectedEvent) return;
    await emergencyEscalationService.connectCrisisTextLine(selectedEvent);
    loadEventResponses(selectedEvent.id);
  };

  const handleEscalateEmergency = async () => {
    if (!selectedEvent) return;
    if (confirm('This will contact 911 emergency services. Continue?')) {
      await emergencyEscalationService.escalateToEmergency(selectedEvent);
      loadEventResponses(selectedEvent.id);
    }
  };

  const handleDispatchMobileCrisis = async () => {
    if (!selectedEvent) return;
    await emergencyEscalationService.dispatchMobileCrisisTeam(selectedEvent);
    loadEventResponses(selectedEvent.id);
  };

  const handleResolveEvent = () => {
    if (!selectedEvent) return;
    const outcome = prompt('Enter resolution outcome:');
    if (outcome) {
      emergencyEscalationService.resolveEvent(selectedEvent.id, outcome);
      setSelectedEvent(null);
      setEventResponses([]);
      loadActiveEvents();
    }
  };

  const getLevelColor = (level: CrisisLevel): string => {
    const colors = {
      imminent: 'bg-red-600 text-white',
      severe: 'bg-red-500 text-white',
      high: 'bg-orange-500 text-white',
      moderate: 'bg-yellow-500 text-white',
      low: 'bg-blue-500 text-white'
    };
    return colors[level];
  };

  const getLevelIcon = (level: CrisisLevel) => {
    const icons = {
      imminent: <AlertTriangle className="w-5 h-5" />,
      severe: <AlertCircle className="w-5 h-5" />,
      high: <Activity className="w-5 h-5" />,
      moderate: <Shield className="w-5 h-5" />,
      low: <Heart className="w-5 h-5" />
    };
    return icons[level];
  };

  const getServiceIcon = (service: string) => {
    const icons: Record<string, JSX.Element> = {
      '988': <Phone className="w-5 h-5" />,
      'crisis-text': <MessageSquare className="w-5 h-5" />,
      '911': <AlertTriangle className="w-5 h-5" />,
      'mobile-crisis': <Users className="w-5 h-5" />,
      'hospital': <Shield className="w-5 h-5" />
    };
    return icons[service] || <Activity className="w-5 h-5" />;
  };

  const activeServicesCount = useMemo(() => {
    return eventResponses.filter(r => r.status === 'connected' || r.status === 'in-progress').length;
  }, [eventResponses]);

  return (
    <div className="crisis-monitoring-dashboard min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Crisis Monitoring Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-red-600 dark:text-red-400">Disconnected</span>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 dark:text-red-400">Active Crises</p>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {activeEvents.length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 dark:text-orange-400">Active Services</p>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                  {activeServicesCount}
                </p>
              </div>
              <Phone className="w-8 h-8 text-orange-500 opacity-50" />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400">Monitoring</p>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {monitoringData ? 'Active' : 'Inactive'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400">Response Time</p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {'< 30s'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Events List */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Active Crisis Events
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeEvents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No active crisis events
              </p>
            ) : (
              activeEvents.map(event => (
                <button
                  key={event.id}
                  onClick={() => handleEventSelect(event)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedEvent?.id === event.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(event.level)}`}>
                      {getLevelIcon(event.level)}
                      {event.level.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    User: {event.userId}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Risk Score: {(event.riskScore * 100).toFixed(0)}%
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <MapPin className="w-3 h-3" />
                      Location available
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Event Details & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <>
              {/* Event Details */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Crisis Event Details
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Event ID</p>
                    <p className="font-mono text-sm">{selectedEvent.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">User ID</p>
                    <p className="font-mono text-sm">{selectedEvent.userId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Risk Level</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(selectedEvent.level)}`}>
                      {getLevelIcon(selectedEvent.level)}
                      {selectedEvent.level.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${selectedEvent.riskScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {(selectedEvent.riskScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Detected Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.keywords.map((keyword, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emergency Actions */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Emergency Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleConnect988}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      Connect 988 Lifeline
                    </button>
                    <button
                      onClick={handleConnectCrisisText}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Crisis Text Line
                    </button>
                    <button
                      onClick={handleDispatchMobileCrisis}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      Mobile Crisis Team
                    </button>
                    <button
                      onClick={handleEscalateEmergency}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Call 911
                    </button>
                  </div>
                </div>

                {/* Resolve Event */}
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={handleResolveEvent}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Resolve Crisis Event
                  </button>
                </div>
              </div>

              {/* Active Responses */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Active Responses
                </h2>

                <div className="space-y-3">
                  {eventResponses.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                      No active responses
                    </p>
                  ) : (
                    eventResponses.map(response => (
                      <div 
                        key={response.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getServiceIcon(response.service)}
                            <span className="font-medium">
                              {response.service === '988' && '988 Lifeline'}
                              {response.service === 'crisis-text' && 'Crisis Text Line'}
                              {response.service === '911' && '911 Emergency'}
                              {response.service === 'mobile-crisis' && 'Mobile Crisis Team'}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            response.status === 'connected' || response.status === 'in-progress'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                              : response.status === 'completed'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {response.status}
                          </span>
                        </div>

                        {response.responder && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Responder: {response.responder.name} ({response.responder.role})
                          </div>
                        )}

                        <div className="space-y-1">
                          {response.interventions.map((intervention, idx) => (
                            <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1">
                              <CheckCircle className="w-3 h-3 mt-0.5 text-green-500" />
                              {intervention}
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          Started: {new Date(response.startTime).toLocaleTimeString()}
                          {response.endTime && (
                            <> • Ended: {new Date(response.endTime).toLocaleTimeString()}</>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <AlertCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Select a crisis event to view details and take action
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Monitoring Data */}
      {monitoringData && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Real-time Monitoring
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Level</p>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(monitoringData.currentLevel)}`}>
                {getLevelIcon(monitoringData.currentLevel)}
                {monitoringData.currentLevel.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Escalation Status</p>
              <p className="font-medium">{monitoringData.escalationStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monitoring Frequency</p>
              <p className="font-medium">{monitoringData.monitoringFrequency / 1000}s</p>
            </div>
          </div>

          {monitoringData.triggers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Active Triggers</p>
              <div className="flex flex-wrap gap-2">
                {monitoringData.triggers.map((trigger, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-xs"
                  >
                    {trigger.keyword} ({trigger.count}x)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CrisisMonitoringDashboard;