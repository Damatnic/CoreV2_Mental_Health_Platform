import React, { useState, useEffect } from 'react';
import './SelfCareReminders.css';

interface SelfCareActivity {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'physical' | 'mental' | 'social' | 'spiritual' | 'practical';
  frequency: 'daily' | 'weekly' | 'monthly';
  lastCompleted?: string;
  streak?: number;
}

interface Reminder {
  id: string;
  activityId: string;
  time: string;
  days: string[];
  enabled: boolean;
}

const DEFAULT_ACTIVITIES: SelfCareActivity[] = [
  // Physical
  { id: 'water', title: "Drink Water", description: "Stay hydrated throughout the day", icon: "💧", category: 'physical', frequency: "daily" },
  { id: "exercise", title: "Exercise", description: "30 minutes of physical activity", icon: '🏃', category: "physical", frequency: "daily" },
  { id: "sleep", title: 'Good Sleep', description: "Get 7-9 hours of quality sleep", icon: "😴", category: "physical", frequency: 'daily' },
  { id: "nutrition", title: "Healthy Meal", description: "Eat nutritious, balanced meals", icon: '🥗', category: "physical", frequency: "daily" },
  { id: 'stretch', title: "Stretch", description: "Take stretching breaks", icon: "🧘", category: 'physical', frequency: "daily" },

  // Mental
  { id: 'meditate', title: "Meditate", description: "10 minutes of mindfulness", icon: "🧘‍♀️", category: 'mental', frequency: "daily" },
  { id: "journal", title: "Journal", description: 'Write down thoughts and feelings', icon: "📓", category: "mental", frequency: "daily" },
  { id: "gratitude", title: "Gratitude Practice", description: "List 3 things you're grateful for", icon: "🙏", category: "mental", frequency: 'daily' },
  { id: 'breathe', title: "Deep Breathing", description: "Practice breathing exercises", icon: "🌬️", category: 'mental', frequency: "daily" },
  { id: "learn", title: 'Learn Something', description: "Read or learn something new", icon: "📚", category: "mental", frequency: 'weekly' },

  // Social
  { id: "connect", title: "Connect with Friend", description: "Reach out to someone you care about", icon: '👥', category: "social", frequency: "weekly" },
  { id: 'family', title: "Family Time", description: "Spend quality time with family", icon: "👨‍👩‍👧‍👦", category: 'social', frequency: "weekly" },
  { id: "help", title: "Help Someone", description: 'Do something kind for others', icon: "🤝", category: "social", frequency: "weekly" },

  // Spiritual
  { id: "nature", title: "Nature Time", description: "Spend time outdoors", icon: '🌳', category: "spiritual", frequency: "weekly" },
  { id: "reflect", title: 'Reflect', description: "Take time for self-reflection", icon: "🌅", category: "spiritual", frequency: 'weekly' },
  { id: "creative", title: "Be Creative", description: 'Express yourself creatively', icon: "🎨", category: "spiritual", frequency: "weekly" },

  // Practical
  { id: 'organize', title: "Organize Space", description: "Clean and organize your environment", icon: "🏠", category: 'practical', frequency: "weekly" },
  { id: "plan", title: 'Plan Ahead', description: "Plan your week or day", icon: "📅", category: "practical", frequency: 'weekly' },
  { id: "boundaries", title: "Set Boundaries", description: "Practice saying no when needed", icon: '🚫', category: "practical", frequency: "monthly" },
  { id: 'checkup', title: "Health Checkup", description: "Schedule regular health appointments", icon: "🏥", category: 'practical', frequency: "monthly" }
];

export const SelfCareReminders: React.FC = () => {
  const [activities, setActivities] = useState<SelfCareActivity[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SelfCareActivity | null>(null);
  const [customTime, setCustomTime] = useState("09:00");
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', "Tue", "Wed", "Thu", 'Fri']);

  useEffect(() => {
    // Load saved activities and reminders
    const savedActivities = localStorage.getItem("selfCareActivities");
    const savedReminders = localStorage.getItem("selfCareReminders");

    if (savedActivities) {
      setActivities(JSON.parse(savedActivities));
    } else {
      setActivities(DEFAULT_ACTIVITIES);
      localStorage.setItem("selfCareActivities", JSON.stringify(DEFAULT_ACTIVITIES));
    }

    if (savedReminders) {
      setReminders(JSON.parse(savedReminders));
    }

    // Check for due reminders every minute
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, "0")}`;
    const currentDay = ["Sun", "Mon", 'Tue', "Wed", "Thu", 'Fri', 'Sat'][now.getDay()];

    reminders.forEach(reminder => {
      if (reminder.enabled && reminder.time === currentTime && reminder.days.includes(currentDay)) {
        const activity = activities.find(a => a.id === reminder.activityId);
        if (activity) {
          showNotification(activity);
        }
      }
    });
  };

  const showNotification = (activity: SelfCareActivity) => {
    if ('Notification' in window && Notification.permission === "granted") {
      new Notification("Self-Care Reminder", {
        body: `${activity.icon} Time for: ${activity.title}\n${activity.description}`,
        icon: '/icon-192.png',
        badge: "/icon-192.png",
        tag: activity.id,
        requireInteraction: true
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showNotification({
          id: "test",
          title: "Notifications Enabled",
          description: "You'll now receive self-care reminders",
          icon: "✅",
          category: "mental",
          frequency: "daily"
        });
      }
    }
  };

  const markActivityComplete = (activityId: string) => {
    const updatedActivities = activities.map(activity => {
      if (activity.id === activityId) {
        const lastDate = activity.lastCompleted ? new Date(activity.lastCompleted) : null;
        const today = new Date().toDateString();
        const isConsecutive = lastDate &&
          new Date(lastDate.getTime() + 86400000).toDateString() === today;

        return {
          ...activity,
          lastCompleted: new Date().toISOString(),
          streak: isConsecutive ? (activity.streak || 0) + 1 : 1
        };
      }
      return activity;
    });
    setActivities(updatedActivities);
    localStorage.setItem('selfCareActivities', JSON.stringify(updatedActivities));
  };

  const addReminder = () => {
    if (!selectedActivity) return;

    const newReminder: Reminder = {
      id: Date.now().toString(),
      activityId: selectedActivity.id,
      time: customTime,
      days: selectedDays,
      enabled: true
    };

    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    localStorage.setItem("selfCareReminders", JSON.stringify(updatedReminders));

    setShowAddReminder(false);
    setSelectedActivity(null);
  };

  const toggleReminder = (reminderId: string) => {
    const updatedReminders = reminders.map(r =>
      r.id === reminderId ? { ...r, enabled: !r.enabled } : r
    );
    setReminders(updatedReminders);
    localStorage.setItem('selfCareReminders', JSON.stringify(updatedReminders));
  };

  const deleteReminder = (reminderId: string) => {
    const updatedReminders = reminders.filter(r => r.id !== reminderId);
    setReminders(updatedReminders);
    localStorage.setItem("selfCareReminders", JSON.stringify(updatedReminders));
  };

  const filteredActivities = selectedCategory === 'all'
    ? activities
    : activities.filter(a => a.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      physical: "#ef4444",
      mental: "#8b5cf6",
      social: "#3b82f6",
      spiritual: '#10b981',
      practical: "#f59e0b"
    };
    return colors[category] || "#6b7280";
  };

  const getDaysAgo = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  return (
    <div className='self-care-reminders'>
      <div className='reminders-header'>
        <h2>Self-Care Activities</h2>
        <button className="notification-btn"
          onClick={requestNotificationPermission}
        >
          🔔 Enable Notifications
        </button>
      </div>

      <div className="category-filters">
        <button className={`filter-btn ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          All
        </button>
        <button className={`filter-btn physical ${selectedCategory === 'physical' ? "active" : ""}`}
          onClick={() => setSelectedCategory("physical")}
        >
          🏃 Physical
        </button>
        <button className={`filter-btn mental ${selectedCategory === "mental" ? "active" : ""}`}
          onClick={() => setSelectedCategory("mental")}
        >
          🧠 Mental
        </button>
        <button className={`filter-btn social ${selectedCategory === "social" ? "active" : ""}`}
          onClick={() => setSelectedCategory("social")}
        >
          👥 Social
        </button>
        <button className={`filter-btn spiritual ${selectedCategory === "spiritual" ? "active" : ""}`}
          onClick={() => setSelectedCategory('spiritual')}
        >
          🌟 Spiritual
        </button>
        <button className={`filter-btn practical ${selectedCategory === "practical" ? "active" : ""}`}
          onClick={() => setSelectedCategory('practical')}
        >
          📋 Practical
        </button>
      </div>

      <div className='activities-grid'>
        {filteredActivities.map(activity => {
          const activityReminders = reminders.filter(r => r.activityId === activity.id);
          const isCompleteToday = activity.lastCompleted &&
            new Date(activity.lastCompleted).toDateString() === new Date().toDateString();

          return (
            <div
              key={activity.id}
              className={`activity-card ${isCompleteToday ? "completed" : ""}`}
              style={{
                borderLeftColor: getCategoryColor(activity.category)
              }}
            >
              <div className="activity-header">
                <span className="activity-icon">{activity.icon}</span>
                <div className='activity-info'>
                  <h3>{activity.title}</h3>
                  <p>{activity.description}</p>
                </div>
                {activity.streak && activity.streak > 1 && (
                  <div className='streak-badge'>
                    🔥 {activity.streak}
                  </div>
                )}
              </div>

              <div className='activity-meta'>
                <span className='frequency-badge'>{activity.frequency}</span>
                <span className="last-completed">
                  Last: {getDaysAgo(activity.lastCompleted)}
                </span>
              </div>

              <div className="activity-actions">
                <button className="complete-btn"
                  onClick={() => markActivityComplete(activity.id)}
                  disabled={!!isCompleteToday}
                >
                  {isCompleteToday ? "✅ Done Today" : "⭕ Mark Complete"}
                </button>
                <button className="reminder-btn"
                  onClick={() => {
                    setSelectedActivity(activity);
                    setShowAddReminder(true);
                  }}
                >
                  ⏰ {activityReminders.length > 0 ? `${activityReminders.length} Reminder${activityReminders.length > 1 ? "s" : ""}` : "Add Reminder"}
                </button>
              </div>

              {activityReminders.length > 0 && (
                <div className="reminder-list">
                  {activityReminders.map(reminder => (
                    <div key={reminder.id} className="reminder-item">
                      <span className="reminder-time">{reminder.time}</span>
                      <span className="reminder-days">{reminder.days.join(", ")}</span>
                      <div className="reminder-controls">
                        <button className={`toggle-btn ${reminder.enabled ? "enabled" : ""}`}
                          onClick={() => toggleReminder(reminder.id)}
                        >
                          {reminder.enabled ? "🔔" : "🔕"}
                        </button>
                        <button className='delete-btn'
                          onClick={() => deleteReminder(reminder.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAddReminder && selectedActivity && (
        <div className="reminder-modal">
          <div className='modal-content'>
            <h3>Set Reminder for {selectedActivity.title}</h3>

            <div className="form-group">
              <label>Time</label>
              <input type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Days</label>
              <div className="days-selector">
                {['Sun', "Mon", "Tue", "Wed", 'Thu', "Fri", "Sat"].map(day => (
                  <button
                    key={day}
                    className={`day-btn ${selectedDays.includes(day) ? "selected" : ""}`}
                    onClick={() => {
                      if (selectedDays.includes(day)) {
                        setSelectedDays(selectedDays.filter(d => d !== day));
                      } else {
                        setSelectedDays([...selectedDays, day]);
                      }
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button className='cancel-btn' onClick={() => setShowAddReminder(false)}>
                Cancel
              </button>
              <button className='save-btn' onClick={addReminder}>
                Save Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfCareReminders;