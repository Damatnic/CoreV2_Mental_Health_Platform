import { jest } from '@jest/globals';

// Mock Twilio message responses
export const mockTwilioMessages = {
  sms: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    api_version: '2010-04-01',
    body: 'Crisis support message: You are not alone. Call 988 for immediate help.',
    date_created: new Date().toISOString(),
    date_sent: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    direction: 'outbound-api',
    error_code: null,
    error_message: null,
    from: '+15551234567',
    messaging_service_sid: null,
    num_media: '0',
    num_segments: '1',
    price: '-0.0075',
    price_unit: 'USD',
    sid: 'SM123456789abcdef123456789abcdef',
    status: 'sent',
    subresource_uris: {},
    to: '+15559876543',
    uri: '/2010-04-01/Accounts/AC123/Messages/SM123.json'
  },
  
  crisis_alert: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    api_version: '2010-04-01',
    body: 'CRISIS ALERT: Your loved one may need immediate support. Contact them or call 988 for crisis intervention.',
    date_created: new Date().toISOString(),
    date_sent: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    direction: 'outbound-api',
    error_code: null,
    error_message: null,
    from: '+15551234567',
    messaging_service_sid: null,
    num_media: '0',
    num_segments: '1',
    price: '-0.0075',
    price_unit: 'USD',
    sid: 'SM789012345abcdef789012345abcdef',
    status: 'sent',
    subresource_uris: {},
    to: '+15559876543',
    uri: '/2010-04-01/Accounts/AC123/Messages/SM789.json'
  },
  
  mms: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    api_version: '2010-04-01',
    body: 'Here are some coping strategies to help you through this difficult time.',
    date_created: new Date().toISOString(),
    date_sent: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    direction: 'outbound-api',
    error_code: null,
    error_message: null,
    from: '+15551234567',
    messaging_service_sid: null,
    num_media: '1',
    num_segments: '1',
    price: '-0.0200',
    price_unit: 'USD',
    sid: 'MM456789012abcdef456789012abcdef',
    status: 'sent',
    subresource_uris: {
      media: '/2010-04-01/Accounts/AC123/Messages/MM456/Media.json'
    },
    to: '+15559876543',
    uri: '/2010-04-01/Accounts/AC123/Messages/MM456.json'
  }
};

// Mock phone call responses
export const mockTwilioCalls = {
  crisis_call: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    api_version: '2010-04-01',
    caller_name: null,
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    direction: 'outbound-api',
    duration: null,
    end_time: null,
    forwarded_from: null,
    from: '+15551234567',
    from_formatted: '(555) 123-4567',
    group_sid: null,
    parent_call_sid: null,
    phone_number_sid: 'PN123456789abcdef123456789abcdef',
    price: null,
    price_unit: 'USD',
    sid: 'CA123456789abcdef123456789abcdef',
    start_time: new Date().toISOString(),
    status: 'initiated',
    subresource_uris: {},
    to: '+19880000988', // 988 crisis line
    to_formatted: '(988) 000-0988',
    uri: '/2010-04-01/Accounts/AC123/Calls/CA123.json'
  },
  
  emergency_call: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    api_version: '2010-04-01',
    caller_name: null,
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    direction: 'outbound-api',
    duration: null,
    end_time: null,
    forwarded_from: null,
    from: '+15551234567',
    from_formatted: '(555) 123-4567',
    group_sid: null,
    parent_call_sid: null,
    phone_number_sid: 'PN789012345abcdef789012345abcdef',
    price: null,
    price_unit: 'USD',
    sid: 'CA789012345abcdef789012345abcdef',
    start_time: new Date().toISOString(),
    status: 'initiated',
    subresource_uris: {},
    to: '+19110000911', // 911 emergency
    to_formatted: '911',
    uri: '/2010-04-01/Accounts/AC123/Calls/CA789.json'
  }
};

// Mock conversation service responses
export const mockTwilioConversations = {
  conversation: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    chat_service_sid: 'IS123456789abcdef123456789abcdef',
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    friendly_name: 'Crisis Support Chat',
    sid: 'CH123456789abcdef123456789abcdef',
    state: 'active',
    timers: {},
    unique_name: 'crisis-chat-user123',
    uri: '/v1/Conversations/CH123',
    attributes: JSON.stringify({
      crisis_level: 'high',
      user_id: 'user-123',
      counselor_assigned: true
    })
  },
  
  participant: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    conversation_sid: 'CH123456789abcdef123456789abcdef',
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    identity: 'crisis-user-123',
    messaging_binding: {
      type: 'sms',
      address: '+15559876543'
    },
    role_sid: null,
    sid: 'MB123456789abcdef123456789abcdef',
    uri: '/v1/Conversations/CH123/Participants/MB123',
    attributes: JSON.stringify({
      user_type: 'client',
      crisis_level: 'high'
    })
  },
  
  message: {
    account_sid: 'AC123456789abcdef123456789abcdef',
    author: 'crisis-counselor-456',
    body: 'I understand you\'re going through a difficult time. You\'re not alone, and I\'m here to help.',
    conversation_sid: 'CH123456789abcdef123456789abcdef',
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    delivery: null,
    index: 0,
    participant_sid: 'MB123456789abcdef123456789abcdef',
    sid: 'IM123456789abcdef123456789abcdef',
    uri: '/v1/Conversations/CH123/Messages/IM123',
    attributes: JSON.stringify({
      message_type: 'support',
      priority: 'high'
    })
  }
};

