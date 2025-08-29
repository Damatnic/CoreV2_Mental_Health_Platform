import React, { useState } from 'react';
import { Save, X, BookOpen, Heart, Calendar, Tag } from 'lucide-react';
import '../styles/SaveSessionModal.css';

interface SaveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sessionData: SessionData) => void;
  sessionType?: 'meditation' | 'breathing' | 'journal' | 'mood' | 'therapy';
  defaultData?: Partial<SessionData>;
}

interface SessionData {
  title: string;
  notes: string;
  rating: number;
  tags: string[];
  duration?: number;
  type: string;
  date: Date;
}

const SaveSessionModal: React.FC<SaveSessionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  sessionType = 'meditation',
  defaultData = {}
}) => {
  const [formData, setFormData] = useState<Partial<SessionData>>({
    title: '',
    notes: '',
    rating: 3,
    tags: [],
    type: sessionType,
    ...defaultData
  });
  const [newTag, setNewTag] = useState('');

  if (!isOpen) return null;

  const sessionIcons = {
    meditation: <Heart size={20} />,
    breathing: <BookOpen size={20} />,
    journal: <BookOpen size={20} />,
    mood: <Heart size={20} />,
    therapy: <Heart size={20} />
  };

  const suggestedTags = {
    meditation: ['mindfulness', 'peace', 'clarity', 'focus', 'relaxation'],
    breathing: ['calm', 'anxiety-relief', 'grounding', 'stress-relief', 'centering'],
    journal: ['reflection', 'growth', 'gratitude', 'insight', 'processing'],
    mood: ['tracking', 'awareness', 'patterns', 'emotions', 'self-care'],
    therapy: ['healing', 'breakthrough', 'support', 'progress', 'understanding']
  };

  const handleSave = () => {
    if (!formData.title?.trim()) return;

    const sessionData: SessionData = {
      title: formData.title,
      notes: formData.notes || '',
      rating: formData.rating || 3,
      tags: formData.tags || [],
      type: formData.type || sessionType,
      date: new Date(),
      ...(formData.duration && { duration: formData.duration })
    };

    onSave(sessionData);
    onClose();
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="save-session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            {sessionIcons[sessionType as keyof typeof sessionIcons]}
            <h2>Save Session</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label htmlFor="session-title">
              <Calendar size={16} />
              Session Title
            </label>
            <input
              id="session-title"
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Give your session a meaningful title..."
              className="title-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="session-rating">
              Rate Your Session
            </label>
            <div className="rating-selector">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  className={`rating-btn ${formData.rating === rating ? 'selected' : ''}`}
                  onClick={() => setFormData(prev => ({ ...prev, rating }))}
                >
                  {'⭐'.repeat(rating)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="session-notes">
              <BookOpen size={16} />
              Notes & Reflections
            </label>
            <textarea
              id="session-notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="How did this session make you feel? Any insights or observations..."
              rows={4}
              className="notes-input"
            />
          </div>

          <div className="form-group">
            <label>
              <Tag size={16} />
              Tags
            </label>
            
            <div className="tag-input-container">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add a tag..."
                className="tag-input"
              />
              <button onClick={handleAddTag} className="add-tag-btn">
                Add
              </button>
            </div>

            {formData.tags && formData.tags.length > 0 && (
              <div className="selected-tags">
                {formData.tags.map(tag => (
                  <span key={tag} className="tag-chip">
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            )}

            <div className="suggested-tags">
              <span className="suggested-label">Suggested:</span>
              {suggestedTags[sessionType as keyof typeof suggestedTags]
                .filter(tag => !formData.tags?.includes(tag))
                .slice(0, 3)
                .map(tag => (
                  <button
                    key={tag}
                    className="suggested-tag"
                    onClick={() => handleAddSuggestedTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="save-btn"
            onClick={handleSave}
            disabled={!formData.title?.trim()}
          >
            <Save size={18} />
            Save Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveSessionModal;
