/**
 * Mock Crisis Stress Testing Dashboard
 * 
 * Provides mock implementation for testing crisis detection systems
 * and stress testing emergency protocols
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Activity, Users, Clock, CheckCircle, XCircle, Play, Pause, RotateCcw } from 'lucide-react';

interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number; // in seconds
  userCount: number;
  messagesPerSecond: number;
  crisisKeywords: string[];
  expectedResponse: string;
}

interface StressTestResult {
  scenarioId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'stopped';
  metrics: {
    totalMessages: number;
    crisisDetected: number;
    falsePositives: number;
    falseNegatives: number;
    responseTime: number; // average in ms
    systemLoad: number; // percentage
    errorRate: number; // percentage
  };
  incidents: TestIncident[];
}

interface TestIncident {
  id: string;
  timestamp: Date;
  type: 'crisis_detected' | 'false_positive' | 'missed_crisis' | 'system_error';
  message: string;
  responseTime?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

interface SystemMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  systemLoad: number;
  activeTests: number;
  totalIncidents: number;
}

const mockScenarios: StressTestScenario[] = [
  {
    id: 'basic_crisis',
    name: 'Basic Crisis Detection',
    description: 'Tests basic crisis keyword detection with moderate user load',
    severity: 'medium',
    duration: 60,
    userCount: 50,
    messagesPerSecond: 2,
    crisisKeywords: ['suicide', 'kill myself', 'end it all'],
    expectedResponse: 'Crisis alert triggered within 5 seconds'
  },
  {
    id: 'high_load',
    name: 'High Load Stress Test',
    description: 'Tests system performance under high message volume',
    severity: 'high',
    duration: 300,
    userCount: 500,
    messagesPerSecond: 10,
    crisisKeywords: ['hopeless', 'worthless', 'can\'t go on'],
    expectedResponse: 'System maintains <2s response time'
  },
  {
    id: 'subtle_crisis',
    name: 'Subtle Crisis Language',
    description: 'Tests detection of subtle or coded crisis language',
    severity: 'high',
    duration: 180,
    userCount: 100,
    messagesPerSecond: 3,
    crisisKeywords: ['better off without me', 'permanent solution', 'tired of trying'],
    expectedResponse: 'AI detects implicit crisis indicators'
  },
  {
    id: 'mass_crisis_event',
    name: 'Mass Crisis Event',
    description: 'Simulates multiple simultaneous crisis situations',
    severity: 'critical',
    duration: 120,
    userCount: 200,
    messagesPerSecond: 5,
    crisisKeywords: ['suicide', 'hurt myself', 'no way out', 'end the pain'],
    expectedResponse: 'All crises detected and prioritized correctly'
  }
];

export const MockCrisisStressTestingDashboard: React.FC = () => {
  const [activeTests, setActiveTests] = useState<Map<string, StressTestResult>>(new Map());
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    responseTime: 0,
    throughput: 0,
    errorRate: 0,
    systemLoad: 0,
    activeTests: 0,
    totalIncidents: 0
  });
  const [selectedScenario, setSelectedScenario] = useState<StressTestScenario | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Update system metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTests]);

  const updateSystemMetrics = useCallback(() => {
    const activeTestsArray = Array.from(activeTests.values());
    const runningTests = activeTestsArray.filter(test => test.status === 'running');
    
    // Calculate aggregate metrics
    const avgResponseTime = runningTests.length > 0
      ? runningTests.reduce((sum, test) => sum + test.metrics.responseTime, 0) / runningTests.length
      : Math.random() * 100 + 50; // Mock baseline
    
    const totalThroughput = runningTests.reduce((sum, test) => {
      const scenario = mockScenarios.find(s => s.id === test.scenarioId);
      return sum + (scenario ? scenario.messagesPerSecond * scenario.userCount : 0);
    }, 0);

    const avgErrorRate = runningTests.length > 0
      ? runningTests.reduce((sum, test) => sum + test.metrics.errorRate, 0) / runningTests.length
      : Math.random() * 2; // Mock baseline error rate

    const systemLoad = Math.min(100, totalThroughput / 10 + runningTests.length * 10);

    const totalIncidents = activeTestsArray.reduce((sum, test) => sum + test.incidents.length, 0);

    setSystemMetrics({
      responseTime: Math.round(avgResponseTime),
      throughput: totalThroughput,
      errorRate: Math.round(avgErrorRate * 100) / 100,
      systemLoad: Math.round(systemLoad),
      activeTests: runningTests.length,
      totalIncidents
    });
  }, [activeTests]);

  const startStressTest = useCallback((scenario: StressTestScenario) => {
    const testId = `${scenario.id}_${Date.now()}`;
    
    const newTest: StressTestResult = {
      scenarioId: scenario.id,
      startTime: new Date(),
      status: 'running',
      metrics: {
        totalMessages: 0,
        crisisDetected: 0,
        falsePositives: 0,
        falseNegatives: 0,
        responseTime: 0,
        systemLoad: 0,
        errorRate: 0
      },
      incidents: []
    };

    setActiveTests(prev => new Map(prev.set(testId, newTest)));
    setIsRunning(true);

    // Simulate test progression
    const testInterval = setInterval(() => {
      setActiveTests(prev => {
        const updated = new Map(prev);
        const test = updated.get(testId);
        
        if (test && test.status === 'running') {
          const elapsed = (Date.now() - test.startTime.getTime()) / 1000;
          
          if (elapsed >= scenario.duration) {
            // Test completed
            test.status = 'completed';
            test.endTime = new Date();
            clearInterval(testInterval);
            setIsRunning(false);
          } else {
            // Update test metrics
            test.metrics.totalMessages += scenario.messagesPerSecond * scenario.userCount;
            test.metrics.responseTime = 50 + Math.random() * 100; // Mock response time
            test.metrics.systemLoad = Math.min(100, elapsed * 2 + Math.random() * 20);
            test.metrics.errorRate = Math.random() * 5; // 0-5% error rate

            // Randomly generate crisis detection events
            if (Math.random() < 0.1) { // 10% chance per interval
              const incident: TestIncident = {
                id: `incident_${Date.now()}_${Math.random()}`,
                timestamp: new Date(),
                type: Math.random() > 0.8 ? 'crisis_detected' : 
                      Math.random() > 0.6 ? 'false_positive' : 'system_error',
                message: generateMockIncidentMessage(),
                responseTime: Math.random() * 5000 + 500,
                severity: scenario.severity,
                resolved: Math.random() > 0.2 // 80% resolution rate
              };
              
              test.incidents.push(incident);
              
              // Update detection metrics
              if (incident.type === 'crisis_detected') {
                test.metrics.crisisDetected++;
              } else if (incident.type === 'false_positive') {
                test.metrics.falsePositives++;
              }
            }
          }
          
          updated.set(testId, test);
        }
        
        return updated;
      });
    }, 1000);

    return testId;
  }, []);

  const stopStressTest = useCallback((testId: string) => {
    setActiveTests(prev => {
      const updated = new Map(prev);
      const test = updated.get(testId);
      
      if (test) {
        test.status = 'stopped';
        test.endTime = new Date();
      }
      
      return updated;
    });
    setIsRunning(false);
  }, []);

  const generateMockIncidentMessage = (): string => {
    const messages = [
      'Crisis keyword detected in user message: "I want to end it all"',
      'AI confidence level below threshold for potential crisis language',
      'Response time exceeded 5-second SLA for crisis alert',
      'False positive triggered by song lyrics containing crisis keywords',
      'System load spike detected during crisis processing',
      'Emergency contact notification failed - retry scheduled'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getSeverityColor = (severity: StressTestScenario['severity']) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: StressTestResult['status']) => {
    switch (status) {
      case 'running': return Activity;
      case 'completed': return CheckCircle;
      case 'failed': return XCircle;
      case 'stopped': return Pause;
      default: return Clock;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Crisis Detection Stress Testing</h1>
        <p className="text-gray-600">Test and monitor crisis detection system performance under various load conditions</p>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-gray-600">Response Time</div>
          <div className="text-2xl font-bold text-blue-600">{systemMetrics.responseTime}ms</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-gray-600">Throughput</div>
          <div className="text-2xl font-bold text-green-600">{systemMetrics.throughput}/s</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-gray-600">Error Rate</div>
          <div className="text-2xl font-bold text-red-600">{systemMetrics.errorRate}%</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-gray-600">System Load</div>
          <div className="text-2xl font-bold text-purple-600">{systemMetrics.systemLoad}%</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-gray-600">Active Tests</div>
          <div className="text-2xl font-bold text-orange-600">{systemMetrics.activeTests}</div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-sm font-medium text-gray-600">Total Incidents</div>
          <div className="text-2xl font-bold text-yellow-600">{systemMetrics.totalIncidents}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Scenarios */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Test Scenarios</h2>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {mockScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedScenario?.id === scenario.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-900">{scenario.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(scenario.severity)}`}>
                          {scenario.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span><Users className="w-3 h-3 inline mr-1" />{scenario.userCount} users</span>
                        <span><Clock className="w-3 h-3 inline mr-1" />{scenario.duration}s</span>
                        <span><Activity className="w-3 h-3 inline mr-1" />{scenario.messagesPerSecond}/s</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRunning) {
                          startStressTest(scenario);
                        }
                      }}
                      disabled={isRunning}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4 inline mr-1" />
                      Start
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Tests & Results */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Tests & Results</h2>
              <button
                onClick={() => setActiveTests(new Map())}
                className="px-3 py-1 text-gray-600 hover:text-gray-900 text-sm"
              >
                <RotateCcw className="w-4 h-4 inline mr-1" />
                Clear All
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {activeTests.size === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No active tests. Select a scenario to start testing.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(activeTests.entries()).map(([testId, test]) => {
                  const scenario = mockScenarios.find(s => s.id === test.scenarioId);
                  const StatusIcon = getStatusIcon(test.status);
                  
                  return (
                    <div key={testId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-5 h-5" />
                          <h3 className="font-medium text-gray-900">{scenario?.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            test.status === 'running' ? 'bg-green-100 text-green-800' :
                            test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            test.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {test.status}
                          </span>
                        </div>
                        
                        {test.status === 'running' && (
                          <button
                            onClick={() => stopStressTest(testId)}
                            className="px-2 py-1 text-red-600 hover:text-red-700 text-sm"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Messages:</span> {test.metrics.totalMessages}
                        </div>
                        <div>
                          <span className="text-gray-600">Crises Detected:</span> {test.metrics.crisisDetected}
                        </div>
                        <div>
                          <span className="text-gray-600">Response Time:</span> {Math.round(test.metrics.responseTime)}ms
                        </div>
                        <div>
                          <span className="text-gray-600">Incidents:</span> {test.incidents.length}
                        </div>
                      </div>
                      
                      {test.incidents.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">Recent Incidents:</div>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {test.incidents.slice(-3).map((incident) => (
                              <div key={incident.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                                <span className="font-medium">{incident.type}:</span> {incident.message}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockCrisisStressTestingDashboard;



