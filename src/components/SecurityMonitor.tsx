/**
 * Security Monitoring Dashboard Component
 * Real-time security monitoring and incident response for mental health platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, Lock, Key, Eye, Activity, AlertCircle, CheckCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface SecurityMetrics {
  failedLoginAttempts: number;
  activeThreats: number;
  encryptionStatus: 'active' | 'partial' | 'inactive';
  lastSecurityScan: Date;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  compliance: {
    hipaa: boolean;
    gdpr: boolean;
    encryption: boolean;
    audit: boolean;
  };
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: 'login_failure' | 'unauthorized_access' | 'data_breach_attempt' | 'session_hijack' | 'brute_force';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  details: string;
  resolved: boolean;
}

interface ActiveSession {
  id: string;
  userId: string;
  ipAddress: string;
  location: string;
  startTime: Date;
  lastActivity: Date;
  suspicious: boolean;
}

// ============================================================================
// SECURITY MONITOR COMPONENT
// ============================================================================

export const SecurityMonitor: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = true }) => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    failedLoginAttempts: 0,
    activeThreats: 0,
    encryptionStatus: 'active',
    lastSecurityScan: new Date(),
    vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 },
    compliance: { hipaa: true, gdpr: true, encryption: true, audit: true }
  });

  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'events' | 'sessions' | 'compliance'>('overview');

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        failedLoginAttempts: Math.max(0, prev.failedLoginAttempts + Math.floor(Math.random() * 3) - 1),
        lastSecurityScan: new Date()
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Run security scan
  const runSecurityScan = useCallback(async () => {
    setIsScanning(true);
    
    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setMetrics(prev => ({
      ...prev,
      lastSecurityScan: new Date(),
      vulnerabilities: {
        critical: 0,
        high: Math.floor(Math.random() * 2),
        medium: Math.floor(Math.random() * 5),
        low: Math.floor(Math.random() * 10)
      }
    }));
    
    setIsScanning(false);
  }, []);

  // Resolve security event
  const resolveEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId ? { ...event, resolved: true } : event
    ));
  }, []);

  // Terminate suspicious session
  const terminateSession = useCallback((sessionId: string) => {
    setActiveSessions(prev => prev.filter(session => session.id !== sessionId));
  }, []);

  // Get threat level color
  const getThreatLevelColor = (level: number) => {
    if (level === 0) return 'text-green-600';
    if (level < 5) return 'text-yellow-600';
    if (level < 10) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Security Monitor</h1>
                <p className="text-gray-600">Real-time security monitoring and threat detection</p>
              </div>
            </div>
            <button
              onClick={runSecurityScan}
              disabled={isScanning}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isScanning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>Run Security Scan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {['overview', 'events', 'sessions', 'compliance'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab as any)}
                  className={`py-2 px-6 border-b-2 font-medium text-sm capitalize ${
                    selectedTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Failed Login Attempts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Lock className="w-5 h-5 text-gray-400" />
                <span className={`text-2xl font-bold ${getThreatLevelColor(metrics.failedLoginAttempts)}`}>
                  {metrics.failedLoginAttempts}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Failed Login Attempts</h3>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>

            {/* Active Threats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-5 h-5 text-gray-400" />
                <span className={`text-2xl font-bold ${getThreatLevelColor(metrics.activeThreats)}`}>
                  {metrics.activeThreats}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Active Threats</h3>
              <p className="text-xs text-gray-500 mt-1">Requires attention</p>
            </div>

            {/* Encryption Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Key className="w-5 h-5 text-gray-400" />
                <span className={`text-sm font-bold ${
                  metrics.encryptionStatus === 'active' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {metrics.encryptionStatus.toUpperCase()}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Encryption Status</h3>
              <p className="text-xs text-gray-500 mt-1">All data protected</p>
            </div>

            {/* Last Security Scan */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {new Date(metrics.lastSecurityScan).toLocaleTimeString()}
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600">Last Security Scan</h3>
              <p className="text-xs text-gray-500 mt-1">Automated scanning active</p>
            </div>
          </div>
        )}

        {/* Security Events Tab */}
        {selectedTab === 'events' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Security Events</h2>
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No security events detected</p>
                  </div>
                ) : (
                  events.map((event) => (
                    <div key={event.id} className="border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <AlertCircle className={`w-5 h-5 mt-0.5 ${
                          event.resolved ? 'text-gray-400' : 'text-red-500'
                        }`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{event.type.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className={`px-2 py-1 text-xs rounded ${getSeverityBadge(event.severity)}`}>
                              {event.severity}
                            </span>
                            {event.resolved && (
                              <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                                Resolved
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{event.details}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(event.timestamp).toLocaleString()} - Source: {event.source}
                          </p>
                        </div>
                      </div>
                      {!event.resolved && (
                        <button
                          onClick={() => resolveEvent(event.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Active Sessions Tab */}
        {selectedTab === 'sessions' && (
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeSessions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          No active sessions
                        </td>
                      </tr>
                    ) : (
                      activeSessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {session.userId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.ipAddress}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {session.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {Math.floor((Date.now() - session.startTime.getTime()) / 60000)} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {session.suspicious ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Suspicious
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => terminateSession(session.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Terminate
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Compliance Tab */}
        {selectedTab === 'compliance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Compliance Status</h2>
              <div className="space-y-3">
                {Object.entries(metrics.compliance).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 uppercase">{key}</span>
                    {value ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold mb-4">Vulnerability Summary</h2>
              <div className="space-y-3">
                {Object.entries(metrics.vulnerabilities).map(([level, count]) => (
                  <div key={level} className="flex items-center justify-between">
                    <span className={`text-sm font-medium capitalize ${getSeverityBadge(level)}`}>
                      {level}
                    </span>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecurityMonitor;