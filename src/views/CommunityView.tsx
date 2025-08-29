import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
}

const CommunityView: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([
    {
      id: '1',
      title: 'Finding Hope in Small Moments',
      content: 'Today I realized that healing isn\'t about big breakthroughs. Sometimes it\'s just about noticing small positive moments.',
      author: 'Sarah M.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      likes: 24,
      comments: 8,
      isLiked: false
    },
    {
      id: '2',
      title: 'Anxiety Management Tips',
      content: 'Here are some techniques that have helped me manage anxiety. Remember, everyone is different.',
      author: 'Alex K.',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      likes: 45,
      comments: 12,
      isLiked: true
    }
  ]);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            isLiked: !post.isLiked 
          }
        : post
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const diffHours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    return diffHours < 24 ? `${diffHours}h ago` : `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="community-view">
      <div className="community-header">
        <h1>Community Support</h1>
        <p>Connect with others on their mental health journey</p>
      </div>

      <div className="community-guidelines">
        <h3>Community Guidelines</h3>
        <ul>
          <li>Be respectful and supportive</li>
          <li>Share experiences, not advice</li>
          <li>Respect privacy</li>
        </ul>
      </div>

      <div className="posts-section">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <h4>{post.author}</h4>
              <span>{formatTimeAgo(post.timestamp)}</span>
            </div>
            <h3>{post.title}</h3>
            <p>{post.content}</p>
            <div className="post-actions">
              <button 
                className={`like-button ${post.isLiked ? 'liked' : ''}`}
                onClick={() => handleLike(post.id)}
              >
                {post.isLiked ? '❤️' : '🤍'} {post.likes}
              </button>
              <span>💬 {post.comments}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="crisis-notice">
        <p>Crisis Support: <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
      </div>
    </div>
  );
};

export default CommunityView;
