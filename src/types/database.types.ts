/**
 * Database Types
 * TODO: Implement complete database type definitions
 * This is a placeholder for database types - integrate with your actual database schema
 */

export interface DatabaseUser {
  id: string;
  email: string | null;
  role: 'admin' | 'therapist' | 'helper' | 'user';
  username: string | null;
  auth_provider: 'email' | 'google' | 'anonymous';
  auth_provider_id: string | null;
  is_verified: boolean;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  last_seen: string;
}

export interface DatabaseUserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  language: string;
  date_of_birth: string | null;
  mental_health_goals: string[] | null;
  crisis_keywords: string[] | null;
  preferred_intervention_style: 'gentle' | 'direct' | 'clinical' | 'peer' | null;
  privacy_level: 'private' | 'community' | 'helpers_only';
  created_at: string;
  updated_at: string;
}

export interface DatabaseCrisisEvent {
  id: string;
  user_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  trigger_type: 'keyword' | 'behavioral' | 'manual' | 'ai_detected' | 'panic_button' | null;
  detected_keywords: string[] | null;
  confidence_score: number | null;
  intervention_type: 'breathing' | 'grounding' | 'safety_plan' | 'emergency_contact' | 'hotline' | 'professional' | null;
  response_time_seconds: number | null;
  resolved: boolean;
  resolution_method: string | null;
  location_context: any | null;
  device_context: any | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DatabaseMoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  energy_level: number | null;
  anxiety_level: number | null;
  sleep_quality: number | null;
  triggers: string[] | null;
  activities: string[] | null;
  notes: string | null;
  weather: string | null;
  social_interaction: boolean | null;
  exercise: boolean | null;
  medication_taken: boolean | null;
  created_at: string;
}

export interface DatabaseSafetyPlan {
  id: string;
  user_id: string;
  warning_signs: string[] | null;
  coping_strategies: string[] | null;
  social_supports: string[] | null;
  environmental_safety: any | null;
  professional_contacts: any | null;
  crisis_contacts: any | null;
  is_active: boolean;
  effectiveness_rating: number | null;
  last_reviewed: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseEmergencyContact {
  id: string;
  user_id: string;
  name: string;
  relationship: string | null;
  phone_number: string | null;
  email: string | null;
  contact_method: 'phone' | 'text' | 'email';
  crisis_only: boolean;
  priority_order: number;
  availability_schedule: any | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Type aliases for compatibility
export type DbUser = DatabaseUser;
export type DbUserProfile = DatabaseUserProfile;
export type DbCrisisEvent = DatabaseCrisisEvent;
export type DbMoodEntry = DatabaseMoodEntry;
export type DbSafetyPlan = DatabaseSafetyPlan;
export type DbEmergencyContact = DatabaseEmergencyContact;