import * as React from 'react';
const { useState, useEffect, useCallback, useMemo } = React;
import { TimestampTooltip, TimestampTooltipProps, TimestampFormat, TooltipPosition } from './TimestampTooltip';
import './TimestampTooltipExample.css';

interface MentalHealthTimestamp {
  id: string;
  timestamp: Date;
  type: 'mood-check' | 'crisis-support' | 'therapy-session' | 'journal-entry' | 'medication-reminder' | 'wellness-activity';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isAnonymous?: boolean;
  crisisLevel?: 'none' | 'mild' | 'moderate' | 'severe' | 'critical';
  culturalContext?: string;
  accessibilityNeeds?: string[];
}

interface ExampleDemoState {
  selectedFormat: TimestampFormat;
  selectedPosition: TooltipPosition;
  autoUpdate: boolean;
  highContrast: boolean;
  showCrisisContext: boolean;
  realTimeUpdates: boolean;
}

interface TimestampExampleProps {
  mentalHealthContext?: boolean;
  crisisAware?: boolean;
  culturallyAdapted?: boolean;
  accessibilityOptimized?: boolean;
  therapeuticMode?: boolean;
}

/**
 * Comprehensive TimestampTooltip demonstration component for mental health platform
 * Features crisis-aware timestamps, therapeutic context, and accessibility optimization
 * Demonstrates real-world usage patterns for mental health applications
 */
