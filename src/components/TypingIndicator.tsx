import React, { useState, useEffect } from 'react';
import { MessageCircle, Bot, User, Users } from 'lucide-react';

interface TypingIndicatorProps {
  users?: Array<{
    id: string;
    name: string;
    avatar?: string;
    type?: 'user' | 'ai' | 'therapist' | 'moderator';
  }>;
  isVisible: boolean;
  variant?: 'default' | 'minimal' | 'detailed' | 'bubble';
  size?: 'small' | 'medium' | 'large';
  animation?: 'dots' | 'wave' | 'pulse' | 'bounce';
  showAvatars?: boolean;
  maxUsers?: number;
  className?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  users = [],
  isVisible,
  variant = 'default',
  size = 'medium',
  animation = 'dots',
  showAvatars = true,
  maxUsers = 3,
  className = ''
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  // Animate dots or other indicators
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const visibleUsers = users.slice(0, maxUsers);
  const hiddenCount = users.length - maxUsers;

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'px-2 py-1',
          text: 'text-xs',
          avatar: 'w-4 h-4',
          dots: 'w-1 h-1'
        };
      case 'large':
        return {
          container: 'px-4 py-3',
          text: 'text-base',
          avatar: 'w-8 h-8',
          dots: 'w-2 h-2'
        };
      default:
        return {
          container: 'px-3 py-2',
          text: 'text-sm',
          avatar: 'w-6 h-6',
          dots: 'w-1.5 h-1.5'
        };
    }
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'ai':
        return Bot;
      case 'therapist':
        return MessageCircle;
      case 'moderator':
        return Users;
      default:
        return User;
    }
  };

  const getUserTypeColor = (userType: string) => {
    switch (userType) {
      case 'ai':
        return 'text-blue-600';
      case 'therapist':
        return 'text-purple-600';
      case 'moderator':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderAnimatedDots = () => {
    const sizeClasses = getSizeClasses();
    
    switch (animation) {
      case 'wave':
        return (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className={`${sizeClasses.dots} bg-current rounded-full transition-transform duration-300`}
                style={{
                  transform: `translateY(${animationPhase === index ? '-2px' : '0px'})`,
                  transitionDelay: `${index * 100}ms`
                }}
              />
            ))}
          </div>
        );
      
      case 'pulse':
        return (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className={`${sizeClasses.dots} bg-current rounded-full`}
                style={{
                  opacity: animationPhase === index ? 1 : 0.3,
                  transform: animationPhase === index ? 'scale(1.2)' : 'scale(1)',
                  transition: 'all 0.3s ease-in-out',
                  transitionDelay: `${index * 150}ms`
                }}
              />
            ))}
          </div>
        );
      
      case 'bounce':
        return (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className={`${sizeClasses.dots} bg-current rounded-full animate-bounce`}
                style={{
                  animationDelay: `${index * 200}ms`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );
      
      default: // dots
        return (
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className={`${sizeClasses.dots} bg-current rounded-full transition-opacity duration-500`}
                style={{
                  opacity: index <= animationPhase ? 1 : 0.3
                }}
              />
            ))}
          </div>
        );
    }
  };

  const renderUserList = () => {
    if (users.length === 0) return 'Someone';
    
    if (users.length === 1) {
      const user = users[0];
      if (user.type === 'ai') return 'AI Assistant';
      return user.name || 'User';
    }

    const names = visibleUsers.map(user => {
      if (user.type === 'ai') return 'AI Assistant';
      return user.name || 'User';
    });

    if (hiddenCount > 0) {
      return `${names.join(', ')} and ${hiddenCount} other${hiddenCount === 1 ? '' : 's'}`;
    }

    if (names.length === 2) {
      return names.join(' and ');
    }

    return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
  };

  const renderAvatars = () => {
    if (!showAvatars || visibleUsers.length === 0) return null;

    const sizeClasses = getSizeClasses();

    return (
      <div className="flex -space-x-1">
        {visibleUsers.map((user, index) => {
          const IconComponent = getUserTypeIcon(user.type || 'user');
          
          return (
            <div
              key={user.id}
              className={`${sizeClasses.avatar} rounded-full border-2 border-white bg-gray-100 flex items-center justify-center relative`}
              style={{ zIndex: visibleUsers.length - index }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <IconComponent className={`w-3/4 h-3/4 ${getUserTypeColor(user.type || 'user')}`} />
              )}
            </div>
          );
        })}
        
        {hiddenCount > 0 && (
          <div className={`${sizeClasses.avatar} rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-medium`}>
            +{hiddenCount}
          </div>
        )}
      </div>
    );
  };

  const sizeClasses = getSizeClasses();

  switch (variant) {
    case 'minimal':
      return (
        <div className={`inline-flex items-center gap-2 text-gray-500 ${className}`}>
          {renderAnimatedDots()}
        </div>
      );

    case 'bubble':
      return (
        <div className={`inline-flex items-start gap-2 ${className}`}>
          {renderAvatars()}
          <div className={`bg-gray-100 rounded-2xl ${sizeClasses.container} max-w-20`}>
            <div className="flex items-center gap-2 text-gray-500">
              {renderAnimatedDots()}
            </div>
          </div>
        </div>
      );

    case 'detailed':
      return (
        <div className={`inline-flex items-center gap-3 ${sizeClasses.container} bg-gray-50 rounded-lg ${className}`}>
          {renderAvatars()}
          <div className={`flex items-center gap-2 text-gray-600 ${sizeClasses.text}`}>
            <span>{renderUserList()}</span>
            <span className="text-gray-400">
              {users.length === 1 ? 'is' : 'are'} typing
            </span>
            {renderAnimatedDots()}
          </div>
        </div>
      );

    default:
      return (
        <div className={`inline-flex items-center gap-2 text-gray-500 ${sizeClasses.text} ${className}`}>
          {showAvatars && renderAvatars()}
          <span>
            {renderUserList()} {users.length === 1 ? 'is' : 'are'} typing
          </span>
          {renderAnimatedDots()}
        </div>
      );
  }
};

