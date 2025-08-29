/**
 * Production Database Schema
 * Complete schema definition for the mental health platform
 * HIPAA-compliant with encryption and audit trails
 */

import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  decimal,
  pgEnum,
  index,
  uniqueIndex,
  primaryKey,
  varchar
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for type safety
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'helper',
  'therapist',
  'psychiatrist',
  'admin',
  'crisis_counselor'
]);

export const moodEnum = pgEnum('mood', [
  'very_sad',
  'sad',
  'neutral',
  'happy',
  'very_happy'
]);

export const crisisSeverityEnum = pgEnum('crisis_severity', [
  'low',
  'medium',
  'high',
  'critical',
  'emergency'
]);

export const sessionStatusEnum = pgEnum('session_status', [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
]);

// ============================================
// USER MANAGEMENT TABLES
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  passwordHash: text('password_hash'), // Encrypted
  role: userRoleEnum('role').default('user').notNull(),
  isAnonymous: boolean('is_anonymous').default(false),
  anonymousId: varchar('anonymous_id', { length: 100 }),
  
  // Profile data (encrypted)
  firstName: text('first_name'),
  lastName: text('last_name'),
  displayName: varchar('display_name', { length: 100 }),
  avatar: text('avatar_url'),
  bio: text('bio'),
  
  // Security
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: text('two_factor_secret'), // Encrypted
  lastLoginAt: timestamp('last_login_at'),
  lastActivityAt: timestamp('last_activity_at'),
  loginAttempts: integer('login_attempts').default(0),
  lockedUntil: timestamp('locked_until'),
  
  // Compliance
  termsAcceptedAt: timestamp('terms_accepted_at'),
  privacyAcceptedAt: timestamp('privacy_accepted_at'),
  dataRetentionConsent: boolean('data_retention_consent').default(true),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
  
  // Indexes
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  anonymousIdx: index('users_anonymous_idx').on(table.anonymousId),
}));

// Professional profiles for helpers/therapists
export const professionalProfiles = pgTable('professional_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Credentials (encrypted)
  licenseNumber: text('license_number'),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpiry: timestamp('license_expiry'),
  npiNumber: text('npi_number'), // National Provider Identifier
  
  // Verification
  verificationStatus: varchar('verification_status', { length: 50 }).default('pending'),
  verifiedAt: timestamp('verified_at'),
  verifiedBy: uuid('verified_by').references(() => users.id),
  verificationDocuments: jsonb('verification_documents'), // Encrypted URLs
  
  // Professional info
  specializations: jsonb('specializations').$type<string[]>(),
  languages: jsonb('languages').$type<string[]>(),
  education: jsonb('education'), // Encrypted
  experience: jsonb('experience'), // Encrypted
  certifications: jsonb('certifications'), // Encrypted
  
  // Availability
  availableHours: jsonb('available_hours'),
  timezone: varchar('timezone', { length: 50 }),
  acceptingClients: boolean('accepting_clients').default(true),
  
  // Settings
  sessionRate: decimal('session_rate', { precision: 10, scale: 2 }),
  insuranceAccepted: jsonb('insurance_accepted').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('professional_user_idx').on(table.userId),
  verificationIdx: index('professional_verification_idx').on(table.verificationStatus),
}));

// ============================================
// MENTAL HEALTH DATA TABLES
// ============================================

export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  mood: moodEnum('mood').notNull(),
  moodScore: integer('mood_score').notNull(), // 1-10 scale
  
  // Detailed tracking
  emotions: jsonb('emotions').$type<string[]>(),
  triggers: jsonb('triggers').$type<string[]>(),
  activities: jsonb('activities').$type<string[]>(),
  sleepHours: decimal('sleep_hours', { precision: 3, scale: 1 }),
  energyLevel: integer('energy_level'), // 1-10
  anxietyLevel: integer('anxiety_level'), // 1-10
  stressLevel: integer('stress_level'), // 1-10
  
  // Context
  notes: text('notes'), // Encrypted
  location: varchar('location', { length: 100 }),
  weather: varchar('weather', { length: 50 }),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('mood_user_idx').on(table.userId),
  createdIdx: index('mood_created_idx').on(table.createdAt),
  moodIdx: index('mood_mood_idx').on(table.mood),
}));

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  type: varchar('type', { length: 50 }).notNull(), // PHQ-9, GAD-7, etc.
  score: integer('score').notNull(),
  severity: varchar('severity', { length: 50 }),
  
  // Responses (encrypted)
  responses: jsonb('responses').notNull(),
  interpretation: text('interpretation'),
  recommendations: jsonb('recommendations').$type<string[]>(),
  
  // Clinical notes
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  clinicalNotes: text('clinical_notes'), // Encrypted
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('assessment_user_idx').on(table.userId),
  typeIdx: index('assessment_type_idx').on(table.type),
  createdIdx: index('assessment_created_idx').on(table.createdAt),
}));

// ============================================
// CRISIS MANAGEMENT TABLES
// ============================================

export const crisisEvents = pgTable('crisis_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  severity: crisisSeverityEnum('severity').notNull(),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
  triggerDetails: jsonb('trigger_details'), // Encrypted
  
  // Detection
  detectedBy: varchar('detected_by', { length: 50 }).notNull(), // system, user, helper
  detectionMethod: varchar('detection_method', { length: 100 }),
  keywords: jsonb('keywords').$type<string[]>(),
  confidenceScore: decimal('confidence_score', { precision: 3, scale: 2 }),
  
  // Response
  responseStatus: varchar('response_status', { length: 50 }).notNull(),
  respondedBy: uuid('responded_by').references(() => users.id),
  respondedAt: timestamp('responded_at'),
  responseActions: jsonb('response_actions'),
  
  // Escalation
  escalated: boolean('escalated').default(false),
  escalatedTo: varchar('escalated_to', { length: 100 }),
  escalatedAt: timestamp('escalated_at'),
  escalationNotes: text('escalation_notes'), // Encrypted
  
  // Resolution
  resolved: boolean('resolved').default(false),
  resolvedAt: timestamp('resolved_at'),
  resolutionNotes: text('resolution_notes'), // Encrypted
  followUpRequired: boolean('follow_up_required').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('crisis_user_idx').on(table.userId),
  severityIdx: index('crisis_severity_idx').on(table.severity),
  statusIdx: index('crisis_status_idx').on(table.responseStatus),
  createdIdx: index('crisis_created_idx').on(table.createdAt),
}));

