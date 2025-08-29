import React from 'react';
import { LucideIcon, Search, MessageCircle, Heart, Users, Calendar, FileText, Database, AlertCircle, Plus, Shield } from 'lucide-react';
import { cn } from '../utils/cn';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: LucideIcon | React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: LucideIcon | React.ReactNode;
  };
  illustration?: 'search' | 'messages' | 'community' | 'calendar' | 'documents' | 'data' | 'error' | 'success' | 'custom';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  // Mental health specific props
  supportive?: boolean;
  mood?: 'neutral' | 'encouraging' | 'supportive' | 'crisis';
}

const getDefaultIcon = (illustration?: EmptyStateProps['illustration']): LucideIcon => {
  switch (illustration) {
    case 'search': return Search;
    case 'messages': return MessageCircle;
    case 'community': return Users;
    case 'calendar': return Calendar;
    case 'documents': return FileText;
    case 'data': return Database;
    case 'error': return AlertCircle;
    case 'success': return Heart;
    default: return Search;
  }
};

const getIllustrationColor = (illustration?: EmptyStateProps['illustration'], mood?: EmptyStateProps['mood']) => {
  if (mood === 'crisis') return 'text-red-500';
  if (mood === 'supportive') return 'text-green-500';
  if (mood === 'encouraging') return 'text-blue-500';

  switch (illustration) {
    case 'search': return 'text-gray-400';
    case 'messages': return 'text-blue-400';
    case 'community': return 'text-purple-400';
    case 'calendar': return 'text-indigo-400';
    case 'documents': return 'text-yellow-400';
    case 'data': return 'text-gray-400';
    case 'error': return 'text-red-400';
    case 'success': return 'text-green-400';
    default: return 'text-gray-400';
  }
};

