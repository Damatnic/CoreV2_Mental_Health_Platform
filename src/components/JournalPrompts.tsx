import React, { useState } from 'react';
import { BookOpen, RefreshCw, Heart, Lightbulb, Feather } from 'lucide-react';
import '../styles/JournalPrompts.css';

interface JournalPrompt {
  id: string;
  category: 'gratitude' | 'reflection' | 'growth' | 'creativity' | 'mindfulness';
  prompt: string;
  followUp?: string;
  icon: React.ReactNode;
}

const JournalPrompts: React.FC = () => {
  const prompts: JournalPrompt[] = [
    {
      id: '1',
      category: 'gratitude',
      prompt: 'What are three things you\'re grateful for today?',
      followUp: 'How did these things make you feel?',
      icon: <Heart size={20} />
    },
    {
      id: '2',
      category: 'reflection',
      prompt: 'What was the highlight of your day?',
      followUp: 'Why was this moment significant to you?',
      icon: <BookOpen size={20} />
    },
    {
      id: '3',
      category: 'growth',
      prompt: 'What challenge did you overcome today?',
      followUp: 'What did you learn from this experience?',
      icon: <Lightbulb size={20} />
    },
    {
      id: '4',
      category: 'creativity',
      prompt: 'If today had a color, what would it be and why?',
      icon: <Feather size={20} />
    },
    {
      id: '5',
      category: 'mindfulness',
      prompt: 'Describe this moment using all five senses.',
      followUp: 'How does being present make you feel?',
      icon: <BookOpen size={20} />
    }
  ];

  const [currentPrompt, setCurrentPrompt] = useState<JournalPrompt>(prompts[0]);
  const [response, setResponse] = useState('');
  const [savedEntries, setSavedEntries] = useState<Array<{ prompt: string; response: string; date: Date }>>([]);

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setCurrentPrompt(prompts[randomIndex]);
    setResponse('');
  };

  const handleSave = () => {
    if (response.trim()) {
      setSavedEntries([
        ...savedEntries,
        {
          prompt: currentPrompt.prompt,
          response: response,
          date: new Date()
        }
      ]);
      setResponse('');
      getRandomPrompt();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      gratitude: '#4CAF50',
      reflection: '#2196F3',
      growth: '#FF9800',
      creativity: '#9C27B0',
      mindfulness: '#00BCD4'
    };
    return colors[category as keyof typeof colors] || '#666';
  };

  return (
    <div className="journal-prompts">
      <div className="prompts-header">
        <BookOpen size={24} />
        <h2>Journal Prompts</h2>
      </div>

      <div className="current-prompt">
        <div className="prompt-card">
          <div className="prompt-header">
            <span 
              className="prompt-category"
              style={{ backgroundColor: getCategoryColor(currentPrompt.category) }}
            >
              {currentPrompt.icon}
              {currentPrompt.category}
            </span>
            <button className="refresh-btn" onClick={getRandomPrompt}>
              <RefreshCw size={18} />
            </button>
          </div>

          <h3 className="prompt-text">{currentPrompt.prompt}</h3>
          {currentPrompt.followUp && (
            <p className="prompt-followup">{currentPrompt.followUp}</p>
          )}

          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Write your thoughts here..."
            className="prompt-response"
            rows={6}
          />

          <div className="prompt-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
              disabled={!response.trim()}
            >
              Save Entry
            </button>
            <button 
              className="skip-btn"
              onClick={getRandomPrompt}
            >
              Skip Prompt
            </button>
          </div>
        </div>
      </div>

      {savedEntries.length > 0 && (
        <div className="recent-entries">
          <h3>Recent Entries</h3>
          <div className="entries-list">
            {savedEntries.slice(-3).reverse().map((entry, index) => (
              <div key={index} className="entry-card">
                <p className="entry-prompt">"{entry.prompt}"</p>
                <p className="entry-response">{entry.response}</p>
                <span className="entry-date">
                  {entry.date.toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="prompt-categories">
        <h3>Explore by Category</h3>
        <div className="category-buttons">
          {Object.keys({
            gratitude: 'Gratitude',
            reflection: 'Reflection',
            growth: 'Growth',
            creativity: 'Creativity',
            mindfulness: 'Mindfulness'
          }).map(category => (
            <button
              key={category}
              className="category-btn"
              style={{ borderColor: getCategoryColor(category) }}
              onClick={() => {
                const filtered = prompts.filter(p => p.category === category);
                if (filtered.length > 0) {
                  setCurrentPrompt(filtered[0]);
                  setResponse('');
                }
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JournalPrompts;
