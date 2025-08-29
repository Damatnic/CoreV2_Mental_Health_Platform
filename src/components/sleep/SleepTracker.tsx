/**
 * Sleep Tracker Component
 * Interactive interface for logging and monitoring sleep patterns
 */

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Moon, Sun, Brain, TrendingUp, AlertCircle, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import {
  sleepTrackingService,
  SleepEntry,
  SleepQuality,
  SleepFactor,
  EnvironmentAssessment,
  DreamEntry,
  SleepRecommendation
} from '../../services/sleep/sleepTrackingService';
import { useSleepTracking } from '../../hooks/useSleepTracking';
import { useAuth } from '../../contexts/AuthContext';

// Predefined sleep factors for quick selection
const COMMON_SLEEP_FACTORS = [
  { factor: 'Caffeine', impact: 'negative' as const },
  { factor: 'Alcohol', impact: 'negative' as const },
  { factor: 'Exercise', impact: 'positive' as const },
  { factor: 'Heavy meal', impact: 'negative' as const },
  { factor: 'Screen time', impact: 'negative' as const },
  { factor: 'Stress', impact: 'negative' as const },
  { factor: 'Meditation', impact: 'positive' as const },
  { factor: 'Reading', impact: 'positive' as const },
  { factor: 'Nap', impact: 'neutral' as const },
  { factor: 'Medication', impact: 'neutral' as const }
];

