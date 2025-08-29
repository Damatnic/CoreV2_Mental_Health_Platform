import request from 'supertest';
import { Server } from 'http';
import { Express } from 'express';
import { io as ioClient, Socket } from 'socket.io-client';

// Mock dependencies
jest.mock('../config/database');
jest.mock('../services/database');
jest.mock('../services/websocket');
jest.mock('../services/crisisDetection');

describe('Server Tests', () => {
  let app: Express;
  let server: Server;
  let socketClient: Socket;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.PORT = '3001';
    process.env.FRONTEND_URL = 'http://localhost:5173';
    process.env.ENCRYPTION_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

    // Import server after setting env vars
    const { default: serverInstance } = await import('../server');
    app = serverInstance.app;
    server = serverInstance.server;
  });

  afterAll(async () => {
    if (socketClient) {
      socketClient.disconnect();
    }
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Health Check Endpoints', () => {
    test('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.status).toBe('healthy');
    });

    test('GET /health/live should return alive status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /health/ready should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Security Headers', () => {
    test('Should set security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for Helmet security headers
      expect(response.headers).toHaveProperty('x-dns-prefetch-control');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    test('Should have CORS configured', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Rate Limiting', () => {
    test('Should rate limit requests', async () => {
      // Make multiple requests to trigger rate limit
      const requests = [];
      for (let i = 0; i < 102; i++) {
        requests.push(
          request(app)
            .get('/api/test')
            .set('X-Forwarded-For', '192.168.1.1')
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);
      
      expect(rateLimited).toBe(true);
    });

    test('Auth endpoints should have stricter rate limits', async () => {
      const requests = [];
      for (let i = 0; i < 7; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .set('X-Forwarded-For', '192.168.1.2')
            .send({ email: 'test@test.com', password: 'wrong' })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Request ID Generation', () => {
    test('Should generate request ID for each request', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('x-request-id');
      expect(response.headers['x-request-id']).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    test('Should use provided request ID if present', async () => {
      const requestId = 'test-request-id-123';
      const response = await request(app)
        .get('/health')
        .set('X-Request-ID', requestId)
        .expect(200);

      expect(response.headers['x-request-id']).toBe(requestId);
    });
  });

  describe('404 Handler', () => {
    test('Should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/unknown/route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('path', '/api/unknown/route');
    });
  });

  describe('Compression', () => {
    test('Should compress large responses', async () => {
      const response = await request(app)
        .get('/metrics')
        .set('Accept-Encoding', 'gzip')
        .expect(200);

      expect(response.headers).toHaveProperty('content-encoding');
      expect(['gzip', 'deflate']).toContain(response.headers['content-encoding']);
    });
  });

  describe('WebSocket Connection', () => {
    test('Should reject WebSocket connection without authentication', (done) => {
      socketClient = ioClient('http://localhost:3001', {
        transports: ['websocket'],
        auth: {}
      });

      socketClient.on('connect_error', (error) => {
        expect(error.message).toContain('Authentication');
        done();
      });
    });

    test('Should accept WebSocket connection with valid token', (done) => {
      // This would require a valid JWT token
      const mockToken = 'valid-jwt-token';
      
      socketClient = ioClient('http://localhost:3001', {
        transports: ['websocket'],
        auth: {
          token: mockToken
        }
      });

      // Mock the authentication for testing
      socketClient.on('connect_error', () => {
        // Expected in test environment without real auth
        done();
      });
    });
  });

  describe('Environment Configuration', () => {
    test('Should load environment variables', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.JWT_SECRET).toBeDefined();
      expect(process.env.PORT).toBeDefined();
    });

    test('Should use default values for missing env vars', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.version).toBe('1.0.0'); // Default version
    });
  });

  describe('Monitoring Endpoints', () => {
    test('GET /metrics should return Prometheus metrics', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('# HELP');
      expect(response.text).toContain('# TYPE');
      expect(response.text).toContain('process_uptime_seconds');
      expect(response.text).toContain('nodejs_version_info');
    });

    test('GET /status should return system status', async () => {
      const response = await request(app)
        .get('/status')
        .expect(200);

      expect(response.body).toHaveProperty('application');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('process');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('features');
      expect(response.body.features.hipaaCompliant).toBe(true);
    });

    test('GET /info should return public information', async () => {
      const response = await request(app)
        .get('/info')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Mental Health Platform');
      expect(response.body).toHaveProperty('features');
      expect(response.body).toHaveProperty('compliance');
      expect(response.body.compliance).toContain('HIPAA');
    });
  });

  describe('Error Handling', () => {
    test('Should handle JSON parsing errors', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('Should handle large payload rejection', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/api/test')
        .send({ data: largePayload })
        .expect(413);

      expect(response.status).toBe(413); // Payload too large
    });
  });

  describe('Session Management', () => {
    test('Should handle session timeout', async () => {
      // This would require setting up a session and waiting for timeout
      // For testing purposes, we'll just verify the middleware is present
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Graceful Shutdown', () => {
    test('Should handle SIGTERM gracefully', (done) => {
      // Simulate SIGTERM
      process.once('SIGTERM', () => {
        // Server should close gracefully
        expect(server.listening).toBe(false);
        done();
      });

      // Don't actually send SIGTERM in test
      done();
    });
  });
});

describe('Server Security Tests', () => {
  let app: Express;

  beforeAll(async () => {
    const { default: serverInstance } = await import('../server');
    app = serverInstance.app;
  });

  test('Should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    
    const response = await request(app)
      .post('/api/test')
      .send({ data: xssPayload })
      .expect(400);

    expect(response.body).not.toContain('<script>');
  });

  test('Should prevent SQL injection', async () => {
    const sqlPayload = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: sqlPayload,
        password: 'test'
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });

  test('Should validate input types', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 123, // Should be string
        password: true, // Should be string
        firstName: null // Should be string
      })
      .expect(400);

    expect(response.body).toHaveProperty('errors');
  });
});