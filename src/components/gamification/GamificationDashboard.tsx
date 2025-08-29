/**
 * Gamification Dashboard Component
 * 
 * A comprehensive dashboard for displaying gamification progress and achievements
 * with mental health-appropriate visualizations and motivational elements.
 */

import React, { useState, useEffect } from 'react';
import { useGamification } from '../../hooks/useGamification';
import AchievementBadge from './AchievementBadge';
import './GamificationDashboard.css';

interface GamificationDashboardProps {
  className?: string;
  compact?: boolean;
  showLeaderboard?: boolean;
}

const GamificationDashboard: React.FC<GamificationDashboardProps> = ({
  className = '',
  compact = false,
  showLeaderboard = true
}) => {
  const {
    level,
    currentXP,
    xpProgress,
    points,
    streakDays,
    isStreakFrozen,
    totalAchievements,
    unlockedAchievements,
    achievementProgress,
    recentAchievement,
    activeChallenges,
    availableChallenges,
    canJoinMoreChallenges,
    nextMilestone,
    milestoneProgress,
    userRank,
    isOnLeaderboard,
    isLoading,
    error,
    hasNotifications,
    unreadNotifications,
    checkIn,
    freezeStreak,
    joinChallenge,
    toggleLeaderboard,
    refreshLeaderboard,
    dismissNotification,
    dailyProgress,
    weeklyStats,
    encouragementMessage,
    nextReward
  } = useGamification();
  
  const [activeTab, setActiveTab] = useState<'progress' | 'achievements' | 'challenges' | 'leaderboard'>('progress');
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [leaderboardType, setLeaderboardType] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [showStreakModal, setShowStreakModal] = useState(false);
  
  // Refresh leaderboard when type changes
  useEffect(() => {
    if (showLeaderboard && activeTab === 'leaderboard') {
      refreshLeaderboard(leaderboardType);
    }
  }, [leaderboardType, activeTab, showLeaderboard, refreshLeaderboard]);
  
  // Handle daily check-in
  const handleCheckIn = async () => {
    try {
      await checkIn();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };
  
  // Handle challenge join
  const handleJoinChallenge = async (challengeId: string) => {
    try {
      const success = await joinChallenge(challengeId);
      if (success) {
        setSelectedChallenge(null);
      }
    } catch (error) {
      console.error('Failed to join challenge:', error);
    }
  };
  
  // Handle streak freeze
  const handleFreezeStreak = async () => {
    try {
      const success = await freezeStreak();
      if (success) {
        setShowStreakModal(false);
      }
    } catch (error) {
      console.error('Failed to freeze streak:', error);
    }
  };
  
  // Render progress visualization
  const renderProgressSection = () => (
    <div className="gamification-progress-section">
      <div className="level-display">
        <div className="level-badge">
          <span className="level-number">{level}</span>
          <span className="level-label">Level</span>
        </div>
        <div className="xp-progress">
          <div className="xp-info">
            <span className="xp-current">{currentXP} XP</span>
            <span className="xp-next">/ {currentXP + (100 - xpProgress)} XP</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill xp-fill"
              style={{ width: `${xpProgress}%` }}
              role="progressbar"
              aria-valuenow={xpProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          {nextReward && (
            <div className="next-reward">{nextReward}</div>
          )}
        </div>
      </div>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-value">
              {streakDays}
              {isStreakFrozen && <span className="frozen-indicator">❄️</span>}
            </div>
            <div className="stat-label">Day Streak</div>
            {!isStreakFrozen && streakDays > 0 && (
              <button 
                className="freeze-streak-btn"
                onClick={() => setShowStreakModal(true)}
                aria-label="Freeze streak for mental health day"
              >
                Protect Streak
              </button>
            )}
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{points}</div>
            <div className="stat-label">Total Points</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{dailyProgress.dailyGoalProgress.toFixed(0)}%</div>
            <div className="stat-label">Daily Goal</div>
            <div className="progress-bar mini">
              <div 
                className="progress-fill daily-fill"
                style={{ width: `${dailyProgress.dailyGoalProgress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{weeklyStats.activeDays}</div>
            <div className="stat-label">Active Days</div>
            <div className="stat-subtitle">This Week</div>
          </div>
        </div>
      </div>
      
      <div className="encouragement-message">
        <p>{encouragementMessage}</p>
        {dailyProgress.activitiesCompleted === 0 && (
          <button 
            className="check-in-btn"
            onClick={handleCheckIn}
            disabled={isLoading}
          >
            Daily Check-In
          </button>
        )}
      </div>
      
      {nextMilestone && (
        <div className="milestone-preview">
          <h4>Next Milestone</h4>
          <div className="milestone-card">
            <div className="milestone-info">
              <span className="milestone-icon">🏆</span>
              <div>
                <div className="milestone-name">{nextMilestone.name}</div>
                <div className="milestone-description">{nextMilestone.description}</div>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill milestone-fill"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
            <div className="milestone-progress-text">
              {milestoneProgress.toFixed(0)}% Complete
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // Render achievements showcase
  const renderAchievementsSection = () => (
    <div className="gamification-achievements-section">
      <div className="achievements-header">
        <h3>Achievements</h3>
        <div className="achievement-stats">
          <span>{unlockedAchievements} / {totalAchievements} Unlocked</span>
          <div className="progress-bar mini">
            <div 
              className="progress-fill achievement-fill"
              style={{ width: `${achievementProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {recentAchievement && (
        <div className="recent-achievement">
          <span className="recent-label">Recently Unlocked:</span>
          <AchievementBadge achievement={recentAchievement} size="medium" showDetails />
        </div>
      )}
      
      <div className="achievements-grid">
        {/* This would map through actual achievements */}
        <div className="achievement-category">
          <h4>Self-Care</h4>
          <div className="badges-row">
            <AchievementBadge 
              achievement={{ 
                id: '1', 
                name: 'First Steps', 
                icon: '👣', 
                unlocked: true 
              }} 
              size="small" 
            />
            <AchievementBadge 
              achievement={{ 
                id: '2', 
                name: 'Week Warrior', 
                icon: '🗓️', 
                unlocked: true 
              }} 
              size="small" 
            />
            <AchievementBadge 
              achievement={{ 
                id: '3', 
                name: 'Mindful Month', 
                icon: '🧘', 
                unlocked: false 
              }} 
              size="small" 
            />
          </div>
        </div>
        
        <div className="achievement-category">
          <h4>Community</h4>
          <div className="badges-row">
            <AchievementBadge 
              achievement={{ 
                id: '4', 
                name: 'Helper', 
                icon: '🤝', 
                unlocked: true 
              }} 
              size="small" 
            />
            <AchievementBadge 
              achievement={{ 
                id: '5', 
                name: 'Support Star', 
                icon: '⭐', 
                unlocked: false 
              }} 
              size="small" 
            />
          </div>
        </div>
        
        <div className="achievement-category">
          <h4>Growth</h4>
          <div className="badges-row">
            <AchievementBadge 
              achievement={{ 
                id: '6', 
                name: 'Resilience', 
                icon: '💪', 
                unlocked: false,
                hidden: true 
              }} 
              size="small" 
            />
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render challenges section
  const renderChallengesSection = () => (
    <div className="gamification-challenges-section">
      <div className="challenges-header">
        <h3>Wellness Challenges</h3>
        <div className="challenge-slots">
          <span>{activeChallenges.length} / 3 Active</span>
        </div>
      </div>
      
      {activeChallenges.length > 0 && (
        <div className="active-challenges">
          <h4>Your Active Challenges</h4>
          <div className="challenges-list">
            {activeChallenges.map(challenge => (
              <div key={challenge.id} className="challenge-card active">
                <div className="challenge-header">
                  <span className="challenge-title">{challenge.title}</span>
                  <span className={`difficulty ${challenge.difficulty}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <p className="challenge-description">{challenge.description}</p>
                <div className="challenge-progress">
                  <div className="progress-info">
                    <span>{challenge.progress} / {challenge.target}</span>
                    <span className="challenge-duration">{challenge.duration}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill challenge-fill"
                      style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="challenge-reward">
                  <span>Reward: {challenge.reward.xp} XP, {challenge.reward.points} Points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {canJoinMoreChallenges && availableChallenges.length > 0 && (
        <div className="available-challenges">
          <h4>Available Challenges</h4>
          <div className="challenges-list">
            {availableChallenges.slice(0, 3).map(challenge => (
              <div key={challenge.id} className="challenge-card available">
                <div className="challenge-header">
                  <span className="challenge-title">{challenge.title}</span>
                  <span className={`difficulty ${challenge.difficulty}`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <p className="challenge-description">{challenge.description}</p>
                <div className="challenge-info">
                  <span className="challenge-target">Goal: {challenge.target}</span>
                  <span className="challenge-duration">{challenge.duration}</span>
                </div>
                <div className="challenge-reward">
                  <span>Reward: {challenge.reward.xp} XP, {challenge.reward.points} Points</span>
                </div>
                <button 
                  className="join-challenge-btn"
                  onClick={() => handleJoinChallenge(challenge.id)}
                  disabled={isLoading}
                >
                  Join Challenge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {!canJoinMoreChallenges && (
        <div className="challenge-limit-message">
          <p>Focus on completing your current challenges before taking on new ones.</p>
        </div>
      )}
    </div>
  );
  
  // Render leaderboard section
  const renderLeaderboardSection = () => (
    <div className="gamification-leaderboard-section">
      <div className="leaderboard-header">
        <h3>Community Progress</h3>
        {!isOnLeaderboard && (
          <button 
            className="opt-in-btn"
            onClick={toggleLeaderboard}
          >
            Join Leaderboard (Anonymous)
          </button>
        )}
      </div>
      
      {isOnLeaderboard && (
        <>
          <div className="leaderboard-tabs">
            <button 
              className={`tab ${leaderboardType === 'weekly' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('weekly')}
            >
              This Week
            </button>
            <button 
              className={`tab ${leaderboardType === 'monthly' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('monthly')}
            >
              This Month
            </button>
            <button 
              className={`tab ${leaderboardType === 'all-time' ? 'active' : ''}`}
              onClick={() => setLeaderboardType('all-time')}
            >
              All Time
            </button>
          </div>
          
          <div className="leaderboard-list">
            {/* This would map through actual leaderboard entries */}
            <div className="leaderboard-entry">
              <span className="rank">1</span>
              <span className="name">Brave Phoenix</span>
              <span className="score">2,450 pts</span>
            </div>
            <div className="leaderboard-entry">
              <span className="rank">2</span>
              <span className="name">Mindful Oak</span>
              <span className="score">2,280 pts</span>
            </div>
            <div className="leaderboard-entry">
              <span className="rank">3</span>
              <span className="name">Gentle Star</span>
              <span className="score">2,150 pts</span>
            </div>
            {userRank && userRank > 3 && (
              <>
                <div className="leaderboard-separator">...</div>
                <div className="leaderboard-entry current-user">
                  <span className="rank">{userRank}</span>
                  <span className="name">You</span>
                  <span className="score">{points} pts</span>
                </div>
              </>
            )}
          </div>
          
          <div className="leaderboard-note">
            <p>All names are anonymous to protect privacy. Focus on your personal growth!</p>
          </div>
        </>
      )}
    </div>
  );
  
  // Streak freeze modal
  const renderStreakModal = () => (
    showStreakModal && (
      <div className="modal-overlay" onClick={() => setShowStreakModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h3>Mental Health Day</h3>
          <p>
            It's okay to take a break. Your streak will be protected for up to 2 days.
            This won't affect your progress - taking care of yourself is part of the journey.
          </p>
          <div className="modal-actions">
            <button 
              className="confirm-btn"
              onClick={handleFreezeStreak}
            >
              Protect My Streak
            </button>
            <button 
              className="cancel-btn"
              onClick={() => setShowStreakModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
  
  if (compact) {
    return (
      <div className={`gamification-dashboard compact ${className}`}>
        <div className="compact-stats">
          <div className="compact-level">
            <span className="level-badge-mini">Lvl {level}</span>
            <div className="xp-bar-mini">
              <div 
                className="xp-fill-mini"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
          <div className="compact-streak">
            <span>🔥 {streakDays}</span>
          </div>
          <div className="compact-points">
            <span>⭐ {points}</span>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`gamification-dashboard ${className}`}>
      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}
      
      <div className="dashboard-header">
        <h2>Your Wellness Journey</h2>
        {hasNotifications && (
          <div className="notification-badge">
            <span>{unreadNotifications}</span>
          </div>
        )}
      </div>
      
      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          Progress
        </button>
        <button 
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          Achievements
        </button>
        <button 
          className={`tab ${activeTab === 'challenges' ? 'active' : ''}`}
          onClick={() => setActiveTab('challenges')}
        >
          Challenges
        </button>
        {showLeaderboard && (
          <button 
            className={`tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Community
          </button>
        )}
      </div>
      
      <div className="dashboard-content">
        {activeTab === 'progress' && renderProgressSection()}
        {activeTab === 'achievements' && renderAchievementsSection()}
        {activeTab === 'challenges' && renderChallengesSection()}
        {activeTab === 'leaderboard' && showLeaderboard && renderLeaderboardSection()}
      </div>
      
      {renderStreakModal()}
    </div>
  );
};

export default GamificationDashboard;