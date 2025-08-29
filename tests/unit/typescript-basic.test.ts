// Basic TypeScript test to validate ts-jest configuration
describe('TypeScript Jest Configuration', () => {
  test('should handle TypeScript syntax', () => {
    const value: string = 'test';
    expect(value).toBe('test');
  });

  test('should handle interfaces', () => {
    interface TestInterface {
      id: number;
      name: string;
    }

    const testObject: TestInterface = {
      id: 1,
      name: 'test'
    };

    expect(testObject.id).toBe(1);
    expect(testObject.name).toBe('test');
  });

  test('should handle arrow functions with types', () => {
    const add = (a: number, b: number): number => a + b;
    expect(add(2, 3)).toBe(5);
  });
});