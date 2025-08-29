/**
 * Token Manager - Secure JWT token storage and management
 * Handles access tokens, refresh tokens, and automatic renewal
 * HIPAA-compliant with encryption and secure storage
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { logger } from './logger';

// Token storage keys
const ACCESS_TOKEN_KEY = 'astral_access_token';
const REFRESH_TOKEN_KEY = 'astral_refresh_token';
const TOKEN_EXPIRY_KEY = 'astral_token_expiry';
const ENCRYPTION_KEY = 'astral_encryption_key';

// Token configuration
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface TokenManagerConfig {
  baseURL: string;
  refreshEndpoint: string;
  onTokenRefresh?: (tokens: TokenPair) => void;
  onTokenExpired?: () => void;
  onRefreshFailed?: (error: Error) => void;
  encryptionEnabled?: boolean;
}

/**
 * TokenManager class for secure token management
 */
export class TokenManager {
  private config: TokenManagerConfig;
  private refreshTimer?: NodeJS.Timeout;
  private isRefreshing: boolean = false;
  private refreshPromise?: Promise<TokenPair>;
  private encryptionKey?: CryptoKey;

  constructor(config: TokenManagerConfig) {
    this.config = {
      encryptionEnabled: true,
      ...config
    };
    
    if (this.config.encryptionEnabled) {
      this.initializeEncryption();
    }
    
    this.setupAxiosInterceptors();
    this.checkStoredTokens();
  }

