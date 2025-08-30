import React, { useState, Suspense, lazy } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { logger } from '../utils/logger';

// Lazy load professional components
const ProfessionalDashboardComplete = lazy(() => import('../components/professional/ProfessionalDashboardComplete'));
const LoadingSpinner = lazy(() => import('../components/LoadingSpinner'));

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  rating: number;
  availability: string;
  languages: string[];
  insuranceAccepted: string[];
  sessionRate: string;
  bio: string;
  credentials: string[];
  yearsOfExperience: number;
  approaches: string[];
}

const ProfessionalView: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [showProfessionalDashboard, setShowProfessionalDashboard] = useState(false);

  const therapists: Therapist[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialization: 'Anxiety & Depression',
      rating: 4.9,
      availability: 'Available Today',
      languages: ['English', 'Spanish'],
      insuranceAccepted: ['BlueCross', 'Aetna', 'UnitedHealth'],
      sessionRate: '$120-180/session',
      bio: 'Specializing in cognitive behavioral therapy with 15 years of experience helping clients overcome anxiety and depression.',
      credentials: ['PhD Psychology', 'Licensed Clinical Psychologist'],
      yearsOfExperience: 15,
      approaches: ['CBT', 'DBT', 'Mindfulness-Based Therapy']
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialization: 'Trauma & PTSD',
      rating: 4.8,
      availability: 'Next Available: Tomorrow',
      languages: ['English', 'Mandarin'],
      insuranceAccepted: ['Cigna', 'Humana', 'Kaiser'],
      sessionRate: '$150-200/session',
      bio: 'Expert in trauma-informed care and EMDR therapy, helping clients heal from past experiences.',
      credentials: ['MD Psychiatry', 'EMDR Certified'],
      yearsOfExperience: 12,
      approaches: ['EMDR', 'Trauma-Focused CBT', 'Somatic Therapy']
    },
    {
      id: '3',
      name: 'Lisa Martinez, LMFT',
      specialization: 'Relationships & Family',
      rating: 4.7,
      availability: 'Available This Week',
      languages: ['English', 'Portuguese'],
      insuranceAccepted: ['Anthem', 'Molina', 'Medicare'],
      sessionRate: '$100-150/session',
      bio: 'Helping individuals and families build stronger, healthier relationships through evidence-based approaches.',
      credentials: ['MA Marriage & Family Therapy', 'LMFT'],
      yearsOfExperience: 8,
      approaches: ['EFT', 'Gottman Method', 'Family Systems']
    }
  ];

  const handleBookSession = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowBookingModal(true);
    logger.info('Booking session initiated', { therapistId: therapist.id, userId: user?.id }, 'ProfessionalView');
  };

  const handleFilterChange = (specialization: string) => {
    setFilterSpecialization(specialization);
    logger.info('Filter changed', { specialization }, 'ProfessionalView');
  };

  const filteredTherapists = filterSpecialization === 'all' 
    ? therapists 
    : therapists.filter(t => t.specialization.toLowerCase().includes(filterSpecialization.toLowerCase()));

  // Check if user is a professional
  const isProfessional = user?.role === 'therapist' || user?.role === 'professional';

  return (
    <div className="professional-view">
      <div className="professional-header">
        <h1>Professional Support</h1>
        <p>Connect with licensed mental health professionals</p>
        {isProfessional && (
          <button 
            className="dashboard-toggle"
            onClick={() => setShowProfessionalDashboard(!showProfessionalDashboard)}
            aria-label="Toggle professional dashboard"
          >
            {showProfessionalDashboard ? 'Client View' : 'Professional Dashboard'}
          </button>
        )}
      </div>

      {/* Professional Dashboard for Therapists */}
      {showProfessionalDashboard && isProfessional && (
        <div className="professional-dashboard-container">
          <Suspense fallback={<LoadingSpinner message="Loading professional dashboard..." />}>
            <ProfessionalDashboardComplete 
              professionalId={user?.id || ''}
              onClientSelect={(clientId) => logger.info('Client selected', { clientId }, 'ProfessionalView')}
            />
          </Suspense>
        </div>
      )}

      {/* Client View */}
      {!showProfessionalDashboard && (
        <>
          <div className="filter-section">
            <h3>Find Your Therapist</h3>
            <div className="filter-buttons">
              <button 
                className={filterSpecialization === 'all' ? 'active' : ''}
                onClick={() => handleFilterChange('all')}
              >
                All Specializations
              </button>
              <button 
                className={filterSpecialization === 'anxiety' ? 'active' : ''}
                onClick={() => handleFilterChange('anxiety')}
              >
                Anxiety & Depression
              </button>
              <button 
                className={filterSpecialization === 'trauma' ? 'active' : ''}
                onClick={() => handleFilterChange('trauma')}
              >
                Trauma & PTSD
              </button>
              <button 
                className={filterSpecialization === 'relationships' ? 'active' : ''}
                onClick={() => handleFilterChange('relationships')}
              >
                Relationships
              </button>
            </div>
          </div>

          <div className="therapists-grid">
            {filteredTherapists.map((therapist) => (
              <div key={therapist.id} className="therapist-card">
                <div className="therapist-header">
                  <h3>{therapist.name}</h3>
                  <span className="rating">⭐ {therapist.rating}</span>
                </div>
                <div className="therapist-info">
                  <p className="specialization">{therapist.specialization}</p>
                  <p className="credentials">{therapist.credentials.join(', ')}</p>
                  <p className="experience">{therapist.yearsOfExperience} years experience</p>
                  <p className="bio">{therapist.bio}</p>
                  <div className="therapist-details">
                    <p><strong>Languages:</strong> {therapist.languages.join(', ')}</p>
                    <p><strong>Approaches:</strong> {therapist.approaches.join(', ')}</p>
                    <p><strong>Insurance:</strong> {therapist.insuranceAccepted.join(', ')}</p>
                    <p><strong>Rate:</strong> {therapist.sessionRate}</p>
                    <p className="availability">{therapist.availability}</p>
                  </div>
                </div>
                <div className="therapist-actions">
                  <button 
                    className="book-button"
                    onClick={() => handleBookSession(therapist)}
                    aria-label={`Book session with ${therapist.name}`}
                  >
                    Book Session
                  </button>
                  <button 
                    className="profile-button"
                    onClick={() => logger.info('View profile', { therapistId: therapist.id }, 'ProfessionalView')}
                    aria-label={`View ${therapist.name}'s profile`}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Modal */}
          {showBookingModal && selectedTherapist && (
            <div className="booking-modal-overlay">
              <div className="booking-modal">
                <h2>Book Session with {selectedTherapist.name}</h2>
                <p>Select your preferred date and time:</p>
                <div className="booking-form">
                  <input type="date" min={new Date().toISOString().split('T')[0]} />
                  <select>
                    <option>9:00 AM</option>
                    <option>10:00 AM</option>
                    <option>11:00 AM</option>
                    <option>2:00 PM</option>
                    <option>3:00 PM</option>
                    <option>4:00 PM</option>
                  </select>
                  <textarea placeholder="Brief description of what you'd like to discuss (optional)" />
                  <div className="modal-actions">
                    <button 
                      className="confirm-button"
                      onClick={() => {
                        logger.info('Session booked', { therapistId: selectedTherapist.id }, 'ProfessionalView');
                        setShowBookingModal(false);
                      }}
                    >
                      Confirm Booking
                    </button>
                    <button 
                      className="cancel-button"
                      onClick={() => setShowBookingModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="professional-notice">
        <p><strong>Note:</strong> All therapists are licensed and verified. Sessions are confidential and HIPAA-compliant.</p>
      </div>

      <div className="crisis-notice">
        <p>Need immediate help? Crisis Support: <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
      </div>
    </div>
  );
};

export default ProfessionalView;