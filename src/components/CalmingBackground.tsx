import React, { useState, useEffect, useRef } from 'react';
import { Pause, Play, Volume2, VolumeX, Settings, RefreshCw } from 'lucide-react';

interface CalmingBackgroundProps {
  type?: 'waves' | 'rain' | 'forest' | 'breathing' | 'gradient' | 'particles';
  intensity?: 'low' | 'medium' | 'high';
  autoplay?: boolean;
  showControls?: boolean;
  className?: string;
  onStateChange?: (isActive: boolean) => void;
}

interface BackgroundAnimation {
  name: string;
  type: CalmingBackgroundProps['type'];
  description: string;
  colors: string[];
  audioUrl?: string;
}

export const CalmingBackground: React.FC<CalmingBackgroundProps> = ({
  type = 'waves',
  intensity = 'medium',
  autoplay = false,
  showControls = true,
  className = '',
  onStateChange
}) => {
  const [isActive, setIsActive] = useState(autoplay);
  const [currentType, setCurrentType] = useState(type);
  const [currentIntensity, setCurrentIntensity] = useState(intensity);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.3);
  const [showSettings, setShowSettings] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>();

  const backgroundAnimations: BackgroundAnimation[] = [
    {
      name: 'Ocean Waves',
      type: 'waves',
      description: 'Gentle ocean waves with soft blue tones',
      colors: ['#0EA5E9', '#0284C7', '#0369A1', '#075985']
    },
    {
      name: 'Rainfall',
      type: 'rain',
      description: 'Peaceful rain with cool grey and blue hues',
      colors: ['#64748B', '#475569', '#334155', '#1E293B']
    },
    {
      name: 'Forest',
      type: 'forest',
      description: 'Serene forest with calming green gradients',
      colors: ['#22C55E', '#16A34A', '#15803D', '#166534']
    },
    {
      name: 'Breathing',
      type: 'breathing',
      description: 'Guided breathing visualization',
      colors: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6']
    },
    {
      name: 'Gradient Flow',
      type: 'gradient',
      description: 'Smooth flowing gradients',
      colors: ['#F59E0B', '#EAB308', '#CA8A04', '#A16207']
    },
    {
      name: 'Floating Particles',
      type: 'particles',
      description: 'Gentle floating particles',
      colors: ['#EC4899', '#DB2777', '#BE185D', '#9D174D']
    }
  ];

  const currentAnimation = backgroundAnimations.find(anim => anim.type === currentType) || backgroundAnimations[0];

  useEffect(() => {
    if (onStateChange) {
      onStateChange(isActive);
    }
  }, [isActive, onStateChange]);

  useEffect(() => {
    if (isActive) {
      startAnimation();
    } else {
      stopAnimation();
    }

    return () => stopAnimation();
  }, [isActive, currentType, currentIntensity]);

  // Audio management
  useEffect(() => {
    if (audioEnabled && isActive) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [audioEnabled, isActive]);

  const startAnimation = () => {
    const canvas = document.getElementById('calming-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      if (!isActive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      switch (currentType) {
        case 'waves':
          drawWaves(ctx, canvas.width, canvas.height);
          break;
        case 'rain':
          drawRain(ctx, canvas.width, canvas.height);
          break;
        case 'forest':
          drawForest(ctx, canvas.width, canvas.height);
          break;
        case 'breathing':
          drawBreathing(ctx, canvas.width, canvas.height);
          break;
        case 'gradient':
          drawGradient(ctx, canvas.width, canvas.height);
          break;
        case 'particles':
          drawParticles(ctx, canvas.width, canvas.height);
          break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const drawWaves = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.002;
    const colors = currentAnimation.colors;
    const intensityMultiplier = getIntensityMultiplier();

    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors[0] + '40');
    gradient.addColorStop(0.5, colors[1] + '60');
    gradient.addColorStop(1, colors[2] + '80');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw waves
    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    for (let x = 0; x <= width; x += 10) {
      const y = height / 2 + Math.sin((x * 0.01 + time) * intensityMultiplier) * 50;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    ctx.fillStyle = colors[3] + '40';
    ctx.fill();
  };

  const drawRain = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    const intensityMultiplier = getIntensityMultiplier();
    const dropCount = 50 * intensityMultiplier;

    // Background
    ctx.fillStyle = currentAnimation.colors[0] + '20';
    ctx.fillRect(0, 0, width, height);

    // Rain drops
    ctx.strokeStyle = currentAnimation.colors[2] + '60';
    ctx.lineWidth = 1;

    for (let i = 0; i < dropCount; i++) {
      const x = (i * 37 + time * 100) % width;
      const y = (i * 23 + time * 200) % height;
      const length = 10 + (i % 10);

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + length);
      ctx.stroke();
    }
  };

  const drawForest = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    const colors = currentAnimation.colors;

    // Background gradient
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    gradient.addColorStop(0, colors[0] + '40');
    gradient.addColorStop(1, colors[3] + '80');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Floating leaves/particles
    const intensityMultiplier = getIntensityMultiplier();
    const leafCount = 20 * intensityMultiplier;

    for (let i = 0; i < leafCount; i++) {
      const x = (width * Math.sin(time * 0.5 + i)) / 2 + width / 2;
      const y = (height * Math.cos(time * 0.3 + i * 0.5)) / 2 + height / 2;
      const size = 3 + (i % 5);

      ctx.fillStyle = colors[i % colors.length] + '60';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawBreathing = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    const breathingCycle = (Math.sin(time * 0.5) + 1) / 2; // 0 to 1
    const intensityMultiplier = getIntensityMultiplier();
    
    // Background
    const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/2);
    gradient.addColorStop(0, currentAnimation.colors[0] + '20');
    gradient.addColorStop(1, currentAnimation.colors[3] + '40');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Breathing circle
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.1;
    const radius = baseRadius + (breathingCycle * baseRadius * intensityMultiplier);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = currentAnimation.colors[1] + (Math.floor(40 + breathingCycle * 40)).toString(16);
    ctx.fill();

    // Instruction text
    ctx.fillStyle = currentAnimation.colors[3] + 'CC';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    const instruction = breathingCycle > 0.5 ? 'Breathe In' : 'Breathe Out';
    ctx.fillText(instruction, centerX, centerY - radius - 40);
  };

  const drawGradient = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    const intensityMultiplier = getIntensityMultiplier();

    // Animated gradient
    const angle = time * 0.5 * intensityMultiplier;
    const x1 = Math.cos(angle) * width;
    const y1 = Math.sin(angle) * height;
    const x2 = Math.cos(angle + Math.PI) * width;
    const y2 = Math.sin(angle + Math.PI) * height;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    currentAnimation.colors.forEach((color, index) => {
      gradient.addColorStop(index / (currentAnimation.colors.length - 1), color + '60');
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };

  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const time = Date.now() * 0.001;
    const intensityMultiplier = getIntensityMultiplier();
    const particleCount = 30 * intensityMultiplier;

    // Background
    ctx.fillStyle = currentAnimation.colors[0] + '10';
    ctx.fillRect(0, 0, width, height);

    // Floating particles
    for (let i = 0; i < particleCount; i++) {
      const x = (width * (Math.sin(time * 0.5 + i * 0.1) + 1)) / 2;
      const y = (height * (Math.cos(time * 0.3 + i * 0.2) + 1)) / 2;
      const size = 2 + Math.sin(time + i) * 3;
      const opacity = (Math.sin(time * 2 + i) + 1) / 2;

      ctx.fillStyle = currentAnimation.colors[i % currentAnimation.colors.length] + 
                     Math.floor(40 + opacity * 40).toString(16);
      ctx.beginPath();
      ctx.arc(x, y, Math.abs(size), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const getIntensityMultiplier = () => {
    switch (currentIntensity) {
      case 'low':
        return 0.5;
      case 'high':
        return 1.5;
      default:
        return 1;
    }
  };

  const playAudio = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      // Note: In a real app, you'd have actual audio files
      audioRef.current.loop = true;
      audioRef.current.volume = audioVolume;
    }

    try {
      await audioRef.current.play();
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const toggleActive = () => {
    setIsActive(!isActive);
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
  };

  const changeBackground = () => {
    const currentIndex = backgroundAnimations.findIndex(anim => anim.type === currentType);
    const nextIndex = (currentIndex + 1) % backgroundAnimations.length;
    const nextType = backgroundAnimations[nextIndex]?.type;
    if (nextType) {
      setCurrentType(nextType);
    }
  };

  return (
    <div className={`calming-background relative w-full h-full overflow-hidden ${className}`}>
      {/* Canvas for animations */}
      <canvas
        id="calming-canvas"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: -1 }}
      />

      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 right-4 z-10">
          <div className="flex items-center gap-2 bg-black bg-opacity-20 backdrop-blur-sm rounded-full p-2">
            {/* Play/Pause */}
            <button
              onClick={toggleActive}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all"
              title={isActive ? 'Pause' : 'Play'}
            >
              {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all"
              title={audioEnabled ? 'Mute' : 'Enable Audio'}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Change Background */}
            <button
              onClick={changeBackground}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all"
              title="Change Background"
            >
              <RefreshCw className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white transition-all"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 shadow-xl">
              <h3 className="font-semibold text-gray-800 mb-3">Calming Background Settings</h3>
              
              {/* Background Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Type
                </label>
                <select
                  value={currentType}
                  onChange={(e) => {
                    const value = e.target.value as CalmingBackgroundProps['type'];
                    if (value) setCurrentType(value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  {backgroundAnimations.map(anim => (
                    <option key={anim.type} value={anim.type}>
                      {anim.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-600 mt-1">
                  {currentAnimation.description}
                </p>
              </div>

              {/* Intensity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensity
                </label>
                <select
                  value={currentIntensity}
                  onChange={(e) => {
                    const value = e.target.value as CalmingBackgroundProps['intensity'];
                    if (value) setCurrentIntensity(value);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Audio Volume */}
              {audioEnabled && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio Volume: {Math.round(audioVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={audioVolume}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setAudioVolume(newVolume);
                      if (audioRef.current) {
                        audioRef.current.volume = newVolume;
                      }
                    }}
                    className="w-full"
                  />
                </div>
              )}

              <div className="text-xs text-gray-500 leading-relaxed">
                Calming backgrounds can help reduce anxiety and promote relaxation. 
                Use with headphones for the best experience.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info indicator */}
      {isActive && (
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-black bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>{currentAnimation.name}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for managing calming background state
export const useCalmingBackground = () => {
  const [isActive, setIsActive] = useState(false);
  const [backgroundType, setBackgroundType] = useState<CalmingBackgroundProps['type']>('waves');
  const [intensity, setIntensity] = useState<CalmingBackgroundProps['intensity']>('medium');

  const activate = (type?: CalmingBackgroundProps['type']) => {
    if (type) setBackgroundType(type);
    setIsActive(true);
  };

  const deactivate = () => {
    setIsActive(false);
  };

  const toggle = () => {
    setIsActive(!isActive);
  };

  return {
    isActive,
    backgroundType,
    intensity,
    setBackgroundType,
    setIntensity,
    activate,
    deactivate,
    toggle
  };
};

export default CalmingBackground;
