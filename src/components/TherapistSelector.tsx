import React, { useState } from 'react';
import { SparkleIcon } from './icons.dynamic';

interface Therapist {
  id: string;
  name: string;
  avatar: string;
  specialty: string;
  bio: string;
  approach?: string;
  languages?: string[];
  availability?: "always" | "limited";
  tags?: string[];
}

interface TherapistSelectorProps {
  onSelectTherapist: (therapist: Therapist) => void;
  selectedTherapist: Therapist | null;
}

const therapists: Therapist[] = [
  {
    id: "1",
    name: "Dr. Sarah Chen",
    avatar: "👩‍⚕️",
    specialty: "Anxiety & Stress Management",
    bio: "Specializes in helping people manage anxiety and stress through mindfulness and cognitive techniques.",
    approach: "CBT & Mindfulness",
    languages: ["English", "Mandarin"],
    availability: "always",
    tags: ["Anxiety", "Stress", "Mindfulness", "Work-Life Balance"]
  },
  {
    id: "2",
    name: "Dr. Marcus Johnson",
    avatar: "👨‍⚕️",
    specialty: "Depression & Mood Support",
    bio: "Focused on supporting individuals through depression and mood challenges with empathy and understanding.",
    approach: "Person-Centered Therapy",
    languages: ["English"],
    availability: "always",
    tags: ["Depression", "Mood", "Self-Esteem", "Motivation"]
  },
  {
    id: "3",
    name: "Dr. Elena Rodriguez",
    avatar: "👩‍🦰",
    specialty: "Relationship & Social Issues",
    bio: "Helps navigate relationship challenges and social difficulties with practical, compassionate guidance.",
    approach: "Systemic Therapy",
    languages: ["English", "Spanish"],
    availability: "always",
    tags: ["Relationships", "Communication", "Family", "Boundaries"]
  },
  {
    id: "4",
    name: "Dr. Aisha Patel",
    avatar: "👩🏽‍⚕️",
    specialty: "Trauma & PTSD Recovery",
    bio: "Experienced in trauma-informed care, helping individuals process and heal from difficult experiences.",
    approach: "EMDR & Somatic Therapy",
    languages: ["English", "Hindi"],
    availability: "always",
    tags: ["Trauma", "PTSD", "Healing", "Safety"]
  },
  {
    id: "5",
    name: "Dr. James Kim",
    avatar: "👨🏻‍⚕️",
    specialty: "LGBTQ+ Support & Identity",
    bio: "Provides affirming support for LGBTQ+ individuals navigating identity, relationships, and acceptance.",
    approach: "Affirmative Therapy",
    languages: ["English", "Korean"],
    availability: "always",
    tags: ["LGBTQ+", "Identity", "Coming Out", "Acceptance"]
  }
];

export const TherapistSelector: React.FC<TherapistSelectorProps> = ({ 
  onSelectTherapist,
  selectedTherapist 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Get all unique tags
  const allTags = Array.from(new Set(therapists.flatMap(t => t.tags || [])));

  // Filter therapists based on search and tag
  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = searchTerm === "" ||
      therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      therapist.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (therapist.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesTag = !selectedTag || therapist.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <>
      <style>{`
        .therapist-selector {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .therapist-selector-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .therapist-selector-header h2 {
          font-size: 2rem;
          margin-bottom: 0.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .therapist-selector-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        .therapist-search {
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          padding: 1rem;
          border: 2px solid var(--border-color);
          border-radius: 12px;
          font-size: 1rem;
          background: var(--bg-secondary);
          color: var(--text-primary);
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .therapist-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 2rem;
        }

        .tag-filter {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .tag-filter:hover {
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }

        .tag-filter.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .therapist-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .therapist-card {
          background: var(--card-bg);
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 2px solid transparent;
          position: relative;
          overflow: hidden;
        }

        .therapist-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f27121, #e94057);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .therapist-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          border-color: var(--accent-primary);
        }

        .therapist-card:hover::before {
          opacity: 1;
        }

        .therapist-card.selected {
          border-color: var(--accent-primary);
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
        }

        .therapist-card.selected::before {
          opacity: 1;
        }

        .therapist-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 1rem;
        }

        .therapist-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
          position: relative;
        }

        .therapist-emoji {
          font-size: 2rem;
        }

        .availability-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 16px;
          height: 16px;
          background: #10b981;
          border-radius: 50%;
          border: 2px solid var(--card-bg);
        }

        .therapist-info {
          flex: 1;
        }

        .therapist-info h3 {
          margin: 0 0 0.25rem 0;
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .therapist-specialty {
          color: var(--accent-primary);
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 0.5rem;
        }

        .therapist-bio {
          color: var(--text-secondary);
          line-height: 1.5;
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }

        .therapist-approach {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .therapist-languages {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.75rem;
        }

        .language-badge {
          padding: 0.25rem 0.5rem;
          background: rgba(102, 126, 234, 0.1);
          color: var(--accent-primary);
          border-radius: 8px;
          font-size: 0.8rem;
        }

        .therapist-tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .therapist-tag {
          padding: 0.25rem 0.75rem;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          border-radius: 12px;
          font-size: 0.8rem;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .no-results h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .therapist-list {
            grid-template-columns: 1fr;
          }

          .therapist-selector-header h2 {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="therapist-selector">
        <div className="therapist-selector-header">
          <h2>Choose Your AI Companion</h2>
          <p>Select a specialized AI therapist that matches your current needs</p>
        </div>

        <div className="therapist-search">
          <input 
            type="text"
            className="search-input"
            placeholder="Search by name, specialty, or concern..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="therapist-tags">
          <button 
            className={`tag-filter ${!selectedTag ? "active" : ""}`}
            onClick={() => setSelectedTag(null)}
          >
            All Specialties
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              className={`tag-filter ${selectedTag === tag ? "active" : ""}`}
              onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="therapist-list">
          {filteredTherapists.length > 0 ? (
            filteredTherapists.map((therapist) => (
              <div
                key={therapist.id}
                className={`therapist-card ${selectedTherapist?.id === therapist.id ? "selected" : ""}`}
                onClick={() => onSelectTherapist(therapist)}
              >
                <div className="therapist-card-header">
                  <div className="therapist-avatar">
                    <span className="therapist-emoji">{therapist.avatar}</span>
                    {therapist.availability === "always" && <div className="availability-badge" />}
                  </div>
                  <div className="therapist-info">
                    <h3>{therapist.name}</h3>
                    <div className="therapist-specialty">{therapist.specialty}</div>
                  </div>
                </div>

                <p className="therapist-bio">{therapist.bio}</p>

                {therapist.approach && (
                  <div className="therapist-approach">
                    <SparkleIcon />
                    <span>{therapist.approach}</span>
                  </div>
                )}

                {therapist.languages && (
                  <div className="therapist-languages">
                    {therapist.languages.map(lang => (
                      <span key={lang} className="language-badge">{lang}</span>
                    ))}
                  </div>
                )}

                {therapist.tags && (
                  <div className="therapist-tags-list">
                    {therapist.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="therapist-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <h3>No therapists found</h3>
              <p>Try adjusting your search or filters to find the right companion for you.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default TherapistSelector;