import React, { useState } from 'react';

interface Reflection {
  id: string;
  title: string;
  content: string;
  mood: number;
  date: Date;
}

const ReflectionsView: React.FC = () => {
  const [reflections, setReflections] = useState<Reflection[]>([
    {
      id: '1',
      title: 'A Good Day',
      content: 'Today was surprisingly good. I managed to complete my tasks.',
      mood: 7,
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState(5);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTitle.trim() || !newContent.trim()) return;

    const newReflection: Reflection = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim(),
      mood: newMood,
      date: new Date()
    };

    setReflections([newReflection, ...reflections]);
    setNewTitle('');
    setNewContent('');
    setNewMood(5);
    setShowForm(false);
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 2) return '😢';
    if (mood <= 4) return '😕';
    if (mood <= 6) return '😐';
    if (mood <= 8) return '😊';
    return '😄';
  };

  return (
    <div className="reflections-view">
      <div className="reflections-header">
        <h1>Daily Reflections</h1>
        <p>Journal your thoughts and feelings</p>
      </div>

      <div className="reflection-actions">
        {!showForm ? (
          <button 
            className="new-reflection-button"
            onClick={() => setShowForm(true)}
          >
            ➕ New Reflection
          </button>
        ) : (
          <form className="reflection-form" onSubmit={handleSubmit}>
            <h3>Write a New Reflection</h3>
            
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Title..."
              required
            />

            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              required
            />

            <label>
              Mood: {getMoodEmoji(newMood)} ({newMood}/10)
              <input
                type="range"
                min="1"
                max="10"
                value={newMood}
                onChange={(e) => setNewMood(Number(e.target.value))}
              />
            </label>

            <div className="form-actions">
              <button type="submit">Save</button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="reflections-list">
        <h2>Your Reflections</h2>
        <div className="reflections-grid">
          {reflections.map((reflection) => (
            <div key={reflection.id} className="reflection-card">
              <h3>{reflection.title}</h3>
              <div className="reflection-date">
                {reflection.date.toLocaleDateString()}
              </div>
              <div className="reflection-mood">
                {getMoodEmoji(reflection.mood)} {reflection.mood}/10
              </div>
              <p>{reflection.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="crisis-notice">
        <p>Crisis Support: <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
      </div>
    </div>
  );
};

export default ReflectionsView;
