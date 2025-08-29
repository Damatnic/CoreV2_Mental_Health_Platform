import { describe, it, expect, jest, beforeEach } from '@jest/globals';

class EnhancedRouter {
  private routes: Map<string, any> = new Map();
  private guards: Map<string, Function[]> = new Map();
  private currentPath: string = '/';

  addRoute(path: string, component: any, guards: Function[] = []) {
    this.routes.set(path, component);
    this.guards.set(path, guards);
  }

  navigate(path: string): boolean {
    const guards = this.guards.get(path) || [];
    
    for (const guard of guards) {
      if (!guard()) {
        return false;
      }
    }
    
    this.currentPath = path;
    return true;
  }

  getCurrentPath(): string {
    return this.currentPath;
  }

  getRoute(path: string) {
    return this.routes.get(path);
  }

  matchRoute(path: string): any {
    // Exact match
    if (this.routes.has(path)) {
      return this.routes.get(path);
    }
    
    // Pattern matching
    for (const [pattern, component] of this.routes) {
      if (this.matchesPattern(path, pattern)) {
        return component;
      }
    }
    
    return null;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    const pathParts = path.split('/');
    const patternParts = pattern.split('/');
    
    if (pathParts.length !== patternParts.length) {
      return false;
    }
    
    for (let i = 0; i < pathParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        continue;
      }
      if (pathParts[i] !== patternParts[i]) {
        return false;
      }
    }
    
    return true;
  }
}

describe('EnhancedRouter', () => {
  let router: EnhancedRouter;

  beforeEach(() => {
    router = new EnhancedRouter();
  });

  it('should add and retrieve routes', () => {
    const component = { name: 'TestComponent' };
    router.addRoute('/test', component);
    
    expect(router.getRoute('/test')).toBe(component);
  });

  it('should navigate to routes', () => {
    router.addRoute('/home', { name: 'Home' });
    
    const result = router.navigate('/home');
    
    expect(result).toBe(true);
    expect(router.getCurrentPath()).toBe('/home');
  });

  it('should apply route guards', () => {
    const guard = jest.fn().mockReturnValue(false);
    router.addRoute('/protected', { name: 'Protected' }, [guard]);
    
    const result = router.navigate('/protected');
    
    expect(guard).toHaveBeenCalled();
    expect(result).toBe(false);
    expect(router.getCurrentPath()).toBe('/');
  });

  it('should match dynamic routes', () => {
    const userComponent = { name: 'UserProfile' };
    router.addRoute('/user/:id', userComponent);
    
    const matched = router.matchRoute('/user/123');
    
    expect(matched).toBe(userComponent);
  });

  it('should return null for unmatched routes', () => {
    const matched = router.matchRoute('/nonexistent');
    
    expect(matched).toBeNull();
  });

  it('should handle multiple guards', () => {
    const guard1 = jest.fn().mockReturnValue(true);
    const guard2 = jest.fn().mockReturnValue(true);
    const guard3 = jest.fn().mockReturnValue(false);
    
    router.addRoute('/multi-guard', { name: 'MultiGuard' }, [guard1, guard2, guard3]);
    
    const result = router.navigate('/multi-guard');
    
    expect(guard1).toHaveBeenCalled();
    expect(guard2).toHaveBeenCalled();
    expect(guard3).toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
