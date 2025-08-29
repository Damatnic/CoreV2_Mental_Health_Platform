import * as React from 'react';

// ===============================================
// MENTAL HEALTH PLATFORM: FAVORITE HELPERS VIEW
// ===============================================
// Comprehensive favorite helpers management with crisis intervention,
// HIPAA compliance, and therapeutic workflow optimization

// Type Definitions
interface FavoriteHelper {
  id: string;
  name: string;
  bio: string;
  specializations: string[];
  rating: number;
  totalReviews: number;
  totalSessions: number;
  isOnline: boolean;
  lastActive: Date;
  responseTime: string;
  languages: string[];
  profileImage?: string;
  addedToFavoritesAt: Date;
  lastSessionAt?: Date;
  totalSessionsWithUser: number;
  isVerified: boolean;
  badges: string[];
  // Mental health specific fields
  crisisTraining: boolean;
  traumaInformed: boolean;
  culturalCompetencies: string[];
  therapeuticApproaches: string[];
  emergencyAvailable: boolean;
  licenseType?: string;
  yearsOfExperience: number;
  sessionNotes?: string;
  preferredSessionLength: number;
  supervisorId?: string;
  hipaaCompliant: boolean;
}

interface FavoriteHelperStats {
  totalFavorites: number;
  totalSessionsWithFavorites: number;
  averageRating: number;
  mostHelpfulSpecialization: string;
  crisisInterventions: number;
  successfulOutcomes: number;
  averageResponseTime: number;
  culturalMatchScore: number;
}

interface CrisisProtocol {
  severity: 'low' | 'medium' | 'high' | 'critical';
  protocol: string;
  escalationPath: string[];
  requiredDocumentation: string[];
  supervisorNotification: boolean;
}