// Mock Twilio client
export const mockTwilioClient = {
  messages: {
    create: jest.fn().mockImplementation(({ body, from, to, mediaUrl }) => {
      if (body.toLowerCase().includes('crisis')) {
        return Promise.resolve({
          ...mockTwilioMessages.crisis_alert,
          body,
          from,
          to
        });
      } else if (mediaUrl) {
        return Promise.resolve({
          ...mockTwilioMessages.mms,
          body,
          from,
          to
        });
      }
      return Promise.resolve({
        ...mockTwilioMessages.sms,
        body,
        from,
        to
      });
    }),
    
    list: jest.fn().mockResolvedValue([
      mockTwilioMessages.sms,
      mockTwilioMessages.crisis_alert
    ]),
    
    get: jest.fn().mockImplementation((sid) => ({
      fetch: jest.fn().mockResolvedValue(mockTwilioMessages.sms)
    }))
  },
  
  calls: {
    create: jest.fn().mockImplementation(({ from, to, twiml, url }) => {
      if (to.includes('988') || to.includes('9880000988')) {
        return Promise.resolve({
          ...mockTwilioCalls.crisis_call,
          from,
          to
        });
      } else if (to.includes('911')) {
        return Promise.resolve({
          ...mockTwilioCalls.emergency_call,
          from,
          to
        });
      }
      
      return Promise.resolve({
        ...mockTwilioCalls.crisis_call,
        from,
        to,
        status: 'initiated'
      });
    }),
    
    list: jest.fn().mockResolvedValue([
      mockTwilioCalls.crisis_call,
      mockTwilioCalls.emergency_call
    ]),
    
    get: jest.fn().mockImplementation((sid) => ({
      fetch: jest.fn().mockResolvedValue(mockTwilioCalls.crisis_call),
      update: jest.fn().mockImplementation((params) => {
        return Promise.resolve({
          ...mockTwilioCalls.crisis_call,
          ...params
        });
      })
    }))
  },
  
  conversations: {
    v1: {
      conversations: {
        create: jest.fn().mockImplementation(({ friendlyName, uniqueName, attributes }) => {
          return Promise.resolve({
            ...mockTwilioConversations.conversation,
            friendly_name: friendlyName,
            unique_name: uniqueName,
            attributes: attributes
          });
        }),
        
        list: jest.fn().mockResolvedValue([mockTwilioConversations.conversation]),
        
        get: jest.fn().mockImplementation((sid) => ({
          fetch: jest.fn().mockResolvedValue(mockTwilioConversations.conversation),
          
          participants: {
            create: jest.fn().mockImplementation(({ identity, messagingBindingAddress }) => {
              return Promise.resolve({
                ...mockTwilioConversations.participant,
                identity,
                messaging_binding: {
                  type: 'sms',
                  address: messagingBindingAddress
                }
              });
            }),
            list: jest.fn().mockResolvedValue([mockTwilioConversations.participant])
          },
          
          messages: {
            create: jest.fn().mockImplementation(({ author, body, attributes }) => {
              return Promise.resolve({
                ...mockTwilioConversations.message,
                author,
                body,
                attributes
              });
            }),
            list: jest.fn().mockResolvedValue([mockTwilioConversations.message])
          }
        }))
      }
    }
  },
  
  // Programmable Voice
  twiml: {
    VoiceResponse: jest.fn().mockImplementation(() => ({
      say: jest.fn().mockReturnThis(),
      dial: jest.fn().mockReturnThis(),
      record: jest.fn().mockReturnThis(),
      hangup: jest.fn().mockReturnThis(),
      toString: jest.fn().mockReturnValue('<Response><Say>Hello</Say></Response>')
    }))
  },
  
  // Verify service for 2FA
  verify: {
    v2: {
      services: {
        get: jest.fn().mockImplementation((serviceSid) => ({
          verifications: {
            create: jest.fn().mockImplementation(({ to, channel }) => {
              return Promise.resolve({
                sid: 'VE123456789abcdef123456789abcdef',
                account_sid: 'AC123456789abcdef123456789abcdef',
                service_sid: serviceSid,
                to,
                channel,
                status: 'pending',
                valid: false,
                date_created: new Date().toISOString(),
                date_updated: new Date().toISOString()
              });
            })
          },
          
          verificationChecks: {
            create: jest.fn().mockImplementation(({ to, code }) => {
              const isValidCode = code === '123456' || code === '988988';
              return Promise.resolve({
                sid: 'VE789012345abcdef789012345abcdef',
                account_sid: 'AC123456789abcdef123456789abcdef',
                service_sid: serviceSid,
                to,
                channel: 'sms',
                status: isValidCode ? 'approved' : 'denied',
                valid: isValidCode,
                date_created: new Date().toISOString(),
                date_updated: new Date().toISOString()
              });
            })
          }
        }))
      }
    }
  }
};

