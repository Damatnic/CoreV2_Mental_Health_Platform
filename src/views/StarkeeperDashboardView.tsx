import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { ViewHeader } from '../components/ViewHeader';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeAgo } from '../utils/formatTimeAgo';

interface StarkeeperPost {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
  };
  timestamp: string;
  reactions: {
    light: number;
    heart: number;
    star: number;
  };
  userReaction?: string;
  isAnonymous: boolean;
}

interface StarkeeperStats {
  totalPosts: number;
  totalReactions: number;
  helpfulVotes: number;
  rank: string;
}

const StarkeeperDashboardView: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<StarkeeperPost[]>([]);
  const [stats, setStats] = useState<StarkeeperStats>({
    totalPosts: 0,
    totalReactions: 0,
    helpfulVotes: 0,
    rank: 'Apprentice Starkeeper'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      const mockPosts: StarkeeperPost[] = [
        {
          id: '1',
          content: 'Remember that healing is not linear. Some days will be harder than others, and that\'s completely normal. Be gentle with yourself.',
          author: {
            id: user?.id || 'current-user',
            username: user?.username || 'You',
            avatar: user?.avatar
          },
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          reactions: { light: 12, heart: 8, star: 5 },
          userReaction: 'heart',
          isAnonymous: false
        },
        {
          id: '2',
          content: 'For anyone struggling with anxiety today: Try the 5-4-3-2-1 grounding technique. Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.',
          author: {
            id: user?.id || 'current-user',
            username: 'Anonymous Starkeeper',
          },
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          reactions: { light: 25, heart: 18, star: 12 },
          isAnonymous: true
        }
      ];

      const mockStats: StarkeeperStats = {
        totalPosts: 15,
        totalReactions: 127,
        helpfulVotes: 89,
        rank: 'Guiding Starkeeper'
      };

      setPosts(mockPosts);
      setStats(mockStats);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getReactionEmoji = (reactionType: string): string => {
    switch (reactionType) {
      case 'light': return '💡';
      case 'heart': return '❤️';
      case 'star': return '⭐';
      default: return '👍';
    }
  };

  const handleReaction = async (postId: string, reactionType: string) => {
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            const newReactions = { ...post.reactions };
            const hadReaction = post.userReaction === reactionType;
            
            if (hadReaction) {
              // Remove reaction
              newReactions[reactionType as keyof typeof newReactions]--;
              return {
                ...post,
                reactions: newReactions,
                userReaction: undefined
              };
            } else {
              // Add new reaction (remove old one if exists)
              if (post.userReaction) {
                newReactions[post.userReaction as keyof typeof newReactions]--;
              }
              newReactions[reactionType as keyof typeof newReactions]++;
              return {
                ...post,
                reactions: newReactions,
                userReaction: reactionType
              };
            }
          }
          return post;
        })
      );
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    try {
      const post: StarkeeperPost = {
        id: Date.now().toString(),
        content: newPost.trim(),
        author: {
          id: user?.id || 'current-user',
          username: isAnonymous ? 'Anonymous Starkeeper' : (user?.username || 'You'),
          avatar: isAnonymous ? undefined : user?.avatar
        },
        timestamp: new Date().toISOString(),
        reactions: { light: 0, heart: 0, star: 0 },
        isAnonymous
      };

      setPosts(prev => [post, ...prev]);
      setNewPost('');
      setStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="starkeeper-dashboard">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your Starkeeper dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="starkeeper-dashboard">
      <ViewHeader
        title="Starkeeper Dashboard"
        subtitle="Share wisdom and support others on their journey"
      />

      <div className="dashboard-stats">
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{stats.totalPosts}</div>
            <div className="stat-label">Posts Shared</div>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{stats.totalReactions}</div>
            <div className="stat-label">Total Reactions</div>
          </div>
        </Card>
        
        <Card className="stat-card">
          <div className="stat-content">
            <div className="stat-number">{stats.helpfulVotes}</div>
            <div className="stat-label">Helpful Votes</div>
          </div>
        </Card>
        
        <Card className="rank-card">
          <div className="rank-content">
            <div className="rank-badge">⭐</div>
            <div className="rank-text">
              <div className="rank-title">{stats.rank}</div>
              <div className="rank-subtitle">Current Rank</div>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Share Wisdom" className="post-composer">
        <form onSubmit={handleSubmitPost} className="compose-form">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Share something helpful, inspiring, or supportive..."
            className="compose-textarea"
            rows={4}
            maxLength={500}
          />
          
          <div className="compose-footer">
            <label className="anonymous-toggle">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              Post anonymously
            </label>
            
            <div className="compose-actions">
              <span className="character-count">
                {newPost.length}/500
              </span>
              <AppButton 
                type="submit" 
                disabled={!newPost.trim()}
                size="small"
              >
                Share
              </AppButton>
            </div>
          </div>
        </form>
      </Card>

      <div className="posts-section">
        <h2>Your Recent Posts</h2>
        {posts.length === 0 ? (
          <Card className="empty-state">
            <div className="empty-content">
              <div className="empty-icon">✨</div>
              <h3>No posts yet</h3>
              <p>Share your first piece of wisdom or support to get started!</p>
            </div>
          </Card>
        ) : (
          <div className="posts-list">
            {posts.map(post => (
              <Card key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-author">
                    {post.author.avatar && !post.isAnonymous ? (
                      <img 
                        src={post.author.avatar} 
                        alt={post.author.username}
                        className="author-avatar"
                      />
                    ) : (
                      <div className="author-avatar-placeholder">
                        {post.isAnonymous ? '🌟' : post.author.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="author-info">
                      <div className="author-name">{post.author.username}</div>
                      <div className="post-time">{formatTimeAgo(post.timestamp)}</div>
                    </div>
                  </div>
                  
                  {post.isAnonymous && (
                    <div className="anonymous-badge">Anonymous</div>
                  )}
                </div>

                <div className="post-content">
                  <p>{post.content}</p>
                </div>

                <div className="post-reactions">
                  {Object.entries(post.reactions).map(([type, count]) => (
                    <button
                      key={type}
                      className={`reaction-button ${post.userReaction === type ? 'active' : ''}`}
                      onClick={() => handleReaction(post.id, type)}
                    >
                      <span className="reaction-emoji">{getReactionEmoji(type)}</span>
                      <span className="reaction-count">{count}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StarkeeperDashboardView;
