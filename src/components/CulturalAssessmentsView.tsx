import React, { useState } from 'react';
import { Globe, BookOpen, Users, Heart, ChevronRight } from 'lucide-react';
import '../styles/CulturalAssessmentsView.css';

interface CulturalContext {
  id: string;
  culture: string;
  region: string;
  languages: string[];
  considerations: string[];
  resources: string[];
}

interface Assessment {
  id: string;
  title: string;
  culturalAdaptations: string[];
  completed: boolean;
  score?: number;
}

const CulturalAssessmentsView: React.FC = () => {
  const [selectedCulture, setSelectedCulture] = useState<string>('');
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  
  const cultures: CulturalContext[] = [
    {
      id: '1',
      culture: 'East Asian',
      region: 'Asia Pacific',
      languages: ['Chinese', 'Japanese', 'Korean'],
      considerations: [
        'Emphasis on family harmony',
        'Indirect communication style',
        'Mental health stigma considerations'
      ],
      resources: [
        'Culturally adapted CBT materials',
        'Family-inclusive therapy approaches'
      ]
    },
    {
      id: '2',
      culture: 'Latino/Hispanic',
      region: 'Americas',
      languages: ['Spanish', 'Portuguese'],
      considerations: [
        'Familismo (family-centeredness)',
        'Respeto in therapeutic relationship',
        'Integration of spiritual beliefs'
      ],
      resources: [
        'Bilingual support materials',
        'Community-based interventions'
      ]
    },
    {
      id: '3',
      culture: 'Middle Eastern',
      region: 'MENA',
      languages: ['Arabic', 'Farsi', 'Hebrew'],
      considerations: [
        'Religious and spiritual integration',
        'Gender-specific preferences',
        'Extended family involvement'
      ],
      resources: [
        'Faith-integrated counseling',
        'Gender-matched therapists'
      ]
    }
  ];

  const handleCultureSelect = (cultureId: string) => {
    setSelectedCulture(cultureId);
    // Load culture-specific assessments
    setAssessments([
      {
        id: '1',
        title: 'Cultural Identity Scale',
        culturalAdaptations: ['Language preferences', 'Cultural values alignment'],
        completed: false
      },
      {
        id: '2',
        title: 'Acculturation Stress Assessment',
        culturalAdaptations: ['Migration history', 'Cultural conflict areas'],
        completed: false
      },
      {
        id: '3',
        title: 'Family Dynamics Questionnaire',
        culturalAdaptations: ['Extended family roles', 'Intergenerational patterns'],
        completed: false
      }
    ]);
  };

  const startAssessment = (assessmentId: string) => {
    console.log('Starting assessment:', assessmentId);
    // Navigate to assessment
  };

  const selectedCultureData = cultures.find(c => c.id === selectedCulture);

  return (
    <div className="cultural-assessments-view">
      <div className="view-header">
        <Globe size={24} />
        <div>
          <h2>Cultural Assessments</h2>
          <p>Culturally-sensitive mental health evaluations</p>
        </div>
      </div>

      {!selectedCulture ? (
        <div className="culture-selection">
          <h3>Select Your Cultural Background</h3>
          <p>This helps us provide more relevant and culturally-appropriate support</p>
          
          <div className="culture-cards">
            {cultures.map(culture => (
              <div
                key={culture.id}
                className="culture-card"
                onClick={() => handleCultureSelect(culture.id)}
              >
                <div className="culture-header">
                  <Users size={20} />
                  <h4>{culture.culture}</h4>
                </div>
                <p className="culture-region">{culture.region}</p>
                <div className="culture-languages">
                  {culture.languages.slice(0, 2).map(lang => (
                    <span key={lang} className="language-tag">{lang}</span>
                  ))}
                  {culture.languages.length > 2 && (
                    <span className="language-tag">+{culture.languages.length - 2}</span>
                  )}
                </div>
                <ChevronRight className="culture-arrow" size={20} />
              </div>
            ))}
          </div>

          <button className="other-culture-btn">
            <Globe size={20} />
            Other Cultural Background
          </button>
        </div>
      ) : (
        <div className="assessment-section">
          <button
            className="back-btn"
            onClick={() => setSelectedCulture('')}
          >
            ← Change Selection
          </button>

          <div className="selected-culture-info">
            <h3>{selectedCultureData?.culture} Context</h3>
            
            <div className="info-section">
              <h4><BookOpen size={18} /> Cultural Considerations</h4>
              <ul>
                {selectedCultureData?.considerations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="info-section">
              <h4><Heart size={18} /> Available Resources</h4>
              <ul>
                {selectedCultureData?.resources.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="assessments-list">
            <h3>Recommended Assessments</h3>
            {assessments.map(assessment => (
              <div key={assessment.id} className="assessment-card">
                <div className="assessment-info">
                  <h4>{assessment.title}</h4>
                  <p className="adaptations">
                    Adapted for: {assessment.culturalAdaptations.join(', ')}
                  </p>
                </div>
                <button
                  className="start-btn"
                  onClick={() => startAssessment(assessment.id)}
                >
                  {assessment.completed ? 'Review' : 'Start'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cultural-note">
        <p>
          All assessments are adapted to respect cultural values and communication styles.
          Your cultural identity is valued and integrated into your care.
        </p>
      </div>
    </div>
  );
};

export default CulturalAssessmentsView;
