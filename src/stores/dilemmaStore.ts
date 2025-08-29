/**
 * Dilemma Store
 *
 * Zustand store for managing dilemmas (posts), user interactions, filtering,
 * sorting, and moderation features for the mental health platform.
 */

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

// Types for dilemma functionality
export interface Dilemma {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    isVerified: boolean;
  };
  category: string;
  tags: string[];
  timestamp: number;
  updatedAt?: number;
  
  // Engagement metrics
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  
  // User interactions
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing: boolean;
  userVote?: 'up' | 'down';
  
  // Content metadata
  readingTime: number;
  difficulty: 'easy' | 'medium' | 'hard';
  sensitivity: 'low' | 'medium' | 'high';
  triggerWarnings: string[];
  
  // Moderation
  isReported: boolean;
  reportCount: number;
  isFlagged: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected' | 'hidden';
  
  // Help status
  hasHelp: boolean;
  helpCount: number;
  isResolved: boolean;
  bestHelpId?: string;
  
  // Media attachments
  attachments?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    caption?: string;
    thumbnail?: string;
  }[];
  
  // Location (if shared)
  location?: {
    country: string;
    region?: string;
    city?: string;
  };
}

export interface DilemmaFilter {
  category?: string;
  tags?: string[];
  difficulty?: Dilemma['difficulty'];
  sensitivity?: Dilemma['sensitivity'];
  hasHelp?: boolean;
  isResolved?: boolean;
  author?: string;
  dateRange?: {
    start: number;
    end: number;
  };
  location?: string;
}

export type SortOption = 
  | 'recent' 
  | 'popular' 
  | 'trending' 
  | 'most_liked' 
  | 'most_commented' 
  | 'most_helped' 
  | 'oldest' 
  | 'alphabetical';

export interface DilemmaStats {
  total: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<Dilemma['difficulty'], number>;
  bySensitivity: Record<Dilemma['sensitivity'], number>;
  resolved: number;
  unresolved: number;
  trending: Dilemma[];
  popular: Dilemma[];
}

// Store state interface
interface DilemmaState {
  // Dilemmas
  allDilemmas: Dilemma[];
  forYouDilemmas: Dilemma[];
  trendingDilemmas: Dilemma[];
  bookmarkedDilemmas: Dilemma[];
  myDilemmas: Dilemma[];
  
  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  
  // Filtering and sorting
  activeFilter: DilemmaFilter;
  sortBy: SortOption;
  searchTerm: string;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
  postsPerPage: number;
  
  // UI state
  selectedDilemmaId: string | null;
  viewMode: 'grid' | 'list' | 'card';
  showFilters: boolean;
  
  // Moderation
  reportingDilemmaId: string | null;
  isReportModalOpen: boolean;
  reportReason: string;
  blockedUserIds: Set<string>;
  
  // Statistics
  stats: DilemmaStats;
  
  // Error handling
  error: string | null;
}

// Store actions interface
interface DilemmaActions {
  // Dilemma management
  fetchDilemmas: (page?: number, refresh?: boolean) => Promise<void>;
  fetchForYouDilemmas: () => Promise<void>;
  fetchTrendingDilemmas: () => Promise<void>;
  fetchMyDilemmas: () => Promise<void>;
  fetchBookmarkedDilemmas: () => Promise<void>;
  
  // CRUD operations
  createDilemma: (dilemma: Omit<Dilemma, 'id' | 'timestamp' | 'views' | 'likes' | 'comments' | 'shares' | 'bookmarks' | 'isLiked' | 'isBookmarked' | 'isFollowing' | 'isReported' | 'reportCount' | 'isFlagged' | 'moderationStatus' | 'hasHelp' | 'helpCount' | 'isResolved'>) => Promise<string>;
  updateDilemma: (id: string, updates: Partial<Dilemma>) => Promise<void>;
  deleteDilemma: (id: string) => Promise<void>;
  
