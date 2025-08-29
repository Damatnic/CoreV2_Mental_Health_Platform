import { jest } from '@jest/globals';

// Mock SendGrid email templates
export const mockEmailTemplates = {
  crisis_alert: {
    id: 'd-1234567890abcdef1234567890abcdef',
    name: 'Crisis Alert Template',
    subject: 'URGENT: Crisis Alert for Your Loved One',
    html_content: `
      <div style="color: #dc2626; font-weight: bold;">
        <h1>Crisis Alert</h1>
        <p>Your loved one {{user_name}} may be experiencing a mental health crisis.</p>
        <p><strong>Immediate Actions:</strong></p>
        <ul>
          <li>Call them immediately at {{user_phone}}</li>
          <li>If no response, contact local emergency services</li>
          <li>Crisis support is available 24/7 at 988</li>
        </ul>
      </div>
    `,
    plain_content: 'CRISIS ALERT: Your loved one {{user_name}} may need immediate support. Call {{user_phone}} or contact emergency services.',
    generation: 'dynamic'
  },
  
  wellness_check: {
    id: 'd-abcdef1234567890abcdef1234567890',
    name: 'Wellness Check Template',
    subject: 'How are you doing today?',
    html_content: `
      <div style="color: #059669;">
        <h1>Wellness Check-In</h1>
        <p>Hi {{user_name}},</p>
        <p>This is a friendly check-in from your mental health support team.</p>
        <p>Remember: You are not alone, and support is always available.</p>
        <p><a href="{{app_url}}/mood-tracker">Track your mood</a></p>
        <p><a href="{{app_url}}/crisis-resources">Crisis resources</a></p>
      </div>
    `,
    plain_content: 'Hi {{user_name}}, this is a wellness check from your support team. Remember you are not alone.',
    generation: 'dynamic'
  },
  
  appointment_reminder: {
    id: 'd-567890abcdef1234567890abcdef1234',
    name: 'Therapy Appointment Reminder',
    subject: 'Reminder: Your therapy session is tomorrow',
    html_content: `
      <div>
        <h1>Appointment Reminder</h1>
        <p>Hi {{user_name}},</p>
        <p>You have a therapy session scheduled:</p>
        <div style="background: #f0f9ff; padding: 15px; border-radius: 5px;">
          <p><strong>Date:</strong> {{appointment_date}}</p>
          <p><strong>Time:</strong> {{appointment_time}}</p>
          <p><strong>Therapist:</strong> {{therapist_name}}</p>
          <p><strong>Type:</strong> {{session_type}}</p>
        </div>
        <p><a href="{{join_url}}">Join Video Session</a></p>
      </div>
    `,
    plain_content: 'Appointment reminder: {{appointment_date}} at {{appointment_time}} with {{therapist_name}}',
    generation: 'dynamic'
  }
};

// Mock email responses
export const mockSendGridResponses = {
  success: {
    statusCode: 202,
    body: '',
    headers: {
      'x-message-id': 'msg_1234567890abcdef'
    }
  },
  
  scheduled: {
    statusCode: 202,
    body: '',
    headers: {
      'x-message-id': 'msg_scheduled_123456789'
    }
  },
  
  invalid_email: {
    statusCode: 400,
    body: {
      errors: [{
        message: 'Invalid email address',
        field: 'personalizations.0.to.0.email',
        help: 'Please provide a valid email address'
      }]
    }
  },
  
  rate_limited: {
    statusCode: 429,
    body: {
      errors: [{
        message: 'Rate limit exceeded',
        field: null,
        help: 'Please reduce your sending rate'
      }]
    }
  }
};

