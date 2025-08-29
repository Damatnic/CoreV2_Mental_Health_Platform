import React from 'react';
import { TrendingUpIcon, TagIcon } from './icons.dynamic';
import './TrendingTopics.css';

interface TrendingTopic {
  tag: string;
  count: number;
  trend: "up" | "down" | "stable";
  color: string;
}

interface TrendingTopicsProps {
  topics: TrendingTopic[];
  onTopicClick?: (tag: string) => void;
}

export const TrendingTopics: React.FC<TrendingTopicsProps> = ({ topics, onTopicClick }) => {
  const getTrendIcon = (trend: TrendingTopic["trend"]) => {
    switch (trend) {
      case "up":
        return "📈";
      case "down":
        return "📉";
      case "stable":
        return "➡️";
      default:
        return "➡️";
    }
  };

  return (
    <div className="trending-topics-card">
      <div className="trending-header">
        <h3 className="trending-title">
          <TrendingUpIcon className="trending-icon" />
          Trending Topics
        </h3>
        <span className="trending-subtitle">What the community is discussing</span>
      </div>

      <div className="topics-grid">
        {topics.map((topic, index) => (
          <button
            key={topic.tag}
            className="topic-tag"
            onClick={() => onTopicClick?.(topic.tag)}
            style={{
              animationDelay: `${index * 0.1}s`,
              background: `linear-gradient(135deg, ${topic.color}20 0%, ${topic.color}10 100%)`,
              borderColor: topic.color
            }}
          >
            <div className="topic-content">
              <div className="topic-main">
                <TagIcon className="hashtag-icon" style={{ color: topic.color }} />
                <span className="topic-name">{topic.tag}</span>
              </div>
              <div className="topic-meta">
                <span className="topic-count">{topic.count} posts</span>
                <span className="topic-trend">{getTrendIcon(topic.trend)}</span>
              </div>
            </div>
            <div className="topic-glow" style={{ backgroundColor: topic.color }}></div>
          </button>
        ))}
      </div>

      <div className="topics-footer">
        <p className="topics-insight">
          💡 Join these conversations to connect with others who understand
        </p>
      </div>
    </div>
  );
};