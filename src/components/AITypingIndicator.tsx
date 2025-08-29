import React, { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Bot, Heart, Brain, Sparkles } from 'lucide-react';

interface AITypingIndicatorProps {
  isVisible: boolean;
  aiName?: string;
  variant?: 'default' | 'therapy' | 'crisis' | 'wellness' | 'chat' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  speed?: 'slow' | 'normal' | 'fast';
  message?: string;
  showPulse?: boolean;
  className?: string;
  onAnimationComplete?: () => void;
}

const TYPING_MESSAGES = {
  therapy: [
    'AI is processing your thoughts...',
    'Preparing therapeutic response...',
    'Analyzing your emotional context...',
    'Crafting personalized guidance...'
  ],
  crisis: [
    'AI is preparing crisis support...',
    'Accessing emergency resources...',
    'Prioritizing your safety...',
    'Connecting you with help...'
  ],
  wellness: [
    'AI is analyzing wellness data...',
    'Generating wellness insights...',
    'Preparing personalized recommendations...',
    'Processing your wellness journey...'
  ],
  chat: [
    'AI is typing...',
    'Preparing response...',
    'Processing your message...',
    'Generating reply...'
  ],
  default: [
    'AI is thinking...',
    'Processing...',
    'Preparing response...',
    'Just a moment...'
  ],
  minimal: [
    '...',
    'Typing...',
    'Please wait...'
  ]
};

const SPEED_CONFIGS = {
  slow: { dots: 1500, message: 3000, pulse: 2000 },
  normal: { dots: 1000, message: 2000, pulse: 1500 },
  fast: { dots: 600, message: 1200, pulse: 800 }
};

export const AITypingIndicator: React.FC<AITypingIndicatorProps> = ({
  isVisible,
  variant = 'default',
  size = 'medium',
  speed = 'normal',
  message,
  showPulse = true,
  className = '',
  onAnimationComplete
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dotsCount, setDotsCount] = useState(1);
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'active' | 'exiting'>('entering');

  const speedConfig = SPEED_CONFIGS[speed];
  const messages = message ? [message] : TYPING_MESSAGES[variant];

  // Manage animation phases
  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('entering');
      const timer = setTimeout(() => {
        setAnimationPhase('active');
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAnimationPhase('exiting');
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);

  // Animate dots
  useEffect(() => {
    if (animationPhase !== 'active') return;

    const interval = setInterval(() => {
      setDotsCount(prev => (prev >= 3 ? 1 : prev + 1));
    }, speedConfig.dots);

    return () => clearInterval(interval);
  }, [animationPhase, speedConfig.dots]);

  // Rotate messages
  useEffect(() => {
    if (animationPhase !== 'active' || messages.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, speedConfig.message);

    return () => clearInterval(interval);
  }, [animationPhase, speedConfig.message, messages.length]);

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'small':
        return {
          container: 'px-3 py-2',
          text: 'text-sm',
          icon: 'w-4 h-4',
          dots: 'text-lg'
        };
      case 'large':
        return {
          container: 'px-6 py-4',
          text: 'text-base',
          icon: 'w-6 h-6',
          dots: 'text-2xl'
        };
      default:
        return {
          container: 'px-4 py-3',
          text: 'text-sm',
          icon: 'w-5 h-5',
          dots: 'text-xl'
        };
    }
  }, [size]);

  const variantConfig = useMemo(() => {
    switch (variant) {
      case 'therapy':
        return {
          icon: Brain,
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          textColor: 'text-purple-700',
          iconColor: 'text-purple-600',
          gradientFrom: 'from-purple-400',
          gradientTo: 'to-indigo-500'
        };
      case 'crisis':
        return {
          icon: Heart,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-700',
          iconColor: 'text-red-600',
          gradientFrom: 'from-red-400',
          gradientTo: 'to-pink-500'
        };
      case 'wellness':
        return {
          icon: Sparkles,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-700',
          iconColor: 'text-green-600',
          gradientFrom: 'from-green-400',
          gradientTo: 'to-emerald-500'
        };
      case 'chat':
        return {
          icon: MessageCircle,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-700',
          iconColor: 'text-blue-600',
          gradientFrom: 'from-blue-400',
          gradientTo: 'to-cyan-500'
        };
      case 'minimal':
        return {
          icon: Bot,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          iconColor: 'text-gray-500',
          gradientFrom: 'from-gray-400',
          gradientTo: 'to-gray-500'
        };
      default:
        return {
          icon: Bot,
          bgColor: 'bg-indigo-50',
          borderColor: 'border-indigo-200',
          textColor: 'text-indigo-700',
          iconColor: 'text-indigo-600',
          gradientFrom: 'from-indigo-400',
          gradientTo: 'to-purple-500'
        };
    }
  }, [variant]);

  const IconComponent = variantConfig.icon;

  if (!isVisible && animationPhase === 'exiting') {
    return null;
  }

  const baseTransitionClasses = 'transition-all duration-300 ease-in-out';
  const visibilityClasses = animationPhase === 'entering' 
    ? 'opacity-0 translate-y-2 scale-95' 
    : animationPhase === 'exiting'
    ? 'opacity-0 translate-y-1 scale-95'
    : 'opacity-100 translate-y-0 scale-100';

  return (
    <div
      className={`
        ${baseTransitionClasses} ${visibilityClasses}
        flex items-center gap-3 rounded-2xl border shadow-sm
        ${sizeClasses.container}
        ${variantConfig.bgColor} ${variantConfig.borderColor}
        ${className}
      `}
      role="status"
      aria-label="AI is typing"
      aria-live="polite"
    >
      {/* AI Icon with Pulse */}
      <div className="relative flex-shrink-0">
        <div
          className={`
            flex items-center justify-center rounded-full
            ${showPulse && animationPhase === 'active' ? 'animate-pulse' : ''}
          `}
        >
          <IconComponent className={`${sizeClasses.icon} ${variantConfig.iconColor}`} />
        </div>

        {/* Pulse Ring Animation */}
        {showPulse && animationPhase === 'active' && (
          <div
            className={`
              absolute inset-0 rounded-full border-2 animate-ping
              ${variantConfig.borderColor} opacity-20
            `}
            style={{
              animationDuration: `${speedConfig.pulse}ms`
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {variant !== 'minimal' && (
          <div className={`font-medium ${variantConfig.textColor} ${sizeClasses.text} truncate`}>
            {messages[currentMessageIndex]}
          </div>
        )}

        {/* Animated Dots */}
        <div className="flex items-center gap-1 mt-1">
          {[1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${dot <= dotsCount ? variantConfig.iconColor : 'bg-gray-300'}
                ${dot <= dotsCount ? 'scale-100 opacity-100' : 'scale-75 opacity-30'}
              `}
              style={{
                transitionDelay: `${(dot - 1) * 100}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Gradient Animation Bar */}
      {animationPhase === 'active' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl overflow-hidden">
          <div
            className={`
              h-full w-full bg-gradient-to-r ${variantConfig.gradientFrom} ${variantConfig.gradientTo}
              transform -translate-x-full animate-pulse
            `}
            style={{
              animation: `slideInOut ${speedConfig.message}ms infinite linear`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Specialized variants for mental health contexts
export const TherapyTypingIndicator: React.FC<Omit<AITypingIndicatorProps, 'variant'>> = (props) => (
  <AITypingIndicator {...props} variant="therapy" aiName="Therapy AI" />
);

export const CrisisTypingIndicator: React.FC<Omit<AITypingIndicatorProps, 'variant'>> = (props) => (
  <AITypingIndicator {...props} variant="crisis" aiName="Crisis Support AI" speed="fast" />
);

export const WellnessTypingIndicator: React.FC<Omit<AITypingIndicatorProps, 'variant'>> = (props) => (
  <AITypingIndicator {...props} variant="wellness" aiName="Wellness AI" />
);

// Mini version for chat bubbles
export const MiniTypingIndicator: React.FC<{
  isVisible: boolean;
  color?: string;
}> = ({ isVisible, color = 'text-gray-400' }) => {
  const [dotsCount, setDotsCount] = useState(1);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setDotsCount(prev => (prev >= 3 ? 1 : prev + 1));
    }, 600);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[1, 2, 3].map((dot) => (
        <div
          key={dot}
          className={`
            w-1.5 h-1.5 rounded-full transition-all duration-200
            ${dot <= dotsCount ? color.replace('text-', 'bg-') : 'bg-gray-300'}
            ${dot <= dotsCount ? 'scale-100 opacity-100' : 'scale-75 opacity-30'}
          `}
        />
      ))}
    </div>
  );
};

// Accessibility-focused version
export const AccessibleTypingIndicator: React.FC<AITypingIndicatorProps> = (props) => {
  return (
    <div role="region" aria-label="AI response in progress">
      <AITypingIndicator
        {...props}
        className={`${props.className} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
      />
      <span className="sr-only">
        AI is processing your request. Please wait for the response.
      </span>
    </div>
  );
};

// Hook for managing typing states
export const useAITypingState = () => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string | undefined>();

  const startTyping = (message?: string) => {
    setTypingMessage(message);
    setIsTyping(true);
  };

  const stopTyping = () => {
    setIsTyping(false);
    setTypingMessage(undefined);
  };

  return {
    isTyping,
    typingMessage,
    startTyping,
    stopTyping
  };
};

export default AITypingIndicator;
