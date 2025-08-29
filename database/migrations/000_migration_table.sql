-- Migration tracking table
-- This table keeps track of which migrations have been applied
-- Must be run before any other migrations

CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    description TEXT
);

-- Insert initial migration tracking
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES ('000', NOW(), 'Create migration tracking table')
ON CONFLICT (version) DO NOTHING;