import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageCircle,
  TrendingUp,
  Search,
  Filter,
  Shield,
  Users,
  Heart,
  AlertCircle,
  BookOpen,
  ChevronRight,
  Lock,
  Eye,
  MessageSquare,
  ThumbsUp,
  Clock,
  UserCheck,
  Award,
  Sparkles,
  Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forumService, ForumPost, ForumCategory, ForumStats } from '../../services/forumService';
import { useCrisisDetection } from '../../hooks/useCrisisDetection';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../LoadingSpinner';
import ErrorState from '../ErrorState';
import Card from '../Card';
import Modal from '../Modal';
import '../../styles/ForumHome.css';

interface ForumHomeProps {
  onCrisisDetected?: (post: ForumPost) => void;
  moderatorMode?: boolean;
}

const ForumHome: React.FC<ForumHomeProps> = ({ onCrisisDetected, moderatorMode = false }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { detectCrisis } = useCrisisDetection({ sensitivity: 'high', enableAutoAlert: true });

  // State management
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<ForumPost[]>([]);
  const [recentPosts, setRecentPosts] = useState<ForumPost[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'trending' | 'unanswered'>('recent');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // New post form state
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [] as string[],
    isAnonymous: false,
    triggerWarnings: [] as string[]
  });

  // Define forum categories with mental health focus
  const forumCategories: ForumCategory[] = [
    {
      id: 'anxiety',
      name: 'Anxiety Support',
      description: 'Share experiences and coping strategies for anxiety',
      icon: '😰',
      postCount: 0,
      color: '#9333ea',
      isModerated: true
    },
    {
      id: 'depression',
      name: 'Depression Support',
      description: 'A safe space to discuss depression and recovery',
      icon: '💙',
      postCount: 0,
      color: '#3b82f6',
      isModerated: true
    },
    {
      id: 'trauma',
      name: 'Trauma & PTSD',
      description: 'Support for trauma survivors and PTSD',
      icon: '🌱',
      postCount: 0,
      color: '#10b981',
      isModerated: true,
      requiresApproval: true
    },
    {
      id: 'relationships',
      name: 'Relationships',
      description: 'Navigating relationships and social connections',
      icon: '💕',
      postCount: 0,
      color: '#ec4899'
    },
    {
      id: 'self-care',
      name: 'Self-Care & Wellness',
      description: 'Tips and strategies for self-care and wellness',
      icon: '🌸',
      postCount: 0,
      color: '#f59e0b'
    },
    {
      id: 'addiction',
      name: 'Addiction Recovery',
      description: 'Support for addiction and recovery journeys',
      icon: '💪',
      postCount: 0,
      color: '#ef4444',
      isModerated: true,
      requiresApproval: true
    },
    {
      id: 'eating-disorders',
      name: 'Eating Disorders',
      description: 'Support for eating disorder recovery',
      icon: '🍃',
      postCount: 0,
      color: '#84cc16',
      isModerated: true,
      requiresApproval: true
    },
    {
      id: 'lgbtq',
      name: 'LGBTQ+ Support',
      description: 'Safe space for LGBTQ+ mental health discussions',
      icon: '🏳️‍🌈',
      postCount: 0,
      color: '#a855f7'
    },
    {
      id: 'grief',
      name: 'Grief & Loss',
      description: 'Processing grief and bereavement',
      icon: '🕊️',
      postCount: 0,
      color: '#6b7280',
      isModerated: true
    },
    {
      id: 'success-stories',
      name: 'Success Stories',
      description: 'Share your recovery victories and milestones',
      icon: '✨',
      postCount: 0,
      color: '#fbbf24'
    }
  ];

  // Load initial data
  useEffect(() => {
    loadForumData();
  }, [selectedCategory, sortBy]);

  const loadForumData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize forum service
      await forumService.initialize();

      // Load categories with post counts
      const categoriesWithCounts = await Promise.all(
        forumCategories.map(async (cat) => ({
          ...cat,
          postCount: await forumService.getCategoryPostCount(cat.id)
        }))
      );
      setCategories(categoriesWithCounts);

      // Load posts based on filters
      const [trending, recent] = await Promise.all([
        forumService.getTrendingPosts(5),
        forumService.getRecentPosts(selectedCategory === 'all' ? undefined : selectedCategory, 10)
      ]);

      setTrendingPosts(trending);
      setRecentPosts(recent);

      // Load forum statistics
      const forumStats = await forumService.getForumStats();
      setStats(forumStats);

    } catch (err) {
      console.error('Failed to load forum data:', err);
      setError('Failed to load forum discussions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new post creation
  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Please provide both title and content for your post.');
      return;
    }

    try {
      // Perform crisis detection on the content
      const crisisCheck = detectCrisis({
        textContent: `${newPost.title} ${newPost.content}`,
        urgencyLevel: undefined
      });

      // Create the post
      const createdPost = await forumService.createPost({
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        tags: newPost.tags,
        isAnonymous: newPost.isAnonymous,
        triggerWarnings: newPost.triggerWarnings,
        authorId: newPost.isAnonymous ? 'anonymous' : user?.id || 'guest'
      });

      // Handle crisis detection results
      if (crisisCheck.detectionResult.isInCrisis && onCrisisDetected) {
        onCrisisDetected(createdPost);
      }

      // Reset form and close modal
      setNewPost({
        title: '',
        content: '',
        category: 'general',
        tags: [],
        isAnonymous: false,
        triggerWarnings: []
      });
      setShowNewPostModal(false);

      // Reload posts
      await loadForumData();

      // Show success message
      alert('Your post has been created successfully!');
    } catch (err) {
      console.error('Failed to create post:', err);
      alert('Failed to create post. Please try again.');
    }
  };

  // Handle search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      await loadForumData();
      return;
    }

    try {
      setIsLoading(true);
      const results = await forumService.searchPosts(searchQuery);
      setRecentPosts(results);
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Format time ago
  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const postDate = typeof date === 'string' ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return postDate.toLocaleDateString();
  };

  // Navigate to post detail
  const navigateToPost = (postId: string) => {
    navigate(`/forums/post/${postId}`);
  };

  // Community guidelines content
  const communityGuidelines = (
    <div className="guidelines-content">
      <h3>Community Guidelines</h3>
      
      <section>
        <h4>Our Safe Space Principles</h4>
        <ul>
          <li><strong>Respect & Empathy:</strong> Treat everyone with kindness and understanding</li>
          <li><strong>No Judgment:</strong> This is a judgment-free zone for all experiences</li>
          <li><strong>Privacy First:</strong> Never share others' personal information</li>
          <li><strong>Support, Not Advice:</strong> Share experiences, avoid giving medical advice</li>
        </ul>
      </section>

      <section>
        <h4>Content Guidelines</h4>
        <ul>
          <li>Use trigger warnings for sensitive content</li>
          <li>No graphic descriptions of self-harm or suicide methods</li>
          <li>Focus on recovery and hope while acknowledging struggles</li>
          <li>Respect diverse perspectives and experiences</li>
        </ul>
      </section>

      <section>
        <h4>Safety Features</h4>
        <ul>
          <li><strong>Anonymous Posting:</strong> Share without revealing your identity</li>
          <li><strong>Crisis Detection:</strong> Automatic support for users in crisis</li>
          <li><strong>24/7 Moderation:</strong> Trained moderators ensure safety</li>
          <li><strong>Report System:</strong> Flag concerning content immediately</li>
        </ul>
      </section>

      <section>
        <h4>Prohibited Content</h4>
        <ul>
          <li>Harassment, bullying, or hate speech</li>
          <li>Promotion of harmful behaviors</li>
          <li>Spam or commercial content</li>
          <li>Explicit or inappropriate material</li>
        </ul>
      </section>

      <section className="crisis-resources">
        <h4>Crisis Resources</h4>
        <p>If you're in crisis, please reach out:</p>
        <ul>
          <li>National Suicide Prevention Lifeline: 988</li>
          <li>Crisis Text Line: Text HOME to 741741</li>
          <li>International Crisis Lines: findahelpline.com</li>
        </ul>
      </section>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading forum discussions..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadForumData} />;
  }

  return (
    <div className="forum-home">
      {/* Header Section */}
      <div className="forum-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <MessageCircle className="header-icon" />
              Peer Support Forums
            </h1>
            <p>Connect, share, and support each other in a safe, moderated community</p>
          </div>
          
          <div className="header-actions">
            <button
              className="guidelines-btn"
              onClick={() => setShowGuidelinesModal(true)}
            >
              <Shield size={18} />
              Guidelines
            </button>
            
            {moderatorMode && (
              <button
                className="moderator-btn"
                onClick={() => navigate('/forums/moderator')}
              >
                <UserCheck size={18} />
                Moderator Tools
              </button>
            )}
            
            <button
              className="new-post-btn primary"
              onClick={() => setShowNewPostModal(true)}
            >
              <MessageSquare size={18} />
              New Discussion
            </button>
          </div>
        </div>

        {/* Forum Statistics */}
        {stats && (
          <div className="forum-stats">
            <div className="stat-item">
              <Users size={20} />
              <div>
                <span className="stat-value">{stats.totalMembers.toLocaleString()}</span>
                <span className="stat-label">Members</span>
              </div>
            </div>
            <div className="stat-item">
              <MessageCircle size={20} />
              <div>
                <span className="stat-value">{stats.totalPosts.toLocaleString()}</span>
                <span className="stat-label">Discussions</span>
              </div>
            </div>
            <div className="stat-item">
              <Heart size={20} />
              <div>
                <span className="stat-value">{stats.supportInteractions.toLocaleString()}</span>
                <span className="stat-label">Support Given</span>
              </div>
            </div>
            <div className="stat-item">
              <Sparkles size={20} />
              <div>
                <span className="stat-value">{stats.activeToday}</span>
                <span className="stat-label">Active Today</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search discussions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="filter-controls">
          <select
            className="category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            className="sort-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Most Recent</option>
            <option value="trending">Trending</option>
            <option value="unanswered">Needs Support</option>
          </select>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="forum-content-grid">
        {/* Categories Sidebar */}
        <aside className="categories-sidebar">
          <h2>Topics</h2>
          <div className="categories-list">
            <button
              className={`category-item ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              <span className="category-icon">📚</span>
              <div className="category-info">
                <span className="category-name">All Discussions</span>
                <span className="category-count">
                  {categories.reduce((sum, cat) => sum + cat.postCount, 0)} posts
                </span>
              </div>
            </button>

            {categories.map(category => (
              <button
                key={category.id}
                className={`category-item ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
                style={{ borderLeftColor: category.color }}
              >
                <span className="category-icon">{category.icon}</span>
                <div className="category-info">
                  <span className="category-name">
                    {category.name}
                    {category.isModerated && (
                      <Shield className="moderated-icon" size={14} />
                    )}
                  </span>
                  <span className="category-description">{category.description}</span>
                  <span className="category-count">{category.postCount} posts</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Posts Area */}
        <main className="posts-main">
          {/* Trending Discussions */}
          {trendingPosts.length > 0 && (
            <section className="trending-section">
              <h2>
                <TrendingUp size={20} />
                Trending Discussions
              </h2>
              <div className="trending-posts">
                {trendingPosts.map(post => (
                  <Card
                    key={post.id}
                    className="trending-post-card"
                    onClick={() => navigateToPost(post.id)}
                  >
                    <div className="post-header">
                      <span className="post-category-badge" style={{ 
                        backgroundColor: categories.find(c => c.id === post.category)?.color 
                      }}>
                        {categories.find(c => c.id === post.category)?.name}
                      </span>
                      {post.isLocked && <Lock size={14} />}
                    </div>
                    <h3 className="post-title">{post.title}</h3>
                    <div className="post-stats">
                      <span><ThumbsUp size={14} /> {post.upvotes}</span>
                      <span><MessageSquare size={14} /> {post.replyCount}</span>
                      <span><Eye size={14} /> {post.viewCount}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recent Posts */}
          <section className="recent-posts-section">
            <h2>Recent Discussions</h2>
            <div className="posts-list">
              {recentPosts.length > 0 ? (
                recentPosts.map(post => (
                  <Card
                    key={post.id}
                    className="post-card"
                    onClick={() => navigateToPost(post.id)}
                  >
                    <div className="post-content">
                      <div className="post-header">
                        <div className="post-meta">
                          <span className="post-author">
                            {post.isAnonymous ? (
                              <>
                                <Lock size={14} />
                                Anonymous
                              </>
                            ) : (
                              post.authorName || 'Community Member'
                            )}
                          </span>
                          <span className="post-time">
                            <Clock size={14} />
                            {formatTimeAgo(post.createdAt)}
                          </span>
                          <span className="post-category-badge" style={{ 
                            backgroundColor: categories.find(c => c.id === post.category)?.color 
                          }}>
                            {categories.find(c => c.id === post.category)?.icon}
                            {categories.find(c => c.id === post.category)?.name}
                          </span>
                        </div>
                        {post.isPinned && (
                          <span className="pinned-badge">
                            📌 Pinned
                          </span>
                        )}
                      </div>

                      <h3 className="post-title">
                        {post.title}
                        {post.isLocked && <Lock size={16} />}
                      </h3>

                      {post.triggerWarnings && post.triggerWarnings.length > 0 && (
                        <div className="trigger-warnings">
                          <AlertCircle size={14} />
                          <span>TW: {post.triggerWarnings.join(', ')}</span>
                        </div>
                      )}

                      <p className="post-excerpt">{post.excerpt}</p>

                      {post.tags && post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}

                      <div className="post-footer">
                        <div className="post-stats">
                          <button className="stat-btn">
                            <ThumbsUp size={16} />
                            {post.upvotes}
                          </button>
                          <button className="stat-btn">
                            <MessageSquare size={16} />
                            {post.replyCount} replies
                          </button>
                          <button className="stat-btn">
                            <Eye size={16} />
                            {post.viewCount} views
                          </button>
                        </div>
                        
                        {post.hasHelpfulReply && (
                          <span className="helpful-badge">
                            <Award size={14} />
                            Has helpful reply
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="no-posts">
                  <MessageCircle size={48} />
                  <h3>No discussions yet</h3>
                  <p>Be the first to start a conversation!</p>
                  <button
                    className="start-discussion-btn"
                    onClick={() => setShowNewPostModal(true)}
                  >
                    Start a Discussion
                  </button>
                </div>
              )}
            </div>
          </section>
        </main>

        {/* Right Sidebar */}
        <aside className="right-sidebar">
          {/* Quick Actions */}
          <Card className="quick-actions-card">
            <h3>Quick Actions</h3>
            <button className="quick-action-btn" onClick={() => setShowNewPostModal(true)}>
              <MessageSquare size={18} />
              New Discussion
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/forums/my-posts')}>
              <BookOpen size={18} />
              My Posts
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/forums/saved')}>
              <Heart size={18} />
              Saved Posts
            </button>
            <button className="quick-action-btn" onClick={() => navigate('/forums/notifications')}>
              <Bell size={18} />
              Notifications
            </button>
          </Card>

          {/* Crisis Support Card */}
          <Card className="crisis-support-card">
            <h3>Need Immediate Help?</h3>
            <p>If you're in crisis, support is available 24/7</p>
            <button className="crisis-btn" onClick={() => navigate('/crisis-support')}>
              <AlertCircle size={18} />
              Crisis Resources
            </button>
            <div className="crisis-numbers">
              <p><strong>988</strong> - Suicide & Crisis Lifeline</p>
              <p><strong>741741</strong> - Crisis Text Line</p>
            </div>
          </Card>

          {/* Community Values */}
          <Card className="values-card">
            <h3>Our Values</h3>
            <ul className="values-list">
              <li>
                <Heart size={16} />
                Compassion & Empathy
              </li>
              <li>
                <Shield size={16} />
                Safety & Privacy
              </li>
              <li>
                <Users size={16} />
                Peer Support
              </li>
              <li>
                <Sparkles size={16} />
                Hope & Recovery
              </li>
            </ul>
          </Card>
        </aside>
      </div>

      {/* New Post Modal */}
      <Modal
        isOpen={showNewPostModal}
        onClose={() => setShowNewPostModal(false)}
        title="Start a New Discussion"
      >
        <div className="new-post-form">
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="What would you like to discuss?"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
              maxLength={200}
            />
            <span className="char-count">{newPost.title.length}/200</span>
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              className="form-select"
              value={newPost.category}
              onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Content *</label>
            <textarea
              className="form-textarea"
              placeholder="Share your thoughts, experiences, or questions..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={8}
              maxLength={5000}
            />
            <span className="char-count">{newPost.content.length}/5000</span>
          </div>

          <div className="form-group">
            <label>Tags (optional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter tags separated by commas"
              onChange={(e) => setNewPost({ 
                ...newPost, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
            />
          </div>

          <div className="form-group">
            <label>Trigger Warnings (if applicable)</label>
            <div className="trigger-warning-options">
              {['Self-harm', 'Suicide', 'Abuse', 'Eating Disorders', 'Substance Use', 'Violence'].map(tw => (
                <label key={tw} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newPost.triggerWarnings.includes(tw)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewPost({ 
                          ...newPost, 
                          triggerWarnings: [...newPost.triggerWarnings, tw] 
                        });
                      } else {
                        setNewPost({ 
                          ...newPost, 
                          triggerWarnings: newPost.triggerWarnings.filter(w => w !== tw) 
                        });
                      }
                    }}
                  />
                  {tw}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label anonymous-option">
              <input
                type="checkbox"
                checked={newPost.isAnonymous}
                onChange={(e) => setNewPost({ ...newPost, isAnonymous: e.target.checked })}
              />
              <Lock size={16} />
              Post anonymously
            </label>
            <p className="form-hint">
              Your identity will be hidden from other users, but moderators can see it for safety purposes.
            </p>
          </div>

          <div className="form-actions">
            <button 
              className="btn-secondary" 
              onClick={() => setShowNewPostModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn-primary"
              onClick={handleCreatePost}
              disabled={!newPost.title.trim() || !newPost.content.trim()}
            >
              Post Discussion
            </button>
          </div>
        </div>
      </Modal>

      {/* Community Guidelines Modal */}
      <Modal
        isOpen={showGuidelinesModal}
        onClose={() => setShowGuidelinesModal(false)}
        title="Community Guidelines"
      >
        {communityGuidelines}
      </Modal>
    </div>
  );
};

export default ForumHome;