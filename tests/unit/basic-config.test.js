// Basic test to validate Jest configuration
describe('Jest Configuration', () => {
  test('should be able to run basic tests', () => {
    expect(true).toBe(true);
  });

  test('should have access to Jest globals', () => {
    expect(jest).toBeDefined();
    expect(expect).toBeDefined();
    expect(describe).toBeDefined();
    expect(test).toBeDefined();
  });

  test('should have mocked crypto', () => {
    expect(global.crypto).toBeDefined();
    expect(typeof global.crypto.randomUUID).toBe('function');
  });

  test('should have test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});