// Mock SendGrid client
export const mockSendGridClient = {
  setApiKey: jest.fn(),
  
  send: jest.fn().mockImplementation((msg) => {
    // Simulate different responses based on email content
    if (!msg.to || !msg.to.length) {
      return Promise.reject(mockSendGridResponses.invalid_email);
    }
    
    const email = Array.isArray(msg.to) ? msg.to[0].email : msg.to;
    
    if (email === 'invalid@invalid') {
      return Promise.reject(mockSendGridResponses.invalid_email);
    }
    
    if (email === 'ratelimited@example.com') {
      return Promise.reject(mockSendGridResponses.rate_limited);
    }
    
    return Promise.resolve([mockSendGridResponses.success, {}]);
  }),
  
  sendMultiple: jest.fn().mockImplementation((msgs) => {
    return Promise.resolve(msgs.map(() => [mockSendGridResponses.success, {}]));
  }),
  
  // Template API
  templates: {
    get: jest.fn().mockImplementation((templateId) => {
      const template = Object.values(mockEmailTemplates).find(t => t.id === templateId);
      return Promise.resolve([{ statusCode: 200 }, template]);
    }),
    
    create: jest.fn().mockImplementation((templateData) => {
      return Promise.resolve([
        { statusCode: 201 },
        {
          id: `d-${Date.now()}`,
          name: templateData.name,
          generation: 'dynamic',
          ...templateData
        }
      ]);
    }),
    
    update: jest.fn().mockImplementation((templateId, templateData) => {
      return Promise.resolve([
        { statusCode: 200 },
        {
          id: templateId,
          ...templateData
        }
      ]);
    })
  },
  
  // Contact lists for emergency contacts
  contactdb: {
    lists: {
      get: jest.fn().mockResolvedValue([
        { statusCode: 200 },
        {
          lists: [{
            id: 'list_crisis_contacts',
            name: 'Crisis Emergency Contacts',
            recipient_count: 5
          }]
        }
      ]),
      
      create: jest.fn().mockImplementation((listData) => {
        return Promise.resolve([
          { statusCode: 201 },
          {
            id: `list_${Date.now()}`,
            name: listData.name,
            recipient_count: 0
          }
        ]);
      }),
      
      recipients: {
        post: jest.fn().mockImplementation((listId, recipients) => {
          return Promise.resolve([
            { statusCode: 201 },
            {
              persisted_recipients: recipients.length,
              new_count: recipients.length
            }
          ]);
        })
      }
    },
    
    recipients: {
      get: jest.fn().mockResolvedValue([
        { statusCode: 200 },
        {
          recipients: [
            {
              id: 'recipient_123',
              email: 'emergency1@example.com',
              custom_fields: {
                relationship: 'spouse',
                phone: '+15551234567'
              }
            },
            {
              id: 'recipient_456',
              email: 'emergency2@example.com',
              custom_fields: {
                relationship: 'parent',
                phone: '+15557654321'
              }
            }
          ]
        }
      ])
    }
  },
  
  // Webhook settings
  user: {
    webhooks: {
      event: {
        settings: {
          get: jest.fn().mockResolvedValue([
            { statusCode: 200 },
            {
              enabled: true,
              url: 'https://example.com/sendgrid/webhook',
              group_resubscribe: true,
              delivered: true,
              group_unsubscribe: true,
              spam_report: true,
              bounce: true,
              deferred: true,
              unsubscribe: true,
              processed: true,
              open: true,
              click: true,
              dropped: true
            }
          ]),
          
          patch: jest.fn().mockImplementation((settings) => {
            return Promise.resolve([
              { statusCode: 200 },
              settings
            ]);
          })
        }
      }
    }
  }
};

// Mock webhook events
export const mockWebhookEvents = {
  delivered: {
    event: 'delivered',
    email: 'user@example.com',
    timestamp: 1677652288,
    'smtp-id': '<smtp_id_123@sendgrid.net>',
    sg_event_id: 'event_123456',
    sg_message_id: 'msg_1234567890abcdef.filterId'
  },
  
  opened: {
    event: 'open',
    email: 'user@example.com',
    timestamp: 1677652350,
    'smtp-id': '<smtp_id_123@sendgrid.net>',
    sg_event_id: 'event_789012',
    sg_message_id: 'msg_1234567890abcdef.filterId',
    useragent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
    ip: '192.168.1.1'
  },
  
  clicked: {
    event: 'click',
    email: 'user@example.com',
    timestamp: 1677652400,
    'smtp-id': '<smtp_id_123@sendgrid.net>',
    sg_event_id: 'event_345678',
    sg_message_id: 'msg_1234567890abcdef.filterId',
    useragent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5',
    ip: '192.168.1.1',
    url: 'https://example.com/crisis-resources'
  },
  
  bounced: {
    event: 'bounce',
    email: 'bounced@example.com',
    timestamp: 1677652288,
    'smtp-id': '<smtp_id_456@sendgrid.net>',
    sg_event_id: 'event_bounce123',
    sg_message_id: 'msg_bounce456.filterId',
    reason: 'mail box not found',
    status: '5.1.1',
    type: 'bounce'
  },
  
  dropped: {
    event: 'dropped',
    email: 'invalid@invalid',
    timestamp: 1677652288,
    'smtp-id': '<smtp_id_789@sendgrid.net>',
    sg_event_id: 'event_dropped789',
    sg_message_id: 'msg_dropped012.filterId',
    reason: 'Invalid email address'
  }
};

