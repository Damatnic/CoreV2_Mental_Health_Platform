/**
 * Mobile Performance Dashboard Component
 * 
 * Real-time visualization of mobile performance metrics for monitoring
 * and debugging the mental health platform's performance.
 * 
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { enhancedMobilePerformanceService } from '../services/mobilePerformanceEnhancedService';
import { mobileMemoryManager } from '../services/mobileMemoryManagerService';
import { mobileCrisisCacheService } from '../services/mobileCrisisCacheService';
import { performanceMonitoringService } from '../services/performanceMonitoringService';
import type { EnhancedMobileMetrics, NetworkQuality, BatteryMode } from '../services/mobilePerformanceEnhancedService';
import type { CacheStatistics } from '../services/mobileCrisisCacheService';

interface PerformanceData {
  mobile: EnhancedMobileMetrics | null;
  memory: any;
  cache: CacheStatistics | null;
  general: any;
}

const MobilePerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    mobile: null,
    memory: null,
    cache: null,
    general: null
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  
  // Fetch performance metrics
  const fetchMetrics = useCallback(() => {
    try {
      // Get mobile performance metrics
      const mobileMetrics = enhancedMobilePerformanceService.getMetrics();
      
      // Get memory report
      const memoryReport = mobileMemoryManager.getMemoryReport();
      
      // Get cache statistics
      const cacheStats = mobileCrisisCacheService.getStatistics();
      
      // Get general performance summary
      const generalPerf = performanceMonitoringService.getSummary();
      
      setPerformanceData({
        mobile: mobileMetrics,
        memory: memoryReport,
        cache: cacheStats,
        general: generalPerf
      });
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    }
  }, []);
  
  // Setup auto-refresh
  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, fetchMetrics]);
  
  // Format bytes to readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  // Format percentage
  const formatPercent = (value: number): string => {
    return Math.round(value * 100) + '%';
  };
  
  // Get status color based on value
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent':
      case 'good':
        return '#4CAF50';
      case 'fair':
      case 'moderate':
        return '#FFC107';
      case 'poor':
      case 'high':
        return '#FF9800';
      case 'critical':
      case 'offline':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };
  
  // Get battery icon based on level
  const getBatteryIcon = (level: number, charging: boolean): string => {
    if (charging) return '🔌';
    if (level < 0.1) return '🪫';
    if (level < 0.3) return '🔋';
    return '🔋';
  };
  
  // Get network icon based on quality
  const getNetworkIcon = (quality: NetworkQuality): string => {
    switch (quality) {
      case 'excellent': return '📶';
      case 'good': return '📶';
      case 'fair': return '📶';
      case 'poor': return '📵';
      case 'offline': return '📵';
      default: return '📶';
    }
  };
  
  if (!performanceData.mobile && !isExpanded) {
    return (
      <div className="performance-dashboard-minimized">
        <button 
          onClick={() => setIsExpanded(true)}
          className="performance-toggle-btn"
          aria-label="Show performance dashboard"
        >
          📊
        </button>
      </div>
    );
  }
  
  return (
    <div className={`performance-dashboard ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="dashboard-header">
        <h3>Performance Monitor</h3>
        <div className="dashboard-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <select 
            value={refreshInterval} 
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            disabled={!autoRefresh}
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
          <button onClick={fetchMetrics}>Refresh</button>
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      </div>
      
      {isExpanded && performanceData.mobile && (
        <div className="dashboard-content">
          {/* Network Status */}
          <div className="metric-section">
            <h4>Network</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="metric-label">Quality</span>
                <span 
                  className="metric-value"
                  style={{ color: getStatusColor(performanceData.mobile.network.quality) }}
                >
                  {getNetworkIcon(performanceData.mobile.network.quality as NetworkQuality)} {performanceData.mobile.network.quality}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Type</span>
                <span className="metric-value">{performanceData.mobile.network.effectiveType}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Speed</span>
                <span className="metric-value">{performanceData.mobile.network.downlink} Mbps</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Latency</span>
                <span className="metric-value">{performanceData.mobile.network.rtt} ms</span>
              </div>
            </div>
          </div>
          
          {/* Battery Status */}
          <div className="metric-section">
            <h4>Battery</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="metric-label">Level</span>
                <span className="metric-value">
                  {getBatteryIcon(performanceData.mobile.battery.level, performanceData.mobile.battery.charging)}
                  {formatPercent(performanceData.mobile.battery.level)}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Mode</span>
                <span 
                  className="metric-value"
                  style={{ color: getStatusColor(performanceData.mobile.battery.mode) }}
                >
                  {performanceData.mobile.battery.mode}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Drain Rate</span>
                <span className="metric-value">{performanceData.mobile.battery.drainRate.toFixed(2)}%/min</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Est. Time</span>
                <span className="metric-value">
                  {Math.floor(performanceData.mobile.battery.estimatedTimeRemaining / 60)}h 
                  {Math.floor(performanceData.mobile.battery.estimatedTimeRemaining % 60)}m
                </span>
              </div>
            </div>
          </div>
          
          {/* Memory Status */}
          <div className="metric-section">
            <h4>Memory</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="metric-label">Used</span>
                <span className="metric-value">{performanceData.mobile.memory.used} MB</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Pressure</span>
                <span 
                  className="metric-value"
                  style={{ color: getStatusColor(performanceData.mobile.memory.pressure) }}
                >
                  {performanceData.mobile.memory.pressure}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Leaks</span>
                <span className="metric-value">{performanceData.mobile.memory.leaks}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">GCs</span>
                <span className="metric-value">{performanceData.mobile.memory.garbageCollections}</span>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="metric-section">
            <h4>Performance</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="metric-label">FPS</span>
                <span 
                  className="metric-value"
                  style={{ color: performanceData.mobile.performance.fps >= 30 ? '#4CAF50' : '#F44336' }}
                >
                  {performanceData.mobile.performance.fps}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Jank</span>
                <span className="metric-value">{performanceData.mobile.performance.jank}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Long Tasks</span>
                <span className="metric-value">{performanceData.mobile.performance.longTasks}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Interaction</span>
                <span className="metric-value">{performanceData.mobile.performance.interactionLatency} ms</span>
              </div>
            </div>
          </div>
          
          {/* Crisis Features Status */}
          <div className="metric-section">
            <h4>Crisis Features</h4>
            <div className="metric-grid">
              <div className="metric-item">
                <span className="metric-label">Response Time</span>
                <span 
                  className="metric-value"
                  style={{ color: performanceData.mobile.crisis.buttonResponseTime <= 100 ? '#4CAF50' : '#F44336' }}
                >
                  {performanceData.mobile.crisis.buttonResponseTime} ms
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Cached</span>
                <span className="metric-value">
                  {performanceData.mobile.crisis.resourcesCached ? '✅' : '❌'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Offline Ready</span>
                <span className="metric-value">
                  {performanceData.mobile.crisis.offlineReady ? '✅' : '❌'}
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Emergency Contacts</span>
                <span className="metric-value">
                  {performanceData.mobile.crisis.emergencyContactsLoaded ? '✅' : '❌'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Cache Statistics */}
          {performanceData.cache && (
            <div className="metric-section">
              <h4>Cache</h4>
              <div className="metric-grid">
                <div className="metric-item">
                  <span className="metric-label">Size</span>
                  <span className="metric-value">{formatBytes(performanceData.cache.totalSize)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Items</span>
                  <span className="metric-value">{performanceData.cache.itemCount}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Hit Rate</span>
                  <span className="metric-value">{formatPercent(performanceData.cache.hitRate)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Critical Cached</span>
                  <span className="metric-value">{performanceData.cache.criticalResourcesCached}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Memory Details */}
          {performanceData.memory && (
            <div className="metric-section">
              <h4>Memory Details</h4>
              <div className="component-memory-list">
                {performanceData.memory.components?.map((comp: any) => (
                  <div key={comp.name} className="component-memory-item">
                    <span className="component-name">{comp.name}</span>
                    <span className="component-memory">{comp.memory} MB</span>
                    {comp.leakDetected && <span className="leak-warning">⚠️ Leak</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .performance-dashboard {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          font-family: 'SF Mono', Monaco, monospace;
          font-size: 12px;
          max-width: 90vw;
          max-height: 80vh;
          overflow: auto;
        }
        
        .performance-dashboard.expanded {
          width: 600px;
        }
        
        .performance-dashboard.collapsed {
          width: auto;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          background: #f5f5f5;
        }
        
        .dashboard-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
        
        .dashboard-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .dashboard-controls label {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .dashboard-controls select,
        .dashboard-controls button {
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
        }
        
        .dashboard-controls button:hover {
          background: #f0f0f0;
        }
        
        .dashboard-content {
          padding: 12px;
        }
        
        .metric-section {
          margin-bottom: 16px;
        }
        
        .metric-section h4 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
        }
        
        .metric-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 8px;
        }
        
        .metric-item {
          display: flex;
          flex-direction: column;
          padding: 8px;
          background: #f9f9f9;
          border-radius: 4px;
        }
        
        .metric-label {
          font-size: 10px;
          color: #999;
          margin-bottom: 2px;
        }
        
        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        
        .component-memory-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .component-memory-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          background: #f9f9f9;
          border-radius: 4px;
          align-items: center;
        }
        
        .component-name {
          flex: 1;
          font-size: 11px;
        }
        
        .component-memory {
          font-size: 11px;
          color: #666;
        }
        
        .leak-warning {
          margin-left: 8px;
          color: #FF9800;
        }
        
        .performance-dashboard-minimized {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
        }
        
        .performance-toggle-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: white;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .performance-toggle-btn:hover {
          background: #f5f5f5;
        }
        
        @media (prefers-color-scheme: dark) {
          .performance-dashboard {
            background: #1e1e1e;
            border-color: #333;
            color: #e0e0e0;
          }
          
          .dashboard-header {
            background: #2a2a2a;
            border-color: #333;
          }
          
          .dashboard-controls select,
          .dashboard-controls button {
            background: #2a2a2a;
            border-color: #444;
            color: #e0e0e0;
          }
          
          .metric-item {
            background: #2a2a2a;
          }
          
          .metric-value {
            color: #e0e0e0;
          }
          
          .component-memory-item {
            background: #2a2a2a;
          }
          
          .performance-toggle-btn {
            background: #2a2a2a;
            border-color: #444;
          }
        }
      `}</style>
    </div>
  );
};

export default MobilePerformanceDashboard;