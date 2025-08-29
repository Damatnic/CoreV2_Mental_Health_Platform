import * as React from 'react';
const { useState, useEffect } = React;
import { LazyMarkdown } from './LazyMarkdown';
import { HeartIcon, VideoOnIcon, ThumbsUpIcon } from './icons.dynamic';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import { Dilemma } from '../types';
import { AppButton } from './AppButton';
import { Card } from './Card';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface PostCardProps {
  dilemma: Dilemma;
  onToggleSupport?: (dilemmaId: string) => void;
  onStartChat?: (dilemmaId: string) => void;
  onStartVideoChat?: (dilemmaId: string) => void;
  onReport?: (dilemmaId: string) => void;
  onDismissReport?: (dilemmaId: string) => void;
  onRemovePost?: (dilemmaId: string) => void;
  onAcceptDilemma?: (dilemmaId: string) => void;
  onDeclineRequest?: (dilemmaId: string) => void;
  onResolve?: (dilemmaId: string) => void;
  onSummarize?: (dilemmaId: string) => void;
  hasUnread?: boolean;
  isHelperView?: boolean;
  isMyPostView?: boolean;
  filteredCategories?: string[];
  aiMatchReason?: string;
}

const getColorIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 8);
};

const PostCardComponent: React.FC<PostCardProps> = (props) => {
  const {
    dilemma,
    onToggleSupport,
    onStartChat,
    onStartVideoChat,
    onReport,
    onDismissReport,
    onRemovePost,
    onAcceptDilemma,
    onDeclineRequest,
    onResolve,
    onSummarize,
    hasUnread,
    isHelperView,
    isMyPostView,
    filteredCategories = [],
    aiMatchReason
  } = props;

  const [isRevealed, setIsRevealed] = useState(false);
  const [isSummaryVisible, setIsSummaryVisible] = useState(false);
  const [isAnimatingSupport, setIsAnimatingSupport] = useState(false);
  const [swipeAction, setSwipeAction] = useState<string | null>(null);
  const isFiltered = filteredCategories.includes(dilemma.category) && !isRevealed;

  // Configure swipe gestures for quick actions
  const { ref: swipeRef } = useSwipeGesture<HTMLDivElement>({
    threshold: 100,
    velocityThreshold: 0.5,
    onSwipeLeft: () => {
      if (!isHelperView && !isMyPostView) {
        setSwipeAction("support");
        setTimeout(() => {
          handleSupportClick({} as React.MouseEvent<HTMLButtonElement>);
          setSwipeAction(null);
        }, 150);
      }
    },
    onSwipeRight: () => {
      if (isHelperView && dilemma.status === "active") {
        setSwipeAction("accept");
        setTimeout(() => {
          onAcceptDilemma?.(dilemma.id);
          setSwipeAction(null);
        }, 150);
      }
    }
  });

  useEffect(() => {
    setIsRevealed(false);
  }, [filteredCategories]);

  const handleSupportClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onToggleSupport && !dilemma.isSupported) {
      onToggleSupport(dilemma.id);
      setIsAnimatingSupport(true);
      setTimeout(() => setIsAnimatingSupport(false), 300);
    }
    if (onStartChat) {
      onStartChat(dilemma.id);
    }
  };

  if (isFiltered) {
    return React.createElement(Card, {
      className: "post-card",
      style: { filter: "blur(8px)", cursor: "pointer" },
      onClick: () => setIsRevealed(true),
      children: [
        React.createElement(
          'div',
          { className: 'post-header' },
          React.createElement(
            'div',
            { className: 'post-user-info' },
            React.createElement('div', { className: `avatar avatar-color-${getColorIndex(dilemma.userToken)}` }),
            React.createElement('span', { className: 'username' }, 'Anonymous User')
          ),
          React.createElement(
            'div',
            { className: 'post-meta' },
            React.createElement('span', { className: 'post-category' }, dilemma.category),
            React.createElement('div', { className: 'post-timestamp' }, formatTimeAgo(dilemma.timestamp))
          )
        ),
        React.createElement(
          'div',
          {
            className: 'post-content markdown-content',
            style: {
              textAlign: "center",
              fontWeight: "bold",
              color: "var(--text-secondary)"
            }
          },
          React.createElement('p', null, 'Content hidden based on your filter preferences.'),
          React.createElement('p', null, 'Click to reveal.')
        )
      ]
    });
  }

  const renderHelperActions = () => {
    if (dilemma.status === "direct_request") {
      return React.createElement(
        'div',
        { className: 'form-actions-group' },
        React.createElement(AppButton, {
          variant: 'success',
          className: 'btn-sm',
          onClick: () => onAcceptDilemma?.(dilemma.id),
          children: 'Accept Request'
        }),
        React.createElement(AppButton, {
          variant: 'danger',
          className: 'btn-sm',
          onClick: () => onDeclineRequest?.(dilemma.id),
          children: 'Decline'
        })
      );
    }

    if (dilemma.status === "in_progress") {
      return React.createElement(
        'div',
        { className: 'form-actions-group' },
        React.createElement(AppButton, {
          variant: 'secondary',
          className: 'btn-sm',
          onClick: () => onStartChat?.(dilemma.id),
          icon: React.createElement(HeartIcon),
          children: 'Chat with User'
        }),
        onStartVideoChat && React.createElement(AppButton, {
          variant: 'secondary',
          className: 'btn-sm',
          onClick: () => onStartVideoChat(dilemma.id),
          icon: React.createElement(VideoOnIcon),
          children: 'Video Chat'
        })
      );
    }

    if (dilemma.isReported) {
      return React.createElement(
        'div',
        { className: 'form-actions-group' },
        React.createElement(AppButton, {
          variant: 'danger',
          className: 'btn-sm',
          onClick: () => onRemovePost?.(dilemma.id),
          children: 'Remove Post'
        }),
        React.createElement(AppButton, {
          variant: 'secondary',
          className: 'btn-sm',
          onClick: () => onDismissReport?.(dilemma.id),
          children: 'Dismiss Report'
        })
      );
    }

    return React.createElement(
      'div',
      { className: 'form-actions-group' },
      !dilemma.summary && React.createElement(AppButton, {
        variant: 'ghost',
        className: 'btn-sm',
        onClick: () => onSummarize?.(dilemma.id),
        isLoading: dilemma.summaryLoading,
        children: 'Summarize'
      }),
      React.createElement(AppButton, {
        variant: 'success',
        className: 'btn-sm',
        onClick: () => onAcceptDilemma?.(dilemma.id),
        icon: React.createElement(ThumbsUpIcon),
        children: 'Accept Dilemma'
      })
    );
  };

  return React.createElement(
    'div',
    {
      ref: swipeRef,
      className: `post-card-container touch-optimized ${swipeAction ? 'swipe-' + swipeAction : ""}`
    },
    React.createElement(Card, {
      className: 'post-card',
      children: [
        // Post header
        React.createElement(
          'div',
          { className: 'post-header' },
          React.createElement(
            'div',
            { className: 'post-user-info' },
            React.createElement('div', { className: `avatar avatar-color-${getColorIndex(dilemma.userToken)}` }),
            React.createElement('span', { className: 'username' }, 'Anonymous User')
          ),
          React.createElement(
            'div',
            { className: 'post-meta' },
            React.createElement('span', { className: 'post-category' }, dilemma.category),
            React.createElement('div', { className: 'post-timestamp' }, formatTimeAgo(dilemma.timestamp))
          )
        ),
        // Report reason display
        dilemma.isReported && isHelperView && React.createElement(
          'div',
          { className: 'report-reason-display' },
          'Reported for: ',
          React.createElement('strong', null, dilemma.reportReason)
        ),
        // AI match reason
        aiMatchReason && React.createElement(
          'div',
          { className: 'ai-match-reason' },
          '✨ ', aiMatchReason
        ),
        // Post content
        React.createElement(
          'div',
          { className: 'post-content markdown-content' },
          React.createElement(LazyMarkdown, {
            className: 'post-markdown',
            autoLoad: true,
            children: dilemma.content
          })
        ),
        // Summary for helpers
        isHelperView && dilemma.summary && React.createElement(
          'div',
          { className: 'summary-container' },
          React.createElement(
            'button',
            {
              onClick: () => setIsSummaryVisible(!isSummaryVisible),
              className: 'btn touch-optimized',
              style: {
                cursor: "pointer",
                background: "none",
                border: "none",
                padding: "12px 0",
                font: "inherit",
                fontSize: "1.1em",
                fontWeight: "bold",
                minHeight: "44px"
              },
              'aria-expanded': isSummaryVisible
            },
            'AI Summary ', isSummaryVisible ? "▼" : '►'
          ),
          isSummaryVisible && React.createElement(
            'div',
            { className: 'summary-content markdown-content' },
            React.createElement(LazyMarkdown, {
              className: 'summary-markdown',
              children: dilemma.summary
            })
          )
        ),
        // Post actions
        React.createElement(
          'div',
          { className: 'post-actions' },
          isHelperView ? (
            renderHelperActions()
          ) : (
            React.createElement(
              'div',
              {
                className: 'form-actions-group',
                style: { width: "100%", justifyContent: 'space-between' }
              },
              React.createElement(AppButton, {
                variant: 'secondary',
                className: `btn-sm btn-support ${dilemma.isSupported ? "supported" : ""} ${isAnimatingSupport ? 'anim-pop' : ""}`,
                onClick: handleSupportClick,
                icon: React.createElement(HeartIcon),
                children: [
                  hasUnread && React.createElement('div', { className: 'notification-dot-small' }),
                  React.createElement(
                    'span',
                    { className: 'support-text' },
                    isMyPostView ? "View Chat" : "Offer Support"
                  ),
                  !isMyPostView && React.createElement(
                    'span',
                    { className: 'support-count' },
                    dilemma.supportCount > 0 ? dilemma.supportCount : ""
                  )
                ]
              }),
              React.createElement(
                'div',
                { style: { display: "flex", gap: "0.5rem" } },
                isMyPostView && dilemma.status === "in_progress" && onResolve && React.createElement(AppButton, {
                  variant: 'success',
                  className: 'btn-sm',
                  onClick: () => onResolve(dilemma.id),
                  children: 'Mark as Resolved'
                }),
                React.createElement(AppButton, {
                  variant: 'secondary',
                  className: `btn-sm btn-report ${dilemma.isReported ? "reported" : ""}`,
                  onClick: (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onReport?.(dilemma.id);
                  },
                  disabled: dilemma.isReported,
                  children: dilemma.isReported ? "Reported" : 'Report'
                })
              )
            )
          )
        )
      ]
    }),
    // Swipe hint overlay
    swipeAction && React.createElement(
      'div',
      { className: `swipe-hint swipe-hint-${swipeAction}` },
      swipeAction === 'support' && "💝 Offering Support",
      swipeAction === "accept" && "✅ Accepting Dilemma"
    )
  );
};

export const PostCard = React.memo(PostCardComponent);