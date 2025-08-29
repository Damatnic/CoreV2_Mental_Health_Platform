import React, { useState, useEffect } from 'react';
import { Users, Heart, Phone, MessageCircle } from 'lucide-react';
import '../../styles/FamilyTether.css';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  status: 'available' | 'busy' | 'offline';
  canContact: boolean;
}

const FamilyTether: React.FC = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    // Load family members
    setFamilyMembers([
      { id: '1', name: 'Mom', relationship: 'Mother', status: 'available', canContact: true },
      { id: '2', name: 'Dad', relationship: 'Father', status: 'busy', canContact: true },
      { id: '3', name: 'Sarah', relationship: 'Sister', status: 'offline', canContact: false }
    ]);
  }, []);

  const handleContact = (member: FamilyMember, type: 'call' | 'message') => {
    console.log(`Contacting ${member.name} via ${type}`);
  };

  return (
    <div className="family-tether">
      <div className="header">
        <Users size={24} />
        <h2>Family Support Network</h2>
      </div>

      <div className="family-list">
        {familyMembers.map(member => (
          <div key={member.id} className={`member-card status-${member.status}`}>
            <div className="member-info">
              <Heart size={20} />
              <div>
                <h3>{member.name}</h3>
                <p>{member.relationship}</p>
                <span className={`status ${member.status}`}>{member.status}</span>
              </div>
            </div>
            
            {member.canContact && (
              <div className="contact-actions">
                <button onClick={() => handleContact(member, 'call')}>
                  <Phone size={18} />
                </button>
                <button onClick={() => handleContact(member, 'message')}>
                  <MessageCircle size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedMember && (
        <div className="member-details">
          <h3>{selectedMember.name}</h3>
          <p>Last contacted: 2 days ago</p>
        </div>
      )}
    </div>
  );
};

export default FamilyTether;
