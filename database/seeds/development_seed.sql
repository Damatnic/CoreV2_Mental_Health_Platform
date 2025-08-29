-- AstralCore V4 Development Seed Data
-- Creates development accounts and sample data for testing

-- Clear existing data (for development only)
TRUNCATE TABLE crisis_escalation_logs CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE crisis_events CASCADE;
TRUNCATE TABLE mood_entries CASCADE;
TRUNCATE TABLE emergency_contacts CASCADE;
TRUNCATE TABLE safety_plans CASCADE;
TRUNCATE TABLE user_analytics CASCADE;
TRUNCATE TABLE notification_logs CASCADE;
TRUNCATE TABLE user_sessions CASCADE;
TRUNCATE TABLE helper_profiles CASCADE;
TRUNCATE TABLE user_relationships CASCADE;
TRUNCATE TABLE user_preferences CASCADE;
TRUNCATE TABLE user_profiles CASCADE;
TRUNCATE TABLE users CASCADE;

-- =============================================================================
-- DEVELOPMENT USERS
-- =============================================================================

-- Admin user
INSERT INTO users (id, email, role, username, auth_provider, is_verified, is_anonymous) VALUES
('admin-dev-001', 'admin@astralcore.dev', 'admin', 'admin', 'email', true, false);

-- Therapist users
INSERT INTO users (id, email, role, username, auth_provider, is_verified, is_anonymous) VALUES
('therapist-dev-001', 'therapist@astralcore.dev', 'therapist', 'dr_smith', 'email', true, false),
('therapist-dev-002', 'therapist2@astralcore.dev', 'therapist', 'dr_johnson', 'email', true, false);

-- Helper users
INSERT INTO users (id, email, role, username, auth_provider, is_verified, is_anonymous) VALUES
('helper-dev-001', 'helper@astralcore.dev', 'helper', 'peer_sarah', 'email', true, false),
('helper-dev-002', 'helper2@astralcore.dev', 'helper', 'peer_mike', 'email', true, false);

-- Regular users for testing
INSERT INTO users (id, email, role, username, auth_provider, is_verified, is_anonymous) VALUES
('user-dev-001', 'user@astralcore.dev', 'user', 'alex_user', 'email', true, false),
('user-dev-002', 'user2@astralcore.dev', 'user', 'casey_test', 'email', true, false),
('user-dev-003', 'user3@astralcore.dev', 'user', 'jordan_demo', 'email', false, false);

-- Anonymous users for testing
INSERT INTO users (id, role, auth_provider, is_verified, is_anonymous) VALUES
('anon-dev-001', 'user', 'anonymous', false, true),
('anon-dev-002', 'user', 'anonymous', false, true);

-- =============================================================================
-- USER PROFILES
-- =============================================================================

-- Admin profile
INSERT INTO user_profiles (user_id, display_name, timezone, language, mental_health_goals, privacy_level) VALUES
('admin-dev-001', 'AstralCore Admin', 'America/New_York', 'en', 
 ARRAY['Platform oversight', 'User safety'], 'private');

-- Therapist profiles
INSERT INTO user_profiles (user_id, display_name, timezone, language, mental_health_goals, preferred_intervention_style, privacy_level) VALUES
('therapist-dev-001', 'Dr. Sarah Smith', 'America/New_York', 'en', 
 ARRAY['Crisis intervention', 'Cognitive behavioral therapy'], 'clinical', 'helpers_only'),
('therapist-dev-002', 'Dr. Mark Johnson', 'America/Los_Angeles', 'en', 
 ARRAY['Trauma therapy', 'Depression treatment'], 'direct', 'helpers_only');

-- Helper profiles
INSERT INTO user_profiles (user_id, display_name, timezone, language, mental_health_goals, preferred_intervention_style, privacy_level) VALUES
('helper-dev-001', 'Sarah P.', 'America/Chicago', 'en', 
 ARRAY['Peer support', 'Recovery mentoring'], 'gentle', 'community'),
('helper-dev-002', 'Mike R.', 'America/Denver', 'en', 
 ARRAY['Crisis support', 'Anxiety help'], 'peer', 'community');

