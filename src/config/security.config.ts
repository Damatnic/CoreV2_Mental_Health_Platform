/**
 * Security Configuration for CoreV2 Mental Health Platform
 * HIPAA-compliant security settings and configurations
 */

export interface SecurityConfig {
  environment: 'development' | 'staging' | 'production';
  encryption: {
    algorithm: string;
    keySize: number;
    keyRotationDays: number;
  };
  session: {
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    httpOnly: boolean;
  };
  cors: {
    enabled: boolean;
    origins: string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
  };
  contentSecurityPolicy: {
    enabled: boolean;
    directives: Record<string, string[]>;
  };
  audit: {
    enabled: boolean;
    logAllRequests: boolean;
    retentionDays: number;
  };
}

export const securityConfig: SecurityConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  
  encryption: {
    algorithm: 'AES-256-GCM',
    keySize: 256,
    keyRotationDays: 90
  },

  session: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true
  },

  cors: {
    enabled: true,
    origins: process.env.NODE_ENV === 'production' 
      ? ['https://corev2-mental-health.netlify.app']
      : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === 'production' ? 100 : 1000,
    skipSuccessfulRequests: false
  },

  contentSecurityPolicy: {
    enabled: process.env.NODE_ENV === 'production',
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"], // Remove unsafe-inline in production
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'connect-src': ["'self'", 'https://api.openai.com'],
      'font-src': ["'self'", 'https://fonts.googleapis.com'],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    }
  },

  audit: {
    enabled: true,
    logAllRequests: process.env.NODE_ENV !== 'development',
    retentionDays: 2555 // 7 years for HIPAA compliance
  }
};

// Environment-specific configurations
export const getSecurityConfig = (env: string): SecurityConfig => {
  const config = { ...securityConfig };
  config.environment = env as any;

  switch (env) {
    case 'development':
      config.session.secure = false;
      config.rateLimit.maxRequests = 10000;
      config.contentSecurityPolicy.enabled = false;
      config.audit.logAllRequests = false;
      break;

    case 'production':
      config.contentSecurityPolicy.directives['script-src'] = ["'self'"];
      config.rateLimit.maxRequests = 100;
      config.cors.origins = ['https://corev2-mental-health.netlify.app'];
      break;
  }

  return config;
};

export default securityConfig;
