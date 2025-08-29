import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, BookOpen, Award } from 'lucide-react';
import '../../styles/StorySharing.css';

interface Story {
  id: string;
  author: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: Date;
  isAnonymous: boolean;
}

const StorySharing: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([
    {
      id: '1',
      author: 'Anonymous',
      title: 'Finding Light in the Darkness',
      content: 'After years of struggling, I finally found the courage to seek help...',
      tags: ['recovery', 'hope', 'anxiety'],
      likes: 42,
      comments: 8,
      createdAt: new Date('2024-02-10'),
      isAnonymous: true
    },
    {
      id: '2',
      author: 'Sarah M.',
      title: 'One Day at a Time',
      content: 'My journey with depression taught me the importance of small victories...',
      tags: ['depression', 'progress', 'self-care'],
      likes: 28,
      comments: 5,
      createdAt: new Date('2024-02-09'),
      isAnonymous: false
    }
  ]);
  const [filter, setFilter] = useState<string>('all');
  const [showShareForm, setShowShareForm] = useState(false);

  const popularTags = ['recovery', 'hope', 'anxiety', 'depression', 'self-care', 'progress'];

  const handleLike = (storyId: string) => {
    setStories(prev => prev.map(story => 
      story.id === storyId 
        ? { ...story, likes: story.likes + 1 }
        : story
    ));
  };

  const filteredStories = filter === 'all' 
    ? stories 
    : stories.filter(story => story.tags.includes(filter));

  return (
    <div className="story-sharing">
      <div className="sharing-header">
        <BookOpen size={24} />
        <div>
          <h2>Community Stories</h2>
          <p>Share your journey, inspire others</p>
        </div>
      </div>

      <div className="sharing-actions">
        <button 
          className="share-story-btn"
          onClick={() => setShowShareForm(true)}
        >
          Share Your Story
        </button>
        <div className="tag-filters">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            All Stories
          </button>
          {popularTags.map(tag => (
            <button
              key={tag}
              className={filter === tag ? 'active' : ''}
              onClick={() => setFilter(tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      <div className="stories-grid">
        {filteredStories.map(story => (
          <article key={story.id} className="story-card">
            <div className="story-header">
              <h3>{story.title}</h3>
              <Award size={20} className="verified-icon" />
            </div>
            
            <p className="story-preview">{story.content}</p>
            
            <div className="story-tags">
              {story.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
            
            <div className="story-footer">
              <span className="story-author">
                {story.isAnonymous ? 'Anonymous' : story.author}
              </span>
              <div className="story-actions">
                <button 
                  className="action-btn"
                  onClick={() => handleLike(story.id)}
                >
                  <Heart size={16} />
                  <span>{story.likes}</span>
                </button>
                <button className="action-btn">
                  <MessageCircle size={16} />
                  <span>{story.comments}</span>
                </button>
                <button className="action-btn">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {showShareForm && (
        <div className="share-form-modal">
          <div className="share-form">
            <h3>Share Your Story</h3>
            <p>Your story can make a difference in someone's life</p>
            <form>
              <input
                type="text"
                placeholder="Title (optional)"
                className="form-input"
              />
              <textarea
                placeholder="Share your experience..."
                className="form-textarea"
                rows={5}
              />
              <label className="anonymous-check">
                <input type="checkbox" defaultChecked />
                Share anonymously
              </label>
              <div className="form-actions">
                <button type="button" onClick={() => setShowShareForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Share Story
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorySharing;