export const safetyPlans = pgTable('safety_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  
  // Warning signs (encrypted)
  warningSigns: jsonb('warning_signs').$type<string[]>().notNull(),
  
  // Coping strategies (encrypted)
  copingStrategies: jsonb('coping_strategies').$type<string[]>().notNull(),
  
  // Support network (encrypted)
  supportContacts: jsonb('support_contacts').notNull(),
  emergencyContacts: jsonb('emergency_contacts').notNull(),
  
  // Professional contacts (encrypted)
  professionalContacts: jsonb('professional_contacts'),
  
  // Safe environment
  safeEnvironment: jsonb('safe_environment'),
  
  // Reasons for living (encrypted)
  reasonsForLiving: jsonb('reasons_for_living').$type<string[]>(),
  
  // Metadata
  isActive: boolean('is_active').default(true),
  lastReviewedAt: timestamp('last_reviewed_at'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdx: uniqueIndex('safety_plan_user_idx').on(table.userId),
  activeIdx: index('safety_plan_active_idx').on(table.isActive),
}));

// ============================================
// COMMUNICATION TABLES
// ============================================

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => users.id).notNull(),
  helperId: uuid('helper_id').references(() => users.id).notNull(),
  
  status: sessionStatusEnum('status').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // chat, video, phone
  
  // Scheduling
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  duration: integer('duration'), // minutes
  
  // Session data (encrypted)
  notes: text('notes'),
  clientNotes: text('client_notes'),
  helperNotes: text('helper_notes'),
  recordings: jsonb('recordings'), // Encrypted URLs
  
  // Clinical info
  treatmentGoals: jsonb('treatment_goals'),
  interventionsUsed: jsonb('interventions_used').$type<string[]>(),
  homework: jsonb('homework'),
  
  // Ratings
  clientRating: integer('client_rating'),
  helperRating: integer('helper_rating'),
  
  // Billing
  rate: decimal('rate', { precision: 10, scale: 2 }),
  paid: boolean('paid').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdx: index('session_client_idx').on(table.clientId),
  helperIdx: index('session_helper_idx').on(table.helperId),
  statusIdx: index('session_status_idx').on(table.status),
  scheduledIdx: index('session_scheduled_idx').on(table.scheduledAt),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => sessions.id),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  recipientId: uuid('recipient_id').references(() => users.id),
  
  // Content (encrypted)
  content: text('content').notNull(),
  
  // Message type
  type: varchar('type', { length: 50 }).default('text'),
  attachments: jsonb('attachments'), // Encrypted URLs
  
  // Status
  delivered: boolean('delivered').default(false),
  read: boolean('read').default(false),
  readAt: timestamp('read_at'),
  
  // Moderation
  flagged: boolean('flagged').default(false),
  flagReason: varchar('flag_reason', { length: 255 }),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  
  // Crisis detection
  crisisDetected: boolean('crisis_detected').default(false),
  crisisKeywords: jsonb('crisis_keywords').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  sessionIdx: index('message_session_idx').on(table.sessionId),
  senderIdx: index('message_sender_idx').on(table.senderId),
  recipientIdx: index('message_recipient_idx').on(table.recipientId),
  createdIdx: index('message_created_idx').on(table.createdAt),
}));

// ============================================
// AUDIT & COMPLIANCE TABLES
// ============================================

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  
  // Details (encrypted for sensitive data)
  details: jsonb('details'),
  
  // Request info
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Result
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  userIdx: index('audit_user_idx').on(table.userId),
  actionIdx: index('audit_action_idx').on(table.action),
  timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
}));

// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  professionalProfile: one(professionalProfiles, {
    fields: [users.id],
    references: [professionalProfiles.userId],
  }),
  moodEntries: many(moodEntries),
  assessments: many(assessments),
  crisisEvents: many(crisisEvents),
  safetyPlan: one(safetyPlans),
  clientSessions: many(sessions),
  sentMessages: many(messages),
  auditLogs: many(auditLogs),
}));

export const professionalProfilesRelations = relations(professionalProfiles, ({ one }) => ({
  user: one(users, {
    fields: [professionalProfiles.userId],
    references: [users.id],
  }),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [assessments.reviewedBy],
    references: [users.id],
  }),
}));

export const crisisEventsRelations = relations(crisisEvents, ({ one }) => ({
  user: one(users, {
    fields: [crisisEvents.userId],
    references: [users.id],
  }),
  responder: one(users, {
    fields: [crisisEvents.respondedBy],
    references: [users.id],
  }),
}));

export const safetyPlansRelations = relations(safetyPlans, ({ one }) => ({
  user: one(users, {
    fields: [safetyPlans.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [safetyPlans.reviewedBy],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  client: one(users, {
    fields: [sessions.clientId],
    references: [users.id],
  }),
  helper: one(users, {
    fields: [sessions.helperId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(sessions, {
    fields: [messages.sessionId],
    references: [sessions.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
  }),
  moderator: one(users, {
    fields: [messages.moderatedBy],
    references: [users.id],
  }),
}));