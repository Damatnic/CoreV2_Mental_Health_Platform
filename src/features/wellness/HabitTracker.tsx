import React, { useState } from 'react';
import { Target, CheckCircle, Circle, Plus, Calendar, TrendingUp } from 'lucide-react';
import '../../styles/HabitTracker.css';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  streak: number;
  completedDates: string[];
  color: string;
}

const HabitTracker: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: '1',
      name: 'Morning Meditation',
      description: '10 minutes of mindfulness',
      frequency: 'daily',
      streak: 5,
      completedDates: ['2024-02-10', '2024-02-09', '2024-02-08'],
      color: '#4CAF50'
    },
    {
      id: '2',
      name: 'Gratitude Journal',
      description: 'Write 3 things I\'m grateful for',
      frequency: 'daily',
      streak: 3,
      completedDates: ['2024-02-10', '2024-02-09'],
      color: '#FF9800'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', description: '', frequency: 'daily' as const });

  const today = new Date().toISOString().split('T')[0];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const toggleHabit = (habitId: string) => {
    setHabits(prev => prev.map(habit => {
      if (habit.id === habitId) {
        const isCompleted = habit.completedDates.includes(today);
        const newDates = isCompleted
          ? habit.completedDates.filter(d => d !== today)
          : [...habit.completedDates, today];
        
        const newStreak = isCompleted 
          ? Math.max(0, habit.streak - 1)
          : habit.streak + 1;
        
        return {
          ...habit,
          completedDates: newDates,
          streak: newStreak
        };
      }
      return habit;
    }));
  };

  const addHabit = () => {
    if (newHabit.name) {
      const colors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336'];
      const habit: Habit = {
        id: Date.now().toString(),
        name: newHabit.name,
        description: newHabit.description,
        frequency: newHabit.frequency,
        streak: 0,
        completedDates: [],
        color: colors[habits.length % colors.length]
      };
      
      setHabits([...habits, habit]);
      setNewHabit({ name: '', description: '', frequency: 'daily' });
      setShowAddForm(false);
    }
  };

  const getTotalStreak = () => {
    return habits.reduce((sum, habit) => sum + habit.streak, 0);
  };

  const getCompletionRate = () => {
    const totalPossible = habits.length * 7;
    const totalCompleted = habits.reduce((sum, habit) => 
      sum + last7Days.filter(day => habit.completedDates.includes(day)).length, 0
    );
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };

  return (
    <div className="habit-tracker">
      <div className="tracker-header">
        <Target size={24} />
        <div>
          <h2>Habit Tracker</h2>
          <p>Build healthy routines, one day at a time</p>
        </div>
      </div>

      <div className="tracker-stats">
        <div className="stat">
          <TrendingUp size={20} />
          <div>
            <span className="stat-value">{getTotalStreak()}</span>
            <span className="stat-label">Day Streak</span>
          </div>
        </div>
        <div className="stat">
          <CheckCircle size={20} />
          <div>
            <span className="stat-value">{getCompletionRate()}%</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
        <div className="stat">
          <Calendar size={20} />
          <div>
            <span className="stat-value">{habits.length}</span>
            <span className="stat-label">Active Habits</span>
          </div>
        </div>
      </div>

      <div className="habits-list">
        {habits.map(habit => (
          <div key={habit.id} className="habit-card">
            <div className="habit-info">
              <div 
                className="habit-color-indicator"
                style={{ backgroundColor: habit.color }}
              />
              <div>
                <h3>{habit.name}</h3>
                {habit.description && <p>{habit.description}</p>}
                <span className="habit-frequency">{habit.frequency}</span>
              </div>
            </div>
            
            <div className="habit-tracking">
              <div className="week-view">
                {last7Days.map(day => (
                  <div 
                    key={day}
                    className={`day-indicator ${
                      habit.completedDates.includes(day) ? 'completed' : ''
                    }`}
                    title={new Date(day).toLocaleDateString('en', { weekday: 'short' })}
                  >
                    {habit.completedDates.includes(day) ? 
                      <CheckCircle size={16} /> : 
                      <Circle size={16} />
                    }
                  </div>
                ))}
              </div>
              
              <button
                className={`complete-btn ${
                  habit.completedDates.includes(today) ? 'completed' : ''
                }`}
                onClick={() => toggleHabit(habit.id)}
              >
                {habit.completedDates.includes(today) ? 
                  <><CheckCircle size={18} /> Done</> : 
                  <><Circle size={18} /> Today</>
                }
              </button>
              
              <div className="streak-badge">
                🔥 {habit.streak}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        className="add-habit-btn"
        onClick={() => setShowAddForm(true)}
      >
        <Plus size={20} />
        Add New Habit
      </button>

      {showAddForm && (
        <div className="add-habit-modal">
          <div className="modal-content">
            <h3>Create New Habit</h3>
            <input
              type="text"
              placeholder="Habit name"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newHabit.description}
              onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
            />
            <select
              value={newHabit.frequency}
              onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value as any })}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
            <div className="modal-actions">
              <button onClick={() => setShowAddForm(false)}>Cancel</button>
              <button onClick={addHabit} className="primary">Add Habit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitTracker;