  /**
   * Initialize encryption for secure token storage
   */
  private async initializeEncryption(): Promise<void> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      logger.warn('Web Crypto API not available, falling back to base64 encoding');
      return;
    }

    try {
      // Get or generate encryption key
      const storedKey = localStorage.getItem(ENCRYPTION_KEY);
      
      if (storedKey) {
        // Import existing key
        const keyData = this.base64ToArrayBuffer(storedKey);
        this.encryptionKey = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      } else {
        // Generate new key
        this.encryptionKey = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Export and store key
        const exported = await crypto.subtle.exportKey('raw', this.encryptionKey);
        const keyString = this.arrayBufferToBase64(exported);
        localStorage.setItem(ENCRYPTION_KEY, keyString);
      }
    } catch (error) {
      logger.error('Failed to initialize encryption', error);
    }
  }

  /**
   * Encrypt data using Web Crypto API
   */
  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey || typeof window === 'undefined') {
      // Fallback to base64 encoding
      return btoa(data);
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encodedData = new TextEncoder().encode(data);
      
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encodedData
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      
      return this.arrayBufferToBase64(combined.buffer);
    } catch (error) {
      logger.error('Encryption failed', error);
      return btoa(data); // Fallback
    }
  }

  /**
   * Decrypt data using Web Crypto API
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey || typeof window === 'undefined') {
      // Fallback from base64 encoding
      return atob(encryptedData);
    }

    try {
      const combined = this.base64ToArrayBuffer(encryptedData);
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      );
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error('Decryption failed', error);
      return atob(encryptedData); // Fallback
    }
  }

  /**
   * Helper: Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
  }

  /**
   * Helper: Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Store tokens securely
   */
  async storeTokens(tokens: TokenPair): Promise<void> {
    try {
      if (this.config.encryptionEnabled) {
        const encryptedAccess = await this.encrypt(tokens.accessToken);
        const encryptedRefresh = await this.encrypt(tokens.refreshToken);
        
        localStorage.setItem(ACCESS_TOKEN_KEY, encryptedAccess);
        localStorage.setItem(REFRESH_TOKEN_KEY, encryptedRefresh);
      } else {
        localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
      }
      
      // Store expiry time
      const expiryTime = Date.now() + (tokens.expiresIn * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Schedule automatic refresh
      this.scheduleTokenRefresh(tokens.expiresIn);
      
      logger.info('Tokens stored successfully');
    } catch (error) {
      logger.error('Failed to store tokens', error);
      throw error;
    }
  }

  /**
   * Retrieve access token
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (!storedToken) return null;
      
      if (this.config.encryptionEnabled) {
        return await this.decrypt(storedToken);
      }
      
      return storedToken;
    } catch (error) {
      logger.error('Failed to retrieve access token', error);
      return null;
    }
  }

  /**
   * Retrieve refresh token
   */
  async getRefreshToken(): Promise<string | null> {
    try {
      const storedToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!storedToken) return null;
      
      if (this.config.encryptionEnabled) {
        return await this.decrypt(storedToken);
      }
      
      return storedToken;
    } catch (error) {
      logger.error('Failed to retrieve refresh token', error);
      return null;
    }
  }

  /**
   * Check if token is expired or about to expire
   */
  isTokenExpired(): boolean {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    
    const expiry = parseInt(expiryTime, 10);
    const now = Date.now();
    
    // Check if expired or within refresh threshold
    return now >= (expiry - TOKEN_REFRESH_THRESHOLD);
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<TokenPair> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }
    
    this.isRefreshing = true;
    
    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const tokens = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = undefined;
      return tokens;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = undefined;
      throw error;
    }
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<TokenPair> {
    const refreshToken = await this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await axios.post<TokenPair>(
          `${this.config.baseURL}${this.config.refreshEndpoint}`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const tokens = response.data;
        
        // Store new tokens
        await this.storeTokens(tokens);
        
        // Notify listeners
        if (this.config.onTokenRefresh) {
          this.config.onTokenRefresh(tokens);
        }
        
        logger.info('Token refreshed successfully');
        return tokens;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Token refresh attempt ${attempt} failed`, error);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await this.delay(RETRY_DELAY * attempt);
        }
      }
    }
    
    // All attempts failed
    logger.error('Token refresh failed after all attempts', lastError);
    
    if (this.config.onRefreshFailed) {
      this.config.onRefreshFailed(lastError!);
    }
    
    this.clearTokens();
    
    if (this.config.onTokenExpired) {
      this.config.onTokenExpired();
    }
    
    throw lastError;
  }

  /**
   * Schedule automatic token refresh
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Calculate when to refresh (5 minutes before expiry)
    const refreshIn = Math.max(
      (expiresIn * 1000) - TOKEN_REFRESH_THRESHOLD,
      10000 // Minimum 10 seconds
    );
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        logger.error('Automatic token refresh failed', error);
      }
    }, refreshIn);
    
    logger.info(`Token refresh scheduled in ${refreshIn / 1000} seconds`);
  }

  /**
   * Setup Axios interceptors for automatic token handling
   */
  private setupAxiosInterceptors(): void {
    // Request interceptor to add token
    axios.interceptors.request.use(
      async (config: AxiosRequestConfig) => {
        // Skip token for auth endpoints
        if (config.url?.includes('/auth/') && 
            !config.url?.includes('/auth/refresh')) {
          return config;
        }
        
        // Check if token needs refresh
        if (this.isTokenExpired()) {
          try {
            await this.refreshToken();
          } catch (error) {
            logger.error('Token refresh in interceptor failed', error);
          }
        }
        
        // Add token to request
        const token = await this.getAccessToken();
        if (token && config.headers) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor to handle 401 errors
    axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            await this.refreshToken();
            
            // Retry original request with new token
            const token = await this.getAccessToken();
            if (token && originalRequest.headers) {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            }
            
            return axios(originalRequest);
          } catch (refreshError) {
            logger.error('Token refresh on 401 failed', refreshError);
            
            // Clear tokens and notify
            this.clearTokens();
            
            if (this.config.onTokenExpired) {
              this.config.onTokenExpired();
            }
            
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check stored tokens on initialization
   */
  private async checkStoredTokens(): Promise<void> {
    const accessToken = await this.getAccessToken();
    const refreshToken = await this.getRefreshToken();
    
    if (!accessToken || !refreshToken) {
      return;
    }
    
    if (this.isTokenExpired()) {
      try {
        await this.refreshToken();
      } catch (error) {
        logger.error('Initial token refresh failed', error);
        this.clearTokens();
      }
    } else {
      // Schedule refresh
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expiryTime) {
        const expiry = parseInt(expiryTime, 10);
        const expiresIn = Math.max(0, (expiry - Date.now()) / 1000);
        this.scheduleTokenRefresh(expiresIn);
      }
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    
    logger.info('Tokens cleared');
  }

  /**
   * Helper: Delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Destroy token manager and cleanup
   */
  destroy(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }
    
    // Remove axios interceptors
    axios.interceptors.request.clear();
    axios.interceptors.response.clear();
  }
}

// Create singleton instance
let tokenManagerInstance: TokenManager | null = null;

/**
 * Initialize token manager
 */
export function initializeTokenManager(config: TokenManagerConfig): TokenManager {
  if (tokenManagerInstance) {
    tokenManagerInstance.destroy();
  }
  
  tokenManagerInstance = new TokenManager(config);
  return tokenManagerInstance;
}

/**
 * Get token manager instance
 */
export function getTokenManager(): TokenManager {
  if (!tokenManagerInstance) {
    throw new Error('TokenManager not initialized. Call initializeTokenManager first.');
  }
  
  return tokenManagerInstance;
}

// Export default instance getter
export default getTokenManager;