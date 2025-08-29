import React, { useState, useEffect } from 'react';
import { Users, MessageCircle, Calendar, Lock } from 'lucide-react';
import '../../styles/PeerSupportGroups.css';

interface SupportGroup {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  isPrivate: boolean;
  nextMeeting?: string;
}

const PeerSupportGroups: React.FC = () => {
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load mock groups
    setGroups([
      {
        id: '1',
        name: 'Anxiety Support Circle',
        description: 'Safe space for sharing anxiety experiences',
        memberCount: 45,
        category: 'anxiety',
        isPrivate: false,
        nextMeeting: '2024-02-15T18:00:00'
      },
      {
        id: '2',
        name: 'Depression Recovery',
        description: 'Support for depression journey',
        memberCount: 32,
        category: 'depression',
        isPrivate: false,
        nextMeeting: '2024-02-16T19:00:00'
      },
      {
        id: '3',
        name: 'PTSD Warriors',
        description: 'Private group for PTSD support',
        memberCount: 18,
        category: 'ptsd',
        isPrivate: true
      }
    ]);
  }, []);

  const handleJoinGroup = (groupId: string) => {
    setJoinedGroups(new Set([...joinedGroups, groupId]));
  };

  const filteredGroups = groups.filter(
    g => selectedCategory === 'all' || g.category === selectedCategory
  );

  return (
    <div className="peer-support-groups">
      <div className="header">
        <h2>Peer Support Groups</h2>
        <p>Connect with others on similar journeys</p>
      </div>

      <div className="category-filter">
        <button
          className={selectedCategory === 'all' ? 'active' : ''}
          onClick={() => setSelectedCategory('all')}
        >
          All Groups
        </button>
        <button
          className={selectedCategory === 'anxiety' ? 'active' : ''}
          onClick={() => setSelectedCategory('anxiety')}
        >
          Anxiety
        </button>
        <button
          className={selectedCategory === 'depression' ? 'active' : ''}
          onClick={() => setSelectedCategory('depression')}
        >
          Depression
        </button>
        <button
          className={selectedCategory === 'ptsd' ? 'active' : ''}
          onClick={() => setSelectedCategory('ptsd')}
        >
          PTSD
        </button>
      </div>

      <div className="groups-grid">
        {filteredGroups.map(group => (
          <div key={group.id} className="group-card">
            <div className="group-header">
              <h3>{group.name}</h3>
              {group.isPrivate && <Lock size={16} />}
            </div>
            
            <p className="group-description">{group.description}</p>
            
            <div className="group-stats">
              <span><Users size={16} /> {group.memberCount} members</span>
              {group.nextMeeting && (
                <span><Calendar size={16} /> Next meeting soon</span>
              )}
            </div>

            <button
              className={`join-btn ${joinedGroups.has(group.id) ? 'joined' : ''}`}
              onClick={() => handleJoinGroup(group.id)}
              disabled={joinedGroups.has(group.id)}
            >
              {joinedGroups.has(group.id) ? 'Joined' : 'Join Group'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PeerSupportGroups;
