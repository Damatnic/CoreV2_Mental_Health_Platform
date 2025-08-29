/**
 * Mentorship Matching Service
 * Intelligent algorithm for matching mentors and mentees based on compatibility,
 * interests, experience, and mental health support needs
 */

import { EventEmitter } from 'events';

// Types for mentorship system
export interface MentorshipProfile {
  userId: string;
  role: 'mentor' | 'mentee' | 'both';
  name: string;
  age?: number;
  gender?: string;
  pronouns?: string;
  languages: string[];
  timezone: string;
  
  // Mental health specific
  areasOfExperience: string[];
  areasSeekingSupport: string[];
  preferredTopics: string[];
  avoidTopics: string[];
  
  // Availability
  availability: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
  preferredFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  preferredDuration: number; // minutes per session
  
  // Matching preferences
  agePreference?: {
    min: number;
    max: number;
  };
  genderPreference?: string;
  culturalBackground?: string;
  culturalPreference?: string;
  
  // Safety and verification
  verified: boolean;
  safetyScreeningCompleted: boolean;
  trainingCompleted: boolean;
  rating?: number;
  reviewCount?: number;
  
  // Goals and expectations
  goals: string[];
  expectations: string[];
  communicationStyle: 'text' | 'voice' | 'video' | 'any';
  
  // Status
  status: 'active' | 'inactive' | 'matched' | 'paused';
  joinedDate: Date;
  lastActive: Date;
  currentMatches: string[];
  maxMatches: number;
}

export interface MatchScore {
  userId: string;
  score: number;
  factors: {
    experienceAlignment: number;
    topicCompatibility: number;
    availabilityOverlap: number;
    languageMatch: number;
    culturalAlignment: number;
    communicationStyleMatch: number;
    goalsAlignment: number;
    ageCompatibility: number;
    genderPreference: number;
    safetyScore: number;
  };
  strengths: string[];
  considerations: string[];
}

export interface MentorshipMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'active' | 'completed' | 'ended';
  createdAt: Date;
  acceptedAt?: Date;
  endedAt?: Date;
  endReason?: string;
  messages: number;
  sessions: number;
  feedback?: {
    fromMentor?: {
      rating: number;
      comment: string;
    };
    fromMentee?: {
      rating: number;
      comment: string;
    };
  };
}

export interface ConnectionRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  respondedAt?: Date;
  matchScore?: number;
}

class MentorshipMatchingService extends EventEmitter {
  private profiles: Map<string, MentorshipProfile> = new Map();
  private matches: Map<string, MentorshipMatch> = new Map();
  private connectionRequests: Map<string, ConnectionRequest> = new Map();
  private matchingWeights = {
    experienceAlignment: 0.25,
    topicCompatibility: 0.20,
    availabilityOverlap: 0.15,
    languageMatch: 0.10,
    culturalAlignment: 0.08,
    communicationStyleMatch: 0.07,
    goalsAlignment: 0.05,
    ageCompatibility: 0.05,
    genderPreference: 0.03,
    safetyScore: 0.02
  };

  constructor() {
    super();
    this.initializeService();
  }

  private initializeService(): void {
    // Initialize with sample data in development
    if (process.env.NODE_ENV === 'development') {
      this.loadSampleProfiles();
    }
  }

  /**
   * Register or update a mentorship profile
   */
  public registerProfile(profile: MentorshipProfile): void {
    // Validate safety screening
    if (!profile.safetyScreeningCompleted) {
      throw new Error('Safety screening must be completed before registration');
    }

    // Store profile
    this.profiles.set(profile.userId, profile);
    
    // Emit profile update event
    this.emit('profileUpdated', profile);
    
    // Trigger matching for new profiles
    if (profile.status === 'active') {
      this.findMatches(profile.userId);
    }
  }