  // User interactions
  likeDilemma: (id: string) => Promise<void>;
  unlikeDilemma: (id: string) => Promise<void>;
  bookmarkDilemma: (id: string) => Promise<void>;
  unbookmarkDilemma: (id: string) => Promise<void>;
  shareDilemma: (id: string, platform?: string) => Promise<void>;
  followAuthor: (dilemmaId: string) => Promise<void>;
  unfollowAuthor: (dilemmaId: string) => Promise<void>;
  
  // Filtering and sorting
  setFilter: (filter: Partial<DilemmaFilter>) => void;
  clearFilter: () => void;
  setSortBy: (sortBy: SortOption) => void;
  setSearchTerm: (term: string) => void;
  
  // Pagination
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setPostsPerPage: (count: number) => void;
  
  // UI actions
  setSelectedDilemma: (id: string | null) => void;
  setViewMode: (mode: DilemmaState['viewMode']) => void;
  toggleFilters: () => void;
  
  // Moderation actions
  reportDilemma: (id: string, reason: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  flagDilemma: (id: string) => Promise<void>;
  
  // Statistics
  updateStats: () => void;
  
  // Utility actions
  refreshAll: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

const POSTS_PER_PAGE = 10;

// Mock API for dilemmas
const mockDilemmaAPI = {
  async fetchDilemmas(page = 1, limit = POSTS_PER_PAGE): Promise<{ dilemmas: Dilemma[], total: number, hasMore: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // Generate mock dilemmas
    const mockDilemmas: Dilemma[] = Array.from({ length: limit }, (_, i) => ({
      id: `dilemma_${page}_${i + 1}`,
      title: `Sample Dilemma ${(page - 1) * limit + i + 1}`,
      content: `This is a sample dilemma content for testing purposes. It contains some meaningful text about mental health challenges and seeking support. This is dilemma number ${(page - 1) * limit + i + 1}.`,
      author: {
        id: `user_${Math.floor(Math.random() * 100)}`,
        name: `User ${Math.floor(Math.random() * 100)}`,
        role: 'user',
        isVerified: Math.random() > 0.7
      },
      category: ['anxiety', 'depression', 'relationships', 'work', 'family'][Math.floor(Math.random() * 5)],
      tags: ['mental-health', 'support', 'advice'].slice(0, Math.floor(Math.random() * 3) + 1),
      timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      comments: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 20),
      bookmarks: Math.floor(Math.random() * 30),
      isLiked: Math.random() > 0.8,
      isBookmarked: Math.random() > 0.9,
      isFollowing: Math.random() > 0.85,
      readingTime: Math.floor(Math.random() * 5) + 1,
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as Dilemma['difficulty'],
      sensitivity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as Dilemma['sensitivity'],
      triggerWarnings: Math.random() > 0.7 ? ['anxiety', 'depression'] : [],
      isReported: false,
      reportCount: 0,
      isFlagged: false,
      moderationStatus: 'approved' as const,
      hasHelp: Math.random() > 0.6,
      helpCount: Math.floor(Math.random() * 10),
      isResolved: Math.random() > 0.7
    }));
    
    return {
      dilemmas: mockDilemmas,
      total: 100, // Mock total
      hasMore: page < 10 // Mock has more
    };
  },
  
  async createDilemma(dilemmaData: any): Promise<Dilemma> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      id: `dilemma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      isLiked: false,
      isBookmarked: false,
      isFollowing: false,
      isReported: false,
      reportCount: 0,
      isFlagged: false,
      moderationStatus: 'pending',
      hasHelp: false,
      helpCount: 0,
      isResolved: false,
      ...dilemmaData
    };
  },
  
  async updateDilemma(id: string, updates: any): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  async deleteDilemma(id: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  },
  
  async interactWithDilemma(id: string, action: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};

// Helper functions
const applyFilters = (dilemmas: Dilemma[], filter: DilemmaFilter, searchTerm: string): Dilemma[] => {
  return dilemmas.filter(dilemma => {
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!dilemma.title.toLowerCase().includes(term) && 
          !dilemma.content.toLowerCase().includes(term) &&
          !dilemma.tags.some(tag => tag.toLowerCase().includes(term))) {
        return false;
      }
    }
    
    // Category filter
    if (filter.category && dilemma.category !== filter.category) {
      return false;
    }
    
    // Tags filter
    if (filter.tags && filter.tags.length > 0) {
      if (!filter.tags.some(tag => dilemma.tags.includes(tag))) {
        return false;
      }
    }
    
    // Difficulty filter
    if (filter.difficulty && dilemma.difficulty !== filter.difficulty) {
      return false;
    }
    
    // Sensitivity filter
    if (filter.sensitivity && dilemma.sensitivity !== filter.sensitivity) {
      return false;
    }
    
    // Help status filter
    if (filter.hasHelp !== undefined && dilemma.hasHelp !== filter.hasHelp) {
      return false;
    }
    
    // Resolved status filter
    if (filter.isResolved !== undefined && dilemma.isResolved !== filter.isResolved) {
      return false;
    }
    
    // Author filter
    if (filter.author && dilemma.author.id !== filter.author) {
      return false;
    }
    
    // Date range filter
    if (filter.dateRange) {
      if (dilemma.timestamp < filter.dateRange.start || dilemma.timestamp > filter.dateRange.end) {
        return false;
      }
    }
    
    return true;
  });
};

const applySorting = (dilemmas: Dilemma[], sortBy: SortOption): Dilemma[] => {
  const sorted = [...dilemmas];
  
  switch (sortBy) {
    case 'recent':
      return sorted.sort((a, b) => b.timestamp - a.timestamp);
    case 'oldest':
      return sorted.sort((a, b) => a.timestamp - b.timestamp);
    case 'popular':
      return sorted.sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares));
    case 'trending':
      return sorted.sort((a, b) => {
        const aScore = (b.likes * 2 + b.comments * 3 + b.shares * 4) / Math.max(1, (Date.now() - b.timestamp) / (1000 * 60 * 60));
        const bScore = (a.likes * 2 + a.comments * 3 + a.shares * 4) / Math.max(1, (Date.now() - a.timestamp) / (1000 * 60 * 60));
        return bScore - aScore;
      });
    case 'most_liked':
      return sorted.sort((a, b) => b.likes - a.likes);
    case 'most_commented':
      return sorted.sort((a, b) => b.comments - a.comments);
    case 'most_helped':
      return sorted.sort((a, b) => b.helpCount - a.helpCount);
    case 'alphabetical':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sorted;
  }
};

// Create the dilemma store
export const useDilemmaStore = create<DilemmaState & DilemmaActions>()(
  persist(
    devtools(
      (set, get) => ({
        // Initial state
        allDilemmas: [],
        forYouDilemmas: [],
        trendingDilemmas: [],
        bookmarkedDilemmas: [],
        myDilemmas: [],
        
        isLoading: false,
        isLoadingMore: false,
        isRefreshing: false,
        
        activeFilter: {},
        sortBy: 'recent',
        searchTerm: '',
        
        currentPage: 1,
        totalPages: 1,
        hasMore: true,
        postsPerPage: POSTS_PER_PAGE,
        
        selectedDilemmaId: null,
        viewMode: 'card',
        showFilters: false,
        
        reportingDilemmaId: null,
        isReportModalOpen: false,
        reportReason: '',
        blockedUserIds: new Set(),
        
        stats: {
          total: 0,
          byCategory: {},
          byDifficulty: { easy: 0, medium: 0, hard: 0 },
          bySensitivity: { low: 0, medium: 0, high: 0 },
          resolved: 0,
          unresolved: 0,
          trending: [],
          popular: []
        },
        
        error: null,

        // Dilemma management
        fetchDilemmas: async (page = 1, refresh = false) => {
          try {
            if (refresh) {
              set({ isRefreshing: true, error: null });
            } else if (page === 1) {
              set({ isLoading: true, error: null });
            } else {
              set({ isLoadingMore: true, error: null });
            }
            
            const result = await mockDilemmaAPI.fetchDilemmas(page, get().postsPerPage);
            
            set(state => ({
              allDilemmas: page === 1 || refresh 
                ? result.dilemmas 
                : [...state.allDilemmas, ...result.dilemmas],
              currentPage: page,
              totalPages: Math.ceil(result.total / state.postsPerPage),
              hasMore: result.hasMore,
              isLoading: false,
              isLoadingMore: false,
              isRefreshing: false
            }));
            
            get().updateStats();
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch dilemmas',
              isLoading: false,
              isLoadingMore: false,
              isRefreshing: false
            });
          }
        },

        fetchForYouDilemmas: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Mock personalized dilemmas
            const result = await mockDilemmaAPI.fetchDilemmas(1, 20);
            
            set({ 
              forYouDilemmas: result.dilemmas,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch personalized dilemmas',
              isLoading: false 
            });
          }
        },

        fetchTrendingDilemmas: async () => {
          try {
            const result = await mockDilemmaAPI.fetchDilemmas(1, 10);
            const trending = applySorting(result.dilemmas, 'trending');
            
            set({ trendingDilemmas: trending });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to fetch trending dilemmas' });
          }
        },

        fetchMyDilemmas: async () => {
          try {
            set({ isLoading: true, error: null });
            
            // Mock user's dilemmas
            const result = await mockDilemmaAPI.fetchDilemmas(1, 50);
            
            set({ 
              myDilemmas: result.dilemmas,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch your dilemmas',
              isLoading: false 
            });
          }
        },

        fetchBookmarkedDilemmas: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const { allDilemmas } = get();
            const bookmarked = allDilemmas.filter(d => d.isBookmarked);
            
            set({ 
              bookmarkedDilemmas: bookmarked,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch bookmarked dilemmas',
              isLoading: false 
            });
          }
        },

        // CRUD operations
        createDilemma: async (dilemmaData) => {
          try {
            const newDilemma = await mockDilemmaAPI.createDilemma(dilemmaData);
            
            set(state => ({
              allDilemmas: [newDilemma, ...state.allDilemmas],
              myDilemmas: [newDilemma, ...state.myDilemmas]
            }));
            
            get().updateStats();
            
            return newDilemma.id;
          } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to create dilemma');
          }
        },

        updateDilemma: async (id, updates) => {
          try {
            await mockDilemmaAPI.updateDilemma(id, updates);
            
            const updateDilemmaInArray = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d);
            
            set(state => ({
              allDilemmas: updateDilemmaInArray(state.allDilemmas),
              forYouDilemmas: updateDilemmaInArray(state.forYouDilemmas),
              myDilemmas: updateDilemmaInArray(state.myDilemmas),
              bookmarkedDilemmas: updateDilemmaInArray(state.bookmarkedDilemmas),
              trendingDilemmas: updateDilemmaInArray(state.trendingDilemmas)
            }));
          } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to update dilemma');
          }
        },

        deleteDilemma: async (id) => {
          try {
            await mockDilemmaAPI.deleteDilemma(id);
            
            const removeDilemmaFromArray = (dilemmas: Dilemma[]) =>
              dilemmas.filter(d => d.id !== id);
            
            set(state => ({
              allDilemmas: removeDilemmaFromArray(state.allDilemmas),
              forYouDilemmas: removeDilemmaFromArray(state.forYouDilemmas),
              myDilemmas: removeDilemmaFromArray(state.myDilemmas),
              bookmarkedDilemmas: removeDilemmaFromArray(state.bookmarkedDilemmas),
              trendingDilemmas: removeDilemmaFromArray(state.trendingDilemmas),
              selectedDilemmaId: state.selectedDilemmaId === id ? null : state.selectedDilemmaId
            }));
            
            get().updateStats();
          } catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Failed to delete dilemma');
          }
        },

        // User interactions
        likeDilemma: async (id) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'like');
            
            const updateLike = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, isLiked: true, likes: d.likes + 1 }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateLike(state.allDilemmas),
              forYouDilemmas: updateLike(state.forYouDilemmas),
              myDilemmas: updateLike(state.myDilemmas),
              bookmarkedDilemmas: updateLike(state.bookmarkedDilemmas),
              trendingDilemmas: updateLike(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to like dilemma' });
          }
        },

        unlikeDilemma: async (id) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'unlike');
            
            const updateUnlike = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, isLiked: false, likes: Math.max(0, d.likes - 1) }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateUnlike(state.allDilemmas),
              forYouDilemmas: updateUnlike(state.forYouDilemmas),
              myDilemmas: updateUnlike(state.myDilemmas),
              bookmarkedDilemmas: updateUnlike(state.bookmarkedDilemmas),
              trendingDilemmas: updateUnlike(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to unlike dilemma' });
          }
        },

        bookmarkDilemma: async (id) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'bookmark');
            
            const updateBookmark = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, isBookmarked: true, bookmarks: d.bookmarks + 1 }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateBookmark(state.allDilemmas),
              forYouDilemmas: updateBookmark(state.forYouDilemmas),
              myDilemmas: updateBookmark(state.myDilemmas),
              trendingDilemmas: updateBookmark(state.trendingDilemmas)
            }));
            
            // Refresh bookmarked dilemmas
            get().fetchBookmarkedDilemmas();
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to bookmark dilemma' });
          }
        },

        unbookmarkDilemma: async (id) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'unbookmark');
            
            const updateUnbookmark = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, isBookmarked: false, bookmarks: Math.max(0, d.bookmarks - 1) }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateUnbookmark(state.allDilemmas),
              forYouDilemmas: updateUnbookmark(state.forYouDilemmas),
              myDilemmas: updateUnbookmark(state.myDilemmas),
              bookmarkedDilemmas: state.bookmarkedDilemmas.filter(d => d.id !== id),
              trendingDilemmas: updateUnbookmark(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to unbookmark dilemma' });
          }
        },

        shareDilemma: async (id, platform) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'share');
            
            const updateShare = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, shares: d.shares + 1 }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateShare(state.allDilemmas),
              forYouDilemmas: updateShare(state.forYouDilemmas),
              myDilemmas: updateShare(state.myDilemmas),
              bookmarkedDilemmas: updateShare(state.bookmarkedDilemmas),
              trendingDilemmas: updateShare(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to share dilemma' });
          }
        },

        followAuthor: async (dilemmaId) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(dilemmaId, 'follow');
            
            const updateFollow = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === dilemmaId 
                  ? { ...d, isFollowing: true }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateFollow(state.allDilemmas),
              forYouDilemmas: updateFollow(state.forYouDilemmas),
              myDilemmas: updateFollow(state.myDilemmas),
              bookmarkedDilemmas: updateFollow(state.bookmarkedDilemmas),
              trendingDilemmas: updateFollow(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to follow author' });
          }
        },

        unfollowAuthor: async (dilemmaId) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(dilemmaId, 'unfollow');
            
            const updateUnfollow = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === dilemmaId 
                  ? { ...d, isFollowing: false }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateUnfollow(state.allDilemmas),
              forYouDilemmas: updateUnfollow(state.forYouDilemmas),
              myDilemmas: updateUnfollow(state.myDilemmas),
              bookmarkedDilemmas: updateUnfollow(state.bookmarkedDilemmas),
              trendingDilemmas: updateUnfollow(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to unfollow author' });
          }
        },

        // Filtering and sorting
        setFilter: (filter) => {
          set(state => ({
            activeFilter: { ...state.activeFilter, ...filter },
            currentPage: 1
          }));
        },

        clearFilter: () => {
          set({ 
            activeFilter: {},
            currentPage: 1
          });
        },

        setSortBy: (sortBy) => {
          set({ sortBy, currentPage: 1 });
        },

        setSearchTerm: (term) => {
          set({ searchTerm: term, currentPage: 1 });
        },

        // Pagination
        loadMore: async () => {
          const { currentPage, hasMore } = get();
          
          if (hasMore) {
            await get().fetchDilemmas(currentPage + 1);
          }
        },

        goToPage: async (page) => {
          await get().fetchDilemmas(page);
        },

        setPostsPerPage: (count) => {
          set({ postsPerPage: count, currentPage: 1 });
          get().fetchDilemmas(1, true);
        },

        // UI actions
        setSelectedDilemma: (id) => {
          set({ selectedDilemmaId: id });
        },

        setViewMode: (mode) => {
          set({ viewMode: mode });
        },

        toggleFilters: () => {
          set(state => ({ showFilters: !state.showFilters }));
        },

        // Moderation actions
        reportDilemma: async (id, reason) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'report');
            
            const updateReport = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, isReported: true, reportCount: d.reportCount + 1 }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateReport(state.allDilemmas),
              forYouDilemmas: updateReport(state.forYouDilemmas),
              myDilemmas: updateReport(state.myDilemmas),
              bookmarkedDilemmas: updateReport(state.bookmarkedDilemmas),
              trendingDilemmas: updateReport(state.trendingDilemmas),
              isReportModalOpen: false,
              reportingDilemmaId: null,
              reportReason: ''
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to report dilemma' });
          }
        },

        blockUser: async (userId) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(userId, 'block');
            
            set(state => ({
              blockedUserIds: new Set([...state.blockedUserIds, userId])
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to block user' });
          }
        },

        unblockUser: async (userId) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(userId, 'unblock');
            
            set(state => {
              const newBlockedIds = new Set(state.blockedUserIds);
              newBlockedIds.delete(userId);
              return { blockedUserIds: newBlockedIds };
            });
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to unblock user' });
          }
        },

        flagDilemma: async (id) => {
          try {
            await mockDilemmaAPI.interactWithDilemma(id, 'flag');
            
            const updateFlag = (dilemmas: Dilemma[]) =>
              dilemmas.map(d => 
                d.id === id 
                  ? { ...d, isFlagged: true }
                  : d
              );
            
            set(state => ({
              allDilemmas: updateFlag(state.allDilemmas),
              forYouDilemmas: updateFlag(state.forYouDilemmas),
              myDilemmas: updateFlag(state.myDilemmas),
              bookmarkedDilemmas: updateFlag(state.bookmarkedDilemmas),
              trendingDilemmas: updateFlag(state.trendingDilemmas)
            }));
          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Failed to flag dilemma' });
          }
        },

        // Statistics
        updateStats: () => {
          const { allDilemmas } = get();
          
          const stats: DilemmaStats = {
            total: allDilemmas.length,
            byCategory: {},
            byDifficulty: { easy: 0, medium: 0, hard: 0 },
            bySensitivity: { low: 0, medium: 0, high: 0 },
            resolved: 0,
            unresolved: 0,
            trending: [],
            popular: []
          };
          
          allDilemmas.forEach(dilemma => {
            // Category stats
            stats.byCategory[dilemma.category] = (stats.byCategory[dilemma.category] || 0) + 1;
            
            // Difficulty stats
            stats.byDifficulty[dilemma.difficulty]++;
            
            // Sensitivity stats
            stats.bySensitivity[dilemma.sensitivity]++;
            
            // Resolution stats
            if (dilemma.isResolved) {
              stats.resolved++;
            } else {
              stats.unresolved++;
            }
          });
          
          // Trending and popular
          stats.trending = applySorting(allDilemmas, 'trending').slice(0, 10);
          stats.popular = applySorting(allDilemmas, 'popular').slice(0, 10);
          
          set({ stats });
        },

        // Utility actions
        refreshAll: async () => {
          await Promise.all([
            get().fetchDilemmas(1, true),
            get().fetchForYouDilemmas(),
            get().fetchTrendingDilemmas()
          ]);
        },

        setError: (error) => {
          set({ error });
        },

        clearError: () => {
          set({ error: null });
        }
      }),
      { name: 'dilemma-store' }
    ),
    {
      name: 'dilemma-store',
      partialize: (state) => ({
        bookmarkedDilemmas: state.bookmarkedDilemmas,
        activeFilter: state.activeFilter,
        sortBy: state.sortBy,
        viewMode: state.viewMode,
        postsPerPage: state.postsPerPage,
        blockedUserIds: Array.from(state.blockedUserIds) // Convert Set to Array for serialization
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.blockedUserIds && Array.isArray(state.blockedUserIds)) {
          // Convert Array back to Set after rehydration
          state.blockedUserIds = new Set(state.blockedUserIds);
        }
      }
    }
  )
);

// Initialize store
if (typeof window !== 'undefined') {
  // Load initial dilemmas
  useStore.getState().fetchDilemmas();
}

export default useDilemmaStore;
