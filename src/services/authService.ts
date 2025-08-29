/**
 * Authentication Service
 * 
 * Handles user authentication, authorization, and session management
 */

interface User {
  id: string;
  email: string;
  name?: string;
  role: 'client' | 'helper' | 'therapist' | 'admin';
  profile?: UserProfile;
  permissions?: string[];
}

interface UserProfile {
  avatar?: string;
  bio?: string;
  timezone?: string;
  preferences?: UserPreferences;
  emergencyContacts?: EmergencyContact[];
}

interface UserPreferences {
  theme?: 'light' | 'dark' | 'auto';
  notifications?: boolean;
  language?: string;
  accessibility?: AccessibilitySettings;
}

interface AccessibilitySettings {
  screenReader?: boolean;
  highContrast?: boolean;
  reducedMotion?: boolean;
  fontSize?: 'small' | 'medium' | 'large' | 'extra-large';
}

interface EmergencyContact {
  name: string;
  phone?: string;
  email?: string;
  relationship?: string;
}

interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
  expiresAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name?: string;
  role?: User['role'];
  acceptedTerms: boolean;
}

type AuthUpdater = (profile: Partial<User>) => void;

class AuthService {
  private currentUser: User | null = null;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private updateListeners: Set<AuthUpdater> = new Set();
  private authStateListeners: Set<(user: User | null) => void> = new Set();

  constructor() {
    // Initialize from localStorage if available
    this.loadStoredAuth();
    
    // Set up token refresh interval
    this.setupTokenRefresh();
  }

  // Authentication Methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      if (typeof fetch === 'undefined') {
        throw new Error('Fetch API not available');
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const authResponse: AuthResponse = await response.json();
      
      this.setAuthData(authResponse);
      
      if (credentials.rememberMe) {
        this.storeAuthData(authResponse);
      }

      return authResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const authResponse: AuthResponse = await response.json();
      
      this.setAuthData(authResponse);
      this.storeAuthData(authResponse);

      return authResponse;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { token, expiresAt } = await response.json();
      
      this.authToken = token;
      this.tokenExpiry = new Date(expiresAt);
      
      this.storeTokens(token, this.refreshToken!);

      return token;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuthData();
      throw error;
    }
  }

  // User Profile Management
  async updateProfile(updates: Partial<UserProfile>): Promise<User> {
    if (!this.currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Profile update failed');
      }

      const updatedUser = await response.json();
      
      this.currentUser = { ...this.currentUser, ...updatedUser };
      this.notifyUpdateListeners(updatedUser);

      return this.currentUser;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
      throw new Error('Password change failed');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error('Password reset request failed');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error('Email verification failed');
    }
  }

  // Helper Profile Update for Helper Role
  updateHelperProfile(profile: Partial<User>): void {
    if (!this.currentUser || this.currentUser.role !== 'helper') {
      console.error('Cannot update helper profile: user is not a helper');
      return;
    }

    this.currentUser = { ...this.currentUser, ...profile };
    this.notifyUpdateListeners(profile);
  }

  // Authorization Methods
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    
    // Admin has all permissions
    if (this.currentUser.role === 'admin') return true;
    
    return this.currentUser.permissions?.includes(permission) || false;
  }

  hasRole(role: User['role']): boolean {
    return this.currentUser?.role === role;
  }

  hasAnyRole(roles: User['role'][]): boolean {
    return roles.includes(this.currentUser?.role!);
  }

  // Session Management
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.currentUser && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    if (!this.tokenExpiry) return true;
    return new Date() >= this.tokenExpiry;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Event Listeners
  setUpdater(updater: AuthUpdater): void {
    this.updateListeners.add(updater);
  }

  removeUpdater(updater: AuthUpdater): void {
    this.updateListeners.delete(updater);
  }

  onAuthStateChange(listener: (user: User | null) => void): () => void {
    this.authStateListeners.add(listener);
    
    // Call immediately with current state
    listener(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners.delete(listener);
    };
  }

  // Private Methods
  private setAuthData(authResponse: AuthResponse): void {
    this.currentUser = authResponse.user;
    this.authToken = authResponse.token;
    this.refreshToken = authResponse.refreshToken || null;
    this.tokenExpiry = new Date(authResponse.expiresAt);
    
    this.notifyAuthStateListeners();
  }

  private clearAuthData(): void {
    this.currentUser = null;
    this.authToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentUser');
    }
    
    this.notifyAuthStateListeners();
  }

  private storeAuthData(authResponse: AuthResponse): void {
    this.storeTokens(authResponse.token, authResponse.refreshToken);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('currentUser', JSON.stringify(authResponse.user));
    }
  }

  private storeTokens(token: string, refreshToken?: string): void {
    if (typeof localStorage === 'undefined') return;
    
    localStorage.setItem('authToken', token);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  private loadStoredAuth(): void {
    if (typeof localStorage === 'undefined') return;
    
    const storedToken = localStorage.getItem('authToken');
    const storedRefreshToken = localStorage.getItem('refreshToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
      try {
        this.authToken = storedToken;
        this.refreshToken = storedRefreshToken;
        this.currentUser = JSON.parse(storedUser);
        
        // Verify token validity
        this.verifyStoredToken();
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuthData();
      }
    }
  }

  private async verifyStoredToken(): Promise<void> {
    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const { user, expiresAt } = await response.json();
      this.currentUser = user;
      this.tokenExpiry = new Date(expiresAt);
      
      this.notifyAuthStateListeners();
    } catch (error) {
      console.error('Token verification error:', error);
      this.clearAuthData();
    }
  }

  private setupTokenRefresh(): void {
    if (typeof setInterval === 'undefined') return;
    
    setInterval(() => {
      if (this.authToken && this.tokenExpiry) {
        const now = new Date();
        const expiryTime = this.tokenExpiry.getTime();
        const refreshThreshold = 5 * 60 * 1000; // 5 minutes
        
        if (expiryTime - now.getTime() < refreshThreshold) {
          this.refreshAccessToken().catch(console.error);
        }
      }
    }, 60000); // Check every minute
  }

  private notifyUpdateListeners(updates: Partial<User>): void {
    this.updateListeners.forEach(listener => {
      try {
        listener(updates);
      } catch (error) {
        console.error('Error in auth update listener:', error);
      }
    });
  }

  private notifyAuthStateListeners(): void {
    this.authStateListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  // Development/Testing Methods
  async loginAsGuest(): Promise<AuthResponse> {
    return this.login({
      email: 'guest@example.com',
      password: 'guest123',
    });
  }

  async impersonate(userId: string): Promise<User> {
    if (!this.hasRole('admin')) {
      throw new Error('Only admins can impersonate users');
    }

    const response = await fetch(`/api/admin/impersonate/${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Impersonation failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.setAuthData(authResponse);
    
    return authResponse.user;
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;



