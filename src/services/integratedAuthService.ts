/**
 * Integrated Authentication Service for Astral Core V4
 * Bridges optional auth with global store and Supabase
 */

import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useGlobalStore } from '../stores/globalStore';

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  role: 'user' | 'helper' | 'admin';
  isAnonymous: boolean;
  anonymousId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class IntegratedAuthService {
  private listeners: Set<(state: AuthState) => void> = new Set();
  private currentState: AuthState = {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the auth service
   */
  private async initialize(): Promise<void> {
    try {
      // Set up Supabase auth state listener
      supabase.auth.onAuthStateChange((event, session) => {
        this.handleAuthStateChange(event, session);
      });

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        this.updateState({ error: error.message, isLoading: false });
      } else {
        this.handleAuthStateChange('INITIAL_SESSION', session);
      }

      // Set up anonymous user if no session
      if (!session) {
        await this.initializeAnonymousUser();
      }
    } catch (error) {
      this.updateState({
        error: error instanceof Error ? error.message : 'Auth initialization failed',
        isLoading: false
      });
      // Fall back to anonymous user
      await this.initializeAnonymousUser();
    }
  }

  /**
   * Handle Supabase auth state changes
   */
  private handleAuthStateChange(event: string, session: Session | null) {
    console.log(`Processing auth event: ${event}`);

    if (session?.user) {
      // Authenticated user
      const authUser: AuthUser = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
        avatar: session.user.user_metadata?.avatar_url,
        role: this.determineUserRole(session.user),
        isAnonymous: false
      };

      this.updateState({
        user: authUser,
        session,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      // Update global store
      useGlobalStore.getState().setUser(session.user);
    } else {
      // No session - maintain anonymous access
      this.initializeAnonymousUser();
    }
  }

  /**
   * Initialize anonymous user
   */
  private async initializeAnonymousUser(): Promise<void> {
    // Generate or get existing anonymous ID
    let anonymousId = localStorage.getItem('astral_anonymous_id');
    
    if (!anonymousId) {
      anonymousId = 'anon_' + crypto.randomUUID();
      localStorage.setItem('astral_anonymous_id', anonymousId);
    }

    const anonymousUser: AuthUser = {
      id: anonymousId,
      name: 'Anonymous User',
      role: 'user',
      isAnonymous: true,
      anonymousId
    };

    this.updateState({
      user: anonymousUser,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });

    // Update global store with null user (anonymous)
    useGlobalStore.getState().setUser(null);
  }

  /**
   * Determine user role from Supabase user metadata
   */
  private determineUserRole(user: User): 'user' | 'helper' | 'admin' {
    const role = user.user_metadata?.role || user.app_metadata?.role;
    
    if (role === 'admin' || role === 'helper') {
      return role;
    }
    
    return 'user';
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...updates };
    this.notifyListeners();
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.error('Error notifying auth listener:', error);
      }
    });
  }

  // Public API methods

  /**
   * Sign in with email/password
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.updateState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      this.updateState({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Sign up with email/password
   */
  async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {}
        }
      });

      if (error) {
        this.updateState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign up failed';
      this.updateState({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { error } = await supabase.auth.signOut();

      if (error) {
        this.updateState({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      // Will trigger auth state change to anonymous
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign out failed';
      this.updateState({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      this.updateState({ isLoading: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      this.updateState({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: { name?: string; avatar?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ isLoading: true, error: null });

      const { error } = await supabase.auth.updateUser({
        data: updates
      });

      this.updateState({ isLoading: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed';
      this.updateState({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  }

  /**
   * Get current auth state
   */
  getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Subscribe to auth state changes
   */
  subscribe(callback: (state: AuthState) => void): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current state
    callback(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Check if user is authenticated (not anonymous)
   */
  isAuthenticated(): boolean {
    return this.currentState.isAuthenticated && !this.currentState.user?.isAnonymous;
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: 'user' | 'helper' | 'admin'): boolean {
    return this.currentState.user?.role === role;
  }

  /**
   * Check if user is anonymous
   */
  isAnonymous(): boolean {
    return this.currentState.user?.isAnonymous ?? true;
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentState.user;
  }

  /**
   * Get current session
   */
  getCurrentSession(): Session | null {
    return this.currentState.session;
  }
}

// Export singleton instance
export const integratedAuthService = new IntegratedAuthService();
export default integratedAuthService;
