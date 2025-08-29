/**
 * Auth0 Service for CoreV2 Mental Health Platform
 * Handles authentication, authorization, and token management with HIPAA compliance
 */

import { Auth0Client, User as Auth0User, GetTokenSilentlyOptions } from '@auth0/auth0-spa-js';
import { User, Helper, UserRole } from '../types';
import { logger } from '../utils/logger';
import { getEnv, isProduction } from '../utils/env';

export interface AuthConfig {
  domain: string;
  clientId: string;
  redirectUri: string;
  audience?: string;
  scope: string;
  useRefreshTokens: boolean;
  cacheLocation: 'localstorage' | 'memory';
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  token: string | null;
  roles: UserRole[];
}

export interface LoginOptions {
  redirectTo?: string;
  prompt?: 'none' | 'login' | 'consent' | 'select_account';
  loginHint?: string;
}

class Auth0Service {
  private auth0Client: Auth0Client | null = null;
  private initialized = false;
  private authState: AuthState = {
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
    token: null,
    roles: []
  };

  constructor(private config: AuthConfig) {
    this.initializeAuth0();
  }

  private async initializeAuth0(): Promise<void> {
    try {
      this.auth0Client = new Auth0Client({
        domain: this.config.domain,
        clientId: this.config.clientId,
        authorizationParams: {
          redirect_uri: this.config.redirectUri,
          audience: this.config.audience,
          scope: this.config.scope,
        },
        useRefreshTokens: this.config.useRefreshTokens,
        cacheLocation: this.config.cacheLocation,
      });

      // Handle redirect callback
      if (window.location.search.includes('code=') || window.location.search.includes('error=')) {
        await this.handleRedirectCallback();
      }

      // Check if user is authenticated
      const isAuthenticated = await this.auth0Client.isAuthenticated();
      if (isAuthenticated) {
        await this.updateAuthState();
      }

      this.authState.isLoading = false;
      this.initialized = true;
      logger.info('Auth0 service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Auth0 service:', error);
      this.authState.error = 'Failed to initialize authentication service';
      this.authState.isLoading = false;
    }
  }

  private async handleRedirectCallback(): Promise<void> {
    try {
      if (!this.auth0Client) throw new Error('Auth0 client not initialized');
      
      const result = await this.auth0Client.handleRedirectCallback();
      await this.updateAuthState();
      
      // Clear URL parameters
      const targetUrl = result?.appState?.targetUrl || window.location.pathname;
      window.history.replaceState({}, document.title, targetUrl);
      
      logger.info('Auth0 redirect callback handled successfully');
    } catch (error) {
      logger.error('Failed to handle Auth0 redirect callback:', error);
      this.authState.error = 'Authentication callback failed';
    }
  }

  private async updateAuthState(): Promise<void> {
    try {
      if (!this.auth0Client) throw new Error('Auth0 client not initialized');

      const isAuthenticated = await this.auth0Client.isAuthenticated();
      
      if (isAuthenticated) {
        const auth0User = await this.auth0Client.getUser();
        const token = await this.auth0Client.getTokenSilently();
        const roles = this.extractUserRoles(auth0User);
        
        this.authState = {
          isAuthenticated: true,
          isLoading: false,
          user: this.transformAuth0User(auth0User),
          error: null,
          token,
          roles
        };
      } else {
        this.authState = {
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          token: null,
          roles: []
        };
      }
    } catch (error) {
      logger.error('Failed to update auth state:', error);
      this.authState.error = 'Failed to update authentication state';
    }
  }

  private transformAuth0User(auth0User: Auth0User | undefined): User | null {
    if (!auth0User) return null;

    return {
      id: auth0User.sub || '',
      email: auth0User.email || '',
      name: auth0User.name,
      picture: auth0User.picture,
      isEmailVerified: auth0User.email_verified,
      roles: this.extractUserRoles(auth0User),
      createdAt: auth0User.created_at,
      updatedAt: auth0User.updated_at,
    };
  }

  private extractUserRoles(auth0User: Auth0User | undefined): UserRole[] {
    if (!auth0User) return [];
    
    // Extract roles from Auth0 user metadata
    const roles = auth0User['https://corev2.app/roles'] || 
                 auth0User.app_metadata?.roles || 
                 auth0User.user_metadata?.roles || 
                 [];
    
    return Array.isArray(roles) ? roles : [roles].filter(Boolean);
  }