// Mock error scenarios
export const mockTwilioErrors = {
  invalidPhoneNumber: {
    status: 400,
    message: 'The \'To\' number is not a valid phone number.',
    code: 21211,
    moreInfo: 'https://www.twilio.com/docs/errors/21211'
  },
  
  unverifiedPhoneNumber: {
    status: 400,
    message: 'The number is unverified. Trial accounts cannot send messages to unverified numbers.',
    code: 21608,
    moreInfo: 'https://www.twilio.com/docs/errors/21608'
  },
  
  insufficientBalance: {
    status: 400,
    message: 'Insufficient balance to send message.',
    code: 21606,
    moreInfo: 'https://www.twilio.com/docs/errors/21606'
  },
  
  rateLimitExceeded: {
    status: 429,
    message: 'Too many requests',
    code: 20429,
    moreInfo: 'https://www.twilio.com/docs/errors/20429'
  },
  
  messageDeliveryFailed: {
    status: 400,
    message: 'Message delivery failed',
    code: 30003,
    moreInfo: 'https://www.twilio.com/docs/errors/30003'
  }
};

// Mock webhook signatures and validation
export const mockTwilioWebhooks = {
  validateRequest: jest.fn().mockImplementation((authToken, twilioSignature, url, params) => {
    // Always validate as true for testing
    return true;
  }),
  
  webhook: jest.fn().mockImplementation((options = {}) => {
    return (req: any, res: any, next: any) => {
      // Mock middleware that always passes validation
      req.body = req.body || {};
      next();
    };
  }),
  
  mockIncomingMessage: {
    MessageSid: 'SM123456789abcdef123456789abcdef',
    AccountSid: 'AC123456789abcdef123456789abcdef',
    From: '+15559876543',
    To: '+15551234567',
    Body: 'I need help, feeling very depressed',
    NumMedia: '0',
    NumSegments: '1',
    MessageStatus: 'received',
    ApiVersion: '2010-04-01'
  },
  
  mockCallStatus: {
    CallSid: 'CA123456789abcdef123456789abcdef',
    AccountSid: 'AC123456789abcdef123456789abcdef',
    From: '+15559876543',
    To: '+19880000988',
    CallStatus: 'completed',
    CallDuration: '180',
    Direction: 'outbound-api',
    ApiVersion: '2010-04-01'
  }
};

// Crisis-specific Twilio helpers
export const mockCrisisHelpers = {
  sendCrisisAlert: jest.fn().mockImplementation(({ to, crisisLevel, userId }) => {
    const body = crisisLevel === 'critical' 
      ? 'URGENT: Crisis alert for your loved one. Please call them immediately or contact emergency services.'
      : 'Crisis support alert: Your loved one may need support. Please reach out when possible.';
      
    return mockTwilioClient.messages.create({
      body,
      from: '+15551234567',
      to
    });
  }),
  
  initiate988Call: jest.fn().mockImplementation(({ userPhone, crisisContext }) => {
    return mockTwilioClient.calls.create({
      from: userPhone,
      to: '+9880000988',
      twiml: '<Response><Say>Connecting you to 988 Crisis Lifeline</Say><Dial>988</Dial></Response>'
    });
  }),
  
  create988ConferenceCall: jest.fn().mockImplementation(({ userPhone, counselorPhone }) => {
    return Promise.resolve({
      conferenceSid: 'CF123456789abcdef123456789abcdef',
      userCallSid: 'CA123456789abcdef123456789abcdef',
      counselorCallSid: 'CA789012345abcdef789012345abcdef',
      status: 'initiated'
    });
  }),
  
  sendWellnessCheckSMS: jest.fn().mockImplementation(({ to, userName }) => {
    return mockTwilioClient.messages.create({
      body: `Hi ${userName}, this is a wellness check from your mental health support team. How are you feeling today? Reply GOOD, OK, or HELP.`,
      from: '+15551234567',
      to
    });
  })
};

export default {
  Twilio: jest.fn().mockImplementation(() => mockTwilioClient),
  mockMessages: mockTwilioMessages,
  mockCalls: mockTwilioCalls,
  mockConversations: mockTwilioConversations,
  mockErrors: mockTwilioErrors,
  mockWebhooks: mockTwilioWebhooks,
  mockCrisisHelpers
};