  /**
   * Find compatible matches for a user
   */
  public findMatches(userId: string, limit: number = 10): MatchScore[] {
    const profile = this.profiles.get(userId);
    if (!profile || profile.status !== 'active') {
      return [];
    }

    const matches: MatchScore[] = [];
    
    // Iterate through all profiles to find matches
    for (const [candidateId, candidate] of this.profiles) {
      // Skip self and inactive profiles
      if (candidateId === userId || candidate.status !== 'active') {
        continue;
      }

      // Check role compatibility
      if (!this.areRolesCompatible(profile, candidate)) {
        continue;
      }

      // Check if already matched
      if (profile.currentMatches.includes(candidateId) || 
          candidate.currentMatches.includes(userId)) {
        continue;
      }

      // Check max matches limit
      if (candidate.currentMatches.length >= candidate.maxMatches) {
        continue;
      }

      // Calculate match score
      const matchScore = this.calculateMatchScore(profile, candidate);
      
      // Only include matches above threshold
      if (matchScore.score >= 0.5) {
        matches.push(matchScore);
      }
    }

    // Sort by score and return top matches
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate comprehensive match score between two profiles
   */
  private calculateMatchScore(profile1: MentorshipProfile, profile2: MentorshipProfile): MatchScore {
    const factors = {
      experienceAlignment: this.calculateExperienceAlignment(profile1, profile2),
      topicCompatibility: this.calculateTopicCompatibility(profile1, profile2),
      availabilityOverlap: this.calculateAvailabilityOverlap(profile1, profile2),
      languageMatch: this.calculateLanguageMatch(profile1, profile2),
      culturalAlignment: this.calculateCulturalAlignment(profile1, profile2),
      communicationStyleMatch: this.calculateCommunicationMatch(profile1, profile2),
      goalsAlignment: this.calculateGoalsAlignment(profile1, profile2),
      ageCompatibility: this.calculateAgeCompatibility(profile1, profile2),
      genderPreference: this.calculateGenderPreference(profile1, profile2),
      safetyScore: this.calculateSafetyScore(profile2)
    };

    // Calculate weighted total score
    let totalScore = 0;
    for (const [factor, value] of Object.entries(factors)) {
      totalScore += value * this.matchingWeights[factor as keyof typeof this.matchingWeights];
    }

    // Identify strengths and considerations
    const strengths: string[] = [];
    const considerations: string[] = [];

    if (factors.experienceAlignment > 0.8) {
      strengths.push('Strong experience alignment');
    }
    if (factors.topicCompatibility > 0.8) {
      strengths.push('High topic compatibility');
    }
    if (factors.availabilityOverlap > 0.7) {
      strengths.push('Good availability match');
    }
    if (factors.languageMatch === 1) {
      strengths.push('Common language');
    }

    if (factors.availabilityOverlap < 0.3) {
      considerations.push('Limited availability overlap');
    }
    if (factors.communicationStyleMatch < 0.5) {
      considerations.push('Different communication preferences');
    }

    return {
      userId: profile2.userId,
      score: totalScore,
      factors,
      strengths,
      considerations
    };
  }

  /**
   * Calculate experience alignment between mentor and mentee
   */
  private calculateExperienceAlignment(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    let alignment = 0;
    let totalFactors = 0;

    // Check if mentor's experience matches mentee's needs
    if (profile1.role === 'mentee' && profile2.role === 'mentor') {
      const overlap = profile1.areasSeekingSupport.filter(area => 
        profile2.areasOfExperience.includes(area)
      );
      alignment = overlap.length / Math.max(profile1.areasSeekingSupport.length, 1);
    } else if (profile1.role === 'mentor' && profile2.role === 'mentee') {
      const overlap = profile2.areasSeekingSupport.filter(area => 
        profile1.areasOfExperience.includes(area)
      );
      alignment = overlap.length / Math.max(profile2.areasSeekingSupport.length, 1);
    } else if (profile1.role === 'both' && profile2.role === 'both') {
      // For peer-to-peer, check mutual interests
      const experienceOverlap = profile1.areasOfExperience.filter(area => 
        profile2.areasOfExperience.includes(area)
      );
      const needsOverlap = profile1.areasSeekingSupport.filter(area => 
        profile2.areasSeekingSupport.includes(area)
      );
      alignment = (experienceOverlap.length + needsOverlap.length) / 
                  Math.max(profile1.areasOfExperience.length + profile1.areasSeekingSupport.length, 2);
    }

    return Math.min(alignment, 1);
  }

  /**
   * Calculate topic compatibility
   */
  private calculateTopicCompatibility(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    // Check for conflicting topics
    const hasConflict = profile1.preferredTopics.some(topic => 
      profile2.avoidTopics.includes(topic)
    ) || profile2.preferredTopics.some(topic => 
      profile1.avoidTopics.includes(topic)
    );

    if (hasConflict) {
      return 0;
    }

    // Calculate positive overlap
    const sharedTopics = profile1.preferredTopics.filter(topic => 
      profile2.preferredTopics.includes(topic)
    );

    const totalTopics = new Set([...profile1.preferredTopics, ...profile2.preferredTopics]).size;
    
    return totalTopics > 0 ? sharedTopics.length / totalTopics : 0.5;
  }

  /**
   * Calculate availability overlap
   */
  private calculateAvailabilityOverlap(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    let totalOverlapMinutes = 0;
    
    for (const slot1 of profile1.availability) {
      for (const slot2 of profile2.availability) {
        if (slot1.dayOfWeek === slot2.dayOfWeek) {
          const overlap = this.calculateTimeOverlap(
            slot1.startTime, 
            slot1.endTime, 
            slot2.startTime, 
            slot2.endTime,
            profile1.timezone,
            profile2.timezone
          );
          totalOverlapMinutes += overlap;
        }
      }
    }

    // Consider preferred duration
    const requiredMinutes = Math.max(profile1.preferredDuration, profile2.preferredDuration);
    const hasAdequateOverlap = totalOverlapMinutes >= requiredMinutes;

    // Score based on total overlap and frequency compatibility
    const frequencyScore = this.calculateFrequencyCompatibility(
      profile1.preferredFrequency,
      profile2.preferredFrequency
    );

    return hasAdequateOverlap ? Math.min(totalOverlapMinutes / (requiredMinutes * 2), 1) * frequencyScore : 0;
  }

  /**
   * Calculate time overlap between two time slots
   */
  private calculateTimeOverlap(
    start1: string, 
    end1: string, 
    start2: string, 
    end2: string,
    timezone1: string,
    timezone2: string
  ): number {
    // Convert times to minutes for easier calculation
    const convertToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Adjust for timezone difference (simplified - would use proper timezone library in production)
    const tzOffset = this.getTimezoneOffset(timezone1, timezone2);
    
    const start1Min = convertToMinutes(start1);
    const end1Min = convertToMinutes(end1);
    const start2Min = convertToMinutes(start2) + tzOffset;
    const end2Min = convertToMinutes(end2) + tzOffset;

    const overlapStart = Math.max(start1Min, start2Min);
    const overlapEnd = Math.min(end1Min, end2Min);

    return Math.max(0, overlapEnd - overlapStart);
  }

  /**
   * Get timezone offset in minutes (simplified)
   */
  private getTimezoneOffset(tz1: string, tz2: string): number {
    // Simplified timezone handling - in production, use proper timezone library
    const timezones: { [key: string]: number } = {
      'UTC': 0,
      'EST': -5,
      'CST': -6,
      'MST': -7,
      'PST': -8,
      'CET': 1,
      'JST': 9,
      'AEST': 10
    };

    const offset1 = timezones[tz1] || 0;
    const offset2 = timezones[tz2] || 0;
    
    return (offset2 - offset1) * 60;
  }

  /**
   * Calculate frequency compatibility
   */
  private calculateFrequencyCompatibility(freq1: string, freq2: string): number {
    const frequencies = ['daily', 'weekly', 'biweekly', 'monthly'];
    const index1 = frequencies.indexOf(freq1);
    const index2 = frequencies.indexOf(freq2);
    
    const difference = Math.abs(index1 - index2);
    return 1 - (difference * 0.25);
  }

  /**
   * Calculate language match
   */
  private calculateLanguageMatch(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    const commonLanguages = profile1.languages.filter(lang => 
      profile2.languages.includes(lang)
    );
    
    return commonLanguages.length > 0 ? 1 : 0;
  }

  /**
   * Calculate cultural alignment
   */
  private calculateCulturalAlignment(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    // If cultural preference is specified, check for match
    if (profile1.culturalPreference && profile2.culturalBackground) {
      if (profile1.culturalPreference === profile2.culturalBackground) {
        return 1;
      }
    }
    
    if (profile2.culturalPreference && profile1.culturalBackground) {
      if (profile2.culturalPreference === profile1.culturalBackground) {
        return 1;
      }
    }

    // If both have same cultural background
    if (profile1.culturalBackground && profile2.culturalBackground) {
      if (profile1.culturalBackground === profile2.culturalBackground) {
        return 0.8;
      }
    }

    // No specific cultural requirements
    return 0.5;
  }

  /**
   * Calculate communication style match
   */
  private calculateCommunicationMatch(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    if (profile1.communicationStyle === 'any' || profile2.communicationStyle === 'any') {
      return 1;
    }
    
    return profile1.communicationStyle === profile2.communicationStyle ? 1 : 0.3;
  }

  /**
   * Calculate goals alignment
   */
  private calculateGoalsAlignment(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    const sharedGoals = profile1.goals.filter(goal => 
      profile2.goals.includes(goal)
    );
    
    const totalGoals = new Set([...profile1.goals, ...profile2.goals]).size;
    
    return totalGoals > 0 ? sharedGoals.length / totalGoals : 0.5;
  }

  /**
   * Calculate age compatibility
   */
  private calculateAgeCompatibility(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    if (!profile1.age || !profile2.age) {
      return 0.5; // Neutral if age not specified
    }

    // Check age preferences
    if (profile1.agePreference) {
      if (profile2.age < profile1.agePreference.min || profile2.age > profile1.agePreference.max) {
        return 0;
      }
    }

    if (profile2.agePreference) {
      if (profile1.age < profile2.agePreference.min || profile1.age > profile2.agePreference.max) {
        return 0;
      }
    }

    // Calculate age difference factor
    const ageDiff = Math.abs(profile1.age - profile2.age);
    if (ageDiff <= 5) return 1;
    if (ageDiff <= 10) return 0.8;
    if (ageDiff <= 15) return 0.6;
    if (ageDiff <= 20) return 0.4;
    return 0.2;
  }

  /**
   * Calculate gender preference match
   */
  private calculateGenderPreference(profile1: MentorshipProfile, profile2: MentorshipProfile): number {
    if (profile1.genderPreference && profile2.gender) {
      if (profile1.genderPreference !== profile2.gender && profile1.genderPreference !== 'any') {
        return 0;
      }
    }

    if (profile2.genderPreference && profile1.gender) {
      if (profile2.genderPreference !== profile1.gender && profile2.genderPreference !== 'any') {
        return 0;
      }
    }

    return 1;
  }

  /**
   * Calculate safety score based on verification and ratings
   */
  private calculateSafetyScore(profile: MentorshipProfile): number {
    let score = 0;

    if (profile.verified) score += 0.3;
    if (profile.safetyScreeningCompleted) score += 0.3;
    if (profile.trainingCompleted) score += 0.2;
    
    if (profile.rating && profile.reviewCount) {
      const ratingScore = (profile.rating / 5) * 0.2;
      const reviewWeight = Math.min(profile.reviewCount / 10, 1);
      score += ratingScore * reviewWeight;
    }

    return score;
  }

  /**
   * Check if roles are compatible for matching
   */
  private areRolesCompatible(profile1: MentorshipProfile, profile2: MentorshipProfile): boolean {
    if (profile1.role === 'mentor' && profile2.role === 'mentee') return true;
    if (profile1.role === 'mentee' && profile2.role === 'mentor') return true;
    if (profile1.role === 'both' || profile2.role === 'both') return true;
    return false;
  }

  /**
   * Send connection request
   */
  public sendConnectionRequest(fromUserId: string, toUserId: string, message: string): ConnectionRequest {
    const request: ConnectionRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromUserId,
      toUserId,
      message,
      status: 'pending',
      createdAt: new Date()
    };

    // Calculate match score for reference
    const fromProfile = this.profiles.get(fromUserId);
    const toProfile = this.profiles.get(toUserId);
    
    if (fromProfile && toProfile) {
      const matchScore = this.calculateMatchScore(fromProfile, toProfile);
      request.matchScore = matchScore.score;
    }

    this.connectionRequests.set(request.id, request);
    this.emit('connectionRequest', request);
    
    return request;
  }

