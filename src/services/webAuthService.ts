/**
 * Web Authentication Service
 *
 * Web-compatible authentication service for browser environments,
 * providing OAuth flows, session management, and secure authentication
 * for the mental health platform.
 * 
 * @fileoverview Web authentication service and OAuth integration
 * @version 2.0.0
 */

/**
 * Authentication response interface
 */
export interface AuthResponse {
  type: 'success' | 'error' | 'dismiss' | 'locked';
  params: Record<string, string>;
  error?: { 
    message: string; 
    code?: string;
    description?: string;
  } | null;
  url?: string;
}

/**
 * Authentication request configuration
 */
export interface AuthRequestConfig {
  clientId: string;
  redirectUri: string;
  responseType: 'code' | 'token';
  scopes: string[];
  state?: string;
  extraParams?: Record<string, string>;
  additionalParameters?: Record<string, string>;
  usePKCE?: boolean;
}

/**
 * Discovery document interface
 */
export interface DiscoveryDocument {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  userInfoEndpoint?: string;
  endSessionEndpoint?: string;
  issuer?: string;
}

/**
 * Token response interface
 */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: number;
  refreshToken?: string;
  scope?: string;
  idToken?: string;
}

/**
 * User info interface
 */
export interface UserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  locale?: string;
  [key: string]: any;
}

/**
 * Web Authentication Session Service
 * Provides OAuth authentication flows compatible with web browsers
 */
export class WebAuthSession {
  private static instance: WebAuthSession;

  /**
   * Get singleton instance
   */
  public static getInstance(): WebAuthSession {
    if (!WebAuthSession.instance) {
      WebAuthSession.instance = new WebAuthSession();
    }
    return WebAuthSession.instance;
  }

  /**
   * Generate redirect URI for OAuth flow
   */
  public makeRedirectUri(path: string = '/auth/callback'): string {
    const origin = window.location.origin;
    return `${origin}${path}`;
  }

  /**
   * Auto-discover OAuth endpoints from domain
   */
  public async useAutoDiscovery(domain: string): Promise<DiscoveryDocument> {
    try {
      // Try well-known discovery endpoint
      const discoveryUrl = `${domain}/.well-known/openid_configuration`;
      const response = await fetch(discoveryUrl);
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Auto-discovery failed, using default endpoints:', error);
    }

    // Fallback to standard OAuth2 endpoints
    return {
      authorizationEndpoint: `${domain}/authorize`,
      tokenEndpoint: `${domain}/oauth/token`,
      revocationEndpoint: `${domain}/oauth/revoke`,
      userInfoEndpoint: `${domain}/userinfo`,
      endSessionEndpoint: `${domain}/v2/logout`
    };
  }

  /**
   * Create an authentication request
   */
  public useAuthRequest(
    config: AuthRequestConfig, 
    discovery: DiscoveryDocument
  ): [{ url: string }, AuthResponse | null, () => Promise<void>] {
    
    const buildAuthUrl = (): string => {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: config.responseType,
        scope: config.scopes.join(' '),
        state: config.state || Math.random().toString(36).substring(7),
        ...config.extraParams,
        ...config.additionalParameters
      });

      // Add PKCE parameters if enabled
      if (config.usePKCE) {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        
        // Store code verifier for token exchange
        sessionStorage.setItem('oauth_code_verifier', codeVerifier);
        
        params.append('code_challenge', codeChallenge);
        params.append('code_challenge_method', 'S256');
      }

