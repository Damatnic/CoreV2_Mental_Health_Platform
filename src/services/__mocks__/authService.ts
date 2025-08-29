// Mock authentication service for testing
export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  isAnonymous: boolean;
  roles: string[];
  createdAt: string;
  lastLogin: string;
  preferences: Record<string, any>;
  isEmailVerified: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    dateOfBirth?: string;
    location?: string;
  };
}

export interface MockAuthSession {
  user: MockUser;
  token: string;
  refreshToken: string;
  expiresAt: string;
  isActive: boolean;
}

export interface MockLoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface MockSignupData {
  email: string;
  password: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
}

class MockAuthService {
  private users: Map<string, MockUser> = new Map();
  private sessions: Map<string, MockAuthSession> = new Map();
  private currentUser: MockUser | null = null;
  private failedAttempts: Map<string, number> = new Map();

  constructor() {
    this.initializeMockUsers();
  }

  private initializeMockUsers(): void {
    // Create test users
    const testUsers: MockUser[] = [
      {
        id: 'user-1',
        email: 'test@example.com',
        displayName: 'Test User',
        isAnonymous: false,
        roles: ['user'],
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-01-15T10:00:00Z',
        preferences: { theme: 'light', notifications: true },
        isEmailVerified: true,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          avatar: 'https://ui-avatars.com/api/?name=Test+User',
        }
      },
      {
        id: 'admin-1',
        email: 'admin@example.com',
        displayName: 'Admin User',
        isAnonymous: false,
        roles: ['admin', 'user'],
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: '2024-01-15T09:00:00Z',
        preferences: { theme: 'dark', notifications: true },
        isEmailVerified: true,
        profile: {
          firstName: 'Admin',
          lastName: 'User',
          avatar: 'https://ui-avatars.com/api/?name=Admin+User',
        }
      }
    ];

