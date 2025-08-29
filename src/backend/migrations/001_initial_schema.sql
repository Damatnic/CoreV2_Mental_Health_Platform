-- Migration: 001_initial_schema
-- Created: 2024-01-01
-- Description: Initial database schema for Mental Health Platform

-- This migration creates the core tables needed for the platform
-- Run the main schema file
\i ../database/schema.sql

-- Add migration record
INSERT INTO migrations (name, executed_at) 
VALUES ('001_initial_schema', CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;