      return `${discovery.authorizationEndpoint}?${params.toString()}`;
    };

    const promptAsync = async (): Promise<void> => {
      const authUrl = buildAuthUrl();
      
      // Store original location for post-auth redirect
      sessionStorage.setItem('oauth_return_url', window.location.href);
      
      // Redirect to OAuth provider
      window.location.href = authUrl;
    };

    // Check for auth response in URL
    const authResponse = this.parseAuthResponse();

    return [{ url: buildAuthUrl() }, authResponse, promptAsync];
  }

  /**
   * Exchange authorization code for tokens
   */
  public async exchangeCodeForTokens(
    code: string,
    config: AuthRequestConfig,
    discovery: DiscoveryDocument
  ): Promise<TokenResponse> {
    const tokenEndpoint = discovery.tokenEndpoint;
    
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri
    });

    // Add PKCE code verifier if used
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
    if (codeVerifier) {
      params.append('code_verifier', codeVerifier);
      sessionStorage.removeItem('oauth_code_verifier');
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'token_exchange_failed' }));
      throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token,
      scope: tokenData.scope,
      idToken: tokenData.id_token
    };
  }

  /**
   * Get user information using access token
   */
  public async getUserInfo(
    accessToken: string, 
    discovery: DiscoveryDocument
  ): Promise<UserInfo> {
    if (!discovery.userInfoEndpoint) {
      throw new Error('UserInfo endpoint not available');
    }

    const response = await fetch(discovery.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(
    refreshToken: string,
    config: AuthRequestConfig,
    discovery: DiscoveryDocument
  ): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.clientId,
      refresh_token: refreshToken
    });

    const response = await fetch(discovery.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'token_refresh_failed' }));
      throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
    }

    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token || refreshToken, // Keep existing if not provided
      scope: tokenData.scope,
      idToken: tokenData.id_token
    };
  }

  /**
   * Revoke token
   */
  public async revokeToken(
    token: string,
    config: AuthRequestConfig,
    discovery: DiscoveryDocument,
    tokenType: 'access_token' | 'refresh_token' = 'access_token'
  ): Promise<void> {
    if (!discovery.revocationEndpoint) {
      console.warn('Revocation endpoint not available');
      return;
    }

    const params = new URLSearchParams({
      token,
      token_type_hint: tokenType,
      client_id: config.clientId
    });

    const response = await fetch(discovery.revocationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      console.warn('Token revocation failed:', response.statusText);
    }
  }

  /**
   * Parse authentication response from URL
   */
  private parseAuthResponse(): AuthResponse | null {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check for error in query params or hash
    const error = urlParams.get('error') || hashParams.get('error');
    if (error) {
      return {
        type: 'error',
        params: Object.fromEntries([...urlParams.entries(), ...hashParams.entries()]),
        error: {
          message: urlParams.get('error_description') || hashParams.get('error_description') || error,
          code: error
        }
      };
    }

    // Check for authorization code or access token
    const code = urlParams.get('code');
    const accessToken = hashParams.get('access_token');
    
    if (code || accessToken) {
      return {
        type: 'success',
        params: Object.fromEntries([...urlParams.entries(), ...hashParams.entries()])
      };
    }

    return null;
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64URLEncode(array);
  }

  /**
   * Generate PKCE code challenge
   */
  private generateCodeChallenge(codeVerifier: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    
    return crypto.subtle.digest('SHA-256', data).then(hash => {
      return this.base64URLEncode(new Uint8Array(hash));
    }).catch(() => {
      // Fallback for environments without crypto.subtle
      return codeVerifier;
    }) as any; // Type assertion for synchronous return in fallback
  }

  /**
   * Base64 URL encode
   */
  private base64URLEncode(buffer: Uint8Array): string {
    const base64 = btoa(String.fromCharCode(...buffer));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
}

/**
 * Response type constants
 */
export const ResponseType = {
  Code: 'code' as const,
  Token: 'token' as const
};

/**
 * OAuth scopes for mental health platform
 */
export const OAuthScopes = {
  OpenID: 'openid',
  Profile: 'profile',
  Email: 'email',
  OfflineAccess: 'offline_access'
};

/**
 * Common OAuth providers configuration
 */
export const OAuthProviders = {
  Auth0: {
    name: 'Auth0',
    getDiscoveryUrl: (domain: string) => `https://${domain}/.well-known/openid_configuration`
  },
  Google: {
    name: 'Google',
    getDiscoveryUrl: () => 'https://accounts.google.com/.well-known/openid_configuration'
  },
  Microsoft: {
    name: 'Microsoft',
    getDiscoveryUrl: (tenant: string = 'common') => 
      `https://login.microsoftonline.com/${tenant}/v2.0/.well-known/openid_configuration`
  }
};

/**
 * Authentication utility functions
 */
export class AuthUtils {
  /**
   * Check if current URL contains auth response
   */
  public static hasAuthResponse(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    return !!(
      urlParams.get('code') || 
      urlParams.get('error') || 
      hashParams.get('access_token') || 
      hashParams.get('error')
    );
  }

  /**
   * Clear auth response from URL
   */
  public static clearAuthResponse(): void {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    
    window.history.replaceState({}, document.title, url.toString());
  }

  /**
   * Get return URL after authentication
   */
  public static getReturnUrl(): string | null {
    return sessionStorage.getItem('oauth_return_url');
  }

  /**
   * Clear return URL
   */
  public static clearReturnUrl(): void {
    sessionStorage.removeItem('oauth_return_url');
  }
}

/**
 * Default export
 */
export default WebAuthSession;
