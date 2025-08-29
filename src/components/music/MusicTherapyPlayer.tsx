/**
 * Music Therapy Player Component
 * Interactive audio player with visualization, mood-based selection,
 * breathing sync, and therapeutic features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Heart,
  Clock,
  Repeat,
  Shuffle,
  Download,
  Music,
  Waves,
  Wind,
  Moon,
  Sun,
  Brain,
  Activity
} from 'lucide-react';
import { 
  musicTherapyService,
  MusicTrack,
  Playlist,
  TherapeuticCategory,
  MoodType,
  BinauralBeat,
  NatureSound
} from '../../services/music/musicTherapyService';
import { useAuth } from '../../contexts/AuthContext';
import './MusicTherapyPlayer.css';

interface MusicTherapyPlayerProps {
  initialCategory?: TherapeuticCategory;
  initialMood?: MoodType;
  onSessionEnd?: (sessionData: any) => void;
}

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
}

// Audio Visualizer Component
const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ audioElement, isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!audioElement || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyzer = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audioElement);
    
    analyzer.fftSize = 256;
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);
    
    analyzerRef.current = analyzer;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isPlaying) {
        cancelAnimationFrame(animationRef.current!);
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
      analyzer.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.7;

        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#6366f1');
        gradient.addColorStop(1, '#3b82f6');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    if (isPlaying) {
      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isPlaying]);

  return (
    <canvas 
      ref={canvasRef}
      className="audio-visualizer"
      width={800}
      height={200}
    />
  );
};

// Breathing Sync Indicator
const BreathingSync: React.FC<{ bpm: number; isActive: boolean }> = ({ bpm, isActive }) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const breathCycle = 60000 / (bpm / 4); // Convert BPM to breathing cycle
    const inhaleTime = breathCycle * 0.4;
    const holdTime = breathCycle * 0.2;
    const exhaleTime = breathCycle * 0.4;

    let currentPhase = 'inhale';
    let timer: NodeJS.Timeout;

    const runCycle = () => {
      if (currentPhase === 'inhale') {
        setPhase('inhale');
        timer = setTimeout(() => {
          currentPhase = 'hold';
          runCycle();
        }, inhaleTime);
      } else if (currentPhase === 'hold') {
        setPhase('hold');
        timer = setTimeout(() => {
          currentPhase = 'exhale';
          runCycle();
        }, holdTime);
      } else {
        setPhase('exhale');
        timer = setTimeout(() => {
          currentPhase = 'inhale';
          runCycle();
        }, exhaleTime);
      }
    };

    runCycle();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [bpm, isActive]);

  if (!isActive) return null;

  return (
    <div className="breathing-sync">
      <div className={`breathing-indicator ${phase}`}>
        <div className="breathing-circle" style={{ transform: `scale(${phase === 'inhale' ? 1.3 : phase === 'hold' ? 1.2 : 1})` }}>
          <span className="breathing-text">{phase === 'inhale' ? 'Breathe In' : phase === 'hold' ? 'Hold' : 'Breathe Out'}</span>
        </div>
      </div>
    </div>
  );
};

// Main Music Therapy Player Component
export const MusicTherapyPlayer: React.FC<MusicTherapyPlayerProps> = ({
  initialCategory = 'anxiety_relief',
  initialMood = 'anxious',
  onSessionEnd
}) => {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TherapeuticCategory>(initialCategory);
  const [selectedMood, setSelectedMood] = useState<MoodType>(initialMood);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showTimer, setShowTimer] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(1800); // 30 minutes default
  const [sessionActive, setSessionActive] = useState(false);
  const [breathingSync, setBreathingSync] = useState(false);
  const [showBinauralBeats, setShowBinauralBeats] = useState(false);
  const [showNatureSounds, setShowNatureSounds] = useState(false);
  const [activeBinauralBeat, setActiveBinauralBeat] = useState<BinauralBeat | null>(null);
  const [activeNatureSounds, setActiveNatureSounds] = useState<Set<string>>(new Set());
  const [isFavorite, setIsFavorite] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();
  }, [selectedCategory]);

  // Update audio element when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
      
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  // Handle session timer
  useEffect(() => {
    if (!sessionActive || sessionTimer <= 0) return;

    const interval = setInterval(() => {
      setSessionTimer(prev => {
        if (prev <= 1) {
          handleSessionEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionActive, sessionTimer]);

  const loadPlaylists = async () => {
    const categoryPlaylists = musicTherapyService.getPlaylistsByCategory(selectedCategory);
    setPlaylists(categoryPlaylists);
    
    if (categoryPlaylists.length > 0 && !currentPlaylist) {
      selectPlaylist(categoryPlaylists[0]);
    }
  };

  const selectPlaylist = (playlist: Playlist) => {
    setCurrentPlaylist(playlist);
    if (playlist.tracks.length > 0) {
      setCurrentTrack(playlist.tracks[0]);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
      
      // Start session if not active
      if (!sessionActive && user) {
        startTherapySession();
      }
    }
    
    setIsPlaying(!isPlaying);
  };

  const startTherapySession = () => {
    if (!user) return;

    const session = musicTherapyService.startSession(
      user.id,
      selectedCategory,
      selectedMood,
      currentPlaylist || undefined
    );
    
    setCurrentSession(session);
    setSessionActive(true);
  };

  const handleSessionEnd = () => {
    setSessionActive(false);
    
    if (currentSession && user) {
      musicTherapyService.endSession(
        currentSession.id,
        selectedMood, // Could prompt for after mood
        {
          helpful: true,
          rating: 4,
          moodImprovement: 2
        }
      );
      
      if (onSessionEnd) {
        onSessionEnd(currentSession);
      }
    }
    
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const skipToNext = () => {
    if (!currentPlaylist || !currentTrack) return;

    const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
    let nextIndex;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * currentPlaylist.tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % currentPlaylist.tracks.length;
    }

    setCurrentTrack(currentPlaylist.tracks[nextIndex]);
  };

  const skipToPrevious = () => {
    if (!currentPlaylist || !currentTrack) return;

    const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? currentPlaylist.tracks.length - 1 : currentIndex - 1;
    
    setCurrentTrack(currentPlaylist.tracks[prevIndex]);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const toggleFavorite = () => {
    if (!user || !currentTrack) return;

    if (isFavorite) {
      musicTherapyService.removeFromFavorites(user.id, currentTrack.id);
    } else {
      musicTherapyService.addToFavorites(user.id, currentTrack.id);
    }
    
    setIsFavorite(!isFavorite);
  };

  const downloadForOffline = async () => {
    if (!currentTrack) return;

    const success = await musicTherapyService.cacheTrackForOffline(currentTrack.id);
    if (success) {
      alert('Track cached for offline listening!');
    }
  };

  const playBinauralBeat = (beat: BinauralBeat) => {
    if (activeBinauralBeat?.id === beat.id) {
      // Stop current beat
      setActiveBinauralBeat(null);
    } else {
      // Play new beat
      musicTherapyService.generateBinauralBeat(beat);
      setActiveBinauralBeat(beat);
    }
  };

  const toggleNatureSound = async (sound: NatureSound) => {
    if (activeNatureSounds.has(sound.id)) {
      // Stop sound
      const newSounds = new Set(activeNatureSounds);
      newSounds.delete(sound.id);
      setActiveNatureSounds(newSounds);
    } else {
      // Play sound
      await musicTherapyService.playNatureSound(sound.id);
      const newSounds = new Set(activeNatureSounds);
      newSounds.add(sound.id);
      setActiveNatureSounds(newSounds);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: TherapeuticCategory) => {
    const icons = {
      anxiety_relief: <Wind className="w-5 h-5" />,
      focus: <Brain className="w-5 h-5" />,
      sleep: <Moon className="w-5 h-5" />,
      meditation: <Waves className="w-5 h-5" />,
      energy_boost: <Sun className="w-5 h-5" />,
      depression_support: <Heart className="w-5 h-5" />,
      stress_relief: <Activity className="w-5 h-5" />,
      emotional_release: <Music className="w-5 h-5" />,
      grounding: <Wind className="w-5 h-5" />,
      creativity: <Brain className="w-5 h-5" />
    };
    return icons[category] || <Music className="w-5 h-5" />;
  };

  return (
    <div className="music-therapy-player">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (isRepeat) {
            audioRef.current?.play();
          } else {
            skipToNext();
          }
        }}
      />

      {/* Category & Mood Selection */}
      <div className="player-header">
        <div className="category-selector">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Therapeutic Category
          </h3>
          <div className="category-grid">
            {(['anxiety_relief', 'focus', 'sleep', 'meditation', 'energy_boost'] as TherapeuticCategory[]).map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                title={category.replace('_', ' ')}
              >
                {getCategoryIcon(category)}
                <span className="category-label">
                  {category.replace('_', ' ')}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mood-selector">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Current Mood
          </h3>
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value as MoodType)}
            className="mood-select"
          >
            <option value="anxious">Anxious</option>
            <option value="sad">Sad</option>
            <option value="happy">Happy</option>
            <option value="calm">Calm</option>
            <option value="energetic">Energetic</option>
            <option value="focused">Focused</option>
            <option value="restless">Restless</option>
            <option value="overwhelmed">Overwhelmed</option>
            <option value="peaceful">Peaceful</option>
            <option value="motivated">Motivated</option>
          </select>
        </div>
      </div>

      {/* Playlist Selection */}
      <div className="playlist-section">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Available Playlists
        </h3>
        <div className="playlist-grid">
          {playlists.map(playlist => (
            <button
              key={playlist.id}
              onClick={() => selectPlaylist(playlist)}
              className={`playlist-card ${currentPlaylist?.id === playlist.id ? 'active' : ''}`}
            >
              <div className="playlist-cover">
                <Music className="w-8 h-8" />
              </div>
              <div className="playlist-info">
                <h4 className="playlist-name">{playlist.name}</h4>
                <p className="playlist-duration">
                  {formatTime(playlist.duration)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Audio Visualizer */}
      <div className="visualizer-section">
        <AudioVisualizer 
          audioElement={audioRef.current} 
          isPlaying={isPlaying}
        />
      </div>

      {/* Track Info */}
      {currentTrack && (
        <div className="track-info">
          <div className="track-details">
            <h2 className="track-title">{currentTrack.title}</h2>
            <p className="track-artist">{currentTrack.artist}</p>
          </div>
          <div className="track-actions">
            <button
              onClick={toggleFavorite}
              className={`action-btn ${isFavorite ? 'active' : ''}`}
              title="Add to favorites"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={downloadForOffline}
              className="action-btn"
              title="Download for offline"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-section">
        <span className="time-label">{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="progress-slider"
        />
        <span className="time-label">{formatTime(duration)}</span>
      </div>

      {/* Playback Controls */}
      <div className="playback-controls">
        <button
          onClick={() => setIsShuffle(!isShuffle)}
          className={`control-btn ${isShuffle ? 'active' : ''}`}
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>
        
        <button
          onClick={skipToPrevious}
          className="control-btn"
          title="Previous"
        >
          <SkipBack className="w-6 h-6" />
        </button>
        
        <button
          onClick={togglePlayPause}
          className="play-pause-btn"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8" />
          )}
        </button>
        
        <button
          onClick={skipToNext}
          className="control-btn"
          title="Next"
        >
          <SkipForward className="w-6 h-6" />
        </button>
        
        <button
          onClick={() => setIsRepeat(!isRepeat)}
          className={`control-btn ${isRepeat ? 'active' : ''}`}
          title="Repeat"
        >
          <Repeat className="w-5 h-5" />
        </button>
      </div>

      {/* Volume & Speed Controls */}
      <div className="audio-controls">
        <div className="volume-control">
          <Volume2 className="w-5 h-5" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
          <span className="volume-value">{Math.round(volume * 100)}%</span>
        </div>

        <div className="speed-control">
          <span className="speed-label">Speed:</span>
          <div className="speed-buttons">
            <button
              onClick={() => handleSpeedChange(0.75)}
              className={`speed-btn ${playbackSpeed === 0.75 ? 'active' : ''}`}
            >
              0.75x
            </button>
            <button
              onClick={() => handleSpeedChange(1)}
              className={`speed-btn ${playbackSpeed === 1 ? 'active' : ''}`}
            >
              1x
            </button>
            <button
              onClick={() => handleSpeedChange(1.25)}
              className={`speed-btn ${playbackSpeed === 1.25 ? 'active' : ''}`}
            >
              1.25x
            </button>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="additional-features">
        <button
          onClick={() => setShowTimer(!showTimer)}
          className={`feature-btn ${showTimer ? 'active' : ''}`}
        >
          <Clock className="w-5 h-5" />
          <span>Session Timer</span>
        </button>
        
        <button
          onClick={() => setBreathingSync(!breathingSync)}
          className={`feature-btn ${breathingSync ? 'active' : ''}`}
        >
          <Wind className="w-5 h-5" />
          <span>Breathing Sync</span>
        </button>
        
        <button
          onClick={() => setShowBinauralBeats(!showBinauralBeats)}
          className={`feature-btn ${showBinauralBeats ? 'active' : ''}`}
        >
          <Brain className="w-5 h-5" />
          <span>Binaural Beats</span>
        </button>
        
        <button
          onClick={() => setShowNatureSounds(!showNatureSounds)}
          className={`feature-btn ${showNatureSounds ? 'active' : ''}`}
        >
          <Waves className="w-5 h-5" />
          <span>Nature Sounds</span>
        </button>
      </div>

      {/* Session Timer */}
      {showTimer && (
        <div className="session-timer-panel">
          <h3 className="panel-title">Session Timer</h3>
          <div className="timer-display">
            <span className="timer-value">{formatTime(sessionTimer)}</span>
          </div>
          <div className="timer-controls">
            <button
              onClick={() => setSessionTimer(900)}
              className="timer-preset-btn"
            >
              15 min
            </button>
            <button
              onClick={() => setSessionTimer(1800)}
              className="timer-preset-btn"
            >
              30 min
            </button>
            <button
              onClick={() => setSessionTimer(3600)}
              className="timer-preset-btn"
            >
              60 min
            </button>
          </div>
          <button
            onClick={() => setSessionActive(!sessionActive)}
            className={`timer-start-btn ${sessionActive ? 'active' : ''}`}
          >
            {sessionActive ? 'Stop Session' : 'Start Session'}
          </button>
        </div>
      )}

      {/* Breathing Sync Panel */}
      {breathingSync && currentTrack && (
        <BreathingSync
          bpm={currentTrack.bpm || 60}
          isActive={breathingSync && isPlaying}
        />
      )}

      {/* Binaural Beats Panel */}
      {showBinauralBeats && (
        <div className="binaural-beats-panel">
          <h3 className="panel-title">Binaural Beats</h3>
          <div className="beats-grid">
            {Array.from(musicTherapyService.getBinauralBeatsByCategory('alpha')).map(beat => (
              <button
                key={beat.id}
                onClick={() => playBinauralBeat(beat)}
                className={`beat-btn ${activeBinauralBeat?.id === beat.id ? 'active' : ''}`}
              >
                <span className="beat-name">{beat.name}</span>
                <span className="beat-freq">{beat.frequency}Hz</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nature Sounds Panel */}
      {showNatureSounds && (
        <div className="nature-sounds-panel">
          <h3 className="panel-title">Nature Sounds</h3>
          <div className="sounds-grid">
            {musicTherapyService.getNatureSounds().map(sound => (
              <button
                key={sound.id}
                onClick={() => toggleNatureSound(sound)}
                className={`sound-btn ${activeNatureSounds.has(sound.id) ? 'active' : ''}`}
              >
                <span className="sound-name">{sound.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};