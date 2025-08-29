import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import DemoDataService from '../../services/demoDataService';

describe('DemoDataService', () => {
  let service: typeof DemoDataService;

  beforeEach(() => {
    service = DemoDataService;
  });

  describe('Demo Users', () => {
    it('should return demo users', () => {
      const users = service.getDemoUsers();
      
      expect(users).toBeDefined();
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('name');
      expect(users[0]).toHaveProperty('role');
    });

    it('should have different user roles', () => {
      const users = service.getDemoUsers();
      const roles = new Set(users.map(u => u.role));
      
      expect(roles.size).toBeGreaterThan(1);
      expect(roles.has('user')).toBe(true);
    });
  });

  describe('Journal Entries', () => {
    it('should generate journal entries for user', () => {
      const entries = service.getDemoJournalEntries('user-001');
      
      expect(entries).toBeDefined();
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0]).toHaveProperty('userId');
      expect(entries[0].userId).toBe('user-001');
    });

    it('should have timestamps for journal entries', () => {
      const entries = service.getDemoJournalEntries('user-001');
      
      entries.forEach(entry => {
        expect(entry.timestamp).toBeDefined();
        expect(new Date(entry.timestamp)).toBeInstanceOf(Date);
      });
    });
  });

  describe('Mood CheckIns', () => {
    it('should generate mood checkins', () => {
      const moods = service.getDemoMoodCheckIns('user-001');
      
      expect(moods).toBeDefined();
      expect(moods.length).toBeGreaterThan(0);
      expect(moods[0]).toHaveProperty('moodScore');
      expect(moods[0]).toHaveProperty('anxietyLevel');
    });

    it('should have valid mood scores', () => {
      const moods = service.getDemoMoodCheckIns('user-001');
      
      moods.forEach(mood => {
        expect(mood.moodScore).toBeGreaterThanOrEqual(1);
        expect(mood.moodScore).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Assessments', () => {
    it('should generate assessments', () => {
      const assessments = service.getDemoAssessments('user-001');
      
      expect(assessments).toBeDefined();
      expect(assessments.length).toBeGreaterThan(0);
      expect(assessments[0]).toHaveProperty('type');
      expect(assessments[0]).toHaveProperty('score');
    });
  });

  describe('Safety Plans', () => {
    it('should generate safety plans', () => {
      const plans = service.getDemoSafetyPlans('user-001');
      
      expect(plans).toBeDefined();
      expect(plans.length).toBeGreaterThan(0);
      expect(plans[0]).toHaveProperty('copingStrategies');
      expect(plans[0]).toHaveProperty('supportContacts');
    });

    it('should have emergency contacts in safety plan', () => {
      const plans = service.getDemoSafetyPlans('user-001');
      
      expect(plans[0].supportContacts.length).toBeGreaterThan(0);
      expect(plans[0].supportContacts[0]).toHaveProperty('name');
      expect(plans[0].supportContacts[0]).toHaveProperty('phone');
    });
  });

  describe('Complete Demo Data', () => {
    it('should generate complete dataset', () => {
      const data = service.getCompleteDemoData();
      
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('journalEntries');
      expect(data).toHaveProperty('moodCheckIns');
      expect(data).toHaveProperty('assessments');
      expect(data).toHaveProperty('safetyPlans');
    });
  });

  describe('Progress Reports', () => {
    it('should generate progress report', () => {
      const report = service.generateProgressReport('user-001', 'week');
      
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('insights');
      expect(report).toHaveProperty('recommendations');
    });
  });
});
