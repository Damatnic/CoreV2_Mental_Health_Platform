import * as React from 'react';
import { useState } from 'react';
import { MessageCircle, ThumbsUp, Reply, Flag } from 'lucide-react';
import '../../styles/ForumDiscussions.css';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  category: string;
  replies: number;
  likes: number;
  isAnonymous: boolean;
}

interface ForumReply {
  id: string;
  postId: string;
  content: string;
  author: string;
  timestamp: Date;
  likes: number;
  isAnonymous: boolean;
}

const ForumDiscussions: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  const categories = [
    { id: 'all', name: 'All Discussions' },
    { id: 'support', name: 'Peer Support' },
    { id: 'wellness', name: 'Wellness Tips' },
    { id: 'resources', name: 'Resources' },
    { id: 'stories', name: 'Recovery Stories' }
  ];

  const posts: ForumPost[] = [
    {
      id: '1',
      title: 'Coping strategies that have helped me',
      content: 'I wanted to share some techniques that have been helpful in my journey...',
      author: 'WellnessWarrior',
      timestamp: new Date('2024-02-10T14:30:00'),
      category: 'wellness',
      replies: 12,
      likes: 24,
      isAnonymous: false
    },
    {
      id: '2',
      title: 'Finding support during difficult times',
      content: 'Sometimes we all need a reminder that we are not alone...',
      author: 'Anonymous',
      timestamp: new Date('2024-02-09T09:15:00'),
      category: 'support',
      replies: 8,
      likes: 18,
      isAnonymous: true
    }
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return React.createElement('div', { className: "forum-discussions" },
    React.createElement('div', { className: "forum-header" },
      React.createElement(MessageCircle, { size: 24 }),
      React.createElement('div', null,
        React.createElement('h2', null, "Community Discussions"),
        React.createElement('p', null, "Connect, share experiences, and support each other")
      ),
      React.createElement('button', {
        className: "new-post-btn",
        onClick: () => setShowNewPost(true)
      }, "New Post")
    ),
    
    React.createElement('div', { className: "category-tabs" },
      categories.map(category => 
        React.createElement('button', {
          key: category.id,
          className: `category-tab ${selectedCategory === category.id ? 'active' : ''}`,
          onClick: () => setSelectedCategory(category.id)
        }, category.name)
      )
    ),
    
    React.createElement('div', { className: "posts-list" },
      filteredPosts.map(post => 
        React.createElement('div', { key: post.id, className: "post-card" },
          React.createElement('div', { className: "post-header" },
            React.createElement('h3', { className: "post-title" }, post.title),
            React.createElement('span', { className: "post-category" }, post.category)
          ),
          
          React.createElement('p', { className: "post-content" }, post.content),
          
          React.createElement('div', { className: "post-meta" },
            React.createElement('div', { className: "post-author" },
              "by ", post.isAnonymous ? 'Anonymous' : post.author
            ),
            React.createElement('div', { className: "post-timestamp" },
              formatTimeAgo(post.timestamp)
            )
          ),
          
          React.createElement('div', { className: "post-stats" },
            React.createElement('div', { className: "stat" },
              React.createElement(ThumbsUp, { size: 14 }),
              React.createElement('span', null, post.likes)
            ),
            React.createElement('div', { className: "stat" },
              React.createElement(Reply, { size: 14 }),
              React.createElement('span', null, post.replies, " replies")
            )
          ),
          
          React.createElement('div', { className: "post-actions" },
            React.createElement('button', { className: "action-btn" },
              React.createElement(ThumbsUp, { size: 16 }),
              "Like"
            ),
            React.createElement('button', { className: "action-btn" },
              React.createElement(Reply, { size: 16 }),
              "Reply"
            ),
            React.createElement('button', { className: "action-btn" },
              React.createElement(Flag, { size: 16 }),
              "Report"
            )
          )
        )
      ),
      
      filteredPosts.length === 0 && React.createElement('div', { className: "no-posts" },
        React.createElement(MessageCircle, { size: 48 }),
        React.createElement('h3', null, "No discussions yet"),
        React.createElement('p', null, "Be the first to start a conversation in this category!")
      )
    ),
    
    showNewPost && React.createElement('div', { className: "new-post-modal" },
      React.createElement('div', { className: "modal-content" },
        React.createElement('div', { className: "modal-header" },
          React.createElement('h3', null, "Create New Post"),
          React.createElement('button', { onClick: () => setShowNewPost(false) }, "×")
        ),
        
        React.createElement('form', { className: "new-post-form" },
          React.createElement('div', { className: "form-group" },
            React.createElement('label', null, "Title"),
            React.createElement('input', { 
              type: "text", 
              placeholder: "What would you like to discuss?" 
            })
          ),
          
          React.createElement('div', { className: "form-group" },
            React.createElement('label', null, "Category"),
            React.createElement('select', null,
              React.createElement('option', { value: "support" }, "Peer Support"),
              React.createElement('option', { value: "wellness" }, "Wellness Tips"),
              React.createElement('option', { value: "resources" }, "Resources"),
              React.createElement('option', { value: "stories" }, "Recovery Stories")
            )
          ),
          
          React.createElement('div', { className: "form-group" },
            React.createElement('label', null, "Content"),
            React.createElement('textarea', {
              rows: 6,
              placeholder: "Share your thoughts, experiences, or questions..."
            })
          ),
          
          React.createElement('div', { className: "form-group" },
            React.createElement('label', { className: "checkbox-label" },
              React.createElement('input', { type: "checkbox" }),
              "Post anonymously"
            )
          ),
          
          React.createElement('div', { className: "form-actions" },
            React.createElement('button', { 
              type: "button", 
              onClick: () => setShowNewPost(false) 
            }, "Cancel"),
            React.createElement('button', { type: "submit" }, "Create Post")
          )
        )
      )
    ),
    
    React.createElement('div', { className: "community-guidelines" },
      React.createElement('h3', null, "Community Guidelines"),
      React.createElement('ul', null,
        React.createElement('li', null, "Be respectful and supportive of all community members"),
        React.createElement('li', null, "Share experiences without giving medical advice"),
        React.createElement('li', null, "Respect privacy - don't share personal information"),
        React.createElement('li', null, "Report any inappropriate content to moderators")
      )
    )
  );
};

export default ForumDiscussions;