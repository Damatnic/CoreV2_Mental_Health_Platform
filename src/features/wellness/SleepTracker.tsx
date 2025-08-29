import React, { useState } from 'react';
import { Moon, Sun, Clock, TrendingUp, Calendar } from 'lucide-react';
import '../../styles/SleepTracker.css';

interface SleepEntry {
  date: Date;
  bedtime: string;
  wakeTime: string;
  duration: number;
  quality: number;
  notes?: string;
}

const SleepTracker: React.FC = () => {
  const [entries, setEntries] = useState<SleepEntry[]>([
    {
      date: new Date('2024-02-10'),
      bedtime: '23:00',
      wakeTime: '07:00',
      duration: 8,
      quality: 4,
      notes: 'Good rest, woke up refreshed'
    },
    {
      date: new Date('2024-02-09'),
      bedtime: '23:30',
      wakeTime: '06:30',
      duration: 7,
      quality: 3,
      notes: 'Woke up once during the night'
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    bedtime: '',
    wakeTime: '',
    quality: 3,
    notes: ''
  });

  const calculateDuration = (bedtime: string, wakeTime: string): number => {
    const [bedHour, bedMin] = bedtime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    
    let duration = wakeHour - bedHour;
    if (wakeHour < bedHour) duration += 24;
    duration += (wakeMin - bedMin) / 60;
    
    return Math.round(duration * 10) / 10;
  };

  const handleAddEntry = () => {
    if (newEntry.bedtime && newEntry.wakeTime) {
      const duration = calculateDuration(newEntry.bedtime, newEntry.wakeTime);
      
      const entry: SleepEntry = {
        date: new Date(),
        bedtime: newEntry.bedtime,
        wakeTime: newEntry.wakeTime,
        duration,
        quality: newEntry.quality,
        notes: newEntry.notes
      };
      
      setEntries([entry, ...entries]);
      setNewEntry({ bedtime: '', wakeTime: '', quality: 3, notes: '' });
      setShowForm(false);
    }
  };

  const getAverageSleep = () => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.duration, 0);
    return Math.round((total / entries.length) * 10) / 10;
  };

  const getAverageQuality = () => {
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.quality, 0);
    return Math.round((total / entries.length) * 10) / 10;
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 4) return '#4CAF50';
    if (quality >= 3) return '#FFC107';
    return '#FF5722';
  };

  const getQualityEmoji = (quality: number) => {
    const emojis = ['😴', '😪', '😐', '🙂', '😊'];
    return emojis[quality - 1] || '😐';
  };

  return (
    <div className="sleep-tracker">
      <div className="tracker-header">
        <Moon size={24} />
        <div>
          <h2>Sleep Tracker</h2>
          <p>Monitor your sleep patterns for better rest</p>
        </div>
      </div>

      <div className="sleep-stats">
        <div className="stat-card">
          <Clock size={20} />
          <div>
            <span className="stat-value">{getAverageSleep()}h</span>
            <span className="stat-label">Avg Sleep</span>
          </div>
        </div>
        
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <span className="stat-value">{getAverageQuality()}/5</span>
            <span className="stat-label">Avg Quality</span>
          </div>
        </div>
        
        <div className="stat-card">
          <Calendar size={20} />
          <div>
            <span className="stat-value">{entries.length}</span>
            <span className="stat-label">Nights Tracked</span>
          </div>
        </div>
      </div>

      <button 
        className="add-sleep-btn"
        onClick={() => setShowForm(true)}
      >
        Log Tonight's Sleep
      </button>

      {showForm && (
        <div className="sleep-form">
          <h3>Log Your Sleep</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>
                <Moon size={16} />
                Bedtime
              </label>
              <input
                type="time"
                value={newEntry.bedtime}
                onChange={(e) => setNewEntry({ ...newEntry, bedtime: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label>
                <Sun size={16} />
                Wake Time
              </label>
              <input
                type="time"
                value={newEntry.wakeTime}
                onChange={(e) => setNewEntry({ ...newEntry, wakeTime: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Sleep Quality</label>
            <div className="quality-selector">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  className={`quality-btn ${newEntry.quality === rating ? 'selected' : ''}`}
                  onClick={() => setNewEntry({ ...newEntry, quality: rating })}
                >
                  {getQualityEmoji(rating)}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="How did you sleep?"
              rows={2}
            />
          </div>

          <div className="form-actions">
            <button onClick={() => setShowForm(false)}>Cancel</button>
            <button onClick={handleAddEntry} className="primary">Save Entry</button>
          </div>
        </div>
      )}

      <div className="sleep-history">
        <h3>Sleep History</h3>
        <div className="entries-list">
          {entries.map((entry, index) => (
            <div key={index} className="sleep-entry">
              <div className="entry-date">
                {entry.date.toLocaleDateString('en', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              
              <div className="entry-times">
                <span className="time">
                  <Moon size={14} /> {entry.bedtime}
                </span>
                <span className="duration">{entry.duration}h</span>
                <span className="time">
                  <Sun size={14} /> {entry.wakeTime}
                </span>
              </div>
              
              <div 
                className="entry-quality"
                style={{ color: getQualityColor(entry.quality) }}
              >
                {getQualityEmoji(entry.quality)}
              </div>
              
              {entry.notes && (
                <p className="entry-notes">{entry.notes}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sleep-tips">
        <h3>Sleep Tips</h3>
        <ul>
          <li>Keep a consistent sleep schedule</li>
          <li>Create a relaxing bedtime routine</li>
          <li>Limit screen time before bed</li>
          <li>Keep your bedroom cool and dark</li>
        </ul>
      </div>
    </div>
  );
};

export default SleepTracker;