-- User profiles
INSERT INTO user_profiles (user_id, display_name, timezone, language, mental_health_goals, crisis_keywords, preferred_intervention_style, privacy_level) VALUES
('user-dev-001', 'Alex', 'America/New_York', 'en', 
 ARRAY['Manage anxiety', 'Improve mood'], ARRAY['stress', 'overwhelmed'], 'gentle', 'private'),
('user-dev-002', 'Casey', 'America/Los_Angeles', 'en', 
 ARRAY['Depression support', 'Build coping skills'], ARRAY['sad', 'hopeless'], 'direct', 'community'),
('user-dev-003', 'Jordan', 'America/Chicago', 'en', 
 ARRAY['Crisis management', 'Find stability'], ARRAY['crisis', 'panic'], 'clinical', 'private');

-- Anonymous profiles
INSERT INTO user_profiles (user_id, display_name, timezone, language, preferred_intervention_style, privacy_level) VALUES
('anon-dev-001', 'Anonymous User', 'UTC', 'en', 'gentle', 'private'),
('anon-dev-002', 'Anonymous User', 'UTC', 'en', 'peer', 'private');

-- =============================================================================
-- USER PREFERENCES
-- =============================================================================

-- Set preferences for all users
INSERT INTO user_preferences (user_id, theme, high_contrast, reduce_motion, font_size, crisis_notifications, mood_reminders, daily_check_ins, peer_messages, quick_exit_enabled, panic_button_visible, auto_crisis_detection) VALUES
('admin-dev-001', 'dark', false, false, 'medium', true, false, false, true, true, true, true),
('therapist-dev-001', 'light', false, false, 'medium', true, false, false, true, false, false, true),
('therapist-dev-002', 'auto', false, false, 'large', true, false, false, true, false, false, true),
('helper-dev-001', 'light', false, false, 'medium', true, true, false, true, true, true, true),
('helper-dev-002', 'dark', false, false, 'medium', true, true, false, true, true, true, true),
('user-dev-001', 'auto', false, false, 'medium', true, true, true, true, true, true, true),
('user-dev-002', 'light', true, false, 'large', true, true, true, true, true, true, true),
('user-dev-003', 'dark', false, true, 'medium', true, true, false, false, true, true, true),
('anon-dev-001', 'auto', false, false, 'medium', true, false, false, false, true, true, true),
('anon-dev-002', 'light', false, false, 'medium', true, false, false, false, true, true, true);

-- =============================================================================
-- HELPER PROFILES
-- =============================================================================

-- Professional therapist profiles
INSERT INTO helper_profiles (
    user_id, license_type, license_state, certification_body, is_verified, verification_date,
    specializations, experience_years, approach_methods, available_for_crisis, 
    max_concurrent_clients, response_time_target, average_rating, total_sessions
) VALUES
('therapist-dev-001', 'Licensed Clinical Social Worker', 'NY', 'NASW', true, NOW(),
 ARRAY['Crisis Intervention', 'CBT', 'Trauma Therapy'], 8, 
 ARRAY['Cognitive Behavioral Therapy', 'Crisis Intervention', 'Mindfulness'], true, 
 10, 15, 4.8, 1247),
('therapist-dev-002', 'Licensed Professional Counselor', 'CA', 'ACA', true, NOW(),
 ARRAY['Depression', 'Anxiety', 'PTSD'], 12, 
 ARRAY['Psychodynamic Therapy', 'EMDR', 'Solution-Focused'], true, 
 8, 20, 4.9, 2156);

-- Peer support helper profiles  
INSERT INTO helper_profiles (
    user_id, certification_body, is_verified, verification_date,
    specializations, experience_years, approach_methods, available_for_crisis,
    max_concurrent_clients, response_time_target, average_rating, total_sessions
) VALUES
('helper-dev-001', 'Peer Support Certification', true, NOW(),
 ARRAY['Peer Support', 'Recovery', 'Crisis Support'], 3,
 ARRAY['Peer Support', 'Lived Experience', 'Active Listening'], true,
 15, 30, 4.7, 423),
('helper-dev-002', 'Crisis Support Training', true, NOW(),
 ARRAY['Crisis Support', 'Anxiety', 'Panic Disorders'], 2,
 ARRAY['Peer Support', 'Crisis De-escalation', 'Breathing Techniques'], true,
 12, 25, 4.6, 287);

