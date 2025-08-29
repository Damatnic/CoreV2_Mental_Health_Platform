/**
 * Cultural Assessment Service Tests
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface CulturalProfile {
  userId: string;
  primaryCulture: string;
  secondaryCultures: string[];
  language: string;
  preferredLanguages: string[];
  communicationStyle: 'direct' | 'indirect' | 'contextual';
  values: string[];
  taboos: string[];
  supportPreferences: string[];
}

interface CulturalRecommendation {
  type: 'therapy' | 'resource' | 'approach' | 'communication';
  title: string;
  description: string;
  culturalRelevance: number; // 0-100
  rationale: string;
}

class CulturalAssessmentService {
  private profiles: Map<string, CulturalProfile> = new Map();
  private culturalDatabase = {
    'east-asian': {
      commonValues: ['family-honor', 'education', 'respect-for-elders', 'harmony'],
      commonTaboos: ['direct-confrontation', 'public-emotion', 'individual-over-group'],
      preferredApproaches: ['practical-solutions', 'somatic-focus', 'indirect-communication']
    },
    'latin-american': {
      commonValues: ['family-bonds', 'spirituality', 'respect', 'warmth'],
      commonTaboos: ['disrespect-elders', 'ignoring-family', 'lack-of-personal-connection'],
      preferredApproaches: ['personal-relationship', 'spiritual-integration', 'family-involvement']
    },
    'middle-eastern': {
      commonValues: ['family-honor', 'religious-faith', 'hospitality', 'gender-roles'],
      commonTaboos: ['shame-family', 'religious-insensitivity', 'inappropriate-gender-interaction'],
      preferredApproaches: ['religious-framework', 'gender-matching', 'family-consultation']
    },
    'african': {
      commonValues: ['community', 'oral-tradition', 'respect-ancestors', 'ubuntu'],
      commonTaboos: ['individualism-excess', 'disrespect-traditions', 'ignoring-community'],
      preferredApproaches: ['community-healing', 'storytelling', 'collective-support']
    },
    'western': {
      commonValues: ['individualism', 'self-reliance', 'direct-communication', 'privacy'],
      commonTaboos: ['invasion-privacy', 'lack-of-autonomy', 'forced-dependence'],
      preferredApproaches: ['individual-therapy', 'evidence-based', 'goal-oriented']
    }
  };

  async createProfile(profile: CulturalProfile): Promise<CulturalProfile> {
    // Validate profile
    if (!profile.userId || !profile.primaryCulture) {
      throw new Error('Invalid cultural profile');
    }

    // Enrich profile with cultural database
    const enrichedProfile = this.enrichProfile(profile);
    
    this.profiles.set(profile.userId, enrichedProfile);
    return enrichedProfile;
  }

  private enrichProfile(profile: CulturalProfile): CulturalProfile {
    const culturalData = this.culturalDatabase[profile.primaryCulture as keyof typeof this.culturalDatabase];
    
    if (culturalData) {
      profile.values = [...new Set([...profile.values, ...culturalData.commonValues])];
      profile.taboos = [...new Set([...profile.taboos, ...culturalData.commonTaboos])];
      profile.supportPreferences = [...new Set([
        ...profile.supportPreferences,
        ...culturalData.preferredApproaches
      ])];
    }
    
    return profile;
  }

  async updateProfile(userId: string, updates: Partial<CulturalProfile>): Promise<CulturalProfile | null> {
    const existing = this.profiles.get(userId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.profiles.set(userId, updated);
    return updated;
  }

  async getProfile(userId: string): Promise<CulturalProfile | undefined> {
    return this.profiles.get(userId);
  }

  async generateRecommendations(userId: string): Promise<CulturalRecommendation[]> {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const recommendations: CulturalRecommendation[] = [];

    // Therapy recommendations
    if (profile.supportPreferences.includes('family-involvement')) {
      recommendations.push({
        type: 'therapy',
        title: 'Family Therapy Sessions',
        description: 'Include family members in therapeutic process',
        culturalRelevance: 95,
        rationale: 'Aligns with cultural emphasis on family involvement'
      });
    }

    // Communication recommendations
    if (profile.communicationStyle === 'indirect') {
      recommendations.push({
        type: 'communication',
        title: 'Indirect Communication Approach',
        description: 'Use metaphors and storytelling rather than direct confrontation',
        culturalRelevance: 90,
        rationale: 'Respects cultural preference for indirect communication'
      });
    }

    // Resource recommendations
    if (profile.preferredLanguages.length > 1) {
      recommendations.push({
        type: 'resource',
        title: 'Multilingual Resources',
        description: `Materials available in ${profile.preferredLanguages.join(', ')}`,
        culturalRelevance: 85,
        rationale: 'Ensures comfort and comprehension in preferred language'
      });
    }

    // Approach recommendations
    if (profile.values.includes('spirituality')) {
      recommendations.push({
        type: 'approach',
        title: 'Integrate Spiritual Practices',
        description: 'Incorporate prayer, meditation, or spiritual counseling',
        culturalRelevance: 88,
        rationale: 'Honors spiritual values important to cultural identity'
      });
    }

    return recommendations.sort((a, b) => b.culturalRelevance - a.culturalRelevance);
  }

  async assessCulturalSensitivity(intervention: string, profile: CulturalProfile): Promise<number> {
    let score = 50; // Base score

    // Check against taboos
    profile.taboos.forEach(taboo => {
      if (intervention.toLowerCase().includes(taboo.replace('-', ' '))) {
        score -= 20;
      }
    });

    // Check alignment with values
    profile.values.forEach(value => {
      if (intervention.toLowerCase().includes(value.replace('-', ' '))) {
        score += 10;
      }
    });

    // Check preferred approaches
    profile.supportPreferences.forEach(pref => {
      if (intervention.toLowerCase().includes(pref.replace('-', ' '))) {
        score += 15;
      }
    });

    return Math.max(0, Math.min(100, score));
  }

  async findCulturallyCompetentProviders(profile: CulturalProfile): Promise<any[]> {
    // Mock provider search
    const providers = [
      {
        id: 'provider-1',
        name: 'Dr. Chen',
        cultures: ['east-asian', 'western'],
        languages: ['en', 'zh', 'ja'],
        specialties: ['anxiety', 'depression', 'cultural-adjustment']
      },
      {
        id: 'provider-2',
        name: 'Dr. Rodriguez',
        cultures: ['latin-american', 'western'],
        languages: ['en', 'es', 'pt'],
        specialties: ['family-therapy', 'trauma', 'spirituality']
      }
    ];

    return providers.filter(provider => {
      const culturalMatch = provider.cultures.includes(profile.primaryCulture) ||
                          profile.secondaryCultures.some(c => provider.cultures.includes(c));
      const languageMatch = provider.languages.includes(profile.language) ||
                          profile.preferredLanguages.some(l => provider.languages.includes(l));
      
      return culturalMatch || languageMatch;
    });
  }

  async detectCulturalConflicts(userId: string, proposedIntervention: string): Promise<string[]> {
    const profile = this.profiles.get(userId);
    if (!profile) return [];

    const conflicts: string[] = [];

    // Check for taboo violations
    profile.taboos.forEach(taboo => {
      if (proposedIntervention.toLowerCase().includes(taboo.replace('-', ' '))) {
        conflicts.push(`May violate cultural taboo: ${taboo}`);
      }
    });

    // Check communication style mismatch
    if (profile.communicationStyle === 'indirect' && proposedIntervention.includes('direct')) {
      conflicts.push('Direct approach may conflict with indirect communication preference');
    }

    return conflicts;
  }

  clearProfiles() {
    this.profiles.clear();
  }

  getProfileCount(): number {
    return this.profiles.size;
  }
}

describe('CulturalAssessmentService', () => {
  let service: CulturalAssessmentService;

  beforeEach(() => {
    service = new CulturalAssessmentService();
  });

  afterEach(() => {
    service.clearProfiles();
    jest.clearAllMocks();
  });

  describe('Profile Management', () => {
    it('should create cultural profile', async () => {
      const profile: CulturalProfile = {
        userId: 'user-1',
        primaryCulture: 'east-asian',
        secondaryCultures: ['western'],
        language: 'zh',
        preferredLanguages: ['zh', 'en'],
        communicationStyle: 'indirect',
        values: ['education'],
        taboos: ['public-emotion'],
        supportPreferences: ['family-involvement']
      };

      const created = await service.createProfile(profile);
      
      expect(created).toBeDefined();
      expect(created.userId).toBe('user-1');
      expect(created.values).toContain('education');
      expect(created.values).toContain('family-honor');
    });

    it('should enrich profile with cultural database', async () => {
      const profile: CulturalProfile = {
        userId: 'user-2',
        primaryCulture: 'latin-american',
        secondaryCultures: [],
        language: 'es',
        preferredLanguages: ['es'],
        communicationStyle: 'direct',
        values: [],
        taboos: [],
        supportPreferences: []
      };

      const created = await service.createProfile(profile);
      
      expect(created.values.length).toBeGreaterThan(0);
      expect(created.values).toContain('family-bonds');
      expect(created.supportPreferences).toContain('family-involvement');
    });

    it('should update existing profile', async () => {
      const profile: CulturalProfile = {
        userId: 'user-3',
        primaryCulture: 'western',
        secondaryCultures: [],
        language: 'en',
        preferredLanguages: ['en'],
        communicationStyle: 'direct',
        values: ['privacy'],
        taboos: [],
        supportPreferences: []
      };

      await service.createProfile(profile);
      const updated = await service.updateProfile('user-3', {
        secondaryCultures: ['east-asian'],
        preferredLanguages: ['en', 'ja']
      });
      
      expect(updated).toBeDefined();
      expect(updated?.secondaryCultures).toContain('east-asian');
      expect(updated?.preferredLanguages).toContain('ja');
    });
  });

  describe('Recommendations', () => {
    it('should generate culturally appropriate recommendations', async () => {
      const profile: CulturalProfile = {
        userId: 'user-4',
        primaryCulture: 'east-asian',
        secondaryCultures: [],
        language: 'zh',
        preferredLanguages: ['zh', 'en'],
        communicationStyle: 'indirect',
        values: ['spirituality'],
        taboos: ['direct-confrontation'],
        supportPreferences: ['family-involvement']
      };

      await service.createProfile(profile);
      const recommendations = await service.generateRecommendations('user-4');
      
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].culturalRelevance).toBeGreaterThanOrEqual(85);
      
      const familyRec = recommendations.find(r => r.type === 'therapy');
      expect(familyRec?.title).toContain('Family');
    });

    it('should sort recommendations by cultural relevance', async () => {
      const profile: CulturalProfile = {
        userId: 'user-5',
        primaryCulture: 'middle-eastern',
        secondaryCultures: [],
        language: 'ar',
        preferredLanguages: ['ar', 'en'],
        communicationStyle: 'indirect',
        values: ['religious-faith', 'family-honor'],
        taboos: ['shame-family'],
        supportPreferences: ['religious-framework', 'gender-matching']
      };

      await service.createProfile(profile);
      const recommendations = await service.generateRecommendations('user-5');
      
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i-1].culturalRelevance)
          .toBeGreaterThanOrEqual(recommendations[i].culturalRelevance);
      }
    });
  });

  describe('Cultural Sensitivity Assessment', () => {
    it('should assess intervention cultural sensitivity', async () => {
      const profile: CulturalProfile = {
        userId: 'user-6',
        primaryCulture: 'east-asian',
        secondaryCultures: [],
        language: 'ja',
        preferredLanguages: ['ja'],
        communicationStyle: 'indirect',
        values: ['harmony', 'respect-for-elders'],
        taboos: ['direct-confrontation', 'public-emotion'],
        supportPreferences: ['indirect-communication']
      };

      await service.createProfile(profile);
      
      const goodIntervention = 'Use gentle suggestions and respect for elders';
      const goodScore = await service.assessCulturalSensitivity(goodIntervention, profile);
      
      const badIntervention = 'Direct confrontation about public emotion';
      const badScore = await service.assessCulturalSensitivity(badIntervention, profile);
      
      expect(goodScore).toBeGreaterThan(badScore);
    });
  });

  describe('Provider Matching', () => {
    it('should find culturally competent providers', async () => {
      const profile: CulturalProfile = {
        userId: 'user-7',
        primaryCulture: 'east-asian',
        secondaryCultures: ['western'],
        language: 'zh',
        preferredLanguages: ['zh', 'en'],
        communicationStyle: 'indirect',
        values: [],
        taboos: [],
        supportPreferences: []
      };

      await service.createProfile(profile);
      const providers = await service.findCulturallyCompetentProviders(profile);
      
      expect(providers.length).toBeGreaterThan(0);
      expect(providers[0].cultures).toContain('east-asian');
    });
  });

  describe('Conflict Detection', () => {
    it('should detect cultural conflicts in interventions', async () => {
      const profile: CulturalProfile = {
        userId: 'user-8',
        primaryCulture: 'east-asian',
        secondaryCultures: [],
        language: 'ko',
        preferredLanguages: ['ko'],
        communicationStyle: 'indirect',
        values: ['harmony'],
        taboos: ['direct-confrontation', 'public-emotion'],
        supportPreferences: ['indirect-communication']
      };

      await service.createProfile(profile);
      
      const intervention = 'Use direct confrontation to address emotional issues in group setting';
      const conflicts = await service.detectCulturalConflicts('user-8', intervention);
      
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0]).toContain('taboo');
    });

    it('should detect communication style conflicts', async () => {
      const profile: CulturalProfile = {
        userId: 'user-9',
        primaryCulture: 'latin-american',
        secondaryCultures: [],
        language: 'es',
        preferredLanguages: ['es'],
        communicationStyle: 'indirect',
        values: [],
        taboos: [],
        supportPreferences: []
      };

      await service.createProfile(profile);
      
      const intervention = 'Use direct and blunt communication';
      const conflicts = await service.detectCulturalConflicts('user-9', intervention);
      
      expect(conflicts.some(c => c.includes('communication'))).toBe(true);
    });
  });
});
