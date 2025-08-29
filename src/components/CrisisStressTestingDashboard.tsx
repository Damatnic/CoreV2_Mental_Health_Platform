import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import '../styles/CrisisStressTestingDashboard.css';

interface TestResult {
  id: string;
  testName: string;
  date: Date;
  passed: boolean;
  metrics: {
    responseTime: number;
    accuracy: number;
    completeness: number;
  };
}

const CrisisStressTestingDashboard: React.FC = () => {
  const [testResults] = useState<TestResult[]>([
    {
      id: '1',
      testName: 'Crisis Detection Accuracy',
      date: new Date('2024-02-10'),
      passed: true,
      metrics: { responseTime: 250, accuracy: 98, completeness: 100 }
    },
    {
      id: '2',
      testName: 'Emergency Response Time',
      date: new Date('2024-02-09'),
      passed: true,
      metrics: { responseTime: 180, accuracy: 100, completeness: 100 }
    }
  ]);

  const getOverallHealth = () => {
    const passRate = testResults.filter(t => t.passed).length / testResults.length;
    if (passRate >= 0.95) return { status: 'excellent', color: 'green' };
    if (passRate >= 0.8) return { status: 'good', color: 'yellow' };
    return { status: 'needs-improvement', color: 'red' };
  };

  const health = getOverallHealth();

  return (
    <div className="crisis-stress-testing-dashboard">
      <div className="dashboard-header">
        <Activity size={24} />
        <h2>Crisis System Stress Testing</h2>
      </div>

      <div className={`system-health health-${health.color}`}>
        <h3>System Health: {health.status}</h3>
        <p>Pass Rate: {(testResults.filter(t => t.passed).length / testResults.length * 100).toFixed(0)}%</p>
      </div>

      <div className="test-results">
        <h3>Recent Test Results</h3>
        {testResults.map(test => (
          <div key={test.id} className={`test-card ${test.passed ? 'passed' : 'failed'}`}>
            <div className="test-header">
              {test.passed ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              <h4>{test.testName}</h4>
            </div>
            <div className="test-metrics">
              <span>Response: {test.metrics.responseTime}ms</span>
              <span>Accuracy: {test.metrics.accuracy}%</span>
              <span>Coverage: {test.metrics.completeness}%</span>
            </div>
            <p className="test-date">{test.date.toLocaleDateString()}</p>
          </div>
        ))}
      </div>

      <div className="performance-trend">
        <TrendingUp size={20} />
        <span>Performance improving over last 30 days</span>
      </div>
    </div>
  );
};

export default CrisisStressTestingDashboard;
