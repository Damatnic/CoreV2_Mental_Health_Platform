/**
 * Mood View Component
 * Main view for mood tracking functionality
 */

import React, { useState } from 'react';
import { Heart, TrendingUp, Calendar } from 'lucide-react';

interface MoodEntry {
  id: string;
  mood: number; // 1-10 scale
  notes: string;
  date: Date;
}

const MoodView: React.FC = () => {
  const [moodHistory] = useState<MoodEntry[]>([]);
  const [currentMood, setCurrentMood] = useState(5);
  const [notes, setNotes] = useState('');

  const moodEmojis = ['😢', '😔', '😐', '🙂', '😊', '😄'];
  const moodLabels = ['Very Sad', 'Sad', 'Neutral', 'Good', 'Happy', 'Very Happy'];

  const handleSaveMood = () => {
    console.log('Saving mood:', { mood: currentMood, notes });
    setNotes('');
  };

  return (
    <div className="mood-view p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="w-8 h-8" />
          Mood Tracker
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Mood Input */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">How are you feeling today?</h2>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              {moodEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMood(index + 1)}
                  className={`text-4xl p-2 rounded-lg transition-all ${
                    currentMood === index + 1 ? 'bg-blue-100 scale-110' : 'hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div className="text-center">
              <span className="text-lg font-medium">{moodLabels[currentMood - 1]}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How was your day? What affected your mood?"
              className="w-full h-24 p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSaveMood}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Mood Entry
          </button>
        </div>

        {/* Mood History */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Mood History
          </h2>
          
          {moodHistory.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mood entries yet</h3>
              <p className="text-gray-600">Start tracking your mood to see patterns over time</p>
            </div>
          ) : (
            <div className="space-y-3">
              {moodHistory.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{moodEmojis[entry.mood - 1]}</span>
                    <div>
                      <div className="font-medium">{moodLabels[entry.mood - 1]}</div>
                      <div className="text-sm text-gray-600">{entry.date.toLocaleDateString()}</div>
                    </div>
                  </div>
                  {entry.notes && (
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {entry.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoodView;
