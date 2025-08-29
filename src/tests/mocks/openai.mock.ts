import { jest } from '@jest/globals';

// Mock OpenAI API responses
export const mockOpenAIResponses = {
  chatCompletion: {
    id: 'chatcmpl-mock123',
    object: 'chat.completion',
    created: 1677652288,
    model: 'gpt-4',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'I understand you\'re going through a difficult time. It\'s important to know that you\'re not alone and that help is available. Would you like to talk about what\'s troubling you?'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 56,
      completion_tokens: 31,
      total_tokens: 87
    }
  },
  
  crisisDetectionCompletion: {
    id: 'chatcmpl-crisis456',
    object: 'chat.completion',
    created: 1677652300,
    model: 'gpt-4',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          riskLevel: 'high',
          confidence: 0.85,
          triggers: ['suicidal_ideation', 'hopelessness'],
          immediateAction: 'connect_988',
          reasoning: 'User expressed direct suicidal thoughts with specific plan details'
        })
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 120,
      completion_tokens: 45,
      total_tokens: 165
    }
  },
  
  therapeuticResponse: {
    id: 'chatcmpl-therapy789',
    object: 'chat.completion',
    created: 1677652315,
    model: 'gpt-4',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: 'It sounds like you\'re experiencing anxiety about your upcoming presentation. This is completely normal. Let\'s try a grounding exercise: Can you name 5 things you can see around you right now?'
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 75,
      completion_tokens: 38,
      total_tokens: 113
    }
  },

  moodAnalysis: {
    id: 'chatcmpl-mood101',
    object: 'chat.completion',
    created: 1677652330,
    model: 'gpt-4',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          sentiment: 'negative',
          emotions: ['sadness', 'anxiety', 'overwhelm'],
          intensity: 7,
          themes: ['work_stress', 'relationship_concerns'],
          recommendations: [
            'Consider talking to a counselor about work stress',
            'Practice stress-reduction techniques like deep breathing',
            'Reach out to supportive friends or family'
          ]
        })
      },
      finish_reason: 'stop'
    }],
    usage: {
      prompt_tokens: 95,
      completion_tokens: 52,
      total_tokens: 147
    }
  }
};

// Mock OpenAI client
export const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn()
        .mockImplementation(({ messages, model, temperature, max_tokens }) => {
          // Simulate different responses based on input
          const lastMessage = messages[messages.length - 1];
          const content = lastMessage?.content?.toLowerCase() || '';
          
          if (content.includes('crisis') || content.includes('suicide') || content.includes('kill myself')) {
            return Promise.resolve(mockOpenAIResponses.crisisDetectionCompletion);
          }
          
          if (content.includes('anxiety') || content.includes('panic') || content.includes('worried')) {
            return Promise.resolve(mockOpenAIResponses.therapeuticResponse);
          }
          
          if (content.includes('mood') || content.includes('feeling')) {
            return Promise.resolve(mockOpenAIResponses.moodAnalysis);
          }
          
          return Promise.resolve(mockOpenAIResponses.chatCompletion);
        })
    }
  },
  
  moderations: {
    create: jest.fn()
      .mockImplementation(({ input }) => {
        const content = input.toLowerCase();
        const flagged = content.includes('violence') || content.includes('harm');
        
        return Promise.resolve({
          id: 'modr-mock123',
          model: 'text-moderation-007',
          results: [{
            flagged,
            categories: {
              hate: false,
              'hate/threatening': false,
              harassment: false,
              'harassment/threatening': false,
              'self-harm': content.includes('harm'),
              'self-harm/intent': content.includes('suicide'),
              'self-harm/instructions': false,
              sexual: false,
              'sexual/minors': false,
              violence: content.includes('violence'),
              'violence/graphic': false
            },
            category_scores: {
              hate: 0.001,
              'hate/threatening': 0.001,
              harassment: 0.002,
              'harassment/threatening': 0.001,
              'self-harm': content.includes('harm') ? 0.85 : 0.001,
              'self-harm/intent': content.includes('suicide') ? 0.95 : 0.001,
              'self-harm/instructions': 0.001,
              sexual: 0.001,
              'sexual/minors': 0.001,
              violence: content.includes('violence') ? 0.75 : 0.002,
              'violence/graphic': 0.001
            }
          }]
        });
      })
  }
};

// Mock error scenarios
export const mockOpenAIErrors = {
  rateLimited: {
    error: {
      message: 'Rate limit reached',
      type: 'requests',
      param: null,
      code: 'rate_limit_exceeded'
    }
  },
  
  invalidRequest: {
    error: {
      message: 'Invalid request',
      type: 'invalid_request_error',
      param: 'messages',
      code: null
    }
  },
  
  serviceUnavailable: {
    error: {
      message: 'Service temporarily unavailable',
      type: 'server_error',
      param: null,
      code: 'service_unavailable'
    }
  }
};

// Mock streaming responses
export const mockStreamingResponse = async function* () {
  const chunks = [
    'I understand',
    ' you\'re going through',
    ' a difficult time.',
    ' It\'s important to know',
    ' that you\'re not alone.',
    ' Help is available.'
  ];
  
  for (const chunk of chunks) {
    yield {
      id: 'chatcmpl-stream123',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: 'gpt-4',
      choices: [{
        index: 0,
        delta: { content: chunk },
        finish_reason: null
      }]
    };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  // Final chunk
  yield {
    id: 'chatcmpl-stream123',
    object: 'chat.completion.chunk',
    created: Date.now(),
    model: 'gpt-4',
    choices: [{
      index: 0,
      delta: {},
      finish_reason: 'stop'
    }]
  };
};

// Export default mock
export default {
  OpenAI: jest.fn().mockImplementation(() => mockOpenAIClient),
  mockResponses: mockOpenAIResponses,
  mockErrors: mockOpenAIErrors,
  mockStreaming: mockStreamingResponse
};