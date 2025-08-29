import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Environment configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Supabase client configuration
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'astral-core-auth',
      storage: typeof window !== 'undefined' ? window.localStorage : undefined
    },
    realtime: {
      params: { eventsPerSecond: 10 }
    },
    global: {
      headers: { 'X-Client-Info': 'astral-core-v4' }
    },
    db: {
      schema: 'public'
    }
  }
);

// Real-time subscription manager
export class RealtimeManager {
  private subscriptions: Map<string, any> = new Map();

  subscribeToCrisisEvents(userId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`crisis-events-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'crisis_events',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`crisis-${userId}`, subscription);
    return subscription;
  }

  subscribeToMoodUpdates(userId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`mood-updates-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_entries',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`mood-${userId}`, subscription);
    return subscription;
  }

  subscribeToSafetyPlanUpdates(userId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`safety-plan-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'safety_plans',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`safety-plan-${userId}`, subscription);
    return subscription;
  }

  subscribeToChat(chatId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_id=eq.${chatId}`
        },
        callback
      )
      .subscribe();

    this.subscriptions.set(`chat-${chatId}`, subscription);
    return subscription;
  }

  subscribeToPresence(roomId: string, callback: (payload: any) => void) {
    const subscription = supabase
      .channel(`presence-${roomId}`)
      .on('presence', { event: 'sync' }, callback)
      .on('presence', { event: 'join' }, callback)
      .on('presence', { event: 'leave' }, callback)
      .subscribe();

    this.subscriptions.set(`presence-${roomId}`, subscription);
    return subscription;
  }

  unsubscribe(key: string) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  unsubscribeAll() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const realtimeManager = new RealtimeManager();

// Helper functions for common operations
export const supabaseHelpers = {
  // Check if user exists
  async userExists(email: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    return !error && !!data;
  },

  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Record<string, any>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  },

  // Create user profile
  async createUserProfile(userId: string, profileData: Record<string, any>) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    return data;
  },

  // Upload file to storage
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return data;
  },

  // Get file URL from storage
  getFileUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  },

  // Delete file from storage
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('Error deleting file:', error);
      throw error;
    }

    return true;
  },

  // Execute RPC function
  async executeRPC(functionName: string, params?: Record<string, any>) {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      console.error(`Error executing RPC ${functionName}:`, error);
      throw error;
    }

    return data;
  },

  // Batch operations
  async batchInsert(table: string, rows: Record<string, any>[]) {
    const { data, error } = await supabase
      .from(table)
      .insert(rows)
      .select();

    if (error) {
      console.error(`Error batch inserting into ${table}:`, error);
      throw error;
    }

    return data;
  },

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      return !error;
    } catch (error) {
      console.error('Supabase health check failed:', error);
      return false;
    }
  }
};

export default supabase;
