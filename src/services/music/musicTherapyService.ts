/**
 * Music Therapy Service
 * Provides therapeutic music features including curated playlists,
 * binaural beats, nature sounds, and personalized recommendations
 */

import { EventEmitter } from 'events';

// Types and Interfaces
export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  url: string;
  category: TherapeuticCategory;
  mood: MoodType[];
  tags: string[];
  isOfflineAvailable?: boolean;
  albumArt?: string;
  bpm?: number;
  key?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  category: TherapeuticCategory;
  tracks: MusicTrack[];
  duration: number;
  coverImage?: string;
  createdAt: Date;
  updatedAt: Date;
  isCustom?: boolean;
  targetMood?: MoodType;
}

export interface BinauralBeat {
  id: string;
  name: string;
  frequency: number; // Hz
  baseFrequency: number;
  category: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';
  description: string;
  benefits: string[];
  duration: number;
}

export interface NatureSound {
  id: string;
  name: string;
  url: string;
  category: 'rain' | 'ocean' | 'forest' | 'wind' | 'fire' | 'birds' | 'white_noise';
  description: string;
  isLoopable: boolean;
  duration: number;
}

export interface MusicSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  playlist?: Playlist;
  tracks: MusicTrack[];
  mood: {
    before: MoodType;
    after?: MoodType;
  };
  category: TherapeuticCategory;
  duration: number;
  feedback?: SessionFeedback;
}

export interface SessionFeedback {
  helpful: boolean;
  rating: number; // 1-5
  notes?: string;
  moodImprovement?: number; // -5 to +5
}

export type TherapeuticCategory = 
  | 'anxiety_relief'
  | 'focus'
  | 'sleep'
  | 'meditation'
  | 'energy_boost'
  | 'depression_support'
  | 'stress_relief'
  | 'emotional_release'
  | 'grounding'
  | 'creativity';

export type MoodType = 
  | 'anxious'
  | 'sad'
  | 'happy'
  | 'calm'
  | 'energetic'
  | 'focused'
  | 'restless'
  | 'overwhelmed'
  | 'peaceful'
  | 'motivated';

export interface PersonalizationProfile {
  userId: string;
  preferredGenres: string[];
  preferredCategories: TherapeuticCategory[];
  avoidedSounds: string[];
  favoriteTracksIds: string[];
  favoritePlaylistIds: string[];
  sessionHistory: MusicSession[];
  recommendations: MusicTrack[];
}

export interface SpotifyConfig {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AppleMusicConfig {
  developerToken?: string;
  userToken?: string;
}

// Music Therapy Service Class
export class MusicTherapyService extends EventEmitter {
  private static instance: MusicTherapyService;
  private audioContext: AudioContext | null = null;
  private playlists: Map<string, Playlist> = new Map();
  private tracks: Map<string, MusicTrack> = new Map();
  private binauralBeats: Map<string, BinauralBeat> = new Map();
  private natureSounds: Map<string, NatureSound> = new Map();
  private sessions: Map<string, MusicSession> = new Map();
  private userProfiles: Map<string, PersonalizationProfile> = new Map();
  private offlineCache: Map<string, ArrayBuffer> = new Map();
  private spotifyConfig: SpotifyConfig = {};
  private appleMusicConfig: AppleMusicConfig = {};
  private currentSession: MusicSession | null = null;

  private constructor() {
    super();
    this.initializeAudioContext();
    this.loadDefaultContent();
    this.initializeOfflineCache();
  }

  public static getInstance(): MusicTherapyService {
    if (!MusicTherapyService.instance) {
      MusicTherapyService.instance = new MusicTherapyService();
    }
    return MusicTherapyService.instance;
  }

  // Initialize audio context for binaural beats generation
  private initializeAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  // Load default therapeutic content
  private loadDefaultContent(): void {
    // Load default playlists
    this.initializeDefaultPlaylists();
    
    // Load binaural beats configurations
    this.initializeBinauralBeats();
    
    // Load nature sounds library
    this.initializeNatureSounds();
  }

  private initializeDefaultPlaylists(): void {
    const defaultPlaylists: Playlist[] = [
      {
        id: 'anxiety-relief-001',
        name: 'Calm Waters',
        description: 'Soothing music to ease anxiety and promote relaxation',
        category: 'anxiety_relief',
        tracks: [],
        duration: 1800,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetMood: 'calm'
      },
      {
        id: 'focus-001',
        name: 'Deep Focus Flow',
        description: 'Instrumental music to enhance concentration',
        category: 'focus',
        tracks: [],
        duration: 2400,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetMood: 'focused'
      },
      {
        id: 'sleep-001',
        name: 'Peaceful Slumber',
        description: 'Gentle melodies to help you fall asleep',
        category: 'sleep',
        tracks: [],
        duration: 3600,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetMood: 'peaceful'
      },
      {
        id: 'meditation-001',
        name: 'Mindful Journey',
        description: 'Ambient sounds for deep meditation',
        category: 'meditation',
        tracks: [],
        duration: 1200,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetMood: 'peaceful'
      },
      {
        id: 'energy-001',
        name: 'Morning Motivation',
        description: 'Uplifting music to boost your energy',
        category: 'energy_boost',
        tracks: [],
        duration: 1500,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetMood: 'energetic'
      }
    ];

    defaultPlaylists.forEach(playlist => {
      this.playlists.set(playlist.id, playlist);
    });
  }

  private initializeBinauralBeats(): void {
    const binauralConfigs: BinauralBeat[] = [
      {
        id: 'delta-sleep',
        name: 'Deep Sleep Delta',
        frequency: 2,
        baseFrequency: 200,
        category: 'delta',
        description: 'Delta waves for deep, restorative sleep',
        benefits: ['Deep sleep', 'Physical healing', 'Unconscious mind access'],
        duration: 1800
      },
      {
        id: 'theta-meditation',
        name: 'Meditation Theta',
        frequency: 6,
        baseFrequency: 200,
        category: 'theta',
        description: 'Theta waves for deep meditation and creativity',
        benefits: ['Deep meditation', 'REM sleep', 'Creativity', 'Intuition'],
        duration: 1200
      },
      {
        id: 'alpha-relaxation',
        name: 'Relaxation Alpha',
        frequency: 10,
        baseFrequency: 200,
        category: 'alpha',
        description: 'Alpha waves for relaxation and stress reduction',
        benefits: ['Relaxation', 'Stress reduction', 'Positive thinking', 'Learning'],
        duration: 900
      },
      {
        id: 'beta-focus',
        name: 'Focus Beta',
        frequency: 20,
        baseFrequency: 200,
        category: 'beta',
        description: 'Beta waves for enhanced focus and alertness',
        benefits: ['Focus', 'Alertness', 'Problem solving', 'Active thinking'],
        duration: 1500
      },
      {
        id: 'gamma-cognition',
        name: 'Cognitive Gamma',
        frequency: 40,
        baseFrequency: 200,
        category: 'gamma',
        description: 'Gamma waves for enhanced cognitive function',
        benefits: ['Cognitive enhancement', 'Memory', 'Consciousness', 'Peak performance'],
        duration: 600
      }
    ];

    binauralConfigs.forEach(config => {
      this.binauralBeats.set(config.id, config);
    });
  }

  private initializeNatureSounds(): void {
    const natureSoundLibrary: NatureSound[] = [
      {
        id: 'rain-gentle',
        name: 'Gentle Rain',
        url: '/audio/nature/rain-gentle.mp3',
        category: 'rain',
        description: 'Soft rainfall for relaxation',
        isLoopable: true,
        duration: 600
      },
      {
        id: 'ocean-waves',
        name: 'Ocean Waves',
        url: '/audio/nature/ocean-waves.mp3',
        category: 'ocean',
        description: 'Calming ocean waves',
        isLoopable: true,
        duration: 600
      },
      {
        id: 'forest-birds',
        name: 'Forest Morning',
        url: '/audio/nature/forest-birds.mp3',
        category: 'forest',
        description: 'Morning forest with bird songs',
        isLoopable: true,
        duration: 600
      },
      {
        id: 'white-noise',
        name: 'White Noise',
        url: '/audio/nature/white-noise.mp3',
        category: 'white_noise',
        description: 'Consistent white noise for focus',
        isLoopable: true,
        duration: 600
      },
      {
        id: 'campfire',
        name: 'Crackling Campfire',
        url: '/audio/nature/campfire.mp3',
        category: 'fire',
        description: 'Warm campfire sounds',
        isLoopable: true,
        duration: 600
      }
    ];

    natureSoundLibrary.forEach(sound => {
      this.natureSounds.set(sound.id, sound);
    });
  }

  // Initialize offline cache for PWA support
  private async initializeOfflineCache(): Promise<void> {
    if ('caches' in window) {
      try {
        const cache = await caches.open('music-therapy-v1');
        // Pre-cache essential tracks
        const essentialUrls = [
          '/audio/nature/rain-gentle.mp3',
          '/audio/nature/white-noise.mp3',
          '/audio/meditation/breathing-guide.mp3'
        ];
        
        await cache.addAll(essentialUrls);
      } catch (error) {
        console.error('Failed to initialize offline cache:', error);
      }
    }
  }

  // Curated Playlist Methods
  public getPlaylistsByCategory(category: TherapeuticCategory): Playlist[] {
    return Array.from(this.playlists.values()).filter(
      playlist => playlist.category === category
    );
  }

  public getPlaylistForMood(mood: MoodType): Playlist[] {
    return Array.from(this.playlists.values()).filter(
      playlist => playlist.targetMood === mood
    );
  }

  public async createCustomPlaylist(
    name: string,
    description: string,
    category: TherapeuticCategory,
    trackIds: string[]
  ): Promise<Playlist> {
    const tracks = trackIds.map(id => this.tracks.get(id)).filter(Boolean) as MusicTrack[];
    const duration = tracks.reduce((sum, track) => sum + track.duration, 0);
    
    const playlist: Playlist = {
      id: `custom-${Date.now()}`,
      name,
      description,
      category,
      tracks,
      duration,
      createdAt: new Date(),
      updatedAt: new Date(),
      isCustom: true
    };

    this.playlists.set(playlist.id, playlist);
    await this.saveToLocalStorage();
    
    return playlist;
  }

  // Binaural Beats Generation
  public generateBinauralBeat(config: BinauralBeat): OscillatorNode[] | null {
    if (!this.audioContext) {
      console.error('Audio context not initialized');
      return null;
    }

    const leftOscillator = this.audioContext.createOscillator();
    const rightOscillator = this.audioContext.createOscillator();
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();
    const merger = this.audioContext.createChannelMerger(2);

    // Set frequencies
    leftOscillator.frequency.value = config.baseFrequency;
    rightOscillator.frequency.value = config.baseFrequency + config.frequency;

    // Set volume
    leftGain.gain.value = 0.3;
    rightGain.gain.value = 0.3;

    // Connect nodes
    leftOscillator.connect(leftGain);
    rightOscillator.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);
    merger.connect(this.audioContext.destination);

    // Start oscillators
    leftOscillator.start();
    rightOscillator.start();

    // Schedule stop
    setTimeout(() => {
      leftOscillator.stop();
      rightOscillator.stop();
    }, config.duration * 1000);

    return [leftOscillator, rightOscillator];
  }

  public getBinauralBeatsByCategory(category: string): BinauralBeat[] {
    return Array.from(this.binauralBeats.values()).filter(
      beat => beat.category === category
    );
  }

  // Nature Sounds Methods
  public getNatureSounds(): NatureSound[] {
    return Array.from(this.natureSounds.values());
  }