export const TimestampTooltipExample: React.FC<TimestampExampleProps> = ({
  mentalHealthContext = true,
  crisisAware = true,
  culturallyAdapted = true,
  accessibilityOptimized = true,
  therapeuticMode = false
}) => {
  const [demoState, setDemoState] = useState<ExampleDemoState>({
    selectedFormat: 'relative',
    selectedPosition: 'top',
    autoUpdate: true,
    highContrast: false,
    showCrisisContext: false,
    realTimeUpdates: false
  });

  // Example time points for demonstration
  const [timePoints, setTimePoints] = useState(() => {
    const now = new Date();
    return {
      now,
      fiveMinutesAgo: new Date(now.getTime() - 5 * 60 * 1000),
      oneHourAgo: new Date(now.getTime() - 60 * 60 * 1000),
      yesterday: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      lastWeek: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      lastMonth: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    };
  });

  // Mental health specific timestamps
  const mentalHealthTimestamps: MentalHealthTimestamp[] = useMemo(() => [
    {
      id: 'mood-1',
      timestamp: timePoints.fiveMinutesAgo,
      type: 'mood-check',
      priority: 'medium',
      crisisLevel: 'none'
    },
    {
      id: 'crisis-1',
      timestamp: timePoints.oneHourAgo,
      type: 'crisis-support',
      priority: 'urgent',
      crisisLevel: 'severe',
      isAnonymous: true
    },
    {
      id: 'therapy-1',
      timestamp: timePoints.yesterday,
      type: 'therapy-session',
      priority: 'high',
      culturalContext: 'Mindfulness-based approach'
    },
    {
      id: 'journal-1',
      timestamp: timePoints.lastWeek,
      type: 'journal-entry',
      priority: 'low',
      accessibilityNeeds: ['screen-reader', 'high-contrast']
    },
    {
      id: 'med-1',
      timestamp: new Date(timePoints.now.getTime() + 2 * 60 * 60 * 1000),
      type: 'medication-reminder',
      priority: 'high',
      crisisLevel: 'none'
    },
    {
      id: 'wellness-1',
      timestamp: timePoints.lastMonth,
      type: 'wellness-activity',
      priority: 'medium',
      culturalContext: 'Group meditation session'
    }
  ], [timePoints]);

  // Update time points periodically if real-time updates are enabled
  useEffect(() => {
    if (demoState.realTimeUpdates) {
      const interval = setInterval(() => {
        setTimePoints(prev => ({
          ...prev,
          now: new Date()
        }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [demoState.realTimeUpdates]);

  // Handle demo state changes
  const handleDemoStateChange = useCallback((key: keyof ExampleDemoState, value: any) => {
    setDemoState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Get crisis-aware styling class
  const getCrisisClass = useCallback((crisisLevel?: string) => {
    if (!crisisAware || !crisisLevel || crisisLevel === 'none') return '';
    return `crisis-${crisisLevel}`;
  }, [crisisAware]);

  // Get accessibility props based on context
  const getAccessibilityProps = useCallback((context: string) => {
    if (!accessibilityOptimized) return {};
    return {
      'aria-label': `${context} timestamp`,
      'aria-live': demoState.realTimeUpdates ? 'polite' : undefined,
      'aria-atomic': true
    };
  }, [accessibilityOptimized, demoState.realTimeUpdates]);

  return (
    <div 
      className={`timestamp-tooltip-examples ${
        mentalHealthContext ? 'mental-health-context' : ''
      } ${
        demoState.highContrast ? 'high-contrast' : ''
      } ${
        therapeuticMode ? 'therapeutic-mode' : ''
      }`}
      role="main"
      aria-label="TimestampTooltip demonstration examples"
    >
      <header className="examples-header">
        <h1>TimestampTooltip Examples - Mental Health Platform</h1>
        <p className="examples-description">
          Comprehensive demonstration of crisis-aware, therapeutically-optimized timestamp components for mental health applications with accessibility and cultural competency features.
        </p>
      </header>

      <section className="demo-controls" aria-label="Demo configuration controls">
        <h2>Interactive Demo Controls</h2>
        <div className="control-grid">
          <div className="control-group">
            <label htmlFor="format-select">Format:</label>
            <select 
              id="format-select"
              value={demoState.selectedFormat}
              onChange={(e) => handleDemoStateChange('selectedFormat', e.target.value as TimestampFormat)}
              aria-describedby="format-help"
            >
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="relative">Relative</option>
            </select>
            <small id="format-help">Choose timestamp display format</small>
          </div>
          
          <div className="control-group">
            <label htmlFor="position-select">Tooltip Position:</label>
            <select 
              id="position-select"
              value={demoState.selectedPosition}
              onChange={(e) => handleDemoStateChange('selectedPosition', e.target.value as TooltipPosition)}
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={demoState.highContrast}
                onChange={(e) => handleDemoStateChange('highContrast', e.target.checked)}
              />
              High Contrast Mode
            </label>
          </div>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={demoState.showCrisisContext}
                onChange={(e) => handleDemoStateChange('showCrisisContext', e.target.checked)}
              />
              Show Crisis Context
            </label>
          </div>
          
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={demoState.realTimeUpdates}
                onChange={(e) => handleDemoStateChange('realTimeUpdates', e.target.checked)}
              />
              Real-time Updates
            </label>
          </div>
        </div>
      </section>
      
      <section className="example-section" aria-labelledby="basic-usage-heading">
        <h2 id="basic-usage-heading">Basic Timestamp Usage</h2>
        <div className="example-grid" role="group" aria-label="Basic timestamp examples">
          <div className="example-item">
            <label>Current moment:</label>
            <TimestampTooltip 
              timestamp={timePoints.now} 
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              {...getAccessibilityProps('Current moment')}
            />
          </div>
          
          <div className="example-item">
            <label>Recent activity:</label>
            <TimestampTooltip 
              timestamp={timePoints.fiveMinutesAgo} 
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              updateInterval={demoState.realTimeUpdates ? 1000 : undefined}
              {...getAccessibilityProps('Recent activity')}
            />
          </div>
          
          <div className="example-item">
            <label>One hour ago:</label>
            <TimestampTooltip 
              timestamp={timePoints.oneHourAgo} 
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              {...getAccessibilityProps('One hour ago')}
            />
          </div>
          
          <div className="example-item">
            <label>Yesterday:</label>
            <TimestampTooltip 
              timestamp={timePoints.yesterday} 
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              {...getAccessibilityProps('Yesterday')}
            />
          </div>
          
          <div className="example-item">
            <label>Last week:</label>
            <TimestampTooltip 
              timestamp={timePoints.lastWeek} 
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              {...getAccessibilityProps('Last week')}
            />
          </div>
          
          <div className="example-item">
            <label>Last month:</label>
            <TimestampTooltip 
              timestamp={timePoints.lastMonth} 
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              {...getAccessibilityProps('Last month')}
            />
          </div>
        </div>
      </section>

      <section className="example-section" aria-labelledby="format-examples-heading">
        <h2 id="format-examples-heading">Format Variations</h2>
        <div className="example-grid" role="group" aria-label="Format examples">
          <div className="example-item">
            <label>Short format:</label>
            <TimestampTooltip 
              timestamp={timePoints.yesterday} 
              format="short"
              tooltipPosition={demoState.selectedPosition}
              highContrast={demoState.highContrast}
              {...getAccessibilityProps('Short format timestamp')}
            />
          </div>
          
          <div className="example-item">
            <label>Long format:</label>
            <TimestampTooltip 
              timestamp={timePoints.yesterday} 
              format="long"
              tooltipPosition={demoState.selectedPosition}
              highContrast={demoState.highContrast}
              {...getAccessibilityProps('Long format timestamp')}
            />
          </div>
          
          <div className="example-item">
            <label>Relative format:</label>
            <TimestampTooltip 
              timestamp={timePoints.yesterday} 
              format="relative"
              tooltipPosition={demoState.selectedPosition}
              highContrast={demoState.highContrast}
              updateInterval={5000}
              {...getAccessibilityProps('Relative format timestamp')}
            />
          </div>
        </div>
      </section>

      {mentalHealthContext && (
        <section className="example-section" aria-labelledby="mental-health-heading">
          <h2 id="mental-health-heading">Mental Health Context Examples</h2>
          <div className="example-grid mental-health-grid" role="group" aria-label="Mental health specific timestamp examples">
            {mentalHealthTimestamps.map((item) => (
              <div 
                key={item.id} 
                className={`example-item mental-health-item ${item.type} ${getCrisisClass(item.crisisLevel)}`}
                data-priority={item.priority}
              >
                <label className="mental-health-label">
                  <span className="type-badge">{item.type.replace('-', ' ')}</span>
                  {item.isAnonymous && <span className="anonymous-badge">Anonymous</span>}
                  {item.crisisLevel && item.crisisLevel !== 'none' && demoState.showCrisisContext && (
                    <span className={`crisis-badge crisis-${item.crisisLevel}`}>
                      Crisis: {item.crisisLevel}
                    </span>
                  )}
                </label>
                <TimestampTooltip 
                  timestamp={item.timestamp}
                  format={demoState.selectedFormat}
                  tooltipPosition={demoState.selectedPosition}
                  highContrast={demoState.highContrast || item.crisisLevel === 'critical'}
                  className={`mental-health-timestamp ${item.priority}-priority`}
                  updateInterval={item.type === 'medication-reminder' ? 1000 : undefined}
                  {...getAccessibilityProps(`${item.type} timestamp`)}
                />
                {item.culturalContext && culturallyAdapted && (
                  <small className="cultural-context">{item.culturalContext}</small>
                )}
                {item.accessibilityNeeds && accessibilityOptimized && (
                  <div className="accessibility-indicators" role="note" aria-label="Accessibility features">
                    {item.accessibilityNeeds.map(need => (
                      <span key={need} className={`accessibility-indicator ${need}`} title={need}>
                        {need === 'screen-reader' && '👁️'}
                        {need === 'high-contrast' && '🔲'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="example-section" aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading">Accessibility Features</h2>
        <div className="example-grid" role="group" aria-label="Accessibility feature examples">
          <div className="example-item">
            <label>High Contrast:</label>
            <TimestampTooltip 
              timestamp={timePoints.now}
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              highContrast={true}
              {...getAccessibilityProps('High contrast timestamp')}
            />
          </div>
          
          <div className="example-item">
            <label>Custom CSS Class:</label>
            <TimestampTooltip 
              timestamp={timePoints.now}
              format={demoState.selectedFormat}
              tooltipPosition={demoState.selectedPosition}
              className="custom-timestamp-style"
              {...getAccessibilityProps('Custom styled timestamp')}
            />
          </div>
          
          <div className="example-item">
            <label>Auto-updating (1s):</label>
            <TimestampTooltip 
              timestamp={timePoints.fiveMinutesAgo}
              format="relative"
              tooltipPosition={demoState.selectedPosition}
              updateInterval={1000}
              aria-live="polite"
              {...getAccessibilityProps('Auto-updating timestamp')}
            />
          </div>
        </div>
      </section>

      <section className="example-section" aria-labelledby="position-examples-heading">
        <h2 id="position-examples-heading">Tooltip Positioning</h2>
        <div className="example-grid position-grid" role="group" aria-label="Tooltip position examples">
          <div className="example-item">
            <label>Top position:</label>
            <TimestampTooltip 
              timestamp={timePoints.now}
              format={demoState.selectedFormat}
              tooltipPosition="top"
              {...getAccessibilityProps('Top positioned tooltip')}
            />
          </div>
          
          <div className="example-item">
            <label>Bottom position:</label>
            <TimestampTooltip 
              timestamp={timePoints.now}
              format={demoState.selectedFormat}
              tooltipPosition="bottom"
              {...getAccessibilityProps('Bottom positioned tooltip')}
            />
          </div>
          
          <div className="example-item">
            <label>Left position:</label>
            <TimestampTooltip 
              timestamp={timePoints.now}
              format={demoState.selectedFormat}
              tooltipPosition="left"
              {...getAccessibilityProps('Left positioned tooltip')}
            />
          </div>
          
          <div className="example-item">
            <label>Right position:</label>
            <TimestampTooltip 
              timestamp={timePoints.now}
              format={demoState.selectedFormat}
              tooltipPosition="right"
              {...getAccessibilityProps('Right positioned tooltip')}
            />
          </div>
        </div>
      </section>

      {therapeuticMode && (
        <section className="example-section therapeutic-section" aria-labelledby="therapeutic-heading">
          <h2 id="therapeutic-heading">Therapeutic Context</h2>
          <div className="therapeutic-info" role="note">
            <p>
              In therapeutic mode, timestamps are displayed with additional context to support mental health professionals 
              and provide trauma-informed care. This includes:
            </p>
            <ul>
              <li>Gentle color schemes to reduce anxiety</li>
              <li>Clear temporal context for session notes</li>
              <li>Privacy-first design for sensitive information</li>
              <li>Crisis-aware visual indicators</li>
              <li>Cultural competency considerations</li>
            </ul>
          </div>
          <div className="example-grid therapeutic-grid">
            <div className="example-item therapeutic-item">
              <label>Session Start:</label>
              <TimestampTooltip 
                timestamp={new Date(timePoints.now.getTime() - 50 * 60 * 1000)}
                format="long"
                tooltipPosition={demoState.selectedPosition}
                highContrast={demoState.highContrast}
                className="session-timestamp"
                {...getAccessibilityProps('Therapy session start time')}
              />
            </div>
            
            <div className="example-item therapeutic-item">
              <label>Last Check-in:</label>
              <TimestampTooltip 
                timestamp={timePoints.yesterday}
                format="relative"
                tooltipPosition={demoState.selectedPosition}
                updateInterval={60000}
                className="checkin-timestamp"
                {...getAccessibilityProps('Last patient check-in')}
              />
            </div>
            
            <div className="example-item therapeutic-item crisis-context">
              <label>Crisis Intervention:</label>
              <TimestampTooltip 
                timestamp={timePoints.oneHourAgo}
                format="long"
                tooltipPosition={demoState.selectedPosition}
                highContrast={true}
                className="crisis-timestamp"
                aria-urgent="true"
                {...getAccessibilityProps('Crisis intervention timestamp')}
              />
            </div>
          </div>
        </section>
      )}

      <footer className="examples-footer">
        <div className="footer-content">
          <h3>Implementation Notes</h3>
          <ul>
            <li>All timestamps are fully accessible with ARIA labels and keyboard navigation</li>
            <li>Crisis-aware styling automatically applies based on context severity</li>
            <li>Cultural adaptations respect user preferences and regional formats</li>
            <li>Privacy mode ensures sensitive temporal data is appropriately anonymized</li>
            <li>Therapeutic mode provides additional context for mental health professionals</li>
          </ul>
          <div className="best-practices">
            <h4>Best Practices for Mental Health Applications:</h4>
            <ol>
              <li>Always provide clear temporal context for crisis situations</li>
              <li>Use relative timestamps for recent events to reduce cognitive load</li>
              <li>Implement high-contrast options for users with visual sensitivities</li>
              <li>Consider cultural differences in time perception and display</li>
              <li>Ensure HIPAA compliance when displaying timestamp information</li>
              <li>Provide therapeutic context when appropriate for professional use</li>
            </ol>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TimestampTooltipExample;

export type {
  MentalHealthTimestamp,
  ExampleDemoState,
  TimestampExampleProps
};