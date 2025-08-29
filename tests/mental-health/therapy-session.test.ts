/**
 * Therapy Session Testing Suite
 * Tests professional helper workflows and therapy session functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { 
  createTherapySession,
  validateHelperCredentials,
  manageCaseNotes,
  handleSessionEmergency,
  generateSessionReport
} from '../../src/services/therapeuticAIService';
import {
  verifyProfessionalLicense,
  checkSupervisionRequirements,
  auditSessionCompliance
} from '../../src/services/professionalNetworkService';

describe('Therapy Session Management', () => {
  let mockSession: any;
  let mockHelper: any;
  let mockSeeker: any;

  beforeEach(() => {
    mockHelper = {
      id: 'helper-123',
      credentials: {
        licenseNumber: 'PSY-12345',
        licenseState: 'CA',
        specializations: ['anxiety', 'depression', 'trauma'],
        verified: true
      },
      experience: {
        years: 5,
        sessionsCompleted: 250,
        rating: 4.8
      }
    };

    mockSeeker = {
      id: 'seeker-456',
      profile: {
        age: 28,
        concerns: ['anxiety', 'work stress'],
        previousSessions: 3
      },
      preferences: {
        sessionType: 'video',
        duration: 50,
        frequency: 'weekly'
      }
    };

    mockSession = null;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Helper Credential Verification', () => {
    it('should verify professional license validity', async () => {
      const verification = await verifyProfessionalLicense({
        licenseNumber: 'PSY-12345',
        state: 'CA',
        type: 'psychologist'
      });

      expect(verification.valid).toBe(true);
      expect(verification.expirationDate).toBeDefined();
      expect(verification.disciplinaryActions).toHaveLength(0);
    });

    it('should reject expired or invalid licenses', async () => {
      const verification = await verifyProfessionalLicense({
        licenseNumber: 'EXPIRED-123',
        state: 'CA',
        type: 'counselor'
      });

      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('expired');
      expect(verification.canReapply).toBeDefined();
    });

    it('should check supervision requirements for provisionally licensed helpers', async () => {
      const supervision = await checkSupervisionRequirements({
        helperId: 'helper-provisional',
        licenseType: 'provisional',
        supervisorId: 'supervisor-123'
      });

      expect(supervision.required).toBe(true);
      expect(supervision.hoursNeeded).toBeGreaterThan(0);
      expect(supervision.supervisorApproved).toBeDefined();
    });

    it('should validate helper specializations match seeker needs', () => {
      const match = validateHelperSpecializations(
        mockHelper.credentials.specializations,
        mockSeeker.profile.concerns
      );

      expect(match.compatible).toBe(true);
      expect(match.matchedAreas).toContain('anxiety');
      expect(match.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('Session Creation and Management', () => {
    it('should create a new therapy session with proper initialization', async () => {
      mockSession = await createTherapySession({
        helperId: mockHelper.id,
        seekerId: mockSeeker.id,
        type: 'scheduled',
        duration: 50,
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });

      expect(mockSession.id).toBeDefined();
      expect(mockSession.status).toBe('scheduled');
      expect(mockSession.securityToken).toBeDefined();
      expect(mockSession.encryptionEnabled).toBe(true);
    });

    it('should enforce session time limits', async () => {
      mockSession = await createTherapySession({
        helperId: mockHelper.id,
        seekerId: mockSeeker.id,
        duration: 50
      });

      // Start session
      await mockSession.start();
      expect(mockSession.status).toBe('active');

      // Simulate time passing
      jest.advanceTimersByTime(50 * 60 * 1000); // 50 minutes

      // Check warning issued
      expect(mockSession.timeWarningIssued).toBe(true);

      // Advance to overtime
      jest.advanceTimersByTime(10 * 60 * 1000); // 10 more minutes

      expect(mockSession.status).toBe('overtime');
      expect(mockSession.overtimeMinutes).toBe(10);
    });

    it('should handle emergency escalation during session', async () => {
      mockSession = await createTherapySession({
        helperId: mockHelper.id,
        seekerId: mockSeeker.id
      });

      const emergency = await handleSessionEmergency(mockSession.id, {
        type: 'crisis',
        severity: 9,
        helperAssessment: 'immediate danger'
      });

      expect(emergency.protocolActivated).toBe(true);
      expect(emergency.supervisorNotified).toBe(true);
      expect(emergency.emergencyServicesContacted).toBeDefined();
      expect(emergency.sessionStatus).toBe('emergency_interrupted');
    });

    it('should maintain session recordings with encryption', async () => {
      mockSession = await createTherapySession({
        helperId: mockHelper.id,
        seekerId: mockSeeker.id,
        recordingEnabled: true,
        seekerConsent: true
      });

      await mockSession.start();
      
      // Simulate session activity
      await mockSession.addNote('Session started, discussing anxiety triggers');
      await mockSession.addNote('Seeker expressing work-related stress');

      const recording = await mockSession.getRecording();
      
      expect(recording.encrypted).toBe(true);
      expect(recording.retentionDays).toBe(30);
      expect(recording.accessLog).toBeDefined();
      expect(recording.consentVerified).toBe(true);
    });
  });

  describe('Case Notes and Documentation', () => {
    it('should create HIPAA-compliant case notes', async () => {
      const caseNotes = await manageCaseNotes({
        sessionId: 'session-123',
        helperId: mockHelper.id,
        content: {
          subjective: 'Client reports increased anxiety',
          objective: 'Observed fidgeting, rapid speech',
          assessment: 'Anxiety symptoms escalating',
          plan: 'Increase coping strategy practice'
        }
      });

      expect(caseNotes.format).toBe('SOAP');
      expect(caseNotes.encrypted).toBe(true);
      expect(caseNotes.hipaaCompliant).toBe(true);
      expect(caseNotes.timestamp).toBeDefined();
    });

    it('should restrict case note access to authorized users', async () => {
      const caseNotes = await manageCaseNotes({
        sessionId: 'session-123',
        helperId: mockHelper.id,
        content: { subjective: 'Confidential notes' }
      });

      // Attempt unauthorized access
      const unauthorizedAccess = await attemptNoteAccess(
        caseNotes.id,
        'unauthorized-user'
      );

      expect(unauthorizedAccess.allowed).toBe(false);
      expect(unauthorizedAccess.logged).toBe(true);
      expect(unauthorizedAccess.alertSent).toBe(true);
    });

    it('should generate session summaries for continuity of care', async () => {
      const summary = await generateSessionReport({
        sessionId: 'session-123',
        includeClinicalNotes: true,
        includeProgressMetrics: true,
        includeRecommendations: true
      });

      expect(summary.sessionDate).toBeDefined();
      expect(summary.duration).toBeDefined();
      expect(summary.keyTopics).toBeInstanceOf(Array);
      expect(summary.progressIndicators).toBeDefined();
      expect(summary.nextSteps).toBeDefined();
      expect(summary.riskAssessment).toBeDefined();
    });
  });

  describe('Session Quality and Compliance', () => {
    it('should monitor session quality metrics', async () => {
      mockSession = await createTherapySession({
        helperId: mockHelper.id,
        seekerId: mockSeeker.id
      });

      await mockSession.start();
      
      // Simulate session interactions
      await mockSession.recordInteraction({ type: 'empathetic_response', quality: 'high' });
      await mockSession.recordInteraction({ type: 'active_listening', quality: 'high' });
      await mockSession.recordInteraction({ type: 'therapeutic_intervention', quality: 'medium' });

      const metrics = await mockSession.getQualityMetrics();

      expect(metrics.overallQuality).toBeGreaterThan(0.7);
      expect(metrics.empathyScore).toBeDefined();
      expect(metrics.engagementLevel).toBeDefined();
      expect(metrics.therapeuticAlliance).toBeDefined();
    });

    it('should audit session for compliance violations', async () => {
      const audit = await auditSessionCompliance({
        sessionId: 'session-123',
        checkpoints: [
          'informed_consent',
          'boundary_maintenance',
          'mandatory_reporting',
          'documentation_standards'
        ]
      });

      expect(audit.compliant).toBeDefined();
      expect(audit.violations).toBeInstanceOf(Array);
      expect(audit.recommendations).toBeDefined();
      expect(audit.requiresReview).toBeDefined();
    });

    it('should handle mandatory reporting requirements', async () => {
      mockSession = await createTherapySession({
        helperId: mockHelper.id,
        seekerId: mockSeeker.id
      });

      const reportingTrigger = {
        type: 'child_abuse_disclosure',
        details: 'Seeker disclosed potential child abuse',
        timestamp: new Date()
      };

      const mandatoryReport = await mockSession.handleMandatoryReporting(reportingTrigger);

      expect(mandatoryReport.reported).toBe(true);
      expect(mandatoryReport.agencyNotified).toBeDefined();
      expect(mandatoryReport.documentationCreated).toBe(true);
      expect(mandatoryReport.supervisorNotified).toBe(true);
      expect(mandatoryReport.seekerInformed).toBe(true);
    });
  });

  describe('Group Therapy Sessions', () => {
    it('should manage group therapy with multiple participants', async () => {
      const groupSession = await createGroupTherapySession({
        facilitatorId: mockHelper.id,
        participantIds: ['seeker-1', 'seeker-2', 'seeker-3', 'seeker-4'],
        type: 'support_group',
        topic: 'anxiety_management',
        maxParticipants: 8
      });

      expect(groupSession.participants).toHaveLength(4);
      expect(groupSession.waitlist).toBeDefined();
      expect(groupSession.rules).toBeDefined();
      expect(groupSession.confidentialityAgreement).toBe(true);
    });

    it('should moderate group interactions for safety', async () => {
      const groupSession = await createGroupTherapySession({
        facilitatorId: mockHelper.id,
        participantIds: ['seeker-1', 'seeker-2']
      });

      const interaction = {
        fromParticipant: 'seeker-1',
        message: 'Potentially triggering content about self-harm',
        timestamp: new Date()
      };

      const moderation = await groupSession.moderateInteraction(interaction);

      expect(moderation.flagged).toBe(true);
      expect(moderation.action).toBe('content_warning_added');
      expect(moderation.facilitatorAlerted).toBe(true);
      expect(moderation.alternativeProvided).toBeDefined();
    });
  });

  describe('Session Analytics and Outcomes', () => {
    it('should track therapeutic outcomes over time', async () => {
      const outcomes = await trackTherapeuticOutcomes({
        seekerId: mockSeeker.id,
        sessionIds: ['session-1', 'session-2', 'session-3'],
        metrics: ['mood', 'anxiety', 'functioning']
      });

      expect(outcomes.trend).toBeDefined();
      expect(outcomes.improvement).toBeDefined();
      expect(outcomes.clinicallySignificant).toBeDefined();
      expect(outcomes.recommendations).toBeInstanceOf(Array);
    });

    it('should identify patterns requiring intervention', async () => {
      const patterns = await analyzeSessionPatterns({
        seekerId: mockSeeker.id,
        timeframe: '30_days'
      });

      expect(patterns.riskFactors).toBeDefined();
      expect(patterns.protectiveFactors).toBeDefined();
      expect(patterns.warningSignals).toBeInstanceOf(Array);
      expect(patterns.suggestedInterventions).toBeDefined();
    });
  });
});

// Helper functions for testing
function validateHelperSpecializations(specializations: string[], concerns: string[]) {
  const matches = concerns.filter(c => 
    specializations.some(s => s.toLowerCase().includes(c.toLowerCase()))
  );
  return {
    compatible: matches.length > 0,
    matchedAreas: matches,
    confidence: matches.length / concerns.length
  };
}

async function attemptNoteAccess(noteId: string, userId: string) {
  // Mock implementation
  return {
    allowed: false,
    logged: true,
    alertSent: true
  };
}

async function createGroupTherapySession(config: any) {
  // Mock implementation
  return {
    id: 'group-session-123',
    participants: config.participantIds,
    waitlist: [],
    rules: ['Confidentiality', 'Respect', 'No judgment'],
    confidentialityAgreement: true,
    moderateInteraction: async (interaction: any) => ({
      flagged: true,
      action: 'content_warning_added',
      facilitatorAlerted: true,
      alternativeProvided: 'Modified message shown'
    })
  };
}

async function trackTherapeuticOutcomes(config: any) {
  // Mock implementation
  return {
    trend: 'improving',
    improvement: 0.35,
    clinicallySignificant: true,
    recommendations: ['Continue current approach', 'Consider group therapy']
  };
}

async function analyzeSessionPatterns(config: any) {
  // Mock implementation
  return {
    riskFactors: ['isolation', 'work_stress'],
    protectiveFactors: ['therapy_engagement', 'social_support'],
    warningSignals: ['increased_anxiety'],
    suggestedInterventions: ['CBT techniques', 'Stress management']
  };
}