-- =============================================================================
-- SAMPLE SAFETY PLANS
-- =============================================================================

-- Safety plan for user-dev-001 (Alex)
INSERT INTO safety_plans (
    user_id, warning_signs, coping_strategies, social_supports, environmental_safety,
    professional_contacts, crisis_contacts, is_active, effectiveness_rating
) VALUES
('user-dev-001', 
 ARRAY['Feeling overwhelmed', 'Difficulty sleeping', 'Avoiding friends', 'Negative self-talk'],
 ARRAY['Deep breathing exercises', 'Listen to calming music', 'Take a warm bath', 'Call a friend', 'Practice mindfulness'],
 ARRAY['Best friend Sarah - very supportive', 'Sister Emma - always available', 'Mom - good listener'],
 '{"safe_spaces": ["bedroom", "local park"], "remove_items": ["alcohol"], "comfort_items": ["journal", "essential oils"]}',
 '{"therapist": {"name": "Dr. Smith", "phone": "555-0123"}}',
 '{"emergency": "911", "crisis_line": "988", "text_line": "741741"}',
 true, 8);

-- Safety plan for user-dev-002 (Casey)  
INSERT INTO safety_plans (
    user_id, warning_signs, coping_strategies, social_supports, environmental_safety,
    professional_contacts, crisis_contacts, is_active, effectiveness_rating
) VALUES
('user-dev-002',
 ARRAY['Feeling hopeless', 'Loss of appetite', 'Sleeping too much', 'Thoughts of self-harm'],
 ARRAY['Reach out to support network', 'Use grounding techniques', 'Exercise or walk', 'Write in journal', 'Watch comfort shows'],
 ARRAY['Partner Alex - very understanding', 'Therapist Dr. Johnson', 'Support group friends'],
 '{"safe_spaces": ["living room", "therapist office"], "remove_items": ["sharp objects"], "comfort_items": ["weighted blanket", "photos"]}',
 '{"therapist": {"name": "Dr. Johnson", "phone": "555-0456"}, "psychiatrist": {"name": "Dr. Lee", "phone": "555-0789"}}',
 '{"emergency": "911", "crisis_line": "988", "local_crisis": "555-HELP"}',
 true, 9);

-- =============================================================================
-- EMERGENCY CONTACTS
-- =============================================================================

-- Emergency contacts for user-dev-001
INSERT INTO emergency_contacts (user_id, name, relationship, phone_number, email, contact_method, crisis_only, priority_order, timezone) VALUES
('user-dev-001', 'Sarah Best Friend', 'Best Friend', '555-1234', 'sarah@email.com', 'phone', false, 1, 'America/New_York'),
('user-dev-001', 'Emma Sister', 'Sister', '555-5678', 'emma@email.com', 'text', false, 2, 'America/New_York'),
('user-dev-001', 'Mom', 'Mother', '555-9999', 'mom@email.com', 'phone', true, 3, 'America/New_York');

-- Emergency contacts for user-dev-002
INSERT INTO emergency_contacts (user_id, name, relationship, phone_number, email, contact_method, crisis_only, priority_order, timezone) VALUES
('user-dev-002', 'Alex Partner', 'Partner', '555-2468', 'alex@email.com', 'phone', false, 1, 'America/Los_Angeles'),
('user-dev-002', 'Crisis Hotline', 'Professional', '988', null, 'phone', true, 2, 'America/Los_Angeles');

-- =============================================================================
-- SAMPLE MOOD ENTRIES
-- =============================================================================

-- Mood entries for user-dev-001 (last 30 days)
INSERT INTO mood_entries (user_id, mood_score, energy_level, anxiety_level, sleep_quality, triggers, activities, notes, social_interaction, exercise, created_at) VALUES
('user-dev-001', 6, 7, 4, 8, ARRAY['work stress'], ARRAY['meditation', 'reading'], 'Good day overall', true, true, NOW() - INTERVAL '1 day'),
('user-dev-001', 4, 5, 7, 5, ARRAY['family conflict'], ARRAY['journaling'], 'Feeling anxious about family dinner', false, false, NOW() - INTERVAL '2 days'),
('user-dev-001', 7, 8, 3, 8, ARRAY[], ARRAY['exercise', 'music'], 'Great workout session!', true, true, NOW() - INTERVAL '3 days'),
('user-dev-001', 5, 6, 6, 6, ARRAY['work deadline'], ARRAY['breathing exercises'], 'Manageable stress levels', true, false, NOW() - INTERVAL '4 days'),
('user-dev-001', 8, 9, 2, 9, ARRAY[], ARRAY['social time', 'nature'], 'Perfect day with friends', true, true, NOW() - INTERVAL '5 days');