const SleepTracker: React.FC = () => {
  const { user } = useAuth();
  const {
    currentEntry,
    recentEntries,
    pattern,
    recommendations,
    isLoading,
    error,
    logSleep,
    updateSleep,
    deleteSleep,
    refreshData
  } = useSleepTracking();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState<SleepQuality>(SleepQuality.FAIR);
  const [selectedFactors, setSelectedFactors] = useState<SleepFactor[]>([]);
  const [environment, setEnvironment] = useState<EnvironmentAssessment>({
    temperature: 'comfortable',
    noise: 'quiet',
    light: 'dark',
    comfort: 4
  });
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [showDreamJournal, setShowDreamJournal] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Dream journal state
  const [dreamContent, setDreamContent] = useState('');
  const [dreamEmotion, setDreamEmotion] = useState<DreamEntry['emotion']>('neutral');
  const [dreamIntensity, setDreamIntensity] = useState(3);
  const [dreamRecurring, setDreamRecurring] = useState(false);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    const entry: Omit<SleepEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: user.id,
      date: parseISO(selectedDate),
      bedtime: parseISO(`${selectedDate}T${bedtime}`),
      wakeTime: parseISO(`${selectedDate}T${wakeTime}`),
      quality,
      factors: selectedFactors,
      environment,
      dreams: dreams.length > 0 ? dreams : undefined,
      notes: notes.trim() || undefined
    };

    try {
      if (isEditing && currentEntry) {
        await updateSleep(currentEntry.id, entry);
      } else {
        await logSleep(entry);
      }
      
      // Reset form
      resetForm();
      refreshData();
    } catch (err) {
      console.error('Error saving sleep entry:', err);
    }
  };

  const resetForm = () => {
    setIsEditing(false);
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
    setBedtime('23:00');
    setWakeTime('07:00');
    setQuality(SleepQuality.FAIR);
    setSelectedFactors([]);
    setEnvironment({
      temperature: 'comfortable',
      noise: 'quiet',
      light: 'dark',
      comfort: 4
    });
    setDreams([]);
    setNotes('');
    setDreamContent('');
    setDreamEmotion('neutral');
    setDreamIntensity(3);
    setDreamRecurring(false);
  };

  const toggleFactor = (factor: string, impact: SleepFactor['impact']) => {
    setSelectedFactors(prev => {
      const existing = prev.findIndex(f => f.factor === factor);
      if (existing >= 0) {
        return prev.filter(f => f.factor !== factor);
      }
      return [...prev, { factor, present: true, impact }];
    });
  };

  const addDream = () => {
    if (!dreamContent.trim()) return;

    const newDream: DreamEntry = {
      id: `dream_${Date.now()}`,
      content: dreamContent,
      emotion: dreamEmotion,
      intensity: dreamIntensity,
      recurring: dreamRecurring
    };

    setDreams(prev => [...prev, newDream]);
    setDreamContent('');
    setDreamEmotion('neutral');
    setDreamIntensity(3);
    setDreamRecurring(false);
    setShowDreamJournal(false);
  };

  const removeDream = (dreamId: string) => {
    setDreams(prev => prev.filter(d => d.id !== dreamId));
  };

  const getQualityColor = (q: SleepQuality) => {
    switch (q) {
      case SleepQuality.EXCELLENT: return 'text-green-600';
      case SleepQuality.GOOD: return 'text-blue-600';
      case SleepQuality.FAIR: return 'text-yellow-600';
      case SleepQuality.POOR: return 'text-orange-600';
      case SleepQuality.VERY_POOR: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityLabel = (q: SleepQuality) => {
    switch (q) {
      case SleepQuality.EXCELLENT: return 'Excellent';
      case SleepQuality.GOOD: return 'Good';
      case SleepQuality.FAIR: return 'Fair';
      case SleepQuality.POOR: return 'Poor';
      case SleepQuality.VERY_POOR: return 'Very Poor';
      default: return 'Unknown';
    }
  };

  const renderSleepHygieneTips = () => {
    const tips = [
      { icon: Moon, text: 'Keep your bedroom cool (60-67°F)', category: 'Environment' },
      { icon: Clock, text: 'Maintain consistent sleep schedule', category: 'Schedule' },
      { icon: Sun, text: 'Get morning sunlight exposure', category: 'Light' },
      { icon: Brain, text: 'Avoid screens 1 hour before bed', category: 'Hygiene' },
      { icon: AlertCircle, text: 'Limit caffeine after 2 PM', category: 'Diet' }
    ];

    return (
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Sleep Hygiene Tips
        </h3>
        <div className="space-y-2">
          {tips.map((tip, index) => (
            <div key={index} className="flex items-start">
              <tip.icon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-700">{tip.text}</p>
                <span className="text-xs text-gray-500">{tip.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Moon className="w-8 h-8 mr-3 text-indigo-600" />
            Sleep Tracker
          </h2>
          <button
            onClick={() => setShowTips(!showTips)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            {showTips ? 'Hide' : 'Show'} Tips
          </button>
        </div>

        {showTips && renderSleepHygieneTips()}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Moon className="inline w-4 h-4 mr-1" />
                Bedtime
              </label>
              <input
                type="time"
                value={bedtime}
                onChange={(e) => setBedtime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Sun className="inline w-4 h-4 mr-1" />
                Wake Time
              </label>
              <input
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Sleep Quality Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sleep Quality
            </label>
            <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setQuality(value as SleepQuality)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                    quality === value
                      ? 'bg-indigo-100 ring-2 ring-indigo-500'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      value <= quality ? 'fill-current text-yellow-500' : 'text-gray-300'
                    }`}
                  />
                  <span className={`text-xs mt-1 ${getQualityColor(value as SleepQuality)}`}>
                    {getQualityLabel(value as SleepQuality)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sleep Factors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Sleep Factors (What affected your sleep?)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COMMON_SLEEP_FACTORS.map(({ factor, impact }) => {
                const isSelected = selectedFactors.some(f => f.factor === factor);
                return (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => toggleFactor(factor, impact)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? impact === 'positive'
                          ? 'bg-green-100 text-green-800 ring-2 ring-green-500'
                          : impact === 'negative'
                          ? 'bg-red-100 text-red-800 ring-2 ring-red-500'
                          : 'bg-blue-100 text-blue-800 ring-2 ring-blue-500'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {factor}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Environment Assessment */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Sleep Environment
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                <select
                  value={environment.temperature}
                  onChange={(e) => setEnvironment(prev => ({ 
                    ...prev, 
                    temperature: e.target.value as EnvironmentAssessment['temperature'] 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="too_cold">Too Cold</option>
                  <option value="cold">Cold</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="warm">Warm</option>
                  <option value="too_warm">Too Warm</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Noise Level</label>
                <select
                  value={environment.noise}
                  onChange={(e) => setEnvironment(prev => ({ 
                    ...prev, 
                    noise: e.target.value as EnvironmentAssessment['noise'] 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="silent">Silent</option>
                  <option value="quiet">Quiet</option>
                  <option value="moderate">Moderate</option>
                  <option value="noisy">Noisy</option>
                  <option value="very_noisy">Very Noisy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-600 mb-1">Light Level</label>
                <select
                  value={environment.light}
                  onChange={(e) => setEnvironment(prev => ({ 
                    ...prev, 
                    light: e.target.value as EnvironmentAssessment['light'] 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="pitch_dark">Pitch Dark</option>
                  <option value="dark">Dark</option>
                  <option value="dim">Dim</option>
                  <option value="bright">Bright</option>
                  <option value="very_bright">Very Bright</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Comfort Level (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={environment.comfort}
                onChange={(e) => setEnvironment(prev => ({ 
                  ...prev, 
                  comfort: parseInt(e.target.value) 
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Very Uncomfortable</span>
                <span>Very Comfortable</span>
              </div>
            </div>
          </div>

          {/* Dream Journal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Dream Journal
              </label>
              <button
                type="button"
                onClick={() => setShowDreamJournal(!showDreamJournal)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                {showDreamJournal ? 'Hide' : 'Add Dream'}
              </button>
            </div>
            
            {showDreamJournal && (
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <textarea
                  value={dreamContent}
                  onChange={(e) => setDreamContent(e.target.value)}
                  placeholder="Describe your dream..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Emotion</label>
                    <select
                      value={dreamEmotion}
                      onChange={(e) => setDreamEmotion(e.target.value as DreamEntry['emotion'])}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="positive">Positive</option>
                      <option value="neutral">Neutral</option>
                      <option value="negative">Negative</option>
                      <option value="nightmare">Nightmare</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Intensity (1-5)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={dreamIntensity}
                      onChange={(e) => setDreamIntensity(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dreamRecurring}
                      onChange={(e) => setDreamRecurring(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Recurring dream</span>
                  </label>
                  
                  <button
                    type="button"
                    onClick={addDream}
                    disabled={!dreamContent.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Add Dream
                  </button>
                </div>
              </div>
            )}
            
            {dreams.length > 0 && (
              <div className="mt-3 space-y-2">
                {dreams.map((dream) => (
                  <div
                    key={dream.id}
                    className="bg-purple-100 rounded-lg p-3 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{dream.content}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          dream.emotion === 'positive' ? 'bg-green-200 text-green-800' :
                          dream.emotion === 'negative' ? 'bg-red-200 text-red-800' :
                          dream.emotion === 'nightmare' ? 'bg-purple-200 text-purple-800' :
                          'bg-gray-200 text-gray-800'
                        }`}>
                          {dream.emotion}
                        </span>
                        <span className="text-xs text-gray-600">
                          Intensity: {dream.intensity}/5
                        </span>
                        {dream.recurring && (
                          <span className="text-xs text-purple-600 font-medium">
                            Recurring
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDream(dream.id)}
                      className="text-red-500 hover:text-red-700 ml-2"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other observations about your sleep..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isEditing ? 'Update' : 'Log'} Sleep
            </button>
          </div>
        </form>
      </div>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sleep Logs</h3>
          <div className="space-y-3">
            {recentEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {format(new Date(entry.date), 'EEEE, MMM d')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(entry.bedtime), 'h:mm a')} - {format(new Date(entry.wakeTime), 'h:mm a')}
                      {' '}({Math.round((entry.actualSleepTime || 0) / 60 * 10) / 10} hours)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      entry.quality >= 4 ? 'bg-green-100 text-green-800' :
                      entry.quality >= 3 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getQualityLabel(entry.quality)}
                    </span>
                  </div>
                </div>
                {entry.notes && (
                  <p className="text-sm text-gray-600 mt-2">{entry.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Personalized Sleep Recommendations
          </h3>
          <div className="space-y-4">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-white rounded-lg p-4">
                <div className="flex items-start">
                  <div className={`px-2 py-1 rounded text-xs font-medium mr-3 ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {rec.actionItems.slice(0, 3).map((item, i) => (
                        <li key={i} className="flex items-start">
                          <span className="text-indigo-600 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-500 mt-2">
                      <strong>Expected benefit:</strong> {rec.expectedBenefit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SleepTracker;