  /**
   * Accept connection request and create match
   */
  public acceptConnectionRequest(requestId: string): MentorshipMatch | null {
    const request = this.connectionRequests.get(requestId);
    if (!request || request.status !== 'pending') {
      return null;
    }

    // Update request status
    request.status = 'accepted';
    request.respondedAt = new Date();

    // Create match
    const match: MentorshipMatch = {
      id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mentorId: request.fromUserId,
      menteeId: request.toUserId,
      score: request.matchScore || 0,
      status: 'active',
      createdAt: new Date(),
      acceptedAt: new Date(),
      messages: 0,
      sessions: 0
    };

    // Determine mentor/mentee roles
    const fromProfile = this.profiles.get(request.fromUserId);
    const toProfile = this.profiles.get(request.toUserId);
    
    if (fromProfile && toProfile) {
      if (fromProfile.role === 'mentor' || (fromProfile.role === 'both' && toProfile.role === 'mentee')) {
        match.mentorId = request.fromUserId;
        match.menteeId = request.toUserId;
      } else {
        match.mentorId = request.toUserId;
        match.menteeId = request.fromUserId;
      }

      // Update profiles with current matches
      fromProfile.currentMatches.push(request.toUserId);
      toProfile.currentMatches.push(request.fromUserId);
      
      // Update status if at capacity
      if (fromProfile.currentMatches.length >= fromProfile.maxMatches) {
        fromProfile.status = 'matched';
      }
      if (toProfile.currentMatches.length >= toProfile.maxMatches) {
        toProfile.status = 'matched';
      }
    }

    this.matches.set(match.id, match);
    this.emit('matchCreated', match);
    
    return match;
  }

