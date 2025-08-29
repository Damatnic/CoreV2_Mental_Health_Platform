/**
 * Simple Authentication Service
 *
 * JWT-based authentication service for the mental health platform
 * using Netlify Functions. Provides secure user authentication,
 * token management, and session handling.
 * 
 * @fileoverview Simple authentication service with JWT support
 * @version 2.0.0
 */

/**
 * User interface for authenticated users
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  profilePicture?: string;
  preferences?: Record<string, any>;
  createdAt: string;
  lastLoginAt?: string;
}

/**
 * Authentication response from server
 */
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
  message?: string;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Registration data interface
 */
export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
  acceptTerms: boolean;
}

/**
 * Password reset request interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset confirmation interface
 */
export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

/**
 * Token refresh response interface
 */
export interface TokenRefreshResponse {
  success: boolean;
  token?: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Simple Authentication Service Class
 */
export class SimpleAuthService {
  private token: string | null = null;
  private user: User | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private readonly baseUrl = '/.netlify/functions/auth';
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';
  private readonly refreshKey = 'auth_refresh';

  constructor() {
    // Load existing auth data from storage
    this.loadFromStorage();
    
    // Setup automatic token refresh
    this.setupTokenRefresh();
  }

  /**
   * Load authentication data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const storedToken = localStorage.getItem(this.tokenKey);
      const storedUser = localStorage.getItem(this.userKey);

      if (storedToken && storedUser) {
        this.token = storedToken;
        this.user = JSON.parse(storedUser);
        
        // Validate token expiry
        if (this.isTokenExpired()) {
          this.clearStorage();
        }
      }
    } catch (error) {
      console.error('Error loading auth data from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Save authentication data to localStorage
   */
  private saveToStorage(): void {
    try {
      if (this.token && this.user) {
        localStorage.setItem(this.tokenKey, this.token);
        localStorage.setItem(this.userKey, JSON.stringify(this.user));
      }
    } catch (error) {
      console.error('Error saving auth data to storage:', error);
    }
  }

  /**
   * Clear authentication data from localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.refreshKey);
    this.token = null;
    this.user = null;
  }

  /**
   * Check if current token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.token) return true;
    
    try {
      // Decode JWT payload (simple base64 decode)
      const payload = JSON.parse(atob(this.token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }

    // Refresh token every 50 minutes (tokens typically expire in 1 hour)
    this.refreshTimer = setInterval(async () => {
      if (this.isAuthenticated() && !this.isTokenExpired()) {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Auto token refresh failed:', error);
          this.logout();
        }
      }
    }, 50 * 60 * 1000); // 50 minutes
  }

  /**
   * Make authenticated API request
   */
  private async apiRequest(
    endpoint: string, 
    method = 'GET', 
    body?: any
  ): Promise<any> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${method} ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/login', 'POST', credentials);
      
      if (response.success && response.token && response.user) {
        this.token = response.token;
        this.user = response.user;
        this.saveToStorage();
        this.setupTokenRefresh();
        
        return {
          success: true,
          token: response.token,
          user: response.user,
          message: 'Login successful'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Login failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Register new user account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/register', 'POST', data);
      
      if (response.success && response.token && response.user) {
        this.token = response.token;
        this.user = response.user;
        this.saveToStorage();
        this.setupTokenRefresh();
        
        return {
          success: true,
          token: response.token,
          user: response.user,
          message: 'Registration successful'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Registration failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      // Notify server of logout (optional)
      if (this.token) {
        await this.apiRequest('/logout', 'POST').catch(() => {
          // Ignore logout API errors - still clear local data
        });
      }
    } finally {
      // Always clear local data
      this.clearStorage();
      
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
      }
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<TokenRefreshResponse> {
    try {
      const response = await this.apiRequest('/refresh', 'POST');
      
      if (response.success && response.token) {
        this.token = response.token;
        this.saveToStorage();
        
        return {
          success: true,
          token: response.token,
          expiresAt: response.expiresAt
        };
      }
      
      return {
        success: false,
        error: response.error || 'Token refresh failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed'
      };
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/password-reset', 'POST', request);
      
      return {
        success: response.success,
        message: response.message || 'Password reset email sent',
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset request failed'
      };
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(confirm: PasswordResetConfirm): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/password-reset/confirm', 'POST', confirm);
      
      return {
        success: response.success,
        message: response.message || 'Password reset successful',
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/profile', 'PUT', updates);
      
      if (response.success && response.user) {
        this.user = response.user;
        this.saveToStorage();
        
        return {
          success: true,
          user: response.user,
          message: 'Profile updated successfully'
        };
      }
      
      return {
        success: false,
        error: response.error || 'Profile update failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed'
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await this.apiRequest('/password', 'PUT', {
        currentPassword,
        newPassword
      });
      
      return {
        success: response.success,
        message: response.message || 'Password changed successfully',
        error: response.error
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed'
      };
    }
  }

  /**
   * Verify authentication token
   */
  async verifyToken(): Promise<boolean> {
    if (!this.token || this.isTokenExpired()) {
      return false;
    }

    try {
      const response = await this.apiRequest('/verify', 'GET');
      return response.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current authenticated user
   */
  getUser(): User | null {
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.user && !this.isTokenExpired());
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    return this.user ? roles.includes(this.user.role) : false;
  }

  /**
   * Get user's permissions based on role
   */
  getUserPermissions(): string[] {
    if (!this.user) return [];

    const rolePermissions: Record<string, string[]> = {
      'Admin': ['manage_users', 'manage_content', 'view_analytics', 'moderate_content'],
      'Moderator': ['moderate_content', 'view_reports'],
      'Certified': ['provide_support', 'access_training', 'view_guidelines'],
      'Community': ['participate', 'create_content'],
      'Starkeeper': ['access_support', 'create_posts', 'join_sessions']
    };

    return rolePermissions[this.user.role] || [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  /**
   * Cleanup service (call when component unmounts)
   */
  cleanup(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

/**
 * Singleton instance of the authentication service
 */
export const simpleAuthService = new SimpleAuthService();

/**
 * Default export
 */
export default simpleAuthService;
