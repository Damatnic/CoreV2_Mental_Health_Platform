-- CoreV2 Mental Health Platform - Initial Database Setup
-- Migration: 001_initial_setup
-- Version: 1.0.0
-- Created: 2025-08-14

-- This migration creates the initial database structure
-- Run migrations in order: 001, 002, 003, etc.

BEGIN;

-- Check if migration has already been run
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'migrations') THEN
        CREATE TABLE migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) UNIQUE NOT NULL,
            executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;
END $$;

-- Check if this migration has already been executed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM migrations WHERE migration_name = '001_initial_setup') THEN
        RAISE EXCEPTION 'Migration 001_initial_setup has already been executed';
    END IF;
END $$;

-- Run the schema files
\i ../schema/01_users.sql
\i ../schema/02_wellness.sql
\i ../schema/03_safety.sql
\i ../schema/04_community.sql

-- Record migration execution
INSERT INTO migrations (migration_name) VALUES ('001_initial_setup');

COMMIT;

-- Grant necessary permissions (adjust based on your user setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO your_app_user;