-- Mood entries for user-dev-002 (last 30 days)
INSERT INTO mood_entries (user_id, mood_score, energy_level, anxiety_level, sleep_quality, triggers, activities, notes, social_interaction, exercise, medication_taken, created_at) VALUES
('user-dev-002', 3, 4, 8, 4, ARRAY['depression episode'], ARRAY['rest'], 'Struggling today', false, false, true, NOW() - INTERVAL '1 day'),
('user-dev-002', 5, 6, 6, 7, ARRAY[], ARRAY['therapy session'], 'Therapy was helpful', true, false, true, NOW() - INTERVAL '2 days'),
('user-dev-002', 4, 5, 7, 5, ARRAY['loneliness'], ARRAY['tv', 'comfort food'], 'Feeling isolated', false, false, true, NOW() - INTERVAL '3 days'),
('user-dev-002', 6, 7, 5, 8, ARRAY[], ARRAY['friend visit', 'cooking'], 'Friend came over, felt better', true, false, true, NOW() - INTERVAL '4 days'),
('user-dev-002', 7, 8, 4, 8, ARRAY[], ARRAY['exercise', 'music'], 'Good energy today', true, true, true, NOW() - INTERVAL '5 days');

-- =============================================================================
-- SAMPLE CRISIS EVENTS
-- =============================================================================