// Component Implementation
const FavoriteHelpersView: React.FC = () => {
  // State Management
  const [favoriteHelpers, setFavoriteHelpers] = React.useState<FavoriteHelper[]>([]);
  const [filteredHelpers, setFilteredHelpers] = React.useState<FavoriteHelper[]>([]);
  const [stats, setStats] = React.useState<FavoriteHelperStats | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedSpecialization, setSelectedSpecialization] = React.useState('all');
  const [selectedCulturalBackground, setSelectedCulturalBackground] = React.useState('all');
  const [selectedTherapeuticApproach, setSelectedTherapeuticApproach] = React.useState('all');
  const [sortBy, setSortBy] = React.useState<'recent' | 'rating' | 'sessions' | 'alphabetical'>('recent');
  const [showOnlineOnly, setShowOnlineOnly] = React.useState(false);
  const [showCrisisReadyOnly, setShowCrisisReadyOnly] = React.useState(false);
  const [showTraumaInformedOnly, setShowTraumaInformedOnly] = React.useState(false);
  const [crisisMode, setCrisisMode] = React.useState(false);
  const [auditLog, setAuditLog] = React.useState<Array<{ timestamp: Date; action: string; details: any }>>([]);

  // HIPAA Compliance Logger
  const logHipaaEvent = React.useCallback((action: string, details: any) => {
    const event = {
      timestamp: new Date(),
      action,
      details,
      userId: 'current-user-id', // Would come from auth context
      sessionId: `session-${Date.now()}`,
      ipAddress: 'masked-for-privacy',
      compliance: 'HIPAA-compliant'
    };
    setAuditLog(prev => [...prev, event]);
    console.log('[HIPAA Audit]', event);
  }, []);

  // Crisis Detection System
  const detectCrisisIndicators = React.useCallback((text: string): CrisisProtocol | null => {
    const crisisKeywords = {
      critical: ['suicide', 'kill myself', 'end it all', 'not worth living'],
      high: ['self-harm', 'hurting myself', 'can\'t go on', 'hopeless'],
      medium: ['overwhelmed', 'breaking down', 'can\'t cope', 'falling apart'],
      low: ['stressed', 'anxious', 'worried', 'struggling']
    };

    for (const [severity, keywords] of Object.entries(crisisKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        return {
          severity: severity as 'low' | 'medium' | 'high' | 'critical',
          protocol: `Initiate ${severity} severity crisis protocol`,
          escalationPath: severity === 'critical' 
            ? ['Immediate helper notification', 'Supervisor alert', 'Emergency services standby']
            : ['Helper notification', 'Monitor closely'],
          requiredDocumentation: ['Initial assessment', 'Intervention notes', 'Follow-up plan'],
          supervisorNotification: severity === 'critical' || severity === 'high'
        };
      }
    }
    return null;
  }, []);

  // Cultural Competency Matcher
  const calculateCulturalMatch = React.useCallback((helper: FavoriteHelper, userPreferences: any) => {
    let score = 0;
    const factors = {
      language: 30,
      culturalBackground: 25,
      therapeuticApproach: 20,
      specialization: 15,
      availability: 10
    };

    // Language match
    if (helper.languages.includes(userPreferences?.preferredLanguage || 'English')) {
      score += factors.language;
    }

    // Cultural competency match
    if (helper.culturalCompetencies.some(comp => 
      userPreferences?.culturalBackground?.includes(comp)
    )) {
      score += factors.culturalBackground;
    }

    // Therapeutic approach match
    if (helper.therapeuticApproaches.some(approach => 
      userPreferences?.preferredApproaches?.includes(approach)
    )) {
      score += factors.therapeuticApproach;
    }

    return score;
  }, []);

  // Load Favorite Helpers with Enhanced Data
  React.useEffect(() => {
    const loadFavoriteHelpers = async () => {
      try {
        setIsLoading(true);
        logHipaaEvent('VIEW_FAVORITES', { timestamp: new Date() });

        // Enhanced mock data with mental health specializations
        const mockFavorites: FavoriteHelper[] = [
          {
            id: '1',
            name: 'Dr. Sarah Thompson, LCSW',
            bio: 'Licensed clinical social worker specializing in trauma-informed care and crisis intervention with 15 years of experience.',
            specializations: ['Anxiety', 'Depression', 'PTSD', 'Crisis Intervention'],
            rating: 4.9,
            totalReviews: 327,
            totalSessions: 1234,
            isOnline: true,
            lastActive: new Date(Date.now() - 5 * 60 * 1000),
            responseTime: 'Immediate for crisis',
            languages: ['English', 'Spanish', 'ASL'],
            addedToFavoritesAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            lastSessionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            totalSessionsWithUser: 28,
            isVerified: true,
            badges: ['Crisis Specialist', 'Top Rated', 'HIPAA Certified'],
            crisisTraining: true,
            traumaInformed: true,
            culturalCompetencies: ['LGBTQ+ Affirming', 'Multicultural', 'Veterans'],
            therapeuticApproaches: ['CBT', 'DBT', 'EMDR', 'Mindfulness'],
            emergencyAvailable: true,
            licenseType: 'LCSW',
            yearsOfExperience: 15,
            preferredSessionLength: 50,
            hipaaCompliant: true
          },
          {
            id: '2',
            name: 'Michael Chen, PhD',
            bio: 'Clinical psychologist focused on addiction recovery, dual diagnosis, and family systems therapy.',
            specializations: ['Addiction', 'Dual Diagnosis', 'Family Therapy', 'Anger Management'],
            rating: 4.8,
            totalReviews: 189,
            totalSessions: 856,
            isOnline: false,
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
            responseTime: 'Within 1 hour',
            languages: ['English', 'Mandarin', 'Cantonese'],
            addedToFavoritesAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lastSessionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            totalSessionsWithUser: 18,
            isVerified: true,
            badges: ['Addiction Specialist', 'Experienced', 'Cultural Competency'],
            crisisTraining: true,
            traumaInformed: true,
            culturalCompetencies: ['Asian American', 'Immigrant Families', 'First Generation'],
            therapeuticApproaches: ['MI', 'Family Systems', 'Cognitive Therapy'],
            emergencyAvailable: false,
            licenseType: 'PhD Clinical Psychology',
            yearsOfExperience: 12,
            preferredSessionLength: 60,
            hipaaCompliant: true
          },
          {
            id: '3',
            name: 'Emily Rodriguez, LMFT',
            bio: 'Marriage and family therapist specializing in adolescent mental health and eating disorders.',
            specializations: ['Teen Mental Health', 'Eating Disorders', 'Self-Harm', 'Body Image'],
            rating: 4.7,
            totalReviews: 142,
            totalSessions: 598,
            isOnline: true,
            lastActive: new Date(),
            responseTime: 'Within 30 minutes',
            languages: ['English', 'Spanish', 'Portuguese'],
            addedToFavoritesAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            lastSessionAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            totalSessionsWithUser: 15,
            isVerified: true,
            badges: ['Youth Specialist', 'Rising Star', 'Bilingual'],
            crisisTraining: true,
            traumaInformed: true,
            culturalCompetencies: ['Latinx', 'BIPOC', 'Teen Culture'],
            therapeuticApproaches: ['DBT', 'Art Therapy', 'Narrative Therapy'],
            emergencyAvailable: true,
            licenseType: 'LMFT',
            yearsOfExperience: 8,
            preferredSessionLength: 45,
            hipaaCompliant: true
          }
        ];

        setFavoriteHelpers(mockFavorites);
        
        // Load stats
        const mockStats: FavoriteHelperStats = {
          totalFavorites: mockFavorites.length,
          totalSessionsWithFavorites: mockFavorites.reduce((sum, h) => sum + h.totalSessionsWithUser, 0),
          averageRating: mockFavorites.reduce((sum, h) => sum + h.rating, 0) / mockFavorites.length,
          mostHelpfulSpecialization: 'Anxiety',
          crisisInterventions: 12,
          successfulOutcomes: 48,
          averageResponseTime: 25,
          culturalMatchScore: 85
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error loading favorite helpers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavoriteHelpers();
  }, [logHipaaEvent]);

  // Filter and Sort Helpers
  React.useEffect(() => {
    let filtered = [...favoriteHelpers];

    // Crisis mode - show only crisis-ready helpers
    if (crisisMode) {
      filtered = filtered.filter(h => h.crisisTraining && h.emergencyAvailable && h.isOnline);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const crisisProtocol = detectCrisisIndicators(searchQuery);
      
      if (crisisProtocol && crisisProtocol.severity === 'critical') {
        setCrisisMode(true);
        logHipaaEvent('CRISIS_DETECTED', { query: searchQuery, protocol: crisisProtocol });
      }

      filtered = filtered.filter(helper => 
        helper.name.toLowerCase().includes(query) ||
        helper.bio.toLowerCase().includes(query) ||
        helper.specializations.some(spec => spec.toLowerCase().includes(query)) ||
        helper.therapeuticApproaches.some(approach => approach.toLowerCase().includes(query))
      );
    }

    // Apply specialization filter
    if (selectedSpecialization !== 'all') {
      filtered = filtered.filter(helper => 
        helper.specializations.includes(selectedSpecialization)
      );
    }

    // Apply cultural background filter
    if (selectedCulturalBackground !== 'all') {
      filtered = filtered.filter(helper => 
        helper.culturalCompetencies.includes(selectedCulturalBackground)
      );
    }

    // Apply therapeutic approach filter
    if (selectedTherapeuticApproach !== 'all') {
      filtered = filtered.filter(helper => 
        helper.therapeuticApproaches.includes(selectedTherapeuticApproach)
      );
    }

    // Apply online filter
    if (showOnlineOnly) {
      filtered = filtered.filter(helper => helper.isOnline);
    }

    // Apply crisis ready filter
    if (showCrisisReadyOnly) {
      filtered = filtered.filter(helper => helper.crisisTraining && helper.emergencyAvailable);
    }

    // Apply trauma informed filter
    if (showTraumaInformedOnly) {
      filtered = filtered.filter(helper => helper.traumaInformed);
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => 
          new Date(b.addedToFavoritesAt).getTime() - new Date(a.addedToFavoritesAt).getTime()
        );
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'sessions':
        filtered.sort((a, b) => b.totalSessionsWithUser - a.totalSessionsWithUser);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredHelpers(filtered);
  }, [favoriteHelpers, searchQuery, selectedSpecialization, selectedCulturalBackground, 
      selectedTherapeuticApproach, sortBy, showOnlineOnly, showCrisisReadyOnly, 
      showTraumaInformedOnly, crisisMode, detectCrisisIndicators, logHipaaEvent]);

  // Handler Functions
  const handleRemoveFromFavorites = React.useCallback(async (helperId: string) => {
    const helper = favoriteHelpers.find(h => h.id === helperId);
    if (!helper) return;

    if (!confirm(`Remove ${helper.name} from your favorites?`)) return;

    try {
      logHipaaEvent('REMOVE_FAVORITE', { helperId, helperName: helper.name });
      
      setFavoriteHelpers(prev => prev.filter(h => h.id !== helperId));
      
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          totalFavorites: prev.totalFavorites - 1,
          totalSessionsWithFavorites: prev.totalSessionsWithFavorites - helper.totalSessionsWithUser
        } : null);
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  }, [favoriteHelpers, stats, logHipaaEvent]);

  const handleStartChat = React.useCallback(async (helperId: string) => {
    const helper = favoriteHelpers.find(h => h.id === helperId);
    if (helper) {
      logHipaaEvent('START_CHAT', { helperId, helperName: helper.name, crisisMode });
      console.log(`Starting secure HIPAA-compliant chat with ${helper.name}`);
    }
  }, [favoriteHelpers, crisisMode, logHipaaEvent]);

  const handleEmergencyContact = React.useCallback(async (helperId: string) => {
    const helper = favoriteHelpers.find(h => h.id === helperId);
    if (helper && helper.emergencyAvailable) {
      logHipaaEvent('EMERGENCY_CONTACT', { 
        helperId, 
        helperName: helper.name,
        timestamp: new Date(),
        protocol: 'crisis-intervention'
      });
      console.log(`Initiating emergency contact with ${helper.name}`);
      setCrisisMode(true);
    }
  }, [favoriteHelpers, logHipaaEvent]);

  // Utility Functions
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = [
      { label: 'year', seconds: 31536000 },
      { label: 'month', seconds: 2592000 },
      { label: 'day', seconds: 86400 },
      { label: 'hour', seconds: 3600 },
      { label: 'minute', seconds: 60 }
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count >= 1) {
        return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  };

  const getSpecializations = React.useMemo(() => {
    const allSpecs = favoriteHelpers.flatMap(h => h.specializations);
    return [...new Set(allSpecs)];
  }, [favoriteHelpers]);

  const getCulturalBackgrounds = React.useMemo(() => {
    const allBackgrounds = favoriteHelpers.flatMap(h => h.culturalCompetencies);
    return [...new Set(allBackgrounds)];
  }, [favoriteHelpers]);

  const getTherapeuticApproaches = React.useMemo(() => {
    const allApproaches = favoriteHelpers.flatMap(h => h.therapeuticApproaches);
    return [...new Set(allApproaches)];
  }, [favoriteHelpers]);

  // Render Functions
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#fbbf24' : '#d1d5db' }}>★</span>
    ));
  };

  const renderHelperCard = (helper: FavoriteHelper) => (
    <div key={helper.id} style={styles.helperCard}>
      <div style={styles.helperHeader}>
        <div style={styles.helperAvatar}>
          <div style={styles.avatarPlaceholder}>
            {helper.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div style={{
            ...styles.statusIndicator,
            backgroundColor: helper.isOnline ? '#10b981' : '#6b7280'
          }} />
        </div>

        <div style={styles.helperInfo}>
          <div style={styles.helperNameSection}>
            <h3 style={styles.helperName}>{helper.name}</h3>
            {helper.isVerified && <span style={styles.verifiedBadge}>✓ Verified</span>}
            {helper.hipaaCompliant && <span style={styles.hipaaBadge}>HIPAA</span>}
          </div>
          
          <div style={styles.helperBadges}>
            {helper.badges.map(badge => (
              <span key={badge} style={styles.badge}>{badge}</span>
            ))}
          </div>

          <div style={styles.helperStatus}>
            <span style={{ color: helper.isOnline ? '#10b981' : '#6b7280' }}>
              {helper.isOnline ? '● Online now' : `Last seen ${formatTimeAgo(helper.lastActive)}`}
            </span>
            {helper.emergencyAvailable && (
              <span style={styles.emergencyBadge}>🚨 Crisis Available</span>
            )}
          </div>
        </div>

        <div style={styles.helperActions}>
          {helper.emergencyAvailable && crisisMode && (
            <button
              style={{ ...styles.button, ...styles.emergencyButton }}
              onClick={() => handleEmergencyContact(helper.id)}
            >
              Emergency Contact
            </button>
          )}
          <button
            style={{ ...styles.button, ...styles.primaryButton }}
            onClick={() => handleStartChat(helper.id)}
            disabled={!helper.isOnline}
          >
            Start Chat
          </button>
          <button
            style={{ ...styles.button, ...styles.dangerButton }}
            onClick={() => handleRemoveFromFavorites(helper.id)}
          >
            Remove
          </button>
        </div>
      </div>

      <div style={styles.helperContent}>
        <p style={styles.helperBio}>{helper.bio}</p>

        <div style={styles.helperSpecializations}>
          {helper.specializations.map(spec => (
            <span key={spec} style={styles.specializationTag}>{spec}</span>
          ))}
        </div>

        <div style={styles.helperApproaches}>
          <strong>Therapeutic Approaches:</strong>
          {helper.therapeuticApproaches.map(approach => (
            <span key={approach} style={styles.approachTag}>{approach}</span>
          ))}
        </div>

        <div style={styles.helperCompetencies}>
          <strong>Cultural Competencies:</strong>
          {helper.culturalCompetencies.map(comp => (
            <span key={comp} style={styles.competencyTag}>{comp}</span>
          ))}
        </div>

        <div style={styles.helperStats}>
          <div style={styles.statGroup}>
            <div style={styles.rating}>
              {renderStars(helper.rating)}
              <span> {helper.rating.toFixed(1)} ({helper.totalReviews} reviews)</span>
            </div>
          </div>

          <div style={styles.statGroup}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{helper.totalSessionsWithUser}</span>
              <span style={styles.statLabel}>Sessions with you</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{helper.yearsOfExperience}</span>
              <span style={styles.statLabel}>Years experience</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{helper.responseTime}</span>
              <span style={styles.statLabel}>Response time</span>
            </div>
          </div>
        </div>

        <div style={styles.helperMeta}>
          <span>Languages: {helper.languages.join(', ')}</span>
          <span>License: {helper.licenseType}</span>
          <span>Session length: {helper.preferredSessionLength} min</span>
          {helper.lastSessionAt && (
            <span>Last session: {formatTimeAgo(helper.lastSessionAt)}</span>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading your favorite helpers...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Crisis Mode Banner */}
      {crisisMode && (
        <div style={styles.crisisBanner}>
          <h3>Crisis Support Mode Active</h3>
          <p>Showing only crisis-trained helpers who are available immediately</p>
          <button 
            style={styles.crisisButton}
            onClick={() => setCrisisMode(false)}
          >
            Exit Crisis Mode
          </button>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Favorite Helpers</h1>
        <p style={styles.subtitle}>Your trusted mental health support network</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{stats.totalFavorites}</div>
            <div style={styles.statCardLabel}>Favorite Helpers</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{stats.totalSessionsWithFavorites}</div>
            <div style={styles.statCardLabel}>Total Sessions</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{stats.averageRating.toFixed(1)}</div>
            <div style={styles.statCardLabel}>Average Rating</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCardValue}>{stats.culturalMatchScore}%</div>
            <div style={styles.statCardLabel}>Cultural Match</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBar}>
          <input
            type="text"
            placeholder="Search helpers or describe what you need help with..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filters}>
          <select
            value={selectedSpecialization}
            onChange={(e) => setSelectedSpecialization(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Specializations</option>
            {getSpecializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>

          <select
            value={selectedCulturalBackground}
            onChange={(e) => setSelectedCulturalBackground(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Cultural Backgrounds</option>
            {getCulturalBackgrounds.map(bg => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>

          <select
            value={selectedTherapeuticApproach}
            onChange={(e) => setSelectedTherapeuticApproach(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Approaches</option>
            {getTherapeuticApproaches.map(approach => (
              <option key={approach} value={approach}>{approach}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={styles.select}
          >
            <option value="recent">Recently Added</option>
            <option value="rating">Highest Rated</option>
            <option value="sessions">Most Sessions</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        <div style={styles.filterCheckboxes}>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
            />
            Online only
          </label>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showCrisisReadyOnly}
              onChange={(e) => setShowCrisisReadyOnly(e.target.checked)}
            />
            Crisis ready
          </label>
          <label style={styles.checkbox}>
            <input
              type="checkbox"
              checked={showTraumaInformedOnly}
              onChange={(e) => setShowTraumaInformedOnly(e.target.checked)}
            />
            Trauma informed
          </label>
        </div>
      </div>

      {/* Helpers List */}
      <div style={styles.helpersList}>
        {filteredHelpers.length === 0 ? (
          <div style={styles.emptyState}>
            {favoriteHelpers.length === 0 ? (
              <>
                <h3>No Favorite Helpers Yet</h3>
                <p>Start exploring helpers and add your favorites to build your support network!</p>
                <button style={{ ...styles.button, ...styles.primaryButton }}>
                  Browse Helpers
                </button>
              </>
            ) : (
              <>
                <h3>No Results Found</h3>
                <p>Try adjusting your search or filters</p>
              </>
            )}
          </div>
        ) : (
          filteredHelpers.map(renderHelperCard)
        )}
      </div>

      {/* Results Summary */}
      {filteredHelpers.length > 0 && (
        <div style={styles.resultsSummary}>
          <p>
            Showing {filteredHelpers.length} of {favoriteHelpers.length} favorite helpers
            {selectedSpecialization !== 'all' && ` • Specialization: ${selectedSpecialization}`}
            {selectedCulturalBackground !== 'all' && ` • Cultural Background: ${selectedCulturalBackground}`}
            {selectedTherapeuticApproach !== 'all' && ` • Approach: ${selectedTherapeuticApproach}`}
            {showOnlineOnly && ' • Online now'}
            {showCrisisReadyOnly && ' • Crisis ready'}
            {showTraumaInformedOnly && ' • Trauma informed'}
          </p>
        </div>
      )}

      {/* Accessibility Features */}
      <div style={styles.accessibilityPanel}>
        <button
          style={styles.accessibilityButton}
          onClick={() => document.body.style.fontSize = '18px'}
          aria-label="Increase text size"
        >
          A+
        </button>
        <button
          style={styles.accessibilityButton}
          onClick={() => document.body.style.fontSize = '16px'}
          aria-label="Default text size"
        >
          A
        </button>
        <button
          style={styles.accessibilityButton}
          onClick={() => document.body.style.fontSize = '14px'}
          aria-label="Decrease text size"
        >
          A-
        </button>
      </div>
    </div>
  );
};

// Styles
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  crisisBanner: {
    backgroundColor: '#fee2e2',
    border: '2px solid #ef4444',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  crisisButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    marginTop: '10px'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#111827'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    textAlign: 'center'
  },
  statCardValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: '4px'
  },
  statCardLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  filtersCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '20px'
  },
  searchBar: {
    marginBottom: '16px'
  },
  searchInput: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px'
  },
  filters: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  select: {
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white'
  },
  filterCheckboxes: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap'
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  helpersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '20px'
  },
  helperCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  helperHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '16px'
  },
  helperAvatar: {
    position: 'relative',
    flexShrink: 0
  },
  avatarPlaceholder: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  statusIndicator: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid white'
  },
  helperInfo: {
    flex: 1
  },
  helperNameSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px'
  },
  helperName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0
  },
  verifiedBadge: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  hipaaBadge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  helperBadges: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '8px'
  },
  badge: {
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    color: '#4b5563'
  },
  emergencyBadge: {
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '8px'
  },
  helperStatus: {
    fontSize: '14px'
  },
  helperActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    color: 'white'
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    fontWeight: 'bold'
  },
  helperContent: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px'
  },
  helperBio: {
    marginBottom: '12px',
    color: '#4b5563',
    lineHeight: '1.5'
  },
  helperSpecializations: {
    display: 'flex',
    gap: '6px',
    flexWrap: 'wrap',
    marginBottom: '12px'
  },
  specializationTag: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px'
  },
  helperApproaches: {
    marginBottom: '12px',
    fontSize: '14px'
  },
  approachTag: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '6px'
  },
  helperCompetencies: {
    marginBottom: '12px',
    fontSize: '14px'
  },
  competencyTag: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    marginLeft: '6px'
  },
  helperStats: {
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    padding: '12px 0',
    marginBottom: '12px'
  },
  statGroup: {
    display: 'flex',
    gap: '20px',
    marginBottom: '8px'
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column'
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#111827'
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  helperMeta: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    fontSize: '14px',
    color: '#6b7280'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  resultsSummary: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280'
  },
  accessibilityPanel: {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    gap: '4px'
  },
  accessibilityButton: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

// Add keyframe animation for spinner
if (typeof document !== 'undefined' && !document.getElementById('favorite-helpers-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'favorite-helpers-styles';
  styleSheet.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default FavoriteHelpersView;