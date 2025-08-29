/**
 * ForumView Component - Main forum interface with thread listing and interactions
 * Includes safety features and mental health-focused moderation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  forumService,
  Forum,
  Post,
  Comment,
  ForumCategory,
  FlagType,
  SentimentAnalysis
} from '../../services/social/forumService';
import { useCrisisDetection } from '../../hooks/useCrisisDetection';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDistanceToNow } from 'date-fns';
import './ForumView.css';

interface ForumViewProps {
  initialCategory?: ForumCategory;
  userId: string;
  isAnonymous?: boolean;
}

const ForumView: React.FC<ForumViewProps> = ({
  initialCategory,
  userId,
  isAnonymous = false
}) => {
  // State management
  const [forums, setForums] = useState<Forum[]>([]);
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ForumCategory | undefined>(initialCategory);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [showFlagged, setShowFlagged] = useState(false);
  
  // Post creation
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [contentWarning, setContentWarning] = useState<string[]>([]);
  const [useAnonymous, setUseAnonymous] = useState(isAnonymous);
  
  // Comment creation
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  
  // Moderation
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportingContent, setReportingContent] = useState<{ id: string; type: 'post' | 'comment' } | null>(null);
  const [reportReason, setReportReason] = useState<FlagType | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  
  // Crisis detection hook
  const { checkContent, isInCrisis } = useCrisisDetection();
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Load forums on mount
  useEffect(() => {
    loadForums();
  }, [selectedCategory]);

  // Load posts when forum changes
  useEffect(() => {
    if (selectedForum) {
      loadPosts();
    }
  }, [selectedForum, sortBy, debouncedSearch]);

  // Monitor content for crisis keywords
  useEffect(() => {
    if (postContent || commentContent) {
      const content = postContent || commentContent;
      const hasCrisisContent = checkContent(content);
      
      if (hasCrisisContent && !isInCrisis) {
        // Show supportive message without blocking
        showSupportiveMessage();
      }
    }
  }, [postContent, commentContent, checkContent, isInCrisis]);

  const loadForums = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const forumList = await forumService.getForums(selectedCategory);
      setForums(forumList);
    } catch (err) {
      setError('Failed to load forums. Please try again.');
      console.error('Error loading forums:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!selectedForum) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const postList = await forumService.getPosts({
        forumId: selectedForum.id,
        sortBy,
        limit: 50
      });
      
      // Filter based on search query
      const filteredPosts = debouncedSearch
        ? postList.filter(post => 
            post.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            post.content.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            post.tags.some(tag => tag.toLowerCase().includes(debouncedSearch.toLowerCase()))
          )
        : postList;
      
      setPosts(filteredPosts);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      setError('Please provide both title and content for your post.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newPost = await forumService.createPost({
        forumId: selectedForum?.id,
        title: postTitle,
        content: postContent,
        tags: postTags,
        isAnonymous: useAnonymous,
        contentWarnings: contentWarning,
        author: userId
      });
      
      // Add to posts list
      setPosts(prev => [newPost, ...prev]);
      
      // Reset form
      setIsCreatingPost(false);
      setPostTitle('');
      setPostContent('');
      setPostTags([]);
      setContentWarning([]);
      
      // Show success message
      showSuccessMessage('Your post has been created successfully!');
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!commentContent.trim()) {
      setError('Please provide content for your comment.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newComment = await forumService.createComment({
        postId,
        parentId: replyingTo,
        content: commentContent,
        isAnonymous: useAnonymous,
        author: userId
      });
      
      // Update post with new comment
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, newComment]
          };
        }
        return post;
      }));
      
      // Reset comment form
      setCommentContent('');
      setReplyingTo(null);
      
      showSuccessMessage('Your comment has been posted!');
    } catch (err) {
      setError('Failed to post comment. Please try again.');
      console.error('Error creating comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async (
    contentId: string,
    contentType: 'post' | 'comment',
    voteType: 'upvote' | 'downvote'
  ) => {
    try {
      if (contentType === 'post') {
        await forumService.voteOnPost(contentId, voteType);
        
        // Update local state
        setPosts(prev => prev.map(post => {
          if (post.id === contentId) {
            const upvotes = [...post.upvotes];
            const downvotes = [...post.downvotes];
            
            if (voteType === 'upvote') {
              if (upvotes.includes(userId)) {
                upvotes.splice(upvotes.indexOf(userId), 1);
              } else {
                upvotes.push(userId);
                const downvoteIndex = downvotes.indexOf(userId);
                if (downvoteIndex > -1) {
                  downvotes.splice(downvoteIndex, 1);
                }
              }
            } else {
              if (downvotes.includes(userId)) {
                downvotes.splice(downvotes.indexOf(userId), 1);
              } else {
                downvotes.push(userId);
                const upvoteIndex = upvotes.indexOf(userId);
                if (upvoteIndex > -1) {
                  upvotes.splice(upvoteIndex, 1);
                }
              }
            }
            
            return { ...post, upvotes, downvotes };
          }
          return post;
        }));
      } else {
        await forumService.voteOnComment(contentId, voteType);
        // Update comment votes similarly
      }
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleReport = async () => {
    if (!reportingContent || !reportReason) return;
    
    setIsLoading(true);
    
    try {
      await forumService.flagContent(
        reportingContent.id,
        reportingContent.type,
        reportReason,
        reportDetails
      );
      
      // Close modal and reset
      setReportModalOpen(false);
      setReportingContent(null);
      setReportReason(null);
      setReportDetails('');
      
      showSuccessMessage('Thank you for your report. Our moderation team will review it.');
    } catch (err) {
      setError('Failed to submit report. Please try again.');
      console.error('Error reporting content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showSupportiveMessage = () => {
    // Show non-intrusive supportive message
    const message = document.createElement('div');
    message.className = 'supportive-message';
    message.innerHTML = `
      <p>We notice you might be going through a difficult time.</p>
      <p>Remember, you're not alone and help is available.</p>
      <button onclick="window.location.href='/crisis-support'">Get Support</button>
    `;
    document.body.appendChild(message);
    
    setTimeout(() => {
      message.remove();
    }, 10000);
  };

  const showSuccessMessage = (text: string) => {
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = text;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  };

  const getSentimentIcon = (sentiment?: SentimentAnalysis) => {
    if (!sentiment) return null;
    
    if (sentiment.score > 0.3) return '😊';
    if (sentiment.score < -0.3) return '😔';
    return '😐';
  };

  const getContentWarningBadges = (warnings?: string[]) => {
    if (!warnings || warnings.length === 0) return null;
    
    return (
      <div className="content-warnings">
        {warnings.map(warning => (
          <span key={warning} className="warning-badge">
            ⚠️ {warning}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="forum-view">
      {/* Header */}
      <div className="forum-header">
        <h1>Community Forums</h1>
        <p className="forum-subtitle">
          Connect, share, and support each other in a safe space
        </p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={!selectedCategory ? 'active' : ''}
          onClick={() => setSelectedCategory(undefined)}
        >
          All Categories
        </button>
        {Object.values(ForumCategory).map(category => (
          <button
            key={category}
            className={selectedCategory === category ? 'active' : ''}
            onClick={() => setSelectedCategory(category)}
          >
            {category.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="forum-content">
        {/* Forums Sidebar */}
        <aside className="forums-sidebar">
          <h2>Forums</h2>
          {isLoading ? (
            <div className="loading">Loading forums...</div>
          ) : (
            <ul className="forums-list">
              {forums.map(forum => (
                <li
                  key={forum.id}
                  className={selectedForum?.id === forum.id ? 'active' : ''}
                  onClick={() => setSelectedForum(forum)}
                >
                  <div className="forum-item">
                    {forum.icon && <span className="forum-icon">{forum.icon}</span>}
                    <div className="forum-info">
                      <h3>{forum.name}</h3>
                      <p>{forum.description}</p>
                      <div className="forum-stats">
                        <span>👥 {forum.memberCount} members</span>
                        <span>📝 {forum.postCount} posts</span>
                      </div>
                    </div>
                    {forum.isPrivate && <span className="private-badge">Private</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="forum-main">
          {selectedForum ? (
            <>
              {/* Forum Header */}
              <div className="selected-forum-header">
                <h2>{selectedForum.name}</h2>
                <p>{selectedForum.description}</p>
                
                {/* Controls */}
                <div className="forum-controls">
                  <div className="search-bar">
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                  >
                    <option value="recent">Most Recent</option>
                    <option value="popular">Most Popular</option>
                    <option value="trending">Trending</option>
                  </select>
                  
                  <button
                    className="create-post-btn"
                    onClick={() => setIsCreatingPost(true)}
                  >
                    Create Post
                  </button>
                </div>
              </div>

              {/* Create Post Form */}
              {isCreatingPost && (
                <div className="create-post-form">
                  <h3>Create New Post</h3>
                  
                  <input
                    type="text"
                    placeholder="Post title..."
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="post-title-input"
                  />
                  
                  <textarea
                    placeholder="Share your thoughts... (Be kind and supportive)"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="post-content-input"
                    rows={8}
                  />
                  
                  <div className="post-options">
                    <label>
                      <input
                        type="checkbox"
                        checked={useAnonymous}
                        onChange={(e) => setUseAnonymous(e.target.checked)}
                      />
                      Post anonymously
                    </label>
                    
                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      value={postTags.join(', ')}
                      onChange={(e) => setPostTags(e.target.value.split(',').map(t => t.trim()))}
                    />
                    
                    <select
                      multiple
                      value={contentWarning}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, option => option.value);
                        setContentWarning(selected);
                      }}
                    >
                      <option value="">Content warnings (optional)</option>
                      <option value="self-harm">Self-harm</option>
                      <option value="suicide">Suicide</option>
                      <option value="eating-disorder">Eating disorder</option>
                      <option value="substance-use">Substance use</option>
                      <option value="trauma">Trauma</option>
                    </select>
                  </div>
                  
                  <div className="post-form-actions">
                    <button onClick={handleCreatePost} disabled={isLoading}>
                      {isLoading ? 'Posting...' : 'Post'}
                    </button>
                    <button onClick={() => setIsCreatingPost(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Posts List */}
              <div className="posts-list">
                {posts.map(post => (
                  <article key={post.id} className="post-card">
                    {/* Post Header */}
                    <div className="post-header">
                      <div className="post-author">
                        {post.isAnonymous ? (
                          <span className="anonymous-author">
                            🎭 {post.authorDisplayName || 'Anonymous'}
                          </span>
                        ) : (
                          <span className="author-name">{post.author}</span>
                        )}
                        <span className="post-time">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                        {getSentimentIcon(post.sentiment)}
                      </div>
                      
                      {post.isPinned && <span className="pinned-badge">📌 Pinned</span>}
                      {post.isLocked && <span className="locked-badge">🔒 Locked</span>}
                    </div>

                    {/* Content Warnings */}
                    {getContentWarningBadges(post.contentWarnings)}

                    {/* Post Content */}
                    <div 
                      className="post-content"
                      onClick={() => setSelectedPost(post)}
                    >
                      <h3>{post.title}</h3>
                      <p>{post.content.substring(0, 300)}...</p>
                      
                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.map(tag => (
                            <span key={tag} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Post Actions */}
                    <div className="post-actions">
                      <button
                        className={`vote-btn ${post.upvotes.includes(userId) ? 'voted' : ''}`}
                        onClick={() => handleVote(post.id, 'post', 'upvote')}
                      >
                        👍 {post.upvotes.length}
                      </button>
                      
                      <button
                        className={`vote-btn ${post.downvotes.includes(userId) ? 'voted' : ''}`}
                        onClick={() => handleVote(post.id, 'post', 'downvote')}
                      >
                        👎 {post.downvotes.length}
                      </button>
                      
                      <button className="comment-btn">
                        💬 {post.comments.length} Comments
                      </button>
                      
                      <button
                        className="report-btn"
                        onClick={() => {
                          setReportingContent({ id: post.id, type: 'post' });
                          setReportModalOpen(true);
                        }}
                      >
                        🚩 Report
                      </button>
                    </div>

                    {/* Comments Section (if expanded) */}
                    {selectedPost?.id === post.id && (
                      <div className="comments-section">
                        <h4>Comments</h4>
                        
                        {/* Comment Form */}
                        <div className="comment-form">
                          <textarea
                            placeholder="Add a supportive comment..."
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            rows={3}
                          />
                          <button
                            onClick={() => handleCreateComment(post.id)}
                            disabled={isLoading}
                          >
                            Post Comment
                          </button>
                        </div>
                        
                        {/* Comments List */}
                        <div className="comments-list">
                          {post.comments.map(comment => (
                            <div key={comment.id} className="comment">
                              <div className="comment-header">
                                {comment.isAnonymous ? (
                                  <span className="anonymous-author">
                                    🎭 {comment.authorDisplayName || 'Anonymous'}
                                  </span>
                                ) : (
                                  <span className="author-name">{comment.author}</span>
                                )}
                                <span className="comment-time">
                                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <p className="comment-content">{comment.content}</p>
                              
                              <div className="comment-actions">
                                <button
                                  className={`vote-btn ${comment.upvotes.includes(userId) ? 'voted' : ''}`}
                                  onClick={() => handleVote(comment.id, 'comment', 'upvote')}
                                >
                                  👍 {comment.upvotes.length}
                                </button>
                                
                                <button
                                  onClick={() => setReplyingTo(comment.id)}
                                >
                                  Reply
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setReportingContent({ id: comment.id, type: 'comment' });
                                    setReportModalOpen(true);
                                  }}
                                >
                                  Report
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="no-forum-selected">
              <h2>Welcome to the Community Forums</h2>
              <p>Select a forum from the sidebar to start browsing posts and connecting with others.</p>
              <div className="forum-guidelines">
                <h3>Community Guidelines</h3>
                <ul>
                  <li>Be kind and supportive to all members</li>
                  <li>Respect everyone's journey and experiences</li>
                  <li>Use content warnings when discussing sensitive topics</li>
                  <li>Report any concerning content to keep our community safe</li>
                  <li>Remember: You're not alone, and seeking help is a sign of strength</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Report Content</h3>
            <p>Help us keep the community safe by reporting inappropriate content.</p>
            
            <div className="report-options">
              {Object.values(FlagType).map(type => (
                <label key={type}>
                  <input
                    type="radio"
                    name="report-reason"
                    value={type}
                    checked={reportReason === type}
                    onChange={() => setReportReason(type)}
                  />
                  {type.replace('-', ' ')}
                </label>
              ))}
            </div>
            
            <textarea
              placeholder="Additional details (optional)"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={4}
            />
            
            <div className="modal-actions">
              <button onClick={handleReport} disabled={!reportReason || isLoading}>
                Submit Report
              </button>
              <button onClick={() => setReportModalOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
    </div>
  );
};

export default ForumView;