  /**
   * Reject connection request
   */
  public rejectConnectionRequest(requestId: string): void {
    const request = this.connectionRequests.get(requestId);
    if (request && request.status === 'pending') {
      request.status = 'rejected';
      request.respondedAt = new Date();
      this.emit('connectionRejected', request);
    }
  }

  /**
   * End a mentorship match
   */
  public endMatch(matchId: string, reason: string): void {
    const match = this.matches.get(matchId);
    if (!match || match.status !== 'active') {
      return;
    }

    match.status = 'ended';
    match.endedAt = new Date();
    match.endReason = reason;

    // Update profiles
    const mentorProfile = this.profiles.get(match.mentorId);
    const menteeProfile = this.profiles.get(match.menteeId);

    if (mentorProfile) {
      mentorProfile.currentMatches = mentorProfile.currentMatches.filter(id => id !== match.menteeId);
      if (mentorProfile.status === 'matched' && mentorProfile.currentMatches.length < mentorProfile.maxMatches) {
        mentorProfile.status = 'active';
      }
    }

    if (menteeProfile) {
      menteeProfile.currentMatches = menteeProfile.currentMatches.filter(id => id !== match.mentorId);
      if (menteeProfile.status === 'matched' && menteeProfile.currentMatches.length < menteeProfile.maxMatches) {
        menteeProfile.status = 'active';
      }
    }

    this.emit('matchEnded', match);
  }

