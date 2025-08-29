import React, { useState } from 'react';

interface Assessment {
  id: string;
  title: string;
  description: string;
  duration: string;
  questions: number;
  completed: boolean;
  score?: number;
}

const AssessmentsView: React.FC = () => {
  const [assessments] = useState<Assessment[]>([
    {
      id: 'gad7',
      title: 'GAD-7 Anxiety Assessment',
      description: 'Measure anxiety symptoms',
      duration: '5 minutes',
      questions: 7,
      completed: true,
      score: 8
    },
    {
      id: 'phq9',
      title: 'PHQ-9 Depression Screening',
      description: 'Assess depression severity',
      duration: '5 minutes',
      questions: 9,
      completed: false
    },
    {
      id: 'stress',
      title: 'Stress Assessment',
      description: 'Evaluate stress levels',
      duration: '10 minutes',
      questions: 10,
      completed: true,
      score: 15
    }
  ]);

  const handleStartAssessment = (assessmentId: string) => {
    console.log('Starting assessment:', assessmentId);
  };

  return (
    <div className="assessments-view">
      <div className="assessments-header">
        <h1>Mental Health Assessments</h1>
        <p>Track your mental health with validated screening tools</p>
      </div>

      <div className="assessment-info">
        <div className="info-card">
          <h3>Why Take Assessments?</h3>
          <ul>
            <li>Track your mental health over time</li>
            <li>Identify areas that need attention</li>
            <li>Share results with healthcare providers</li>
          </ul>
        </div>
      </div>

      <div className="assessments-grid">
        {assessments.map((assessment) => (
          <div key={assessment.id} className="assessment-card">
            <div className="assessment-header">
              <h3>{assessment.title}</h3>
              {assessment.completed && <div className="completion-badge">✓</div>}
            </div>

            <p>{assessment.description}</p>

            <div className="assessment-details">
              <span>Duration: {assessment.duration}</span>
              <span>Questions: {assessment.questions}</span>
            </div>

            {assessment.completed && assessment.score && (
              <div className="assessment-score">
                <span>Score: {assessment.score}</span>
              </div>
            )}

            <button 
              className="start-button"
              onClick={() => handleStartAssessment(assessment.id)}
            >
              {assessment.completed ? 'Retake' : 'Start'} Assessment
            </button>
          </div>
        ))}
      </div>

      <div className="assessment-disclaimer">
        <p>
          These are screening tools, not diagnostic instruments. 
          Contact a healthcare professional for proper diagnosis.
        </p>
        <p>Crisis Support: <a href="tel:988">988</a> or <a href="tel:911">911</a></p>
      </div>
    </div>
  );
};

export default AssessmentsView;
