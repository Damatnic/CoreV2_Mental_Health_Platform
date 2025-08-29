const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Mock database
const assessmentsData = new Map();

// Helper to verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Initialize user assessments
const initUserAssessments = (userId) => {
  if (!assessmentsData.has(userId)) {
    assessmentsData.set(userId, {
      assessments: [],
      recommendations: []
    });
  }
  return assessmentsData.get(userId);
};

// Assessment templates
const ASSESSMENT_TEMPLATES = {
  phq9: {
    id: 'phq9',
    name: 'PHQ-9 Depression Screening',
    description: 'Patient Health Questionnaire for depression severity',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself or that you are a failure',
      'Trouble concentrating on things',
      'Moving or speaking slowly, or being fidgety/restless',
      'Thoughts that you would be better off dead or of hurting yourself'
    ],
    scoring: {
      0: 'Not at all',
      1: 'Several days',
      2: 'More than half the days',
      3: 'Nearly every day'
    }
  },
  gad7: {
    id: 'gad7',
    name: 'GAD-7 Anxiety Screening',
    description: 'Generalized Anxiety Disorder 7-item scale',
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid, as if something awful might happen'
    ],
    scoring: {
      0: 'Not at all',
      1: 'Several days',
      2: 'More than half the days',
      3: 'Nearly every day'
    }
  },
  stress: {
    id: 'stress',
    name: 'Perceived Stress Scale',
    description: 'Measure your current stress levels',
    questions: [
      'How often have you been upset because of something that happened unexpectedly?',
      'How often have you felt unable to control important things in your life?',
      'How often have you felt nervous and stressed?',
      'How often have you felt confident about handling personal problems?',
      'How often have you felt that things were going your way?',
      'How often have you found that you could not cope with all the things you had to do?',
      'How often have you been able to control irritations in your life?',
      'How often have you felt that you were on top of things?',
      'How often have you been angered by things outside of your control?',
      'How often have you felt difficulties were piling up so high you could not overcome them?'
    ],
    scoring: {
      0: 'Never',
      1: 'Almost never',
      2: 'Sometimes',
      3: 'Fairly often',
      4: 'Very often'
    }
  }
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check authentication
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }

  const userId = decoded.userId;
  const userAssessments = initUserAssessments(userId);
  const path = event.path.replace('/.netlify/functions/assessments', '');
  const method = event.httpMethod;

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    switch (true) {
      // Get available assessment templates
      case path === '/templates' && method === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: Object.values(ASSESSMENT_TEMPLATES)
          })
        };
      }

      // Get user's assessment history
      case path === '' && method === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: userAssessments.assessments
          })
        };
      }

      // Submit a new assessment
      case path === '' && method === 'POST': {
        const { assessmentId, answers } = body;
        
        if (!assessmentId || !answers) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing assessment ID or answers' })
          };
        }

        const template = ASSESSMENT_TEMPLATES[assessmentId];
        if (!template) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Assessment template not found' })
          };
        }

        // Calculate score
        const totalScore = answers.reduce((sum, answer) => sum + answer, 0);
        const maxScore = answers.length * (Object.keys(template.scoring).length - 1);
        const percentage = (totalScore / maxScore) * 100;
        
        // Generate interpretation
        const interpretation = getInterpretation(assessmentId, totalScore);
        
        const assessment = {
          id: Date.now().toString(),
          assessmentId,
          assessmentName: template.name,
          timestamp: new Date().toISOString(),
          answers,
          score: totalScore,
          maxScore,
          percentage,
          interpretation,
          recommendations: getRecommendations(assessmentId, totalScore)
        };
        
        userAssessments.assessments.unshift(assessment);
        
        // Keep only last 20 assessments
        if (userAssessments.assessments.length > 20) {
          userAssessments.assessments = userAssessments.assessments.slice(0, 20);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: assessment
          })
        };
      }

      // Get specific assessment result
      case path.startsWith('/') && method === 'GET': {
        const assessmentId = path.substring(1);
        const assessment = userAssessments.assessments.find(a => a.id === assessmentId);
        
        if (!assessment) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Assessment not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: assessment
          })
        };
      }

      // Get recommendations
      case path === '/recommendations' && method === 'GET': {
        const recentAssessments = userAssessments.assessments.slice(0, 3);
        const recommendations = generatePersonalizedRecommendations(recentAssessments);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: recommendations
          })
        };
      }

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not found' })
        };
    }
  } catch (error) {
    console.error('Assessments API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

function getInterpretation(assessmentId, score) {
  switch (assessmentId) {
    case 'phq9':
      if (score <= 4) return { level: 'minimal', message: 'Minimal depression' };
      if (score <= 9) return { level: 'mild', message: 'Mild depression' };
      if (score <= 14) return { level: 'moderate', message: 'Moderate depression' };
      if (score <= 19) return { level: 'moderately-severe', message: 'Moderately severe depression' };
      return { level: 'severe', message: 'Severe depression' };
    
    case 'gad7':
      if (score <= 4) return { level: 'minimal', message: 'Minimal anxiety' };
      if (score <= 9) return { level: 'mild', message: 'Mild anxiety' };
      if (score <= 14) return { level: 'moderate', message: 'Moderate anxiety' };
      return { level: 'severe', message: 'Severe anxiety' };
    
    case 'stress':
      if (score <= 13) return { level: 'low', message: 'Low stress' };
      if (score <= 26) return { level: 'moderate', message: 'Moderate stress' };
      return { level: 'high', message: 'High perceived stress' };
    
    default:
      return { level: 'unknown', message: 'Assessment complete' };
  }
}

function getRecommendations(assessmentId, score) {
  const recommendations = [];
  
  switch (assessmentId) {
    case 'phq9':
      if (score > 9) {
        recommendations.push('Consider speaking with a mental health professional');
        recommendations.push('Try daily mood tracking to identify patterns');
      }
      if (score > 4) {
        recommendations.push('Practice daily self-care activities');
        recommendations.push('Maintain regular sleep schedule');
        recommendations.push('Engage in physical activity');
      }
      recommendations.push('Use breathing exercises for emotional regulation');
      break;
    
    case 'gad7':
      if (score > 9) {
        recommendations.push('Consider anxiety management therapy');
        recommendations.push('Practice grounding techniques daily');
      }
      if (score > 4) {
        recommendations.push('Try meditation or mindfulness exercises');
        recommendations.push('Limit caffeine intake');
        recommendations.push('Use the 5-4-3-2-1 grounding technique');
      }
      recommendations.push('Maintain a worry journal');
      break;
    
    case 'stress':
      if (score > 26) {
        recommendations.push('Seek stress management counseling');
        recommendations.push('Consider major lifestyle changes');
      }
      if (score > 13) {
        recommendations.push('Practice daily relaxation techniques');
        recommendations.push('Set boundaries and learn to say no');
        recommendations.push('Take regular breaks throughout the day');
      }
      recommendations.push('Maintain work-life balance');
      break;
  }
  
  return recommendations;
}

function generatePersonalizedRecommendations(assessments) {
  if (!assessments || assessments.length === 0) {
    return ['Complete an assessment to get personalized recommendations'];
  }
  
  const allRecommendations = new Set();
  
  assessments.forEach(assessment => {
    assessment.recommendations.forEach(rec => allRecommendations.add(rec));
  });
  
  // Add trend-based recommendations
  const latestScores = assessments.map(a => a.percentage);
  if (latestScores.length > 1) {
    const trend = latestScores[0] - latestScores[1];
    if (trend > 10) {
      allRecommendations.add('Your scores are increasing - consider immediate support');
    } else if (trend < -10) {
      allRecommendations.add('Great progress! Keep up your current wellness routine');
    }
  }
  
  return Array.from(allRecommendations);
}