  /**
   * Submit feedback for a match
   */
  public submitFeedback(matchId: string, userId: string, rating: number, comment: string): void {
    const match = this.matches.get(matchId);
    if (!match) {
      return;
    }

    if (!match.feedback) {
      match.feedback = {};
    }

    if (userId === match.mentorId) {
      match.feedback.fromMentor = { rating, comment };
    } else if (userId === match.menteeId) {
      match.feedback.fromMentee = { rating, comment };
    }

    // Update profile ratings
    const targetUserId = userId === match.mentorId ? match.menteeId : match.mentorId;
    const targetProfile = this.profiles.get(targetUserId);
    
    if (targetProfile) {
      if (!targetProfile.rating) {
        targetProfile.rating = rating;
        targetProfile.reviewCount = 1;
      } else {
        const totalRating = targetProfile.rating * targetProfile.reviewCount! + rating;
        targetProfile.reviewCount! += 1;
        targetProfile.rating = totalRating / targetProfile.reviewCount!;
      }
    }

    this.emit('feedbackSubmitted', { matchId, userId, rating, comment });
  }

  /**
   * Get user's active matches
   */
  public getUserMatches(userId: string): MentorshipMatch[] {
    const matches: MentorshipMatch[] = [];
    
    for (const match of this.matches.values()) {
      if ((match.mentorId === userId || match.menteeId === userId) && 
          match.status === 'active') {
        matches.push(match);
      }
    }

    return matches;
  }

  /**
   * Get pending connection requests for a user
   */
  public getPendingRequests(userId: string): ConnectionRequest[] {
    const requests: ConnectionRequest[] = [];
    
    for (const request of this.connectionRequests.values()) {
      if (request.toUserId === userId && request.status === 'pending') {
        requests.push(request);
      }
    }

    return requests;
  }

  /**
   * Load sample profiles for development
   */
  private loadSampleProfiles(): void {
    const sampleProfiles: MentorshipProfile[] = [
      {
        userId: 'mentor1',
        role: 'mentor',
        name: 'Dr. Sarah Chen',
        age: 35,
        gender: 'female',
        pronouns: 'she/her',
        languages: ['English', 'Mandarin'],
        timezone: 'PST',
        areasOfExperience: ['anxiety', 'depression', 'stress management', 'mindfulness'],
        areasSeekingSupport: [],
        preferredTopics: ['coping strategies', 'meditation', 'work-life balance'],
        avoidTopics: [],
        availability: [
          { dayOfWeek: 'Monday', startTime: '18:00', endTime: '21:00' },
          { dayOfWeek: 'Wednesday', startTime: '18:00', endTime: '21:00' },
          { dayOfWeek: 'Saturday', startTime: '10:00', endTime: '14:00' }
        ],
        preferredFrequency: 'weekly',
        preferredDuration: 60,
        culturalBackground: 'Asian',
        verified: true,
        safetyScreeningCompleted: true,
        trainingCompleted: true,
        rating: 4.8,
        reviewCount: 12,
        goals: ['help others', 'share experience', 'give back to community'],
        expectations: ['regular meetings', 'open communication', 'mutual respect'],
        communicationStyle: 'video',
        status: 'active',
        joinedDate: new Date('2024-01-15'),
        lastActive: new Date(),
        currentMatches: [],
        maxMatches: 3
      },
      {
        userId: 'mentee1',
        role: 'mentee',
        name: 'Alex Johnson',
        age: 28,
        gender: 'non-binary',
        pronouns: 'they/them',
        languages: ['English'],
        timezone: 'EST',
        areasOfExperience: [],
        areasSeekingSupport: ['anxiety', 'stress management', 'career transitions'],
        preferredTopics: ['coping strategies', 'work-life balance', 'self-care'],
        avoidTopics: ['substance use'],
        availability: [
          { dayOfWeek: 'Tuesday', startTime: '19:00', endTime: '21:00' },
          { dayOfWeek: 'Thursday', startTime: '19:00', endTime: '21:00' },
          { dayOfWeek: 'Sunday', startTime: '14:00', endTime: '17:00' }
        ],
        preferredFrequency: 'weekly',
        preferredDuration: 45,
        genderPreference: 'any',
        verified: true,
        safetyScreeningCompleted: true,
        trainingCompleted: false,
        goals: ['manage anxiety', 'develop coping skills', 'career guidance'],
        expectations: ['supportive environment', 'practical advice', 'confidentiality'],
        communicationStyle: 'text',
        status: 'active',
        joinedDate: new Date('2024-02-20'),
        lastActive: new Date(),
        currentMatches: [],
        maxMatches: 1
      }
    ];

    sampleProfiles.forEach(profile => this.registerProfile(profile));
  }

  /**
   * Get all profiles (for admin/testing)
   */
  public getAllProfiles(): MentorshipProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get profile by user ID
   */
  public getProfile(userId: string): MentorshipProfile | undefined {
    return this.profiles.get(userId);
  }

  /**
   * Update match session count
   */
  public incrementSessionCount(matchId: string): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.sessions += 1;
      this.emit('sessionRecorded', { matchId, sessions: match.sessions });
    }
  }

  /**
   * Update match message count
   */
  public incrementMessageCount(matchId: string): void {
    const match = this.matches.get(matchId);
    if (match) {
      match.messages += 1;
    }
  }
}

// Export singleton instance
export const mentorshipMatchingService = new MentorshipMatchingService();

// Export for testing
export default MentorshipMatchingService;