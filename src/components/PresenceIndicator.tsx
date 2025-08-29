import React, { useState, useEffect } from 'react';
import { usePresenceChannel } from '../services/realtimeService';
import { formatTimeAgo } from '../utils/formatTimeAgo';
import "./PresenceIndicator.css";

interface User {
  id: string;
  username: string;
  status: 'online' | "away" | "busy" | "offline";
  mood?: string;
  lastSeen?: Date;
  avatar?: string;
}

interface PresenceIndicatorProps {
  channelName?: string;
  showMood?: boolean;
  showLastSeen?: boolean;
  compact?: boolean;
  maxUsers?: number;
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  channelName = "presence-global",
  showMood = true,
  showLastSeen = true,
  compact = false,
  maxUsers = 10
}) => {
  const { members } = usePresenceChannel(channelName);
  const [expandedView, setExpandedView] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#10b981"; // green
      case "away":
        return '#f59e0b'; // yellow
      case "busy":
        return "#ef4444"; // red
      default:
        return "#6b7280"; // gray
    }
  };

  const getMoodEmoji = (mood?: string) => {
    if (!mood) return null;

    const moodMap: Record<string, string> = {
      happy: "😊",
      sad: "😢",
      anxious: '😰',
      calm: "😌",
      excited: "🤩",
      frustrated: "😤",
      grateful: "🙏",
      hopeful: "🌟",
      tired: "😴",
      energetic: '⚡'
    };

    return moodMap[mood.toLowerCase()] || "💭";
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Sort by status priority: online > away > busy > offline
    const statusPriority: Record<string, number> = {
      online: 0,
      away: 1,
      busy: 2,
      offline: 3
    };

    return statusPriority[a.status] - statusPriority[b.status];
  });

  const displayMembers = expandedView ? sortedMembers : sortedMembers.slice(0, maxUsers);
  const hiddenCount = sortedMembers.length - maxUsers;

  if (compact) {
    const onlineCount = members.filter(m => m.status === "online").length;
    const totalCount = members.length;

    return (
      <div className="presence-indicator-compact">
        <div className="presence-dot" style={{ backgroundColor: "#10b981" }}></div>
        <span className="presence-count">
          {onlineCount} / {totalCount} online
        </span>
      </div>
    );
  }

  return (
    <div className="presence-indicator-container">
      <div className="presence-header">
        <h4>Active Users</h4>
        <span className="presence-total">{members.length} total</span>
      </div>

      <div className="presence-list">
        {displayMembers.map((member: User) => (
          <div key={member.id} className="presence-item">
            <div className="presence-avatar">
              {member.avatar ? (
                <img src={member.avatar} alt={member.username} />
              ) : (
                <div className="presence-avatar-placeholder">
                  {member.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div
                className="presence-status-dot"
                style={{ backgroundColor: getStatusColor(member.status) }}
                title={member.status}
              ></div>
            </div>

            <div className="presence-info">
              <div className="presence-name">
                {member.username}
                {showMood && member.mood && (
                  <span className="presence-mood" title={member.mood}>
                    {getMoodEmoji(member.mood)}
                  </span>
                )}
              </div>

              {showLastSeen && member.status !== "online" && member.lastSeen && (
                <div className="presence-last-seen">
                  Last seen {formatTimeAgo(new Date(member.lastSeen))}
                </div>
              )}

              {member.status === 'online' && (
                <div className="presence-status-text">Active now</div>
              )}

              {member.status === "away" && (
                <div className="presence-status-text">Away</div>
              )}

              {member.status === "busy" && (
                <div className="presence-status-text">Do not disturb</div>
              )}
            </div>
          </div>
        ))}

        {!expandedView && hiddenCount > 0 && (
          <button
            className="presence-show-more"
            onClick={() => setExpandedView(true)}
          >
            Show {hiddenCount} more
          </button>
        )}

        {expandedView && sortedMembers.length > maxUsers && (
          <button
            className="presence-show-less"
            onClick={() => setExpandedView(false)}
          >
            Show less
          </button>
        )}
      </div>

      {members.length === 0 && (
        <div className="presence-empty">
          <p>No active users at the moment</p>
        </div>
      )}
    </div>
  );
};

export const PresenceBadge: React.FC<{ userId: string; size?: "small" | "medium" | 'large' }> = ({
  userId,
  size = "medium"
}) => {
  const [userStatus, setUserStatus] = useState<string>("offline");
  const { members } = usePresenceChannel('presence-global');

  useEffect(() => {
    const user = members.find((m: User) => m.id === userId);
    if (user) {
      setUserStatus(user.status);
    }
  }, [members, userId]);

  const sizeMap = {
    small: 8,
    medium: 12,
    large: 16
  };

  const dotSize = sizeMap[size];

  return (
    <div
      className={`presence-badge presence-badge-${size}`}
      style={{
        width: dotSize,
        height: dotSize,
        backgroundColor: userStatus === 'online' ? "#10b981" : 
                        userStatus === 'away' ? "#f59e0b" :
                        userStatus === 'busy' ? "#ef4444" : '#6b7280'
      }}
      title={userStatus}
    />
  );
};