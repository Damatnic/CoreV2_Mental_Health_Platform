import React, { useState } from 'react';
import { demoDataService } from '../services/demoDataService';
import './workflow-demo.css';

interface WorkflowStep {
  step: number;
  role: 'user' | 'ai' | 'helper' | 'admin';
  title: string;
  timestamp: string;
  content: string;
  actions?: string[];
  outcome?: string;
}

const WorkflowDemoView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'crisis' | 'boundary' | 'content' | 'success' | 'suicide' | 'domestic-violence' | 'substance-abuse' | 'wellness-challenge' | 'support-group' | 'peer-connection'>('crisis');
  const [selectedRole, setSelectedRole] = useState<'user' | 'helper' | 'admin'>('user');

  const workflowData = demoDataService.getDemoData('admin').workflowExample;
  const crisisScenarios = demoDataService.getDemoData('admin').crisisManagement;

  const getWorkflowSteps = (scenario: string): WorkflowStep[] => {
    switch (scenario) {
      case 'crisis':
        return [
          {
            step: 1,
            role: 'user',
            title: 'User Posts Vulnerable Content',
            timestamp: workflowData.incidentOverview.timestamp,
            content: workflowData.incidentOverview.content,
            outcome: 'AI concern detection triggered'
          },
          {
            step: 2,
            role: 'ai',
            title: 'AI Detection & Risk Assessment',
            timestamp: workflowData.aiSystem.detectionTime,
            content: `Risk Level: ${workflowData.aiSystem.riskLevel} | Confidence: ${workflowData.aiSystem.confidenceScore}`,
            actions: workflowData.aiSystem.automatedActions,
            outcome: 'Crisis specialist automatically assigned'
          },
          {
            step: 3,
            role: 'helper',
            title: 'Helper Crisis Intervention',
            timestamp: workflowData.helperResponse.responseTime,
            content: workflowData.helperResponse.initialResponse,
            actions: workflowData.helperResponse.interventionActions,
            outcome: workflowData.helperResponse.outcomeAssessment
          },
          {
            step: 4,
            role: 'admin',
            title: 'Admin Quality Review',
            timestamp: workflowData.myReview.reviewTime,
            content: `Quality Score: ${workflowData.myReview.qualityScore}/10`,
            actions: workflowData.myReview.adminActions,
            outcome: workflowData.myReview.escalationDecision
          }
        ];

      case 'suicide': {
        const suicideScenario = crisisScenarios.suicideCrisisOversight;
        return [
          {
            step: 1,
            role: 'user',
            title: 'Critical Suicide Risk Post',
            timestamp: suicideScenario.incident.timestamp,
            content: suicideScenario.incident.content,
            outcome: 'Critical crisis detected with 98% confidence'
          },
          {
            step: 2,
            role: 'ai',
            title: 'Emergency AI Detection',
            timestamp: suicideScenario.aiSystem.detectionTime,
            content: `${suicideScenario.aiSystem.algorithm} - Confidence: ${suicideScenario.aiSystem.confidenceScore}`,
            actions: suicideScenario.aiSystem.automatedActions,
            outcome: 'All crisis specialists alerted immediately'
          },
          {
            step: 3,
            role: 'helper',
            title: 'Crisis Specialist Emergency Response',
            timestamp: suicideScenario.helperResponse.responseTime,
            content: `${suicideScenario.helperResponse.responderName} - ${suicideScenario.helperResponse.urgencyProtocol}`,
            actions: suicideScenario.helperResponse.immediateActions,
            outcome: suicideScenario.helperResponse.riskMitigation
          },
          {
            step: 4,
            role: 'admin',
            title: 'Admin Emergency Escalation',
            timestamp: suicideScenario.myEscalation.escalationTime,
            content: `${suicideScenario.myEscalation.adminName} - ${suicideScenario.myEscalation.escalationReason}`,
            actions: suicideScenario.myEscalation.emergencyProtocols,
            outcome: `Crisis stabilized in ${suicideScenario.systemMetrics.timeToStabilization}`
          }
        ];
      }

      case 'domestic-violence': {
        const dvScenario = crisisScenarios.domesticViolenceCrisisOversight;
        return [
          {
            step: 1,
            role: 'user',
            title: 'Domestic Violence Emergency',
            timestamp: dvScenario.incident.timestamp,
            content: dvScenario.incident.content,
            outcome: 'Safety crisis detected with children at risk'
          },
          {
            step: 2,
            role: 'ai',
            title: 'DV Specialist Auto-Assignment',
            timestamp: dvScenario.aiSystem.detectionTime,
            content: `${dvScenario.aiSystem.algorithm} - Confidence: ${dvScenario.aiSystem.confidenceScore}`,
            actions: dvScenario.aiSystem.automatedActions,
            outcome: 'Domestic violence specialist immediately notified'
          },
          {
            step: 3,
            role: 'helper',
            title: 'DV Specialist Safety Planning',
            timestamp: dvScenario.helperResponse.responseTime,
            content: `${dvScenario.helperResponse.responderName} - ${dvScenario.helperResponse.urgencyProtocol}`,
            actions: dvScenario.helperResponse.safetyActions,
            outcome: 'Emergency safety plan activated'
          },
          {
            step: 4,
            role: 'admin',
            title: 'Admin Emergency Coordination',
            timestamp: dvScenario.myEscalation.escalationTime,
            content: `${dvScenario.myEscalation.adminName} - ${dvScenario.myEscalation.escalationReason}`,
            actions: dvScenario.myEscalation.emergencyProtocols,
            outcome: `Safety plan implemented in ${dvScenario.systemMetrics.timeToSafetyPlan}`
          }
        ];
      }

      case 'substance-abuse': {
        const substanceScenario = crisisScenarios.medicalEmergencyCrisisOversight;
        return [
          {
            step: 1,
            role: 'user',
            title: 'Overdose Medical Emergency',
            timestamp: substanceScenario.incident.timestamp,
            content: substanceScenario.incident.content,
            outcome: 'Medical emergency detected with overdose symptoms'
          },
          {
            step: 2,
            role: 'ai',
            title: 'Medical Emergency Detection',
            timestamp: substanceScenario.aiSystem.detectionTime,
            content: `${substanceScenario.aiSystem.algorithm} - Confidence: ${substanceScenario.aiSystem.confidenceScore}`,
            actions: substanceScenario.aiSystem.automatedActions,
            outcome: 'Medical emergency specialist alerted'
          },
          {
            step: 3,
            role: 'helper',
            title: 'Emergency Medical Guidance',
            timestamp: substanceScenario.helperResponse.responseTime,
            content: `${substanceScenario.helperResponse.responderName} - ${substanceScenario.helperResponse.urgencyProtocol}`,
            actions: substanceScenario.helperResponse.emergencyActions,
            outcome: 'Emergency services coordination activated'
          },
          {
            step: 4,
            role: 'admin',
            title: 'Admin Medical Crisis Management',
            timestamp: substanceScenario.myEscalation.escalationTime,
            content: `${substanceScenario.myEscalation.adminName} - ${substanceScenario.myEscalation.escalationReason}`,
            actions: substanceScenario.myEscalation.emergencyProtocols,
            outcome: `Emergency services contacted in ${substanceScenario.systemMetrics.timeToEmergencyServices}`
          }
        ];
      }

      case 'wellness-challenge':
        return [
          {
            step: 1,
            role: 'user',
            title: 'User Joins Wellness Challenge',
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'Joined the "30-Day Mindful Moments" challenge to help manage my anxiety. Ready to start this journey!',
            outcome: 'Enrolled in mindfulness challenge with 12-day streak'
          },
          {
            step: 2,
            role: 'ai',
            title: 'Personalized Progress Tracking',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            content: 'Progress analyzed: 12/30 days completed, current streak maintained, engagement level: high',
            actions: ['Daily reminder sent', 'Peer encouragement matched', 'Progress milestone celebrated'],
            outcome: 'Continued engagement supported with peer connections'
          },
          {
            step: 3,
            role: 'helper',
            title: 'Mindfulness Coach Check-in',
            timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            content: 'Luna Martinez: "Amazing progress on your mindfulness journey! Your consistent practice shows real commitment to your well-being."',
            actions: ['Weekly progress celebration', 'Advanced technique suggestion', 'Community encouragement'],
            outcome: 'Motivation reinforced, advanced practices introduced'
          },
          {
            step: 4,
            role: 'admin',
            title: 'Community Wellness Analytics',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            content: 'Wellness challenge metrics: 85% completion rate, 92% user satisfaction, positive mental health outcomes tracked',
            actions: ['Challenge effectiveness validated', 'User feedback analyzed', 'Future challenges planned'],
            outcome: 'Successful community wellness program validated'
          }
        ];

      case 'support-group':
        return [
          {
            step: 1,
            role: 'user',
            title: 'User Joins Support Group',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'Joining the "Managing Anxiety in Daily Life" support group. Looking forward to connecting with others who understand.',
            outcome: 'Successfully joined anxiety support community'
          },
          {
            step: 2,
            role: 'ai',
            title: 'Smart Group Matching',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'User profile matched with compatible support group members based on anxiety triggers and coping preferences',
            actions: ['Peer compatibility analysis', 'Safe space protocols activated', 'Interaction guidelines shared'],
            outcome: 'Optimal peer support environment established'
          },
          {
            step: 3,
            role: 'helper',
            title: 'Group Facilitator Guidance',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            content: 'Dr. Jennifer Walsh: "Welcome to our supportive community! Sharing the 4-7-8 breathing technique has helped many members find calm."',
            actions: ['Weekly group facilitation', 'Therapeutic technique sharing', 'Member support encouragement'],
            outcome: 'Therapeutic support provided within peer community'
          },
          {
            step: 4,
            role: 'admin',
            title: 'Community Health Monitoring',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            content: 'Support group health metrics: High engagement, positive peer interactions, 88% report reduced anxiety symptoms',
            actions: ['Group dynamics analyzed', 'Mental health outcomes tracked', 'Facilitator support provided'],
            outcome: 'Healthy support community with measurable mental health benefits'
          }
        ];

      case 'peer-connection':
        return [
          {
            step: 1,
            role: 'user',
            title: 'User Seeks Accountability Partner',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'Looking for an accountability buddy to help with daily meditation and journaling goals. Want someone who understands anxiety recovery.',
            outcome: 'Requested peer connection for mutual support'
          },
          {
            step: 2,
            role: 'ai',
            title: 'Intelligent Peer Matching',
            timestamp: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'Matched with MindfulMate based on: similar anxiety management goals, compatible time zones, shared mindfulness interests',
            actions: ['Compatibility analysis completed', 'Initial connection facilitated', 'Shared goals established'],
            outcome: 'Optimal peer accountability partnership formed'
          },
          {
            step: 3,
            role: 'helper',
            title: 'Peer Connection Support',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            content: 'Connection Guide: "14 days of consistent mutual support! Your partnership shows the power of shared accountability."',
            actions: ['Partnership progress celebrated', 'Goal achievement recognized', 'Relationship health monitored'],
            outcome: 'Successful peer support relationship maintained'
          },
          {
            step: 4,
            role: 'admin',
            title: 'Peer Network Analysis',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            content: 'Peer connection metrics: 28 mutual interactions, 100% goal check-in rate, positive mental health impact documented',
            actions: ['Partnership effectiveness measured', 'User satisfaction validated', 'Platform connection algorithms refined'],
            outcome: 'Evidence-based peer support system demonstrating positive outcomes'
          }
        ];

      case 'boundary':
        return [
          {
            step: 1,
            role: 'user',
            title: 'User Reports Boundary Violation',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            content: 'Helper shared their personal phone number and suggested meeting in person outside the platform. This made me very uncomfortable.',
            outcome: 'Investigation initiated'
          },
          {
            step: 2,
            role: 'helper',
            title: 'Helper Account Suspended',
            timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
            content: 'I thought I was being helpful by offering more personal support. I didn\'t realize this violated platform guidelines.',
            actions: ['Account temporarily suspended', 'Mandatory retraining scheduled'],
            outcome: 'Remedial action required'
          },
          {
            step: 3,
            role: 'admin',
            title: 'Admin Investigation & Resolution',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            content: 'Clear boundary violation confirmed. No malicious intent detected.',
            actions: [
              'Helper temporarily suspended',
              'Mandatory retraining scheduled',
              'User provided additional support',
              'Platform guidelines clarified'
            ],
            outcome: 'violation_confirmed_training_required'
          }
        ];

      default:
        return [];
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return '👤';
      case 'ai': return '🤖';
      case 'helper': return '✨';
      case 'admin': return '🛡️';
      default: return '•';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'user': return 'var(--color-primary)';
      case 'ai': return 'var(--color-secondary)';
      case 'helper': return 'var(--color-accent)';
      case 'admin': return 'var(--color-warning)';
      default: return 'var(--color-text)';
    }
  };

  const steps = getWorkflowSteps(selectedScenario);

  return (
    <div className="workflow-demo">
      <div className="workflow-header">
        <h1>Platform Workflow Demonstration</h1>
        <p>See how AstralCore handles different scenarios from user post to resolution</p>
      </div>

      <div className="workflow-controls">
        <div className="scenario-selector">
          <h3>Select Scenario</h3>
          <div className="button-group">
            <button 
              className={selectedScenario === 'crisis' ? 'active' : ''}
              onClick={() => setSelectedScenario('crisis')}
            >
              🚨 Crisis Intervention
            </button>
            <button 
              className={selectedScenario === 'suicide' ? 'active' : ''}
              onClick={() => setSelectedScenario('suicide')}
            >
              ⚠️ Suicide Risk
            </button>
            <button 
              className={selectedScenario === 'domestic-violence' ? 'active' : ''}
              onClick={() => setSelectedScenario('domestic-violence')}
            >
              🏠 Domestic Violence
            </button>
            <button 
              className={selectedScenario === 'substance-abuse' ? 'active' : ''}
              onClick={() => setSelectedScenario('substance-abuse')}
            >
              💊 Substance Crisis
            </button>
            <button 
              className={selectedScenario === 'wellness-challenge' ? 'active' : ''}
              onClick={() => setSelectedScenario('wellness-challenge')}
            >
              🌱 Wellness Challenge
            </button>
            <button 
              className={selectedScenario === 'support-group' ? 'active' : ''}
              onClick={() => setSelectedScenario('support-group')}
            >
              👥 Support Group
            </button>
            <button 
              className={selectedScenario === 'peer-connection' ? 'active' : ''}
              onClick={() => setSelectedScenario('peer-connection')}
            >
              🤝 Peer Connection
            </button>
            <button 
              className={selectedScenario === 'boundary' ? 'active' : ''}
              onClick={() => setSelectedScenario('boundary')}
            >
              ⚠️ Boundary Violation
            </button>
            <button 
              className={selectedScenario === 'content' ? 'active' : ''}
              onClick={() => setSelectedScenario('content')}
            >
              🚫 Content Moderation
            </button>
            <button 
              className={selectedScenario === 'success' ? 'active' : ''}
              onClick={() => setSelectedScenario('success')}
            >
              ✅ Success Story
            </button>
          </div>
        </div>

        <div className="role-selector">
          <h3>View From Role</h3>
          <div className="button-group">
            <button 
              className={selectedRole === 'user' ? 'active' : ''}
              onClick={() => setSelectedRole('user')}
            >
              👤 Starkeeper
            </button>
            <button 
              className={selectedRole === 'helper' ? 'active' : ''}
              onClick={() => setSelectedRole('helper')}
            >
              ✨ Constellation Guide
            </button>
            <button 
              className={selectedRole === 'admin' ? 'active' : ''}
              onClick={() => setSelectedRole('admin')}
            >
              🛡️ Astral Admin
            </button>
          </div>
        </div>
      </div>

      <div className="workflow-timeline">
        {steps.map((step, index) => (
          <div
            key={step.step}
            className={`workflow-step ${step.role} ${selectedRole === step.role ? 'highlighted' : ''}`}
          >
            <div className="step-indicator">
              <div 
                className="step-number"
                style={{ backgroundColor: getRoleColor(step.role) }}
              >
                {getRoleIcon(step.role)}
              </div>
              {index < steps.length - 1 && <div className="step-connector"></div>}
            </div>

            <div className="step-content">
              <div className="step-header">
                <h3>{step.title}</h3>
                <span className="timestamp">{formatTimestamp(step.timestamp)}</span>
              </div>

              <div className="step-body">
                <p className="content">{step.content}</p>

                {step.actions && (
                  <div className="actions">
                    <h4>Actions Taken:</h4>
                    <ul>
                      {step.actions.map((action) => (
                        <li key={action}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {step.outcome && (
                  <div className="outcome">
                    <strong>Outcome:</strong> {step.outcome}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="workflow-metrics">
        <h3>Platform Effectiveness Metrics</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="metric-value">94.2%</span>
            <span className="metric-label">Crisis Resolution Rate</span>
          </div>
          <div className="metric">
            <span className="metric-value">4.3 min</span>
            <span className="metric-label">Avg Response to Crisis</span>
          </div>
          <div className="metric">
            <span className="metric-value">8.2 min</span>
            <span className="metric-label">Avg Helper Response</span>
          </div>
          <div className="metric">
            <span className="metric-value">99.97%</span>
            <span className="metric-label">System Uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowDemoView;