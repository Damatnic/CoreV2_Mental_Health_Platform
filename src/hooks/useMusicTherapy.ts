/**
 * Music Therapy Hook
 * Custom hook for managing music therapy state and functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  musicTherapyService,
  MusicTrack,
  Playlist,
  MusicSession,
  TherapeuticCategory,
  MoodType,
  BinauralBeat,
  NatureSound,
  PersonalizationProfile
} from '../services/music/musicTherapyService';
import { useAuth } from '../contexts/AuthContext';

interface MusicTherapyState {
  // Playback state
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  currentPlaylist: Playlist | null;
  currentTime: number;
  duration: number;
  volume: number;
  playbackSpeed: number;
  isRepeat: boolean;
  isShuffle: boolean;
  
  // Session state
  currentSession: MusicSession | null;
  sessionActive: boolean;
  sessionTimer: number;
  sessionHistory: MusicSession[];
  
  // Therapeutic features
  selectedCategory: TherapeuticCategory;
  selectedMood: MoodType;
  breathingSync: boolean;
  activeBinauralBeat: BinauralBeat | null;
  activeNatureSounds: Set<string>;
  
  // User preferences
  favorites: MusicTrack[];
  playlists: Playlist[];
  recommendations: MusicTrack[];
  offlineContent: { tracks: MusicTrack[]; playlists: Playlist[] };
  
  // Integration state
  spotifyConnected: boolean;
  appleMusicConnected: boolean;
}

interface MusicTherapyActions {
  // Playback controls
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  
  // Track and playlist management
  selectTrack: (track: MusicTrack) => void;
  selectPlaylist: (playlist: Playlist) => void;
  createPlaylist: (name: string, description: string, category: TherapeuticCategory, trackIds: string[]) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => void;
  addToFavorites: (trackId: string) => void;
  removeFromFavorites: (trackId: string) => void;
  
  // Session management
  startSession: (category: TherapeuticCategory, mood: MoodType) => void;
  endSession: (afterMood?: MoodType, feedback?: any) => void;
  setSessionTimer: (seconds: number) => void;
  
  // Therapeutic features
  setCategory: (category: TherapeuticCategory) => void;
  setMood: (mood: MoodType) => void;
  toggleBreathingSync: () => void;
  playBinauralBeat: (beat: BinauralBeat) => void;
  stopBinauralBeat: () => void;
  toggleNatureSound: (sound: NatureSound) => void;
  
  // Recommendations and personalization
  loadRecommendations: () => Promise<void>;
  updatePreferences: (preferences: Partial<PersonalizationProfile>) => void;
  
  // Offline support
  cacheTrackForOffline: (trackId: string) => Promise<boolean>;
  cachePlaylistForOffline: (playlistId: string) => Promise<boolean>;
  loadOfflineContent: () => void;
  
  // Integration
  connectSpotify: (config: any) => Promise<boolean>;
  connectAppleMusic: (config: any) => Promise<boolean>;
  searchSpotify: (query: string) => Promise<any[]>;
}

export interface UseMusicTherapyReturn {
  state: MusicTherapyState;
  actions: MusicTherapyActions;
  isLoading: boolean;
  error: string | null;
}

export const useMusicTherapy = (): UseMusicTherapyReturn => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state
  const [state, setState] = useState<MusicTherapyState>({
    // Playback state
    isPlaying: false,
    currentTrack: null,
    currentPlaylist: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    playbackSpeed: 1,
    isRepeat: false,
    isShuffle: false,
    
    // Session state
    currentSession: null,
    sessionActive: false,
    sessionTimer: 1800,
    sessionHistory: [],
    
    // Therapeutic features
    selectedCategory: 'anxiety_relief',
    selectedMood: 'anxious',
    breathingSync: false,
    activeBinauralBeat: null,
    activeNatureSounds: new Set(),
    
    // User preferences
    favorites: [],
    playlists: [],
    recommendations: [],
    offlineContent: { tracks: [], playlists: [] },
    
    // Integration state
    spotifyConnected: false,
    appleMusicConnected: false
  });

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
      audioRef.current.playbackRate = state.playbackSpeed;
      
      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('ended', handleTrackEnded);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('ended', handleTrackEnded);
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [user]);

  // Handle session timer
  useEffect(() => {
    if (state.sessionActive && state.sessionTimer > 0) {
      sessionTimerRef.current = setInterval(() => {
        setState(prev => {
          if (prev.sessionTimer <= 1) {
            actions.endSession();
            return { ...prev, sessionTimer: 0 };
          }
          return { ...prev, sessionTimer: prev.sessionTimer - 1 };
        });
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    }
    
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [state.sessionActive, state.sessionTimer]);

  // Update audio element when track changes
  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      audioRef.current.src = state.currentTrack.url;
      if (state.isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [state.currentTrack]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setState(prev => ({ ...prev, currentTime: audioRef.current!.currentTime }));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setState(prev => ({ ...prev, duration: audioRef.current!.duration }));
    }
  };

  const handleTrackEnded = () => {
    if (state.isRepeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      actions.skipToNext();
    }
  };

  // Load initial data
  const loadInitialData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Load user's playlists
      const playlists = Array.from(musicTherapyService['playlists'].values());
      
      // Load user's favorites
      const favorites = musicTherapyService.getFavorites(user.id);
      
      // Load session history
      const sessionHistory = musicTherapyService.getSessionHistory(user.id);
      
      // Load offline content
      const offlineContent = musicTherapyService.getOfflineContent();
      
      setState(prev => ({
        ...prev,
        playlists,
        favorites,
        sessionHistory,
        offlineContent
      }));
    } catch (err) {
      setError('Failed to load music therapy data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const actions: MusicTherapyActions = {
    // Playback controls
    play: useCallback(() => {
      if (audioRef.current && state.currentTrack) {
        audioRef.current.play();
        setState(prev => ({ ...prev, isPlaying: true }));
        
        // Start session if not active
        if (!state.sessionActive && user) {
          actions.startSession(state.selectedCategory, state.selectedMood);
        }
      }
    }, [state.currentTrack, state.sessionActive, user]),

    pause: useCallback(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        setState(prev => ({ ...prev, isPlaying: false }));
      }
    }, []),

    togglePlayPause: useCallback(() => {
      if (state.isPlaying) {
        actions.pause();
      } else {
        actions.play();
      }
    }, [state.isPlaying]),

    skipToNext: useCallback(() => {
      if (!state.currentPlaylist || !state.currentTrack) return;
      
      const tracks = state.currentPlaylist.tracks;
      const currentIndex = tracks.findIndex(t => t.id === state.currentTrack!.id);
      let nextIndex;
      
      if (state.isShuffle) {
        nextIndex = Math.floor(Math.random() * tracks.length);
      } else {
        nextIndex = (currentIndex + 1) % tracks.length;
      }
      
      setState(prev => ({ ...prev, currentTrack: tracks[nextIndex] }));
    }, [state.currentPlaylist, state.currentTrack, state.isShuffle]),

    skipToPrevious: useCallback(() => {
      if (!state.currentPlaylist || !state.currentTrack) return;
      
      const tracks = state.currentPlaylist.tracks;
      const currentIndex = tracks.findIndex(t => t.id === state.currentTrack!.id);
      const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
      
      setState(prev => ({ ...prev, currentTrack: tracks[prevIndex] }));
    }, [state.currentPlaylist, state.currentTrack]),

    seek: useCallback((time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setState(prev => ({ ...prev, currentTime: time }));
      }
    }, []),

    setVolume: useCallback((volume: number) => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      setState(prev => ({ ...prev, volume }));
    }, []),

    setPlaybackSpeed: useCallback((speed: number) => {
      if (audioRef.current) {
        audioRef.current.playbackRate = speed;
      }
      setState(prev => ({ ...prev, playbackSpeed: speed }));
    }, []),

    toggleRepeat: useCallback(() => {
      setState(prev => ({ ...prev, isRepeat: !prev.isRepeat }));
    }, []),

    toggleShuffle: useCallback(() => {
      setState(prev => ({ ...prev, isShuffle: !prev.isShuffle }));
    }, []),

    // Track and playlist management
    selectTrack: useCallback((track: MusicTrack) => {
      setState(prev => ({ ...prev, currentTrack: track }));
    }, []),

    selectPlaylist: useCallback((playlist: Playlist) => {
      setState(prev => ({
        ...prev,
        currentPlaylist: playlist,
        currentTrack: playlist.tracks[0] || null
      }));
    }, []),

    createPlaylist: useCallback(async (
      name: string,
      description: string,
      category: TherapeuticCategory,
      trackIds: string[]
    ) => {
      const playlist = await musicTherapyService.createCustomPlaylist(
        name,
        description,
        category,
        trackIds
      );
      
      setState(prev => ({
        ...prev,
        playlists: [...prev.playlists, playlist]
      }));
      
      return playlist;
    }, []),

    deletePlaylist: useCallback((playlistId: string) => {
      musicTherapyService['playlists'].delete(playlistId);
      setState(prev => ({
        ...prev,
        playlists: prev.playlists.filter(p => p.id !== playlistId)
      }));
    }, []),

    addToFavorites: useCallback((trackId: string) => {
      if (!user) return;
      
      musicTherapyService.addToFavorites(user.id, trackId);
      const track = musicTherapyService['tracks'].get(trackId);
      
      if (track) {
        setState(prev => ({
          ...prev,
          favorites: [...prev.favorites, track]
        }));
      }
    }, [user]),

    removeFromFavorites: useCallback((trackId: string) => {
      if (!user) return;
      
      musicTherapyService.removeFromFavorites(user.id, trackId);
      setState(prev => ({
        ...prev,
        favorites: prev.favorites.filter(t => t.id !== trackId)
      }));
    }, [user]),

    // Session management
    startSession: useCallback((category: TherapeuticCategory, mood: MoodType) => {
      if (!user) return;
      
      const session = musicTherapyService.startSession(
        user.id,
        category,
        mood,
        state.currentPlaylist || undefined
      );
      
      setState(prev => ({
        ...prev,
        currentSession: session,
        sessionActive: true
      }));
    }, [user, state.currentPlaylist]),

    endSession: useCallback((afterMood?: MoodType, feedback?: any) => {
      if (!state.currentSession || !user) return;
      
      musicTherapyService.endSession(
        state.currentSession.id,
        afterMood,
        feedback
      );
      
      setState(prev => ({
        ...prev,
        currentSession: null,
        sessionActive: false,
        sessionHistory: [...prev.sessionHistory, prev.currentSession!]
      }));
      
      // Pause playback
      actions.pause();
    }, [state.currentSession, user]),

    setSessionTimer: useCallback((seconds: number) => {
      setState(prev => ({ ...prev, sessionTimer: seconds }));
    }, []),

    // Therapeutic features
    setCategory: useCallback((category: TherapeuticCategory) => {
      setState(prev => ({ ...prev, selectedCategory: category }));
      
      // Load playlists for new category
      const categoryPlaylists = musicTherapyService.getPlaylistsByCategory(category);
      if (categoryPlaylists.length > 0) {
        actions.selectPlaylist(categoryPlaylists[0]);
      }
    }, []),

    setMood: useCallback((mood: MoodType) => {
      setState(prev => ({ ...prev, selectedMood: mood }));
      
      // Load playlists for mood
      const moodPlaylists = musicTherapyService.getPlaylistForMood(mood);
      if (moodPlaylists.length > 0) {
        actions.selectPlaylist(moodPlaylists[0]);
      }
    }, []),

    toggleBreathingSync: useCallback(() => {
      setState(prev => ({ ...prev, breathingSync: !prev.breathingSync }));
    }, []),

    playBinauralBeat: useCallback((beat: BinauralBeat) => {
      musicTherapyService.generateBinauralBeat(beat);
      setState(prev => ({ ...prev, activeBinauralBeat: beat }));
    }, []),

    stopBinauralBeat: useCallback(() => {
      setState(prev => ({ ...prev, activeBinauralBeat: null }));
    }, []),

    toggleNatureSound: useCallback(async (sound: NatureSound) => {
      const newSounds = new Set(state.activeNatureSounds);
      
      if (newSounds.has(sound.id)) {
        newSounds.delete(sound.id);
      } else {
        await musicTherapyService.playNatureSound(sound.id);
        newSounds.add(sound.id);
      }
      
      setState(prev => ({ ...prev, activeNatureSounds: newSounds }));
    }, [state.activeNatureSounds]),

    // Recommendations and personalization
    loadRecommendations: useCallback(async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const recommendations = await musicTherapyService.getPersonalizedRecommendations(user.id);
        setState(prev => ({ ...prev, recommendations }));
      } catch (err) {
        setError('Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    }, [user]),

    updatePreferences: useCallback((preferences: Partial<PersonalizationProfile>) => {
      if (!user) return;
      
      const profile = musicTherapyService['userProfiles'].get(user.id);
      if (profile) {
        const updatedProfile = { ...profile, ...preferences };
        musicTherapyService['userProfiles'].set(user.id, updatedProfile);
      }
    }, [user]),

    // Offline support
    cacheTrackForOffline: useCallback(async (trackId: string) => {
      const success = await musicTherapyService.cacheTrackForOffline(trackId);
      if (success) {
        const offlineContent = musicTherapyService.getOfflineContent();
        setState(prev => ({ ...prev, offlineContent }));
      }
      return success;
    }, []),

    cachePlaylistForOffline: useCallback(async (playlistId: string) => {
      const success = await musicTherapyService.cachePlaylistForOffline(playlistId);
      if (success) {
        const offlineContent = musicTherapyService.getOfflineContent();
        setState(prev => ({ ...prev, offlineContent }));
      }
      return success;
    }, []),

    loadOfflineContent: useCallback(() => {
      const offlineContent = musicTherapyService.getOfflineContent();
      setState(prev => ({ ...prev, offlineContent }));
    }, []),

    // Integration
    connectSpotify: useCallback(async (config: any) => {
      const connected = await musicTherapyService.connectSpotify(config);
      setState(prev => ({ ...prev, spotifyConnected: connected }));
      return connected;
    }, []),

    connectAppleMusic: useCallback(async (config: any) => {
      const connected = await musicTherapyService.connectAppleMusic(config);
      setState(prev => ({ ...prev, appleMusicConnected: connected }));
      return connected;
    }, []),

    searchSpotify: useCallback(async (query: string) => {
      return await musicTherapyService.searchSpotifyTracks(query);
    }, [])
  };

  return {
    state,
    actions,
    isLoading,
    error
  };
};