  public getNatureSoundsByCategory(category: string): NatureSound[] {
    return Array.from(this.natureSounds.values()).filter(
      sound => sound.category === category
    );
  }

  public async playNatureSound(soundId: string, loop: boolean = true): Promise<HTMLAudioElement> {
    const sound = this.natureSounds.get(soundId);
    if (!sound) {
      throw new Error(`Nature sound ${soundId} not found`);
    }

    const audio = new Audio(sound.url);
    audio.loop = loop && sound.isLoopable;
    audio.volume = 0.5;
    
    try {
      await audio.play();
      return audio;
    } catch (error) {
      console.error('Failed to play nature sound:', error);
      throw error;
    }
  }

  // Personalized Recommendations
  public async getPersonalizedRecommendations(userId: string): Promise<MusicTrack[]> {
    const profile = this.userProfiles.get(userId) || this.createDefaultProfile(userId);
    
    // Analyze session history
    const recentSessions = profile.sessionHistory.slice(-10);
    const preferredCategories = this.analyzePreferredCategories(recentSessions);
    const averageMoodImprovement = this.calculateAverageMoodImprovement(recentSessions);
    
    // Generate recommendations based on analysis
    const recommendations: MusicTrack[] = [];
    
    // Get tracks from preferred categories
    preferredCategories.forEach(category => {
      const categoryTracks = Array.from(this.tracks.values()).filter(
        track => track.category === category
      );
      recommendations.push(...categoryTracks.slice(0, 3));
    });

    // Add tracks similar to favorites
    profile.favoriteTracksIds.forEach(trackId => {
      const track = this.tracks.get(trackId);
      if (track) {
        const similarTracks = this.findSimilarTracks(track);
        recommendations.push(...similarTracks.slice(0, 2));
      }
    });

    // Remove duplicates and limit
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(track => [track.id, track])).values()
    ).slice(0, 20);

    profile.recommendations = uniqueRecommendations;
    this.userProfiles.set(userId, profile);

    return uniqueRecommendations;
  }

  private createDefaultProfile(userId: string): PersonalizationProfile {
    return {
      userId,
      preferredGenres: [],
      preferredCategories: [],
      avoidedSounds: [],
      favoriteTracksIds: [],
      favoritePlaylistIds: [],
      sessionHistory: [],
      recommendations: []
    };
  }

  private analyzePreferredCategories(sessions: MusicSession[]): TherapeuticCategory[] {
    const categoryCount = new Map<TherapeuticCategory, number>();
    
    sessions.forEach(session => {
      const count = categoryCount.get(session.category) || 0;
      categoryCount.set(session.category, count + 1);
    });

    return Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);
  }

  private calculateAverageMoodImprovement(sessions: MusicSession[]): number {
    const improvements = sessions
      .filter(session => session.feedback?.moodImprovement !== undefined)
      .map(session => session.feedback!.moodImprovement!);

    if (improvements.length === 0) return 0;
    
    return improvements.reduce((sum, val) => sum + val, 0) / improvements.length;
  }

  private findSimilarTracks(track: MusicTrack): MusicTrack[] {
    return Array.from(this.tracks.values()).filter(t => {
      if (t.id === track.id) return false;
      
      // Similar if same category or overlapping moods
      const sameCategory = t.category === track.category;
      const similarMoods = t.mood.some(mood => track.mood.includes(mood));
      const similarTags = t.tags.some(tag => track.tags.includes(tag));
      
      return sameCategory || similarMoods || similarTags;
    });
  }

  // Session Tracking
  public startSession(
    userId: string,
    category: TherapeuticCategory,
    mood: MoodType,
    playlist?: Playlist
  ): MusicSession {
    const session: MusicSession = {
      id: `session-${Date.now()}`,
      userId,
      startTime: new Date(),
      playlist,
      tracks: playlist ? playlist.tracks : [],
      mood: { before: mood },
      category,
      duration: 0
    };

    this.currentSession = session;
    this.sessions.set(session.id, session);
    this.emit('sessionStarted', session);

    return session;
  }

  public endSession(sessionId: string, afterMood?: MoodType, feedback?: SessionFeedback): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.duration = (session.endTime.getTime() - session.startTime.getTime()) / 1000;
    
    if (afterMood) {
      session.mood.after = afterMood;
    }
    
    if (feedback) {
      session.feedback = feedback;
    }

    this.sessions.set(sessionId, session);
    
    // Update user profile
    const profile = this.userProfiles.get(session.userId) || this.createDefaultProfile(session.userId);
    profile.sessionHistory.push(session);
    this.userProfiles.set(session.userId, profile);

    this.currentSession = null;
    this.emit('sessionEnded', session);
    
    this.saveToLocalStorage();
  }

  public getSessionHistory(userId: string, limit: number = 10): MusicSession[] {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];
    
    return profile.sessionHistory.slice(-limit);
  }

  public getSessionStats(userId: string): {
    totalSessions: number;
    totalDuration: number;
    averageDuration: number;
    favoriteCategory: TherapeuticCategory | null;
    moodImprovement: number;
  } {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.sessionHistory.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageDuration: 0,
        favoriteCategory: null,
        moodImprovement: 0
      };
    }

    const sessions = profile.sessionHistory;
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = totalDuration / sessions.length;
    const favoriteCategory = this.analyzePreferredCategories(sessions)[0] || null;
    const moodImprovement = this.calculateAverageMoodImprovement(sessions);

    return {
      totalSessions: sessions.length,
      totalDuration,
      averageDuration,
      favoriteCategory,
      moodImprovement
    };
  }

  // Spotify Integration
  public async connectSpotify(config: SpotifyConfig): Promise<boolean> {
    this.spotifyConfig = config;
    
    try {
      if (!config.accessToken) {
        // Initiate OAuth flow
        const authUrl = this.buildSpotifyAuthUrl(config.clientId!, config.redirectUri!);
        window.location.href = authUrl;
        return false;
      }

      // Validate token
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`
        }
      });

      if (response.ok) {
        this.emit('spotifyConnected');
        return true;
      } else if (response.status === 401) {
        // Token expired, refresh
        await this.refreshSpotifyToken();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Spotify connection failed:', error);
      return false;
    }
  }

  private buildSpotifyAuthUrl(clientId: string, redirectUri: string): string {
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'playlist-read-private',
      'playlist-read-collaborative',
      'user-library-read'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: scopes
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  private async refreshSpotifyToken(): Promise<void> {
    if (!this.spotifyConfig.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${this.spotifyConfig.clientId}:${this.spotifyConfig.clientSecret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.spotifyConfig.refreshToken
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.spotifyConfig.accessToken = data.access_token;
        if (data.refresh_token) {
          this.spotifyConfig.refreshToken = data.refresh_token;
        }
        this.emit('spotifyTokenRefreshed');
      }
    } catch (error) {
      console.error('Failed to refresh Spotify token:', error);
      throw error;
    }
  }

  public async searchSpotifyTracks(query: string, limit: number = 20): Promise<any[]> {
    if (!this.spotifyConfig.accessToken) {
      throw new Error('Spotify not connected');
    }

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${this.spotifyConfig.accessToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.tracks.items;
      }

      return [];
    } catch (error) {
      console.error('Spotify search failed:', error);
      return [];
    }
  }

  // Apple Music Integration
  public async connectAppleMusic(config: AppleMusicConfig): Promise<boolean> {
    this.appleMusicConfig = config;
    
    try {
      // Initialize MusicKit
      if (typeof (window as any).MusicKit !== 'undefined') {
        const music = (window as any).MusicKit.configure({
          developerToken: config.developerToken,
          app: {
            name: 'Astral Core Mental Health',
            build: '1.0.0'
          }
        });

        const userToken = await music.authorize();
        this.appleMusicConfig.userToken = userToken;
        this.emit('appleMusicConnected');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Apple Music connection failed:', error);
      return false;
    }
  }

  // Offline Support
  public async cacheTrackForOffline(trackId: string): Promise<boolean> {
    const track = this.tracks.get(trackId);
    if (!track) return false;

    try {
      const response = await fetch(track.url);
      const buffer = await response.arrayBuffer();
      this.offlineCache.set(trackId, buffer);
      
      // Also cache in browser cache
      if ('caches' in window) {
        const cache = await caches.open('music-therapy-v1');
        await cache.put(track.url, new Response(buffer));
      }

      track.isOfflineAvailable = true;
      this.tracks.set(trackId, track);
      
      return true;
    } catch (error) {
      console.error('Failed to cache track:', error);
      return false;
    }
  }

  public async cachePlaylistForOffline(playlistId: string): Promise<boolean> {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) return false;

    const cachePromises = playlist.tracks.map(track => 
      this.cacheTrackForOffline(track.id)
    );

    const results = await Promise.all(cachePromises);
    return results.every(result => result === true);
  }

  public getOfflineContent(): {
    tracks: MusicTrack[];
    playlists: Playlist[];
  } {
    const offlineTracks = Array.from(this.tracks.values()).filter(
      track => track.isOfflineAvailable
    );

    const offlinePlaylists = Array.from(this.playlists.values()).filter(
      playlist => playlist.tracks.every(track => track.isOfflineAvailable)
    );

    return {
      tracks: offlineTracks,
      playlists: offlinePlaylists
    };
  }

  // Favorites Management
  public addToFavorites(userId: string, trackId: string): void {
    const profile = this.userProfiles.get(userId) || this.createDefaultProfile(userId);
    
    if (!profile.favoriteTracksIds.includes(trackId)) {
      profile.favoriteTracksIds.push(trackId);
      this.userProfiles.set(userId, profile);
      this.emit('favoriteAdded', { userId, trackId });
      this.saveToLocalStorage();
    }
  }

  public removeFromFavorites(userId: string, trackId: string): void {
    const profile = this.userProfiles.get(userId);
    if (!profile) return;

    const index = profile.favoriteTracksIds.indexOf(trackId);
    if (index > -1) {
      profile.favoriteTracksIds.splice(index, 1);
      this.userProfiles.set(userId, profile);
      this.emit('favoriteRemoved', { userId, trackId });
      this.saveToLocalStorage();
    }
  }

  public getFavorites(userId: string): MusicTrack[] {
    const profile = this.userProfiles.get(userId);
    if (!profile) return [];

    return profile.favoriteTracksIds
      .map(id => this.tracks.get(id))
      .filter(Boolean) as MusicTrack[];
  }

  // Local Storage Persistence
  private async saveToLocalStorage(): Promise<void> {
    try {
      const data = {
        playlists: Array.from(this.playlists.entries()),
        sessions: Array.from(this.sessions.entries()),
        userProfiles: Array.from(this.userProfiles.entries()),
        spotifyConfig: this.spotifyConfig,
        appleMusicConfig: this.appleMusicConfig
      };

      localStorage.setItem('musicTherapyData', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }

  private async loadFromLocalStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem('musicTherapyData');
      if (!stored) return;

      const data = JSON.parse(stored);
      
      if (data.playlists) {
        this.playlists = new Map(data.playlists);
      }
      
      if (data.sessions) {
        this.sessions = new Map(data.sessions);
      }
      
      if (data.userProfiles) {
        this.userProfiles = new Map(data.userProfiles);
      }
      
      if (data.spotifyConfig) {
        this.spotifyConfig = data.spotifyConfig;
      }
      
      if (data.appleMusicConfig) {
        this.appleMusicConfig = data.appleMusicConfig;
      }
    } catch (error) {
      console.error('Failed to load from local storage:', error);
    }
  }

  // Cleanup
  public dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
export const musicTherapyService = MusicTherapyService.getInstance();