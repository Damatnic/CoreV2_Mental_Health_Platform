import React, { useState } from 'react';
import { Users, Award, Calendar, MessageCircle, Star } from 'lucide-react';
import '../../styles/MentorshipProgram.css';

interface Mentor {
  id: string;
  name: string;
  specialties: string[];
  experience: string;
  rating: number;
  availability: 'available' | 'busy' | 'offline';
  bio: string;
}

const MentorshipProgram: React.FC = () => {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [userRole, setUserRole] = useState<'mentee' | 'mentor' | null>(null);

  const mentors: Mentor[] = [
    {
      id: '1',
      name: 'Dr. Sarah Chen',
      specialties: ['Anxiety', 'Depression', 'Mindfulness'],
      experience: '10+ years',
      rating: 4.8,
      availability: 'available',
      bio: 'Specialized in cognitive behavioral therapy and mindfulness practices.'
    },
    {
      id: '2',
      name: 'Michael Rivera',
      specialties: ['Trauma Recovery', 'PTSD', 'Peer Support'],
      experience: '5+ years',
      rating: 4.9,
      availability: 'available',
      bio: 'Lived experience advocate focusing on trauma-informed peer support.'
    },
    {
      id: '3',
      name: 'Emma Thompson',
      specialties: ['Youth Support', 'Family Dynamics', 'School Stress'],
      experience: '7+ years',
      rating: 4.7,
      availability: 'busy',
      bio: 'Dedicated to supporting young adults through life transitions.'
    }
  ];

  const handleConnect = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    console.log('Connecting with mentor:', mentor.name);
  };

  const renderRoleSelection = () => (
    <div className="role-selection">
      <h2>Join Our Mentorship Program</h2>
      <p>Choose your role to get started</p>
      <div className="role-cards">
        <div 
          className="role-card"
          onClick={() => setUserRole('mentee')}
        >
          <Users size={48} />
          <h3>Become a Mentee</h3>
          <p>Connect with experienced mentors for guidance and support</p>
        </div>
        <div 
          className="role-card"
          onClick={() => setUserRole('mentor')}
        >
          <Award size={48} />
          <h3>Become a Mentor</h3>
          <p>Share your experience and help others on their journey</p>
        </div>
      </div>
    </div>
  );

  const renderMentorList = () => (
    <div className="mentorship-program">
      <div className="program-header">
        <Users size={24} />
        <div>
          <h2>Find Your Mentor</h2>
          <p>Connect with experienced guides on your wellness journey</p>
        </div>
      </div>

      <div className="mentors-grid">
        {mentors.map(mentor => (
          <div key={mentor.id} className="mentor-card">
            <div className="mentor-header">
              <div className="mentor-avatar">
                {mentor.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="mentor-info">
                <h3>{mentor.name}</h3>
                <span className="experience">{mentor.experience}</span>
              </div>
              <span className={`availability ${mentor.availability}`}>
                {mentor.availability}
              </span>
            </div>

            <p className="mentor-bio">{mentor.bio}</p>

            <div className="mentor-specialties">
              {mentor.specialties.map(specialty => (
                <span key={specialty} className="specialty-tag">
                  {specialty}
                </span>
              ))}
            </div>

            <div className="mentor-footer">
              <div className="mentor-rating">
                <Star size={16} fill="currentColor" />
                <span>{mentor.rating}</span>
              </div>
              <button
                className="connect-btn"
                onClick={() => handleConnect(mentor)}
                disabled={mentor.availability === 'offline'}
              >
                <MessageCircle size={16} />
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedMentor && (
        <div className="connection-modal">
          <div className="modal-content">
            <h3>Connecting with {selectedMentor.name}</h3>
            <p>Your request has been sent. {selectedMentor.name} will respond within 24 hours.</p>
            <div className="modal-actions">
              <button onClick={() => setSelectedMentor(null)}>Close</button>
              <button className="primary">
                <Calendar size={16} />
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderMentorApplication = () => (
    <div className="mentor-application">
      <h2>Become a Mentor</h2>
      <p>Share your experience and make a difference</p>
      <form>
        <div className="form-group">
          <label>Areas of Expertise</label>
          <textarea 
            placeholder="What areas can you provide guidance in?"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>Your Experience</label>
          <textarea 
            placeholder="Tell us about your journey and qualifications"
            rows={4}
          />
        </div>
        <div className="form-group">
          <label>Availability</label>
          <select>
            <option>1-2 hours per week</option>
            <option>3-5 hours per week</option>
            <option>5+ hours per week</option>
          </select>
        </div>
        <button type="submit" className="submit-btn">
          Submit Application
        </button>
      </form>
    </div>
  );

  if (!userRole) {
    return renderRoleSelection();
  }

  if (userRole === 'mentor') {
    return renderMentorApplication();
  }

  return renderMentorList();
};

export default MentorshipProgram;