  // Public API methods
  public async login(options: LoginOptions = {}): Promise<void> {
    try {
      if (!this.auth0Client) throw new Error('Auth0 client not initialized');
      
      await this.auth0Client.loginWithRedirect({
        authorizationParams: {
          prompt: options.prompt,
          login_hint: options.loginHint,
        },
        appState: {
          targetUrl: options.redirectTo || window.location.pathname
        }
      });
    } catch (error) {
      logger.error('Login failed:', error);
      throw new Error('Login failed');
    }
  }

  public async logout(returnTo?: string): Promise<void> {
    try {
      if (!this.auth0Client) throw new Error('Auth0 client not initialized');
      
      await this.auth0Client.logout({
        logoutParams: {
          returnTo: returnTo || window.location.origin
        }
      });
      
      this.authState = {
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        token: null,
        roles: []
      };
    } catch (error) {
      logger.error('Logout failed:', error);
      throw new Error('Logout failed');
    }
  }

  public async getToken(options?: GetTokenSilentlyOptions): Promise<string | null> {
    try {
      if (!this.auth0Client || !this.authState.isAuthenticated) {
        return null;
      }
      
      return await this.auth0Client.getTokenSilently(options);
    } catch (error) {
      logger.error('Failed to get token:', error);
      return null;
    }
  }

  public async refreshToken(): Promise<void> {
    try {
      if (!this.auth0Client) throw new Error('Auth0 client not initialized');
      
      await this.auth0Client.getTokenSilently({ cacheMode: 'off' });
      await this.updateAuthState();
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Token refresh failed');
    }
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  public getUser(): User | null {
    return this.authState.user;
  }

  public hasRole(role: UserRole): boolean {
    return this.authState.roles.includes(role);
  }

  public hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.authState.roles.includes(role));
  }

  public hasAllRoles(roles: UserRole[]): boolean {
    return roles.every(role => this.authState.roles.includes(role));
  }

  public isHelper(): boolean {
    return this.hasAnyRole(['helper', 'therapist']);
  }

  public isModerator(): boolean {
    return this.hasAnyRole(['moderator', 'admin', 'superadmin']);
  }

  public isAdmin(): boolean {
    return this.hasAnyRole(['admin', 'superadmin']);
  }

  public async waitForInitialization(): Promise<void> {
    if (this.initialized) return;
    
    return new Promise((resolve) => {
      const checkInitialized = () => {
        if (this.initialized) {
          resolve();
        } else {
          setTimeout(checkInitialized, 100);
        }
      };
      checkInitialized();
    });
  }

  // Helper management methods
  public async upgradeToHelper(helperData: Partial<Helper>): Promise<void> {
    try {
      if (!this.authState.isAuthenticated || !this.authState.user) {
        throw new Error('User must be authenticated');
      }

      // This would typically make an API call to update user role
      // For now, we'll update the local state
      const updatedRoles = [...this.authState.roles];
      if (!updatedRoles.includes('helper')) {
        updatedRoles.push('helper');
      }

      this.authState.roles = updatedRoles;
      logger.info('User upgraded to helper role');
    } catch (error) {
      logger.error('Failed to upgrade user to helper:', error);
      throw new Error('Failed to upgrade to helper role');
    }
  }

  public async updateUserMetadata(metadata: Record<string, unknown>): Promise<void> {
    try {
      if (!this.authState.isAuthenticated) {
        throw new Error('User must be authenticated');
      }

      // This would typically make an API call to Auth0 Management API
      // For now, we'll log the operation
      logger.info('User metadata update requested:', metadata);
    } catch (error) {
      logger.error('Failed to update user metadata:', error);
      throw new Error('Failed to update user metadata');
    }
  }
}

// Default configuration - should be overridden with environment variables
const defaultConfig: AuthConfig = {
  domain: getEnv('AUTH0_DOMAIN', 'corev2-mental-health.auth0.com')!,
  clientId: getEnv('AUTH0_CLIENT_ID', '')!,
  redirectUri: getEnv('AUTH0_CALLBACK_URL', `${window.location.origin}/callback`)!,
  audience: getEnv('AUTH0_AUDIENCE') as string | undefined,
  scope: 'openid profile email offline_access read:user_metadata update:user_metadata',
  useRefreshTokens: true,
  cacheLocation: isProduction() ? 'memory' : 'localstorage'
};

// Export singleton instance
export const auth0Service = new Auth0Service(defaultConfig);
export default auth0Service;

// Re-export UserRole for backward compatibility
export type { UserRole };