-- Crisis events for testing (resolved)
INSERT INTO crisis_events (user_id, severity, trigger_type, detected_keywords, confidence_score, intervention_type, response_time_seconds, resolved, resolution_method, created_at, resolved_at) VALUES
('user-dev-001', 'medium', 'keyword', ARRAY['overwhelmed', 'stress'], 0.65, 'breathing', 45, true, 'breathing_exercise_completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '10 minutes'),
('user-dev-002', 'high', 'behavioral', ARRAY['hopeless'], 0.82, 'safety_plan', 30, true, 'safety_plan_reviewed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '25 minutes'),
('user-dev-001', 'low', 'ai_detected', ARRAY['anxious'], 0.45, 'grounding', 60, true, 'grounding_technique_used', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '8 minutes');

-- Active crisis for testing
INSERT INTO crisis_events (user_id, severity, trigger_type, detected_keywords, confidence_score, intervention_type, response_time_seconds, resolved, created_at) VALUES
('user-dev-002', 'medium', 'manual', ARRAY['struggling'], 0.55, 'breathing', 25, false, NOW() - INTERVAL '1 hour');

-- =============================================================================
-- SAMPLE CHAT MESSAGES
-- =============================================================================

-- Chat conversation for user-dev-001
INSERT INTO chat_messages (user_id, conversation_id, message_content, is_ai_message, ai_model, crisis_confidence_score, tokens_used, response_time_ms, created_at) VALUES
('user-dev-001', 'conv-alex-001', 'I''ve been feeling really stressed about work lately', false, null, 0.3, null, null, NOW() - INTERVAL '2 hours'),
('user-dev-001', 'conv-alex-001', 'I can understand how work stress can feel overwhelming. It''s completely normal to feel this way sometimes. Would you like to talk about what specifically is causing you the most stress?', true, 'gpt-4', 0.0, 42, 850, NOW() - INTERVAL '2 hours' + INTERVAL '30 seconds'),
('user-dev-001', 'conv-alex-001', 'It''s the deadline pressure and my manager keeps adding more tasks', false, null, 0.2, null, null, NOW() - INTERVAL '2 hours' + INTERVAL '2 minutes'),
('user-dev-001', 'conv-alex-001', 'That sounds really challenging. When you have multiple demands like that, it can help to break things down. Have you been able to use any stress management techniques that have worked for you before?', true, 'gpt-4', 0.0, 38, 920, NOW() - INTERVAL '2 hours' + INTERVAL '2 minutes 30 seconds');

-- Chat conversation for user-dev-002
INSERT INTO chat_messages (user_id, conversation_id, message_content, is_ai_message, ai_model, crisis_keywords_detected, crisis_confidence_score, intervention_triggered, tokens_used, response_time_ms, created_at) VALUES
('user-dev-002', 'conv-casey-001', 'I don''t know if I can keep going like this', false, null, ARRAY['can''t keep going'], 0.7, false, null, null, NOW() - INTERVAL '1 hour'),
('user-dev-002', 'conv-casey-001', 'I hear that you''re going through a really difficult time right now. That takes courage to share with me. You''re not alone in this. Would you like to talk about what''s making things feel so hard right now?', true, 'gpt-4', null, 0.0, true, 48, 1200, NOW() - INTERVAL '1 hour' + INTERVAL '45 seconds');

-- =============================================================================
-- SAMPLE ANALYTICS DATA
-- =============================================================================

-- User analytics for the past week
INSERT INTO user_analytics (user_id, feature_used, session_duration, interaction_count, crisis_prevented_count, safety_plan_accessed_count, breathing_exercises_used, date) VALUES
('user-dev-001', 'mood_tracker', 180, 3, 0, 0, 0, CURRENT_DATE - 1),
('user-dev-001', 'ai_chat', 450, 8, 1, 0, 1, CURRENT_DATE - 1),
('user-dev-001', 'breathing_exercise', 300, 1, 0, 0, 1, CURRENT_DATE - 2),
('user-dev-002', 'safety_plan', 240, 2, 0, 1, 0, CURRENT_DATE - 1),
('user-dev-002', 'ai_chat', 600, 12, 1, 1, 0, CURRENT_DATE - 1),
('user-dev-002', 'crisis_resources', 120, 2, 0, 0, 0, CURRENT_DATE - 2);

-- =============================================================================
-- SAMPLE NOTIFICATIONS
-- =============================================================================

-- Recent notifications
INSERT INTO notification_logs (user_id, notification_type, delivery_method, status, opened, title, message, created_at) VALUES
('user-dev-001', 'mood_reminder', 'in_app', 'delivered', true, 'Daily Mood Check', 'How are you feeling today?', NOW() - INTERVAL '6 hours'),
('user-dev-002', 'crisis_alert', 'push', 'delivered', true, 'Crisis Support Available', 'We noticed you might be struggling. Support is available.', NOW() - INTERVAL '2 hours'),
('user-dev-001', 'check_in', 'in_app', 'delivered', false, 'Weekly Check-in', 'How has your week been?', NOW() - INTERVAL '1 day'),
('helper-dev-001', 'crisis_alert', 'push', 'delivered', true, 'Crisis Support Needed', 'A user needs immediate support.', NOW() - INTERVAL '1 hour');

-- =============================================================================
-- USER RELATIONSHIPS
-- =============================================================================

-- Peer support relationships
INSERT INTO user_relationships (user_id, related_user_id, relationship_type, status, support_focus, crisis_support_enabled) VALUES
('user-dev-001', 'helper-dev-001', 'peer_support', 'active', ARRAY['anxiety', 'stress management'], true),
('user-dev-002', 'helper-dev-002', 'peer_support', 'active', ARRAY['depression', 'crisis support'], true),
('user-dev-002', 'therapist-dev-002', 'helper_client', 'active', ARRAY['depression', 'therapy'], true);

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

SELECT 'Development seed data created successfully! 🌱' as status,
       'Users created: 9 (1 admin, 2 therapists, 2 helpers, 4 regular users)' as users,
       'Sample data includes: profiles, preferences, safety plans, mood entries, crisis events, chat messages' as data_types;

-- Show created users
SELECT 
    username,
    role,
    CASE WHEN is_anonymous THEN 'Anonymous' ELSE email END as identifier,
    is_verified as verified
FROM users 
ORDER BY 
    CASE role 
        WHEN 'admin' THEN 1 
        WHEN 'therapist' THEN 2 
        WHEN 'helper' THEN 3 
        ELSE 4 
    END,
    username;