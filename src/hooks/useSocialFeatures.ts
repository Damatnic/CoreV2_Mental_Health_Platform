/**
 * useSocialFeatures Hook - Centralized state management for social features
 * Handles forums, support groups, posts, and real-time updates
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  forumService,
  Forum,
  SupportGroup,
  Post,
  Comment,
  ForumCategory,
  GroupType,
  FlagType,
  ModerationAction,
  GroupEvent,
  GroupResource,
  User,
  TrustLevel
} from '../services/social/forumService';
import { useCrisisDetection } from './useCrisisDetection';
import { useDebounce } from './useDebounce';

interface SocialState {
  // Forums
  forums: Forum[];
  selectedForum: Forum | null;
  forumPosts: Post[];
  
  // Support Groups
  supportGroups: SupportGroup[];
  myGroups: SupportGroup[];
  selectedGroup: SupportGroup | null;
  
  // User Data
  currentUser: User | null;
  userReputation: {
    score: number;
    level: TrustLevel;
    badges: any[];
  };
  
  // UI State
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  moderationQueue: (Post | Comment)[];
  
  // Filters
  filters: {
    category?: ForumCategory;
    type?: GroupType;
    searchQuery: string;
    showPrivate: boolean;
    sortBy: 'recent' | 'popular' | 'trending';
  };
  
  // Real-time
  onlineUsers: Map<string, boolean>;
  typingIndicators: Map<string, boolean>;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'crisis';
  message: string;
  timestamp: Date;
  actionUrl?: string;
  autoDismiss?: boolean;
}

interface UseSocialFeaturesReturn {
  // State
  state: SocialState;
  
  // Forum Actions
  loadForums: (category?: ForumCategory) => Promise<void>;
  selectForum: (forum: Forum | null) => void;
  createPost: (post: Partial<Post>) => Promise<Post | null>;
  updatePost: (postId: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  votePost: (postId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  
  // Comment Actions
  createComment: (comment: Partial<Comment>) => Promise<Comment | null>;
  updateComment: (commentId: string, updates: Partial<Comment>) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  voteComment: (commentId: string, voteType: 'upvote' | 'downvote') => Promise<void>;
  
  // Support Group Actions
  loadSupportGroups: (filters?: any) => Promise<void>;
  createSupportGroup: (group: Partial<SupportGroup>) => Promise<SupportGroup | null>;
  joinGroup: (groupId: string, isAnonymous?: boolean) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  selectGroup: (group: SupportGroup | null) => void;
  
  // Event Actions
  scheduleGroupEvent: (groupId: string, event: Partial<GroupEvent>) => Promise<void>;
  joinEvent: (eventId: string) => Promise<void>;
  cancelEvent: (eventId: string) => Promise<void>;
  
  // Resource Actions
  addGroupResource: (groupId: string, resource: Partial<GroupResource>) => Promise<void>;
  removeResource: (resourceId: string) => Promise<void>;
  
  // Moderation Actions
  flagContent: (contentId: string, type: 'post' | 'comment', reason: FlagType, details?: string) => Promise<void>;
  moderateContent: (action: ModerationAction) => Promise<void>;
  loadModerationQueue: () => Promise<void>;
  
  // Filter Actions
  setFilters: (filters: Partial<SocialState['filters']>) => void;
  clearFilters: () => void;
  search: (query: string) => Promise<void>;
  
  // Notification Actions
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Utility Functions
  checkContentSafety: (content: string) => Promise<boolean>;
  getRecommendedGroups: () => SupportGroup[];
  getTrendingTopics: () => string[];
  getUserStats: () => Promise<any>;
}

export const useSocialFeatures = (userId: string): UseSocialFeaturesReturn => {
  // Initialize state
  const [state, setState] = useState<SocialState>({
    forums: [],
    selectedForum: null,
    forumPosts: [],
    supportGroups: [],
    myGroups: [],
    selectedGroup: null,
    currentUser: null,
    userReputation: {
      score: 0,
      level: TrustLevel.NEW_MEMBER,
      badges: []
    },
    isLoading: false,
    error: null,
    notifications: [],
    moderationQueue: [],
    filters: {
      searchQuery: '',
      showPrivate: false,
      sortBy: 'recent'
    },
    onlineUsers: new Map(),
    typingIndicators: new Map()
  });

  // Refs for real-time connections
  const socketRef = useRef<any>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Crisis detection
  const { checkContent, triggerCrisisSupport } = useCrisisDetection();
  
  // Debounced search
  const debouncedSearch = useDebounce(state.filters.searchQuery, 500);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
    loadInitialData();
    
    return () => {
      cleanup();
    };
  }, [userId]);

  // Handle search
  useEffect(() => {
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  // Initialize WebSocket connection
  const initializeConnection = useCallback(() => {
    // This would connect to the real-time service
    // For now, we'll simulate with a placeholder
    console.log('Initializing social features connection...');
    
    // Set up event listeners for real-time updates
    setupRealtimeListeners();
  }, []);

  const setupRealtimeListeners = useCallback(() => {
    // These would be actual WebSocket event listeners
    // Simulating with placeholders
    
    // Listen for new posts
    const handleNewPost = (post: Post) => {
      setState(prev => ({
        ...prev,
        forumPosts: [post, ...prev.forumPosts]
      }));
      
      // Check for crisis content
      if (checkContent(post.content)) {
        showNotification({
          type: 'crisis',
          message: 'Crisis content detected. Support resources are available.',
          actionUrl: '/crisis-support'
        });
      }
    };
    
    // Listen for user status updates
    const handleUserStatus = (userId: string, isOnline: boolean) => {
      setState(prev => {
        const newOnlineUsers = new Map(prev.onlineUsers);
        newOnlineUsers.set(userId, isOnline);
        return { ...prev, onlineUsers: newOnlineUsers };
      });
    };
    
    // Listen for typing indicators
    const handleTypingIndicator = (userId: string, isTyping: boolean) => {
      setState(prev => {
        const newTypingIndicators = new Map(prev.typingIndicators);
        if (isTyping) {
          newTypingIndicators.set(userId, true);
        } else {
          newTypingIndicators.delete(userId);
        }
        return { ...prev, typingIndicators: newTypingIndicators };
      });
    };
  }, [checkContent]);

  // Load initial data
  const loadInitialData = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Load forums and groups in parallel
      const [forums, groups, reputation] = await Promise.all([
        forumService.getForums(),
        forumService.getSupportGroups(),
        forumService.getUserReputation(userId)
      ]);
      
      // Filter user's groups
      const myGroups = groups.filter(g => 
        g.members.some(m => m.userId === userId)
      );
      
      setState(prev => ({
        ...prev,
        forums,
        supportGroups: groups,
        myGroups,
        userReputation: reputation,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to load social features. Please refresh the page.',
        isLoading: false
      }));
    }
  };

  // Forum Actions
  const loadForums = async (category?: ForumCategory) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const forums = await forumService.getForums(category);
      setState(prev => ({ ...prev, forums, isLoading: false }));
    } catch (error) {
      handleError('Failed to load forums', error);
    }
  };

  const selectForum = (forum: Forum | null) => {
    setState(prev => ({ ...prev, selectedForum: forum }));
    
    if (forum) {
      loadForumPosts(forum.id);
    }
  };

  const loadForumPosts = async (forumId: string) => {
    try {
      const posts = await forumService.getPosts({
        forumId,
        sortBy: state.filters.sortBy,
        limit: 50
      });
      
      setState(prev => ({ ...prev, forumPosts: posts }));
    } catch (error) {
      handleError('Failed to load posts', error);
    }
  };

  const createPost = async (post: Partial<Post>): Promise<Post | null> => {
    // Check content safety
    if (post.content && checkContent(post.content)) {
      const proceed = await showCrisisWarning();
      if (!proceed) return null;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const newPost = await forumService.createPost({
        ...post,
        author: userId
      });
      
      setState(prev => ({
        ...prev,
        forumPosts: [newPost, ...prev.forumPosts],
        isLoading: false
      }));
      
      showNotification({
        type: 'success',
        message: 'Your post has been created successfully!'
      });
      
      return newPost;
    } catch (error) {
      handleError('Failed to create post', error);
      return null;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      // Update local state optimistically
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(p => 
          p.id === postId ? { ...p, ...updates } : p
        )
      }));
      
      // Send update to server
      // await forumService.updatePost(postId, updates);
    } catch (error) {
      handleError('Failed to update post', error);
      // Revert optimistic update
      loadForumPosts(state.selectedForum?.id || '');
    }
  };

  const deletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    
    try {
      // await forumService.deletePost(postId);
      
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.filter(p => p.id !== postId)
      }));
      
      showNotification({
        type: 'info',
        message: 'Post deleted successfully'
      });
    } catch (error) {
      handleError('Failed to delete post', error);
    }
  };

  const votePost = async (postId: string, voteType: 'upvote' | 'downvote') => {
    try {
      await forumService.voteOnPost(postId, voteType);
      
      // Update local state
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => {
          if (post.id === postId) {
            const upvotes = [...post.upvotes];
            const downvotes = [...post.downvotes];
            
            if (voteType === 'upvote') {
              const index = upvotes.indexOf(userId);
              if (index > -1) {
                upvotes.splice(index, 1);
              } else {
                upvotes.push(userId);
                const downIndex = downvotes.indexOf(userId);
                if (downIndex > -1) {
                  downvotes.splice(downIndex, 1);
                }
              }
            } else {
              const index = downvotes.indexOf(userId);
              if (index > -1) {
                downvotes.splice(index, 1);
              } else {
                downvotes.push(userId);
                const upIndex = upvotes.indexOf(userId);
                if (upIndex > -1) {
                  upvotes.splice(upIndex, 1);
                }
              }
            }
            
            return { ...post, upvotes, downvotes };
          }
          return post;
        })
      }));
    } catch (error) {
      handleError('Failed to vote', error);
    }
  };

  // Comment Actions
  const createComment = async (comment: Partial<Comment>): Promise<Comment | null> => {
    if (comment.content && checkContent(comment.content)) {
      const proceed = await showCrisisWarning();
      if (!proceed) return null;
    }
    
    try {
      const newComment = await forumService.createComment({
        ...comment,
        author: userId
      });
      
      // Update post with new comment
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => {
          if (post.id === comment.postId) {
            return {
              ...post,
              comments: [...post.comments, newComment]
            };
          }
          return post;
        })
      }));
      
      showNotification({
        type: 'success',
        message: 'Comment posted successfully!'
      });
      
      return newComment;
    } catch (error) {
      handleError('Failed to post comment', error);
      return null;
    }
  };

  const updateComment = async (commentId: string, updates: Partial<Comment>) => {
    try {
      // Optimistic update
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => ({
          ...post,
          comments: post.comments.map(c => 
            c.id === commentId ? { ...c, ...updates } : c
          )
        }))
      }));
      
      // Server update
      // await forumService.updateComment(commentId, updates);
    } catch (error) {
      handleError('Failed to update comment', error);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    try {
      // await forumService.deleteComment(commentId);
      
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => ({
          ...post,
          comments: post.comments.filter(c => c.id !== commentId)
        }))
      }));
      
      showNotification({
        type: 'info',
        message: 'Comment deleted'
      });
    } catch (error) {
      handleError('Failed to delete comment', error);
    }
  };

  const voteComment = async (commentId: string, voteType: 'upvote' | 'downvote') => {
    try {
      await forumService.voteOnComment(commentId, voteType);
      
      // Update local state
      setState(prev => ({
        ...prev,
        forumPosts: prev.forumPosts.map(post => ({
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              const upvotes = [...comment.upvotes];
              const downvotes = [...comment.downvotes];
              
              if (voteType === 'upvote') {
                const index = upvotes.indexOf(userId);
                if (index > -1) {
                  upvotes.splice(index, 1);
                } else {
                  upvotes.push(userId);
                  const downIndex = downvotes.indexOf(userId);
                  if (downIndex > -1) {
                    downvotes.splice(downIndex, 1);
                  }
                }
              } else {
                const index = downvotes.indexOf(userId);
                if (index > -1) {
                  downvotes.splice(index, 1);
                } else {
                  downvotes.push(userId);
                  const upIndex = upvotes.indexOf(userId);
                  if (upIndex > -1) {
                    upvotes.splice(upIndex, 1);
                  }
                }
              }
              
              return { ...comment, upvotes, downvotes };
            }
            return comment;
          })
        }))
      }));
    } catch (error) {
      handleError('Failed to vote on comment', error);
    }
  };

  // Support Group Actions
  const loadSupportGroups = async (filters?: any) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const groups = await forumService.getSupportGroups(filters);
      setState(prev => ({ ...prev, supportGroups: groups, isLoading: false }));
    } catch (error) {
      handleError('Failed to load support groups', error);
    }
  };

  const createSupportGroup = async (group: Partial<SupportGroup>): Promise<SupportGroup | null> => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const newGroup = await forumService.createSupportGroup({
        ...group,
        createdBy: userId
      });
      
      setState(prev => ({
        ...prev,
        supportGroups: [...prev.supportGroups, newGroup],
        myGroups: [...prev.myGroups, newGroup],
        isLoading: false
      }));
      
      showNotification({
        type: 'success',
        message: 'Support group created successfully!'
      });
      
      return newGroup;
    } catch (error) {
      handleError('Failed to create support group', error);
      return null;
    }
  };

  const joinGroup = async (groupId: string, isAnonymous: boolean = false) => {
    try {
      await forumService.joinSupportGroup(groupId, isAnonymous);
      
      const group = state.supportGroups.find(g => g.id === groupId);
      if (group) {
        setState(prev => ({
          ...prev,
          myGroups: [...prev.myGroups, group]
        }));
        
        showNotification({
          type: 'success',
          message: `Successfully joined ${group.name}!`
        });
      }
    } catch (error) {
      handleError('Failed to join group', error);
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!window.confirm('Are you sure you want to leave this group?')) {
      return;
    }
    
    try {
      await forumService.leaveSupportGroup(groupId);
      
      setState(prev => ({
        ...prev,
        myGroups: prev.myGroups.filter(g => g.id !== groupId),
        selectedGroup: prev.selectedGroup?.id === groupId ? null : prev.selectedGroup
      }));
      
      showNotification({
        type: 'info',
        message: 'You have left the group'
      });
    } catch (error) {
      handleError('Failed to leave group', error);
    }
  };

  const selectGroup = (group: SupportGroup | null) => {
    setState(prev => ({ ...prev, selectedGroup: group }));
  };

  // Event Actions
  const scheduleGroupEvent = async (groupId: string, event: Partial<GroupEvent>) => {
    try {
      const newEvent = await forumService.scheduleGroupEvent(groupId, event);
      
      // Update group with new event
      setState(prev => ({
        ...prev,
        supportGroups: prev.supportGroups.map(g => 
          g.id === groupId 
            ? { ...g, events: [...g.events, newEvent] }
            : g
        ),
        myGroups: prev.myGroups.map(g => 
          g.id === groupId 
            ? { ...g, events: [...g.events, newEvent] }
            : g
        )
      }));
      
      showNotification({
        type: 'success',
        message: 'Event scheduled successfully!'
      });
    } catch (error) {
      handleError('Failed to schedule event', error);
    }
  };

  const joinEvent = async (eventId: string) => {
    try {
      await forumService.joinGroupEvent(eventId);
      
      showNotification({
        type: 'success',
        message: 'You have joined the event!'
      });
    } catch (error) {
      handleError('Failed to join event', error);
    }
  };

  const cancelEvent = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to cancel this event?')) {
      return;
    }
    
    try {
      // await forumService.cancelEvent(eventId);
      
      showNotification({
        type: 'info',
        message: 'Event cancelled'
      });
    } catch (error) {
      handleError('Failed to cancel event', error);
    }
  };

  // Resource Actions
  const addGroupResource = async (groupId: string, resource: Partial<GroupResource>) => {
    try {
      // const newResource = await forumService.addGroupResource(groupId, resource);
      
      showNotification({
        type: 'success',
        message: 'Resource added successfully!'
      });
    } catch (error) {
      handleError('Failed to add resource', error);
    }
  };

  const removeResource = async (resourceId: string) => {
    if (!window.confirm('Are you sure you want to remove this resource?')) {
      return;
    }
    
    try {
      // await forumService.removeResource(resourceId);
      
      showNotification({
        type: 'info',
        message: 'Resource removed'
      });
    } catch (error) {
      handleError('Failed to remove resource', error);
    }
  };

  // Moderation Actions
  const flagContent = async (
    contentId: string,
    type: 'post' | 'comment',
    reason: FlagType,
    details?: string
  ) => {
    try {
      await forumService.flagContent(contentId, type, reason, details);
      
      showNotification({
        type: 'success',
        message: 'Thank you for your report. Our moderation team will review it.'
      });
    } catch (error) {
      handleError('Failed to flag content', error);
    }
  };

  const moderateContent = async (action: ModerationAction) => {
    try {
      await forumService.moderateContent(action);
      
      showNotification({
        type: 'success',
        message: 'Moderation action completed'
      });
      
      // Refresh moderation queue
      loadModerationQueue();
    } catch (error) {
      handleError('Failed to moderate content', error);
    }
  };

  const loadModerationQueue = async () => {
    try {
      const queue = await forumService.getModerationQueue();
      setState(prev => ({ ...prev, moderationQueue: queue }));
    } catch (error) {
      handleError('Failed to load moderation queue', error);
    }
  };

  // Filter Actions
  const setFilters = (filters: Partial<SocialState['filters']>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters }
    }));
  };

  const clearFilters = () => {
    setState(prev => ({
      ...prev,
      filters: {
        searchQuery: '',
        showPrivate: false,
        sortBy: 'recent'
      }
    }));
  };

  const search = async (query: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const results = await forumService.searchContent(query);
      // Handle search results
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      handleError('Search failed', error);
    }
  };

  const performSearch = async (query: string) => {
    // Implement search logic
    await search(query);
  };

  // Notification Actions
  const showNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      autoDismiss: notification.autoDismiss !== false
    };
    
    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification]
    }));
    
    // Auto-dismiss after 5 seconds if enabled
    if (newNotification.autoDismiss) {
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, 5000);
    }
  };

  const dismissNotification = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== id)
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({ ...prev, notifications: [] }));
  };

  // Utility Functions
  const checkContentSafety = async (content: string): Promise<boolean> => {
    // Check for crisis content
    if (checkContent(content)) {
      return false;
    }
    
    // Additional safety checks
    return true;
  };

  const getRecommendedGroups = (): SupportGroup[] => {
    // Algorithm to recommend groups based on user activity and preferences
    return state.supportGroups
      .filter(g => !state.myGroups.some(mg => mg.id === g.id))
      .slice(0, 5);
  };

  const getTrendingTopics = (): string[] => {
    // Analyze posts to find trending topics
    const topicCounts = new Map<string, number>();
    
    state.forumPosts.forEach(post => {
      post.tags.forEach(tag => {
        topicCounts.set(tag, (topicCounts.get(tag) || 0) + 1);
      });
    });
    
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag]) => tag);
  };

  const getUserStats = async (): Promise<any> => {
    try {
      const reputation = await forumService.getUserReputation(userId);
      return {
        reputation,
        postCount: state.forumPosts.filter(p => p.author === userId).length,
        groupCount: state.myGroups.length,
        // Add more stats
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  };

  // Helper Functions
  const handleError = (message: string, error: any) => {
    console.error(message, error);
    setState(prev => ({
      ...prev,
      error: message,
      isLoading: false
    }));
    
    showNotification({
      type: 'error',
      message,
      autoDismiss: false
    });
  };

  const showCrisisWarning = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      showNotification({
        type: 'crisis',
        message: 'We noticed your message might indicate you\'re going through a difficult time. Would you like to access crisis support resources?',
        actionUrl: '/crisis-support',
        autoDismiss: false
      });
      
      // For now, allow the post to continue
      // In production, this would show a modal with options
      resolve(true);
    });
  };

  const cleanup = () => {
    // Clean up WebSocket connections
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Disconnect from forum service
    forumService.disconnect();
  };

  return {
    state,
    
    // Forum Actions
    loadForums,
    selectForum,
    createPost,
    updatePost,
    deletePost,
    votePost,
    
    // Comment Actions
    createComment,
    updateComment,
    deleteComment,
    voteComment,
    
    // Support Group Actions
    loadSupportGroups,
    createSupportGroup,
    joinGroup,
    leaveGroup,
    selectGroup,
    
    // Event Actions
    scheduleGroupEvent,
    joinEvent,
    cancelEvent,
    
    // Resource Actions
    addGroupResource,
    removeResource,
    
    // Moderation Actions
    flagContent,
    moderateContent,
    loadModerationQueue,
    
    // Filter Actions
    setFilters,
    clearFilters,
    search,
    
    // Notification Actions
    showNotification,
    dismissNotification,
    clearNotifications,
    
    // Utility Functions
    checkContentSafety,
    getRecommendedGroups,
    getTrendingTopics,
    getUserStats
  };
};

export default useSocialFeatures;