// Specialized typing indicators for different contexts

export const AITypingIndicator: React.FC<Omit<TypingIndicatorProps, 'users'> & {
  aiName?: string;
  processingType?: 'thinking' | 'generating' | 'analyzing';
}> = ({ 
  aiName = 'AI Assistant',
  processingType = 'thinking',
  variant = 'bubble',
  ...props 
}) => {
  const processingMessages = {
    thinking: 'is thinking',
    generating: 'is generating response',
    analyzing: 'is analyzing'
  };

  const aiUser = {
    id: 'ai',
    name: aiName,
    type: 'ai' as const
  };

  return (
    <div className="flex items-center gap-2">
      <TypingIndicator
        {...props}
        users={[aiUser]}
        variant={variant}
      />
      {variant === 'detailed' && (
        <span className="text-xs text-blue-600 italic">
          {processingMessages[processingType]}
        </span>
      )}
    </div>
  );
};

export const TherapistTypingIndicator: React.FC<Omit<TypingIndicatorProps, 'users'> & {
  therapistName?: string;
}> = ({ 
  therapistName = 'Your Therapist',
  ...props 
}) => {
  const therapistUser = {
    id: 'therapist',
    name: therapistName,
    type: 'therapist' as const
  };

  return (
    <TypingIndicator
      {...props}
      users={[therapistUser]}
      variant="detailed"
    />
  );
};

export const GroupTypingIndicator: React.FC<TypingIndicatorProps> = (props) => {
  return (
    <TypingIndicator
      {...props}
      variant="detailed"
      showAvatars={true}
      maxUsers={3}
    />
  );
};

// Hook for managing typing state
export const useTypingIndicator = () => {
  const [typingUsers, setTypingUsers] = useState<TypingIndicatorProps['users']>([]);

  const addTypingUser = (user: NonNullable<TypingIndicatorProps['users']>[0]) => {
    setTypingUsers(prev => {
      const existing = prev?.find(u => u.id === user.id);
      if (existing) return prev;
      return [...(prev || []), user];
    });
  };

  const removeTypingUser = (userId: string) => {
    setTypingUsers(prev => prev?.filter(u => u.id !== userId) || []);
  };

  const clearTypingUsers = () => {
    setTypingUsers([]);
  };

  const isUserTyping = (userId: string) => {
    return typingUsers?.some(u => u.id === userId) || false;
  };

  return {
    typingUsers,
    addTypingUser,
    removeTypingUser,
    clearTypingUsers,
    isUserTyping,
    hasTypingUsers: (typingUsers?.length || 0) > 0
  };
};

// Mental health specific typing indicators
export const CrisisTypingIndicator: React.FC<{
  isVisible: boolean;
  responderType: 'counselor' | 'peer' | 'ai';
  className?: string;
}> = ({ isVisible, responderType, className }) => {
  const responderConfig = {
    counselor: { name: 'Crisis Counselor', type: 'therapist' as const },
    peer: { name: 'Peer Supporter', type: 'user' as const },
    ai: { name: 'Crisis AI', type: 'ai' as const }
  };

  const config = responderConfig[responderType];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      <TypingIndicator
        isVisible={isVisible}
        users={[{ id: responderType, ...config }]}
        variant="detailed"
        animation="pulse"
        size="small"
      />
      <span className="text-xs text-red-600 font-medium">Crisis Support Active</span>
    </div>
  );
};

export const AnonymousTypingIndicator: React.FC<{
  isVisible: boolean;
  userCount?: number;
  className?: string;
}> = ({ isVisible, userCount = 1, className }) => {
  const anonymousUsers = Array.from({ length: Math.min(userCount, 5) }, (_, i) => ({
    id: `anon-${i}`,
    name: `Anonymous User ${i + 1}`,
    type: 'user' as const
  }));

  return (
    <TypingIndicator
      isVisible={isVisible}
      users={anonymousUsers}
      variant="default"
      showAvatars={false}
      maxUsers={3}
      className={className}
    />
  );
};

export default TypingIndicator;