const getSizeClasses = (size: EmptyStateProps['size']) => {
  switch (size) {
    case 'small':
      return {
        container: 'py-8',
        icon: 'w-12 h-12',
        title: 'text-lg',
        description: 'text-sm',
        spacing: 'space-y-3'
      };
    case 'large':
      return {
        container: 'py-20',
        icon: 'w-24 h-24',
        title: 'text-2xl',
        description: 'text-lg',
        spacing: 'space-y-8'
      };
    default: // medium
      return {
        container: 'py-12',
        icon: 'w-16 h-16',
        title: 'text-xl',
        description: 'text-base',
        spacing: 'space-y-6'
      };
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  illustration = 'search',
  size = 'medium',
  className = '',
  supportive = false,
  mood = 'neutral'
}) => {
  const DefaultIcon = getDefaultIcon(illustration);
  const iconColor = getIllustrationColor(illustration, mood);
  const sizeClasses = getSizeClasses(size);

  const renderIcon = () => {
    if (icon) {
      if (React.isValidElement(icon)) {
        return React.cloneElement(icon as React.ReactElement, {
          className: cn(sizeClasses.icon, iconColor, (icon as React.ReactElement).props?.className)
        });
      }
      
      if (typeof icon === 'function') {
        const IconComponent = icon as LucideIcon;
        return <IconComponent className={cn(sizeClasses.icon, iconColor)} />;
      }
      
      return icon;
    }

    return <DefaultIcon className={cn(sizeClasses.icon, iconColor)} />;
  };

  const getSupportiveMessage = () => {
    if (!supportive) return null;

    const messages = {
      neutral: "Remember, every journey starts with a single step. 💙",
      encouraging: "You're making progress by being here. Keep going! 🌟",
      supportive: "It's okay to take things one day at a time. You're not alone. 🤗",
      crisis: "Your safety and well-being matter. Help is available 24/7. ❤️"
    };

    return (
      <div className={cn(
        'mt-4 p-3 rounded-lg text-sm',
        mood === 'crisis' ? 'bg-red-50 text-red-800 border border-red-200' :
        mood === 'supportive' ? 'bg-green-50 text-green-800 border border-green-200' :
        mood === 'encouraging' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
        'bg-gray-50 text-gray-700 border border-gray-200'
      )}>
        {messages[mood]}
      </div>
    );
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center max-w-md mx-auto',
      sizeClasses.container,
      className
    )}>
      <div className={cn('flex flex-col items-center', sizeClasses.spacing)}>
        {/* Icon */}
        <div className="flex-shrink-0">
          {renderIcon()}
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className={cn('font-semibold text-gray-900', sizeClasses.title)}>
            {title}
          </h3>
          
          <p className={cn('text-gray-600 leading-relaxed', sizeClasses.description)}>
            {description}
          </p>

          {supportive && getSupportiveMessage()}
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            {action && (
              <AppButton
                variant={action.variant || 'primary'}
                onClick={action.onClick}
                icon={typeof action.icon === 'function' ? React.createElement(action.icon as LucideIcon, { className: "w-4 h-4" }) : action.icon}
              >
                {action.label}
              </AppButton>
            )}
            
            {secondaryAction && (
              <AppButton
                variant={secondaryAction.variant || 'outline'}
                onClick={secondaryAction.onClick}
                icon={typeof secondaryAction.icon === 'function' ? React.createElement(secondaryAction.icon as LucideIcon, { className: "w-4 h-4" }) : secondaryAction.icon}
              >
                {secondaryAction.label}
              </AppButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Specialized empty state components for mental health platform

export const NoMessagesEmptyState: React.FC<{
  onStartConversation?: () => void;
  className?: string;
}> = ({ onStartConversation, className }) => (
  <EmptyState
    illustration="messages"
    title="No messages yet"
    description="Start a conversation with a peer supporter or therapist to begin your journey of healing and growth."
    action={onStartConversation ? {
      label: "Start Conversation",
      onClick: onStartConversation,
      icon: MessageCircle
    } : undefined}
    supportive={true}
    mood="encouraging"
    className={className}
  />
);

export const NoMoodEntriesEmptyState: React.FC<{
  onAddMoodEntry?: () => void;
  className?: string;
}> = ({ onAddMoodEntry, className }) => (
  <EmptyState
    icon={Heart}
    title="Track your first mood"
    description="Understanding your emotional patterns is a powerful step toward mental wellness. Start by logging how you're feeling today."
    action={onAddMoodEntry ? {
      label: "Log Mood",
      onClick: onAddMoodEntry,
      icon: Plus
    } : undefined}
    supportive={true}
    mood="supportive"
    size="medium"
    className={className}
  />
);

export const NoCommunityPostsEmptyState: React.FC<{
  onCreatePost?: () => void;
  className?: string;
}> = ({ onCreatePost, className }) => (
  <EmptyState
    illustration="community"
    title="Be the first to share"
    description="Our community grows stronger when we share our experiences, support each other, and learn together."
    action={onCreatePost ? {
      label: "Share Your Story",
      onClick: onCreatePost,
      icon: Plus
    } : undefined}
    secondaryAction={{
      label: "Browse Guidelines",
      onClick: () => {}, // Would navigate to guidelines
      variant: "outline"
    }}
    supportive={true}
    mood="encouraging"
    className={className}
  />
);

export const NoTherapistsEmptyState: React.FC<{
  onSearchTherapists?: () => void;
  className?: string;
}> = ({ onSearchTherapists, className }) => (
  <EmptyState
    icon={Search}
    title="No therapists found"
    description="Try adjusting your search criteria or browse all available therapists in your area."
    action={onSearchTherapists ? {
      label: "Browse All Therapists",
      onClick: onSearchTherapists
    } : undefined}
    secondaryAction={{
      label: "Refine Search",
      onClick: () => {}, // Would open search filters
      variant: "outline"
    }}
    className={className}
  />
);

export const NoAppointmentsEmptyState: React.FC<{
  onScheduleAppointment?: () => void;
  className?: string;
}> = ({ onScheduleAppointment, className }) => (
  <EmptyState
    illustration="calendar"
    title="No appointments scheduled"
    description="Taking the step to schedule professional support shows incredible strength and self-care."
    action={onScheduleAppointment ? {
      label: "Schedule Appointment",
      onClick: onScheduleAppointment,
      icon: Calendar
    } : undefined}
    supportive={true}
    mood="encouraging"
    className={className}
  />
);

export const NoSafetyPlanEmptyState: React.FC<{
  onCreateSafetyPlan?: () => void;
  className?: string;
}> = ({ onCreateSafetyPlan, className }) => (
  <EmptyState
    icon={<Shield className="w-16 h-16 text-blue-500" />}
    title="Create your safety plan"
    description="A safety plan is a personalized guide that helps you navigate difficult moments and connects you with support when you need it most."
    action={onCreateSafetyPlan ? {
      label: "Create Safety Plan",
      onClick: onCreateSafetyPlan,
      variant: "primary"
    } : undefined}
    secondaryAction={{
      label: "Learn More",
      onClick: () => {}, // Would show info about safety plans
      variant: "outline"
    }}
    supportive={true}
    mood="supportive"
    size="large"
    className={className}
  />
);

export const SearchEmptyState: React.FC<{
  searchTerm?: string;
  onClearSearch?: () => void;
  onBrowseAll?: () => void;
  className?: string;
}> = ({ searchTerm, onClearSearch, onBrowseAll, className }) => (
  <EmptyState
    illustration="search"
    title={searchTerm ? `No results for "${searchTerm}"` : "No results found"}
    description="Try different keywords, check your spelling, or browse all available options."
    action={onBrowseAll ? {
      label: "Browse All",
      onClick: onBrowseAll,
      variant: "primary"
    } : undefined}
    secondaryAction={onClearSearch ? {
      label: "Clear Search",
      onClick: onClearSearch,
      variant: "outline"
    } : undefined}
    className={className}
  />
);

export const CrisisEmptyState: React.FC<{
  onGetHelp?: () => void;
  onCallCrisisLine?: () => void;
  className?: string;
}> = ({ onGetHelp, onCallCrisisLine, className }) => (
  <EmptyState
    icon={<AlertCircle className="w-16 h-16 text-red-500" />}
    title="We're here for you"
    description="If you're experiencing a mental health crisis, immediate support is available. You don't have to go through this alone."
    action={onCallCrisisLine ? {
      label: "Call 988",
      onClick: onCallCrisisLine,
      variant: "primary"
    } : undefined}
    secondaryAction={onGetHelp ? {
      label: "Get Support",
      onClick: onGetHelp,
      variant: "secondary"
    } : undefined}
    supportive={true}
    mood="crisis"
    size="large"
    className={className}
  />
);

export const ErrorEmptyState: React.FC<{
  onRetry?: () => void;
  onGoBack?: () => void;
  errorMessage?: string;
  className?: string;
}> = ({ onRetry, onGoBack, errorMessage, className }) => (
  <EmptyState
    illustration="error"
    title="Something went wrong"
    description={errorMessage || "We're having trouble loading this content. Please try again or go back to the previous page."}
    action={onRetry ? {
      label: "Try Again",
      onClick: onRetry,
      variant: "primary"
    } : undefined}
    secondaryAction={onGoBack ? {
      label: "Go Back",
      onClick: onGoBack,
      variant: "outline"
    } : undefined}
    className={className}
  />
);

export const SuccessEmptyState: React.FC<{
  title: string;
  description: string;
  onContinue?: () => void;
  className?: string;
}> = ({ title, description, onContinue, className }) => (
  <EmptyState
    illustration="success"
    title={title}
    description={description}
    action={onContinue ? {
      label: "Continue",
      onClick: onContinue,
      variant: "primary"
    } : undefined}
    supportive={true}
    mood="encouraging"
    className={className}
  />
);

export default EmptyState;

