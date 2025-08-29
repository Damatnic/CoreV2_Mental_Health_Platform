import React, { useState, useCallback, useEffect } from 'react';
import { PostCard } from '../components/PostCard';
import { SkeletonPostCard } from '../components/SkeletonPostCard';
import { SearchIcon } from '../components/icons.dynamic';
import { CATEGORIES } from '../constants';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

interface FeedFilters {
  category: string;
  sortBy: 'recent' | 'popular' | 'trending';
  timeRange: 'today' | 'week' | 'month' | 'all';
  searchQuery: string;
}

// Properly defined FeedPost interface that doesn't extend Dilemma
// since Dilemma has different structure for different use case
interface FeedPost {
  id: string;
  title: string;
  description: string;
  content: string;
  author: string;
  authorId: string;
  timestamp: Date; // Using Date object for proper date handling
  category: string;
  likes: number;
  comments: number;
  isAnonymous: boolean;
  isBookmarked?: boolean;
  isLiked?: boolean;
  viewCount?: number;
  shareCount?: number;
  trendingScore?: number;
}

const FeedView: React.FC = () => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FeedFilters>({
    category: 'all',
    sortBy: 'recent',
    timeRange: 'all',
    searchQuery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadInitialPosts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, filters]);

  const loadInitialPosts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data for demonstration with proper Date objects
      const mockPosts: FeedPost[] = [
        {
          id: '1',
          title: 'Finding Peace in Daily Meditation',
          description: 'How I discovered the power of meditation during my recovery journey',
          author: 'MindfulWarrior',
          authorId: 'user-1',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          category: 'wellness',
          likes: 45,
          comments: 12,
          isAnonymous: false,
          content: 'After struggling with anxiety for years, I finally found a practice that works...',
          isBookmarked: false,
          isLiked: false,
          viewCount: 234,
          shareCount: 8,
          trendingScore: 85
        },
        {
          id: '2',
          title: 'Coping with Work Stress',
          description: 'Strategies that helped me manage overwhelming work pressure',
          author: 'Anonymous',
          authorId: 'user-2',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          category: 'coping',
          likes: 32,
          comments: 8,
          isAnonymous: true,
          content: 'The pressure at work was becoming unbearable until I learned these techniques...',
          isBookmarked: true,
          isLiked: true,
          viewCount: 156,
          shareCount: 5,
          trendingScore: 72
        },
        {
          id: '3',
          title: 'My Journey with Depression',
          description: 'Sharing my story to help others who might be struggling',
          author: 'HopeSeeker',
          authorId: 'user-3',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          category: 'personal-story',
          likes: 89,
          comments: 23,
          isAnonymous: false,
          content: 'It started slowly, but eventually I realized I needed help...',
          isBookmarked: false,
          isLiked: false,
          viewCount: 512,
          shareCount: 15,
          trendingScore: 68
        }
      ];

      setPosts(mockPosts);
      setHasMore(mockPosts.length >= 10);
      
    } catch (error) {
      console.error('Error loading posts:', error);
      setError('Failed to load feed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      
      // Simulate loading more posts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const morePosts: FeedPost[] = [
        {
          id: `${page}-4`,
          title: 'Building Healthy Habits',
          description: 'Small steps that made a big difference',
          author: 'WellnessJourney',
          authorId: 'user-4',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
          category: 'wellness',
          likes: 28,
          comments: 6,
          isAnonymous: false,
          content: 'It all started with one small change...',
          viewCount: 98,
          shareCount: 3,
          trendingScore: 45
        }
      ];

      setPosts(prev => [...prev, ...morePosts]);
      setPage(prev => prev + 1);
      setHasMore(morePosts.length >= 10);
      
    } catch (error) {
      console.error('Error loading more posts:', error);
      showNotification('Failed to load more posts', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(post => post.category === filters.category);
    }

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
      );
    }

    // Apply time range filter with proper Date object handling
    const now = Date.now();
    switch (filters.timeRange) {
      case 'today':
        filtered = filtered.filter(post => 
          now - post.timestamp.getTime() < 24 * 60 * 60 * 1000
        );
        break;
      case 'week':
        filtered = filtered.filter(post => 
          now - post.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
        );
        break;
      case 'month':
        filtered = filtered.filter(post => 
          now - post.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000
        );
        break;
    }

    // Apply sorting with proper Date object handling
    switch (filters.sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments));
        break;
      case 'trending':
        filtered.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));
        break;
    }

    setFilteredPosts(filtered);
  };

  const handleLike = useCallback(async (postId: string) => {
    try {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          };
        }
        return post;
      }));
    } catch (error) {
      console.error('Error liking post:', error);
      showNotification('Failed to like post', 'error');
    }
  }, [showNotification]);

  const handleBookmark = useCallback(async (postId: string) => {
    try {
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            isBookmarked: !post.isBookmarked
          };
        }
        return post;
      }));
      
      const post = posts.find(p => p.id === postId);
      if (post) {
        showNotification(
          post.isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks',
          'success'
        );
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      showNotification('Failed to bookmark post', 'error');
    }
  }, [posts, showNotification]);

  const handleShare = useCallback(async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: window.location.href
        });
        
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return { ...p, shareCount: (p.shareCount || 0) + 1 };
          }
          return p;
        }));
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        showNotification('Link copied to clipboard', 'success');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  }, [posts, showNotification]);

  const handleFilterChange = (key: keyof FeedFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'all',
      sortBy: 'recent',
      timeRange: 'all',
      searchQuery: ''
    });
  };

  // Convert FeedPost to Dilemma format for PostCard component
  const convertToDilemmaFormat = (post: FeedPost): any => {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      timestamp: post.timestamp.toISOString(), // Convert Date to string for PostCard
      userToken: post.authorId,
      userId: post.authorId,
      anonymous: post.isAnonymous,
      supportCount: post.likes,
      isSupported: post.isLiked || false,
      isReported: false,
      status: 'active'
    };
  };

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={loadInitialPosts}
      />
    );
  }

  return (
    <div className="feed-view">
      <ViewHeader
        title="Community Feed"
        subtitle="Discover stories, insights, and support from the community"
      />

      <div className="feed-controls">
        <div className="search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search posts..."
            value={filters.searchQuery}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
          />
        </div>

        <button
          className="filter-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as 'recent' | 'popular' | 'trending')}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="trending">Trending</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Time Range</label>
            <select
              value={filters.timeRange}
              onChange={(e) => handleFilterChange('timeRange', e.target.value as 'today' | 'week' | 'month' | 'all')}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <AppButton
            variant="secondary"
            size="sm"
            onClick={clearFilters}
          >
            Clear Filters
          </AppButton>
        </div>
      )}

      <div className="feed-content">
        {isLoading ? (
          <div className="loading-posts">
            {[1, 2, 3].map(i => (
              <SkeletonPostCard key={i} />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            title="No posts found"
            description={
              filters.searchQuery
                ? "Try adjusting your search or filters"
                : "Be the first to share your story"
            }
          />
        ) : (
          <>
            <div className="posts-list">
              {filteredPosts.map(post => (
                <PostCard
                  key={post.id}
                  dilemma={convertToDilemmaFormat(post)}
                  onToggleSupport={() => handleLike(post.id)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="load-more">
                <AppButton
                  onClick={loadMorePosts}
                  loading={isLoadingMore}
                  variant="secondary"
                >
                  Load More Posts
                </AppButton>
              </div>
            )}
          </>
        )}
      </div>

      {filteredPosts.length > 0 && (
        <div className="feed-stats">
          <span>Showing {filteredPosts.length} posts</span>
          {filters.category !== 'all' && (
            <span> in {filters.category.replace('-', ' ')}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedView;