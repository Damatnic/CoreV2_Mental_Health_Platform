// Simple Jest setup for node environment testing
console.log('Jest setup loaded for node environment');

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: jest.fn(() => '12345678-1234-1234-1234-123456789abc'),
    getRandomValues: jest.fn((array) => array.map(() => Math.floor(Math.random() * 256))),
  },
  writable: true,
});

// Basic environment setup
process.env.NODE_ENV = 'test';