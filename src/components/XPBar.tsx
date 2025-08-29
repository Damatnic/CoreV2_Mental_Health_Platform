import React from 'react';

interface XPBarProps {
  currentXp: number;
  nextLevelXp: number;
  level: number;
}

export const XPBar: React.FC<XPBarProps> = ({ 
  currentXp = 0, 
  nextLevelXp = 0, 
  level = 1 
}) => {
  const safeCurrentXp = currentXp ?? 0;
  const safeNextLevelXp = nextLevelXp ?? 0;
  const safeLevel = level ?? 1;
  const progressPercentage = safeNextLevelXp > 0 ? (safeCurrentXp / safeNextLevelXp) * 100 : 0;

  return (
    <div className="xp-bar-container">
      <div 
        className="xp-bar-text" 
        style={{
          position: 'static',
          padding: 0,
          mixBlendMode: 'normal',
          color: 'var(--text-secondary)'
        }}
      >
        <span>Level {safeLevel}</span>
        <span>{safeCurrentXp.toLocaleString()} / {safeNextLevelXp.toLocaleString()} XP</span>
      </div>
      <div className="xp-bar" title={`Level ${safeLevel} Progress`}>
        <div 
          className="xp-bar-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};