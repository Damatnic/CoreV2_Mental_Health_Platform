import { describe, it, expect, jest, beforeEach } from '@jest/globals';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class WebAuthService {
  private currentUser: AuthUser | null = null;
  private tokens: AuthTokens | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  async signIn(email: string, password: string): Promise<AuthUser> {
    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock authentication
    if (email === 'test@example.com' && password === 'password123') {
      const user: AuthUser = {
        id: 'user-123',
        email,
        name: 'Test User',
        role: 'user',
        emailVerified: true
      };

      const tokens: AuthTokens = {
        accessToken: this.generateToken(),
        refreshToken: this.generateToken(),
        expiresIn: 3600
      };

      this.currentUser = user;
      this.tokens = tokens;
      this.scheduleTokenRefresh();

      return user;
    }

    throw new Error('Invalid credentials');
  }

  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    if (!email || !password || !name) {
      throw new Error('All fields are required');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 200));

    const user: AuthUser = {
      id: `user-${Date.now()}`,
      email,
      name,
      role: 'user',
      emailVerified: false
    };

    const tokens: AuthTokens = {
      accessToken: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresIn: 3600
    };

    this.currentUser = user;
    this.tokens = tokens;

    // Send verification email
    await this.sendVerificationEmail(email);

    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.tokens = null;
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Clear stored tokens
    this.clearStoredTokens();
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 50));

    const newTokens: AuthTokens = {
      accessToken: this.generateToken(),
      refreshToken: this.tokens.refreshToken,
      expiresIn: 3600
    };

    this.tokens = newTokens;
    this.scheduleTokenRefresh();

    return newTokens;
  }

  async verifyEmail(token: string): Promise<boolean> {
    if (!token) {
      throw new Error('Verification token is required');
    }

    // Mock verification
    await new Promise(resolve => setTimeout(resolve, 100));

    if (this.currentUser) {
      this.currentUser.emailVerified = true;
      return true;
    }

    return false;
  }

  async resetPassword(email: string): Promise<void> {
    if (!email) {
      throw new Error('Email is required');
    }

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Send reset email
    console.log(`Password reset email sent to ${email}`);
  }

  async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }

    if (!currentPassword || !newPassword) {
      throw new Error('Both passwords are required');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private generateToken(): string {
    return `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh 5 minutes before expiry
    const refreshIn = (this.tokens?.expiresIn || 3600) * 1000 - 300000;
    
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch(console.error);
    }, refreshIn);
  }

  private clearStoredTokens(): void {
    // Mock clearing tokens from storage
    console.log('Tokens cleared');
  }

  private async sendVerificationEmail(email: string): Promise<void> {
    // Mock sending email
    console.log(`Verification email sent to ${email}`);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  getAccessToken(): string | null {
    return this.tokens?.accessToken || null;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null && this.tokens !== null;
  }
}

describe('WebAuthService', () => {
  let service: WebAuthService;

  beforeEach(() => {
    service = new WebAuthService();
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in with valid credentials', async () => {
      const user = await service.signIn('test@example.com', 'password123');
      
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        service.signIn('wrong@example.com', 'wrongpass')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with missing credentials', async () => {
      await expect(
        service.signIn('', 'password')
      ).rejects.toThrow('Email and password are required');
    });
  });

  describe('signUp', () => {
    it('should create new user', async () => {
      const user = await service.signUp(
        'new@example.com',
        'password123',
        'New User'
      );
      
      expect(user.email).toBe('new@example.com');
      expect(user.emailVerified).toBe(false);
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should throw error with weak password', async () => {
      await expect(
        service.signUp('test@example.com', 'short', 'Test')
      ).rejects.toThrow('Password must be at least 8 characters');
    });
  });

  describe('signOut', () => {
    it('should clear user session', async () => {
      await service.signIn('test@example.com', 'password123');
      expect(service.isAuthenticated()).toBe(true);
      
      await service.signOut();
      
      expect(service.getCurrentUser()).toBeNull();
      expect(service.getAccessToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe('token refresh', () => {
    it('should refresh access token', async () => {
      await service.signIn('test@example.com', 'password123');
      const oldToken = service.getAccessToken();
      
      const newTokens = await service.refreshAccessToken();
      
      expect(newTokens.accessToken).not.toBe(oldToken);
      expect(service.getAccessToken()).toBe(newTokens.accessToken);
    });

    it('should throw error without refresh token', async () => {
      await expect(
        service.refreshAccessToken()
      ).rejects.toThrow('No refresh token available');
    });
  });

  describe('email verification', () => {
    it('should verify email with valid token', async () => {
      await service.signUp('new@example.com', 'password123', 'New User');
      
      const verified = await service.verifyEmail('valid-token');
      
      expect(verified).toBe(true);
      expect(service.getCurrentUser()?.emailVerified).toBe(true);
    });
  });

  describe('password reset', () => {
    it('should send reset email', async () => {
      await expect(
        service.resetPassword('test@example.com')
      ).resolves.toBeUndefined();
    });

    it('should throw error without email', async () => {
      await expect(
        service.resetPassword('')
      ).rejects.toThrow('Email is required');
    });
  });
});
