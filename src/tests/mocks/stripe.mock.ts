import { jest } from '@jest/globals';

// Mock Stripe payment methods
export const mockPaymentMethods = {
  card: {
    id: 'pm_1234567890',
    object: 'payment_method',
    type: 'card',
    card: {
      brand: 'visa',
      exp_month: 12,
      exp_year: 2025,
      last4: '4242',
      funding: 'credit'
    },
    created: 1677652288
  },
  
  bank_account: {
    id: 'pm_bank_987654321',
    object: 'payment_method',
    type: 'us_bank_account',
    us_bank_account: {
      account_type: 'checking',
      last4: '6789',
      routing_number: '110000000'
    },
    created: 1677652300
  }
};

// Mock subscription plans
export const mockSubscriptionPlans = {
  therapy_basic: {
    id: 'price_therapy_basic',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    currency: 'usd',
    interval: 'month',
    interval_count: 1,
    unit_amount: 4900, // $49.00
    product: {
      id: 'prod_therapy_basic',
      name: 'Basic Therapy Plan',
      description: 'Monthly therapy sessions with licensed therapists'
    }
  },
  
  therapy_premium: {
    id: 'price_therapy_premium',
    object: 'price',
    active: true,
    billing_scheme: 'per_unit',
    currency: 'usd',
    interval: 'month',
    interval_count: 1,
    unit_amount: 9900, // $99.00
    product: {
      id: 'prod_therapy_premium',
      name: 'Premium Therapy Plan',
      description: 'Unlimited therapy sessions and crisis support'
    }
  }
};

// Mock customers
export const mockCustomers = {
  regular: {
    id: 'cus_regular123',
    object: 'customer',
    email: 'user@example.com',
    name: 'John Doe',
    created: 1677652288,
    default_source: 'pm_1234567890',
    subscriptions: {
      object: 'list',
      data: [{
        id: 'sub_123456',
        object: 'subscription',
        status: 'active',
        current_period_start: 1677652288,
        current_period_end: 1680244288,
        items: {
          data: [{ price: mockSubscriptionPlans.therapy_basic }]
        }
      }]
    }
  },
  
  premium: {
    id: 'cus_premium456',
    object: 'customer',
    email: 'premium@example.com',
    name: 'Jane Smith',
    created: 1677652300,
    subscriptions: {
      object: 'list',
      data: [{
        id: 'sub_789012',
        object: 'subscription',
        status: 'active',
        current_period_start: 1677652300,
        current_period_end: 1680244300,
        items: {
          data: [{ price: mockSubscriptionPlans.therapy_premium }]
        }
      }]
    }
  }
};

// Mock payment intents
export const mockPaymentIntents = {
  successful: {
    id: 'pi_successful123',
    object: 'payment_intent',
    amount: 4900,
    currency: 'usd',
    status: 'succeeded',
    client_secret: 'pi_successful123_secret_123',
    payment_method: 'pm_1234567890',
    metadata: {
      user_id: 'user-123',
      service_type: 'therapy_session'
    }
  },
  
  requires_action: {
    id: 'pi_action456',
    object: 'payment_intent',
    amount: 9900,
    currency: 'usd',
    status: 'requires_action',
    client_secret: 'pi_action456_secret_456',
    next_action: {
      type: 'use_stripe_sdk'
    }
  },
  
  failed: {
    id: 'pi_failed789',
    object: 'payment_intent',
    amount: 4900,
    currency: 'usd',
    status: 'payment_failed',
    client_secret: 'pi_failed789_secret_789',
    last_payment_error: {
      code: 'card_declined',
      message: 'Your card was declined.'
    }
  }
};