    testUsers.forEach(user => {
      this.users.set(user.email, user);
    });
  }

  // Authentication Methods
  async login(credentials: MockLoginCredentials): Promise<MockAuthSession> {
    await this.simulateNetworkDelay();

    const { email, password, rememberMe = false } = credentials;

    // Check failed attempts
    const attempts = this.failedAttempts.get(email) || 0;
    if (attempts >= 5) {
      throw new Error('Account locked due to too many failed attempts');
    }

    // Simple password validation (in real app, would hash and compare)
    if (password === 'password123' || password === 'admin123') {
      const user = this.users.get(email);
      if (!user) {
        this.recordFailedAttempt(email);
        throw new Error('Invalid email or password');
      }

      // Clear failed attempts on successful login
      this.failedAttempts.delete(email);

      // Update last login
      user.lastLogin = new Date().toISOString();
      this.users.set(email, user);

      // Create session
      const session = this.createSession(user, rememberMe);
      this.currentUser = user;

      return session;
    }

    this.recordFailedAttempt(email);
    throw new Error('Invalid email or password');
  }

  async signup(data: MockSignupData): Promise<MockAuthSession> {
    await this.simulateNetworkDelay();

    const { email, password, displayName, firstName, lastName } = data;

    // Check if user already exists
    if (this.users.has(email)) {
      throw new Error('Email already registered');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Create new user
    const newUser: MockUser = {
      id: `user-${Date.now()}`,
      email,
      displayName,
      isAnonymous: false,
      roles: ['user'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      preferences: { theme: 'light', notifications: true },
      isEmailVerified: false,
      profile: {
        firstName,
        lastName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`,
      }
    };

    this.users.set(email, newUser);

    // Create session
    const session = this.createSession(newUser, false);
    this.currentUser = newUser;

    return session;
  }

  async loginAnonymously(): Promise<MockAuthSession> {
    await this.simulateNetworkDelay();

    // Generate anonymous user
    const anonymousUser: MockUser = {
      id: `anon-${Date.now()}`,
      email: `anon-${Date.now()}@anonymous.local`,
      displayName: 'Anonymous User',
      isAnonymous: true,
      roles: ['anonymous'],
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      preferences: {},
      isEmailVerified: false,
      profile: {}
    };

    // Create temporary session (shorter expiry)
    const session = this.createSession(anonymousUser, false, true);
    this.currentUser = anonymousUser;

    return session;
  }

  async logout(): Promise<void> {
    await this.simulateNetworkDelay();

    if (this.currentUser) {
      // Remove session
      const sessionId = `session-${this.currentUser.id}`;
      this.sessions.delete(sessionId);
      this.currentUser = null;
    }
  }

  async refreshToken(refreshToken: string): Promise<MockAuthSession> {
    await this.simulateNetworkDelay();

    // Find session by refresh token
    const session = Array.from(this.sessions.values()).find(s => s.refreshToken === refreshToken);
    
    if (!session || !session.isActive) {
      throw new Error('Invalid refresh token');
    }

    // Check if session has expired
    if (new Date() > new Date(session.expiresAt)) {
      throw new Error('Session expired');
    }

    // Generate new tokens
    const newSession: MockAuthSession = {
      ...session,
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt: new Date(Date.now() + (session.user.isAnonymous ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000)).toISOString()
    };

    this.sessions.set(`session-${session.user.id}`, newSession);
    return newSession;
  }

  // User Management
  async getCurrentUser(): Promise<MockUser | null> {
    await this.simulateNetworkDelay(100);
    return this.currentUser;
  }

  async updateUser(userId: string, updates: Partial<MockUser>): Promise<MockUser> {
    await this.simulateNetworkDelay();

    if (!this.currentUser || this.currentUser.id !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = { ...this.currentUser, ...updates };
    this.users.set(this.currentUser.email, updated);
    this.currentUser = updated;

    return updated;
  }

  async updateProfile(userId: string, profileUpdates: Partial<MockUser['profile']>): Promise<MockUser> {
    await this.simulateNetworkDelay();

    if (!this.currentUser || this.currentUser.id !== userId) {
      throw new Error('Unauthorized');
    }

    const updated = {
      ...this.currentUser,
      profile: { ...this.currentUser.profile, ...profileUpdates }
    };

    this.users.set(this.currentUser.email, updated);
    this.currentUser = updated;

    return updated;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.simulateNetworkDelay();

    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }

    // Simple validation (in real app would verify current password)
    if (currentPassword !== 'password123' && currentPassword !== 'admin123') {
      throw new Error('Current password is incorrect');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    // In real implementation, would hash and store new password
    console.log('Password changed successfully for user:', this.currentUser.id);
  }

  // Session Management
  async validateSession(token: string): Promise<MockUser | null> {
    await this.simulateNetworkDelay(50);

    const session = Array.from(this.sessions.values()).find(s => s.token === token);
    
    if (!session || !session.isActive) {
      return null;
    }

    // Check expiration
    if (new Date() > new Date(session.expiresAt)) {
      session.isActive = false;
      return null;
    }

    return session.user;
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.simulateNetworkDelay();

    if (!this.currentUser || this.currentUser.id !== userId) {
      throw new Error('Unauthorized');
    }

    // Deactivate all sessions for the user
    Array.from(this.sessions.values())
      .filter(session => session.user.id === userId)
      .forEach(session => session.isActive = false);
  }

  // Password Reset
  async requestPasswordReset(email: string): Promise<void> {
    await this.simulateNetworkDelay();

    const user = this.users.get(email);
    if (!user) {
      // Don't reveal whether email exists
      return;
    }

    // In real implementation, would send reset email
    console.log('Password reset requested for:', email);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.simulateNetworkDelay();

    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // In real implementation, would validate token and update password
    console.log('Password reset with token:', token);
  }

  // Email Verification
  async sendVerificationEmail(userId: string): Promise<void> {
    await this.simulateNetworkDelay();

    if (!this.currentUser || this.currentUser.id !== userId) {
      throw new Error('Unauthorized');
    }

    console.log('Verification email sent to:', this.currentUser.email);
  }

  async verifyEmail(token: string): Promise<MockUser> {
    await this.simulateNetworkDelay();

    if (!this.currentUser) {
      throw new Error('Not authenticated');
    }

    const updated = { ...this.currentUser, isEmailVerified: true };
    this.users.set(this.currentUser.email, updated);
    this.currentUser = updated;

    return updated;
  }

  // Helper Methods
  private createSession(user: MockUser, rememberMe: boolean, isAnonymous = false): MockAuthSession {
    const expirationHours = isAnonymous ? 2 : rememberMe ? 24 * 30 : 24; // Anonymous: 2h, Remember me: 30 days, Regular: 24h
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000).toISOString();

    const session: MockAuthSession = {
      user,
      token: this.generateToken(),
      refreshToken: this.generateToken(),
      expiresAt,
      isActive: true
    };

    this.sessions.set(`session-${user.id}`, session);
    return session;
  }

  private generateToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordFailedAttempt(email: string): void {
    const current = this.failedAttempts.get(email) || 0;
    this.failedAttempts.set(email, current + 1);
  }

  private async simulateNetworkDelay(ms = 500): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test Utilities
  resetMockState(): void {
    this.users.clear();
    this.sessions.clear();
    this.currentUser = null;
    this.failedAttempts.clear();
    this.initializeMockUsers();
  }

  getAllUsers(): MockUser[] {
    return Array.from(this.users.values());
  }

  getAllSessions(): MockAuthSession[] {
    return Array.from(this.sessions.values());
  }

  setCurrentUser(user: MockUser | null): void {
    this.currentUser = user;
  }

  simulateNetworkError(): void {
    throw new Error('Network error: Unable to connect to authentication service');
  }

  simulateServiceUnavailable(): void {
    throw new Error('Service temporarily unavailable');
  }
}

// Export singleton instance
export const mockAuthService = new MockAuthService();

// Export commonly used test data
export const TEST_USERS = {
  REGULAR_USER: {
    email: 'test@example.com',
    password: 'password123',
    displayName: 'Test User'
  },
  ADMIN_USER: {
    email: 'admin@example.com',
    password: 'admin123',
    displayName: 'Admin User'
  }
};

export default mockAuthService;