// Crisis-specific email helpers
export const mockCrisisEmailHelpers = {
  sendCrisisAlert: jest.fn().mockImplementation(async ({
    emergencyContacts,
    userInfo,
    crisisLevel,
    location
  }) => {
    const emails = emergencyContacts.map(contact => ({
      to: contact.email,
      from: 'crisis-alerts@mentalhealthapp.com',
      templateId: mockEmailTemplates.crisis_alert.id,
      dynamicTemplateData: {
        user_name: userInfo.name,
        user_phone: userInfo.phone,
        crisis_level: crisisLevel,
        location: location || 'Unknown',
        timestamp: new Date().toISOString(),
        emergency_number: '988'
      }
    }));
    
    return mockSendGridClient.sendMultiple(emails);
  }),
  
  sendWellnessReminder: jest.fn().mockImplementation(async ({
    userEmail,
    userName,
    appUrl
  }) => {
    return mockSendGridClient.send({
      to: userEmail,
      from: 'support@mentalhealthapp.com',
      templateId: mockEmailTemplates.wellness_check.id,
      dynamicTemplateData: {
        user_name: userName,
        app_url: appUrl
      }
    });
  }),
  
  sendTherapyReminder: jest.fn().mockImplementation(async ({
    userEmail,
    userName,
    appointmentDetails
  }) => {
    return mockSendGridClient.send({
      to: userEmail,
      from: 'appointments@mentalhealthapp.com',
      templateId: mockEmailTemplates.appointment_reminder.id,
      dynamicTemplateData: {
        user_name: userName,
        appointment_date: appointmentDetails.date,
        appointment_time: appointmentDetails.time,
        therapist_name: appointmentDetails.therapist,
        session_type: appointmentDetails.type,
        join_url: appointmentDetails.joinUrl
      }
    });
  }),
  
  sendCrisisFollowUp: jest.fn().mockImplementation(async ({
    userEmail,
    userName,
    crisisDate,
    resources
  }) => {
    return mockSendGridClient.send({
      to: userEmail,
      from: 'followup@mentalhealthapp.com',
      subject: 'Following up on your recent crisis support',
      html: `
        <h1>We're thinking of you</h1>
        <p>Hi ${userName},</p>
        <p>We wanted to follow up after your recent crisis support request on ${crisisDate}.</p>
        <p>Your wellbeing is important to us. Here are some resources that might help:</p>
        <ul>
          ${resources.map(r => `<li><a href="${r.url}">${r.name}</a></li>`).join('')}
        </ul>
        <p>Remember: You are not alone. Support is always available at 988.</p>
      `
    });
  })
};

// Mock email validation and deliverability
export const mockEmailValidation = {
  validate: jest.fn().mockImplementation((email) => {
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const isDeliverable = !email.includes('bounced') && !email.includes('invalid');
    
    return Promise.resolve({
      email,
      valid: isValid,
      deliverable: isDeliverable,
      score: isValid && isDeliverable ? 0.95 : 0.2,
      checks: {
        domain: {
          valid: isValid,
          has_mx_record: isDeliverable
        },
        local: {
          valid: isValid
        },
        spam: {
          score: 0.1
        }
      }
    });
  }),
  
  validateList: jest.fn().mockImplementation((emails) => {
    return Promise.all(emails.map(email => mockEmailValidation.validate(email)));
  })
};

// Mock analytics and reporting
export const mockEmailAnalytics = {
  getStats: jest.fn().mockImplementation(({ start_date, end_date, aggregated_by }) => {
    return Promise.resolve([
      { statusCode: 200 },
      [{
        date: start_date,
        stats: [{
          metrics: {
            blocks: 0,
            bounce_drops: 2,
            bounces: 2,
            clicks: 15,
            deferred: 1,
            delivered: 245,
            invalid_emails: 3,
            opens: 120,
            processed: 250,
            requests: 250,
            spam_report_drops: 0,
            spam_reports: 1,
            unique_clicks: 12,
            unique_opens: 85,
            unsubscribe_drops: 0,
            unsubscribes: 2
          }
        }]
      }]
    ]);
  }),
  
  getCrisisAlertMetrics: jest.fn().mockResolvedValue({
    total_sent: 125,
    delivered: 120,
    opened: 98,
    clicked: 45,
    response_rate: 0.82, // 82% of recipients took action
    average_response_time: 180 // 3 minutes
  })
};

export default {
  SendGrid: jest.fn().mockImplementation(() => mockSendGridClient),
  mockTemplates: mockEmailTemplates,
  mockResponses: mockSendGridResponses,
  mockWebhookEvents,
  mockCrisisHelpers: mockCrisisEmailHelpers,
  mockValidation: mockEmailValidation,
  mockAnalytics: mockEmailAnalytics
};