// Mock Stripe client
export const mockStripeClient = {
  customers: {
    create: jest.fn().mockImplementation(({ email, name, payment_method }) => {
      return Promise.resolve({
        id: `cus_${Date.now()}`,
        object: 'customer',
        email,
        name,
        created: Date.now(),
        default_source: payment_method
      });
    }),
    
    retrieve: jest.fn().mockImplementation((id) => {
      if (id === 'cus_regular123') {
        return Promise.resolve(mockCustomers.regular);
      } else if (id === 'cus_premium456') {
        return Promise.resolve(mockCustomers.premium);
      }
      throw new Error('Customer not found');
    }),
    
    update: jest.fn().mockImplementation((id, params) => {
      const customer = { ...mockCustomers.regular, ...params };
      return Promise.resolve(customer);
    }),
    
    del: jest.fn().mockResolvedValue({ id: 'cus_deleted', deleted: true })
  },
  
  subscriptions: {
    create: jest.fn().mockImplementation(({ customer, items, metadata }) => {
      return Promise.resolve({
        id: `sub_${Date.now()}`,
        object: 'subscription',
        customer,
        status: 'active',
        current_period_start: Date.now(),
        current_period_end: Date.now() + (30 * 24 * 60 * 60 * 1000),
        items: { data: items },
        metadata
      });
    }),
    
    retrieve: jest.fn().mockImplementation((id) => {
      if (id === 'sub_123456') {
        return Promise.resolve(mockCustomers.regular.subscriptions.data[0]);
      }
      throw new Error('Subscription not found');
    }),
    
    update: jest.fn().mockImplementation((id, params) => {
      const subscription = { ...mockCustomers.regular.subscriptions.data[0], ...params };
      return Promise.resolve(subscription);
    }),
    
    cancel: jest.fn().mockImplementation((id) => {
      return Promise.resolve({
        id,
        status: 'canceled',
        canceled_at: Date.now()
      });
    })
  },
  
  paymentIntents: {
    create: jest.fn().mockImplementation(({ amount, currency, customer, metadata }) => {
      if (amount === 0) {
        throw new Error('Amount must be positive');
      }
      
      return Promise.resolve({
        id: `pi_${Date.now()}`,
        object: 'payment_intent',
        amount,
        currency,
        status: 'requires_payment_method',
        client_secret: `pi_${Date.now()}_secret_${Date.now()}`,
        customer,
        metadata
      });
    }),
    
    confirm: jest.fn().mockImplementation((id, { payment_method }) => {
      if (id === 'pi_failed789') {
        return Promise.resolve(mockPaymentIntents.failed);
      }
      if (payment_method === 'pm_requires_action') {
        return Promise.resolve(mockPaymentIntents.requires_action);
      }
      return Promise.resolve(mockPaymentIntents.successful);
    }),
    
    retrieve: jest.fn().mockImplementation((id) => {
      if (id === 'pi_successful123') {
        return Promise.resolve(mockPaymentIntents.successful);
      }
      if (id === 'pi_failed789') {
        return Promise.resolve(mockPaymentIntents.failed);
      }
      throw new Error('Payment intent not found');
    })
  },
  
  paymentMethods: {
    create: jest.fn().mockImplementation(({ type, card, us_bank_account }) => {
      if (type === 'card') {
        return Promise.resolve({
          ...mockPaymentMethods.card,
          id: `pm_${Date.now()}`,
          card: { ...mockPaymentMethods.card.card, ...card }
        });
      } else if (type === 'us_bank_account') {
        return Promise.resolve({
          ...mockPaymentMethods.bank_account,
          id: `pm_${Date.now()}`,
          us_bank_account: { ...mockPaymentMethods.bank_account.us_bank_account, ...us_bank_account }
        });
      }
    }),
    
    attach: jest.fn().mockImplementation((id, { customer }) => {
      return Promise.resolve({
        ...mockPaymentMethods.card,
        id,
        customer
      });
    }),
    
    detach: jest.fn().mockImplementation((id) => {
      return Promise.resolve({
        ...mockPaymentMethods.card,
        id,
        customer: null
      });
    })
  },
  
  webhookEndpoints: {
    create: jest.fn().mockResolvedValue({
      id: 'we_test123',
      url: 'https://example.com/stripe/webhook',
      enabled_events: ['payment_intent.succeeded', 'payment_intent.payment_failed']
    })
  }
};

// Mock Stripe Elements
export const mockStripeElements = {
  create: jest.fn().mockImplementation((type, options) => {
    const mockElement = {
      mount: jest.fn(),
      unmount: jest.fn(),
      update: jest.fn(),
      focus: jest.fn(),
      blur: jest.fn(),
      clear: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
    
    return mockElement;
  }),
  
  getElement: jest.fn(),
  fetchUpdates: jest.fn().mockResolvedValue({}),
  submit: jest.fn().mockResolvedValue({ error: null })
};

// Mock Stripe instance
export const mockStripe = {
  elements: jest.fn().mockReturnValue(mockStripeElements),
  createToken: jest.fn().mockResolvedValue({
    token: {
      id: 'tok_visa',
      type: 'card',
      card: {
        id: 'card_1234',
        brand: 'visa',
        last4: '4242'
      }
    }
  }),
  createPaymentMethod: jest.fn().mockResolvedValue({
    paymentMethod: mockPaymentMethods.card
  }),
  confirmPayment: jest.fn().mockResolvedValue({
    paymentIntent: mockPaymentIntents.successful
  }),
  retrievePaymentIntent: jest.fn().mockResolvedValue({
    paymentIntent: mockPaymentIntents.successful
  })
};

// Mock error scenarios
export const mockStripeErrors = {
  cardDeclined: {
    type: 'card_error',
    code: 'card_declined',
    message: 'Your card was declined.',
    decline_code: 'generic_decline'
  },
  
  insufficientFunds: {
    type: 'card_error',
    code: 'card_declined',
    message: 'Your card has insufficient funds.',
    decline_code: 'insufficient_funds'
  },
  
  expiredCard: {
    type: 'card_error',
    code: 'expired_card',
    message: 'Your card has expired.'
  },
  
  incorrectCvc: {
    type: 'card_error',
    code: 'incorrect_cvc',
    message: 'Your card\'s security code is incorrect.'
  },
  
  rateLimited: {
    type: 'rate_limit_error',
    message: 'Too many requests made to the API too quickly'
  }
};

// Mock webhook events
export const mockWebhookEvents = {
  paymentSucceeded: {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2020-08-27',
    created: Date.now(),
    type: 'payment_intent.succeeded',
    data: {
      object: mockPaymentIntents.successful
    }
  },
  
  paymentFailed: {
    id: 'evt_test_webhook_2',
    object: 'event',
    api_version: '2020-08-27',
    created: Date.now(),
    type: 'payment_intent.payment_failed',
    data: {
      object: mockPaymentIntents.failed
    }
  },
  
  subscriptionCreated: {
    id: 'evt_test_webhook_3',
    object: 'event',
    api_version: '2020-08-27',
    created: Date.now(),
    type: 'customer.subscription.created',
    data: {
      object: mockCustomers.regular.subscriptions.data[0]
    }
  }
};

export default {
  Stripe: jest.fn().mockImplementation(() => mockStripeClient),
  loadStripe: jest.fn().mockResolvedValue(mockStripe),
  mockCustomers,
  mockPaymentMethods,
  mockPaymentIntents,
  mockSubscriptionPlans,
  mockStripeErrors,
  mockWebhookEvents
};