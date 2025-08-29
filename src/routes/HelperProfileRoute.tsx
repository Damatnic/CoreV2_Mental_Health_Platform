import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Star, MessageCircle, Calendar, MapPin, Phone, Mail, Shield, Award, Clock, ArrowLeft } from 'lucide-react';
import { AppButton } from '../components/AppButton';

interface HelperProfile {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  specialties: string[];
  bio: string;
  experience: string;
  credentials: string[];
  rating: number;
  reviewCount: number;
  location: {
    city: string;
    state: string;
    country: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
  availability: {
    isActive: boolean;
    responseTime: string;
    schedule: string;
  };
  languages: string[];
  approaches: string[];
  demographics: string[];
  pricing: {
    consultationFee?: number;
    sessionRate?: number;
    currency: string;
  };
  verification: {
    isVerified: boolean;
    backgroundCheck: boolean;
    licenses: string[];
  };
  stats: {
    sessionsCompleted: number;
    clientsHelped: number;
    yearsExperience: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    date: string;
    clientInitials: string;
  }>;
}

export const HelperProfileRoute: React.FC = () => {
  const { helperId } = useParams<{ helperId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<HelperProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'availability'>('overview');

  useEffect(() => {
    loadHelperProfile();
  }, [helperId]);

  const loadHelperProfile = async () => {
    if (!helperId) {
      setError('Helper ID not provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockProfile: HelperProfile = {
        id: helperId,
        name: 'Dr. Sarah Johnson',
        avatar: 'https://via.placeholder.com/120',
        title: 'Licensed Clinical Therapist',
        specialties: ['Anxiety', 'Depression', 'Trauma', 'Relationship Issues'],
        bio: 'Dr. Sarah Johnson is a compassionate and experienced therapist with over 10 years of experience helping individuals navigate through life\'s challenges. She specializes in cognitive-behavioral therapy and mindfulness-based interventions.',
        experience: '10+ years',
        credentials: ['PhD in Clinical Psychology', 'Licensed Clinical Social Worker (LCSW)', 'Certified in EMDR'],
        rating: 4.8,
        reviewCount: 127,
        location: {
          city: 'Seattle',
          state: 'WA',
          country: 'USA'
        },
        contactInfo: {
          email: 'sarah.johnson@example.com',
          phone: '+1 (555) 123-4567',
          website: 'www.sarahjohnsontherapy.com'
        },
        availability: {
          isActive: true,
          responseTime: 'Within 24 hours',
          schedule: 'Monday - Friday, 9 AM - 6 PM PST'
        },
        languages: ['English', 'Spanish'],
        approaches: ['Cognitive Behavioral Therapy', 'Mindfulness-Based Therapy', 'EMDR', 'Dialectical Behavior Therapy'],
        demographics: ['Adults', 'Young Adults', 'LGBTQ+ Friendly', 'Trauma Survivors'],
        pricing: {
          consultationFee: 150,
          sessionRate: 200,
          currency: 'USD'
        },
        verification: {
          isVerified: true,
          backgroundCheck: true,
          licenses: ['LCSW-WA-12345', 'PhD-Clinical-Psychology']
        },
        stats: {
          sessionsCompleted: 1250,
          clientsHelped: 340,
          yearsExperience: 10
        },
        reviews: [
          {
            id: '1',
            rating: 5,
            comment: 'Dr. Johnson has been incredibly helpful in my healing journey. Her approach is both professional and compassionate.',
            date: '2023-11-15',
            clientInitials: 'M.K.'
          },
          {
            id: '2',
            rating: 5,
            comment: 'Excellent therapist who really listens and provides practical strategies. Highly recommended!',
            date: '2023-11-08',
            clientInitials: 'J.D.'
          },
          {
            id: '3',
            rating: 4,
            comment: 'Very knowledgeable and understanding. Has helped me work through some difficult issues.',
            date: '2023-10-22',
            clientInitials: 'A.S.'
          }
        ]
      };

      setProfile(mockProfile);
    } catch (err) {
      setError('Failed to load helper profile');
      console.error('Profile loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContact = (method: 'message' | 'call' | 'email') => {
    if (!profile) return;

    switch (method) {
      case 'message':
        navigate(`/chat/therapist/${profile.id}`);
        break;
      case 'call':
        if (profile.contactInfo.phone) {
          window.open(`tel:${profile.contactInfo.phone}`);
        }
        break;
      case 'email':
        if (profile.contactInfo.email) {
          window.open(`mailto:${profile.contactInfo.email}`);
        }
        break;
    }
  };

  const handleBookConsultation = () => {
    if (profile) {
      navigate(`/booking/therapist/${profile.id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The helper profile could not be loaded.'}</p>
          <AppButton onClick={() => navigate('/helpers')} variant="primary">
            Back to Helpers
          </AppButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <AppButton
            variant="ghost"
            size="small"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </AppButton>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar and Basic Info */}
            <div className="flex-shrink-0">
              <div className="relative">
                <img
                  src={profile.avatar || 'https://via.placeholder.com/120'}
                  alt={profile.name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
                {profile.verification.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-2">
                    <Shield className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                <div className="mb-4">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  <p className="text-lg text-gray-600 mb-2">{profile.title}</p>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(profile.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-1">
                        {profile.rating} ({profile.reviewCount} reviews)
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {profile.location.city}, {profile.location.state}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${
                      profile.availability.isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-gray-600">
                      {profile.availability.isActive ? 'Available' : 'Unavailable'} • 
                      Responds {profile.availability.responseTime.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.slice(0, 4).map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {profile.specialties.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{profile.specialties.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex flex-col gap-2 md:w-48">
                  <AppButton
                    variant="primary"
                    size="medium"
                    onClick={handleBookConsultation}
                    className="w-full"
                    disabled={!profile.availability.isActive}
                  >
                    Book Consultation
                  </AppButton>
                  
                  <div className="flex gap-2">
                    <AppButton
                      variant="outline"
                      size="small"
                      onClick={() => handleContact('message')}
                      icon={<MessageCircle className="w-4 h-4" />}
                    >
                      Message
                    </AppButton>
                    
                    {profile.contactInfo.phone && (
                      <AppButton
                        variant="outline"
                        size="small"
                        onClick={() => handleContact('call')}
                        icon={<Phone className="w-4 h-4" />}
                      >
                        Call
                      </AppButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'reviews', label: `Reviews (${profile.reviewCount})` },
                { id: 'availability', label: 'Availability' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Bio */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </div>

                {/* Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{profile.stats.yearsExperience}+</div>
                      <div className="text-sm text-gray-600">Years Experience</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{profile.stats.clientsHelped}</div>
                      <div className="text-sm text-gray-600">Clients Helped</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{profile.stats.sessionsCompleted}</div>
                      <div className="text-sm text-gray-600">Sessions</div>
                    </div>
                  </div>
                </div>

                {/* Approaches */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Therapeutic Approaches</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.approaches.map((approach, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full"
                      >
                        {approach}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Demographics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Specializes In</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.demographics.map((demo, index) => (
                      <span
                        key={index}
                        className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full"
                      >
                        {demo}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Credentials */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Credentials & Verification
                  </h3>
                  <div className="space-y-3">
                    {profile.credentials.map((credential, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">{credential}</span>
                      </div>
                    ))}
                    {profile.verification.backgroundCheck && (
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Background Check Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Languages</h3>
                  <div className="flex gap-2">
                    {profile.languages.map((language, index) => (
                      <span
                        key={index}
                        className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Initial Consultation</span>
                      <span className="font-semibold">
                        ${profile.pricing.consultationFee} {profile.pricing.currency}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Session Rate</span>
                      <span className="font-semibold">
                        ${profile.pricing.sessionRate} {profile.pricing.currency}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Client Reviews ({profile.reviewCount})
                </h3>
                
                {profile.reviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-medium text-gray-900">{review.clientInitials}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'availability' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Availability</h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Schedule</div>
                      <div className="text-gray-600">{profile.availability.schedule}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Response Time</div>
                      <div className="text-gray-600">{profile.availability.responseTime}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Ready to get started?</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Book a consultation to discuss your needs and see if Dr. Johnson is the right fit for you.
                  </p>
                  <AppButton
                    variant="primary"
                    onClick={handleBookConsultation}
                    disabled={!profile.availability.isActive}
                  >
                    Book Consultation Now
                  </AppButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelperProfileRoute;