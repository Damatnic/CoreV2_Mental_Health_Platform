import { Habit, HabitCompletion, TrackedHabit } from '../types';

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export const calculateStreaks = (
  trackedHabits: Habit[],
  completions: HabitCompletion[],
  userId: string
): TrackedHabit[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return trackedHabits.map(habit => {
    // Get unique completion dates for this habit (deduplicate same day completions)
    const habitCompletions = completions
      .filter(c => c.habitId === habit.id)
      .map(c => {
        const date = new Date(c.completedAt);
        date.setHours(0, 0, 0, 0);
        return date;
      });

    // Remove duplicate dates
    const uniqueDates = Array.from(new Set(habitCompletions.map(d => d.getTime())))
      .map(time => new Date(time))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort descending (most recent first)

    if (uniqueDates.length === 0) {
      return {
        userId,
        habitId: habit.id,
        trackedAt: '',
        currentStreak: 0,
        longestStreak: 0,
        isCompletedToday: false
      };
    }

    const isCompletedToday = isSameDay(uniqueDates[0], today);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate current streak starting from most recent completion
    const mostRecent = uniqueDates[0];

    // Current streak only counts if completed today or yesterday
    if (isSameDay(mostRecent, today) || isSameDay(mostRecent, yesterday)) {
      let expectedDate = new Date(today);
      if (!isSameDay(mostRecent, today)) {
        expectedDate = new Date(yesterday);
      }

      for (const completionDate of uniqueDates) {
        if (isSameDay(completionDate, expectedDate)) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak by checking all consecutive sequences
    for (let i = 0; i < uniqueDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const current = uniqueDates[i];
        const previous = uniqueDates[i - 1];
        const daysBetween = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

        if (daysBetween === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return {
      userId,
      habitId: habit.id,
      trackedAt: '',
      currentStreak,
      longestStreak,
      isCompletedToday
    };
  });
};