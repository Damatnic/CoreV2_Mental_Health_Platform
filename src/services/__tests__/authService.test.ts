import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

class AuthService {
  private currentUser: User | null = null;
  private token: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string): Promise<AuthResponse> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock authentication
    if (email === 'test@example.com' && password === 'password') {
      const authResponse: AuthResponse = {
        user: {
          id: '123',
          email,
          name: 'Test User',
          role: 'user'
        },
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token'
      };

      this.currentUser = authResponse.user;
      this.token = authResponse.token;
      this.refreshToken = authResponse.refreshToken;

      return authResponse;
    }

    throw new Error('Invalid credentials');
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('auth-token');
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));

    const authResponse: AuthResponse = {
      user: {
        id: Date.now().toString(),
        email,
        name,
        role: 'user'
      },
      token: 'new-jwt-token',
      refreshToken: 'new-refresh-token'
    };

    this.currentUser = authResponse.user;
    this.token = authResponse.token;

    return authResponse;
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Simulate token refresh
    await new Promise(resolve => setTimeout(resolve, 50));
    
    this.token = 'refreshed-jwt-token';
    return this.token;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return this.token !== null && this.currentUser !== null;
  }

  async resetPassword(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const result = await authService.login('test@example.com', 'password');
      
      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        authService.login('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with missing credentials', async () => {
      await expect(
        authService.login('', 'password')
      ).rejects.toThrow('Email and password are required');
    });
  });

  describe('logout', () => {
    it('should clear user session', async () => {
      await authService.login('test@example.com', 'password');
      expect(authService.isAuthenticated()).toBe(true);
      
      await authService.logout();
      
      expect(authService.getCurrentUser()).toBeNull();
      expect(authService.getToken()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('register', () => {
    it('should register new user', async () => {
      const result = await authService.register(
        'new@example.com',
        'password',
        'New User'
      );
      
      expect(result.user.email).toBe('new@example.com');
      expect(result.user.name).toBe('New User');
      expect(result.token).toBeDefined();
    });

    it('should throw error with missing fields', async () => {
      await expect(
        authService.register('', 'password', 'Name')
      ).rejects.toThrow('All fields are required');
    });
  });

  describe('token refresh', () => {
    it('should refresh access token', async () => {
      await authService.login('test@example.com', 'password');
      
      const newToken = await authService.refreshAccessToken();
      
      expect(newToken).toBe('refreshed-jwt-token');
      expect(authService.getToken()).toBe('refreshed-jwt-token');
    });

    it('should throw error without refresh token', async () => {
      await expect(
        authService.refreshAccessToken()
      ).rejects.toThrow('No refresh token available');
    });
  });

  describe('password reset', () => {
    it('should send password reset email', async () => {
      await expect(
        authService.resetPassword('test@example.com')
      ).resolves.toBeUndefined();
    });

    it('should throw error without email', async () => {
      await expect(
        authService.resetPassword('')
      ).rejects.toThrow('Email is required');
    });
  });
});
