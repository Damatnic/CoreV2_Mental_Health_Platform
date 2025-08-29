-- AstralCore V4 Crisis Keywords Enhancement Migration
-- Migration: 002_crisis_keywords_table
-- Created: 2025-01-xx
-- Description: Add dedicated crisis keywords configuration table for better crisis detection

BEGIN;

-- Create crisis keywords configuration table
CREATE TABLE crisis_keywords_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    keyword VARCHAR(100) NOT NULL UNIQUE,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.00 CHECK (weight >= 0.1 AND weight <= 2.0),
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    is_active BOOLEAN NOT NULL DEFAULT true,
    requires_context BOOLEAN NOT NULL DEFAULT false, -- Some words need context (e.g., "cut" could be harmless)
    false_positive_patterns TEXT[], -- Patterns that indicate false positive
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert comprehensive crisis keywords with weights and categories
INSERT INTO crisis_keywords_config (keyword, weight, category, requires_context, false_positive_patterns) VALUES
-- Suicide-related keywords (highest weight)
('suicide', 2.0, 'suicide', false, NULL),
('kill myself', 1.8, 'suicide', false, NULL),
('want to die', 1.7, 'suicide', false, NULL),
('end it all', 1.6, 'suicide', false, NULL),
('better off dead', 1.5, 'suicide', false, NULL),
('no reason to live', 1.5, 'suicide', false, NULL),
('take my own life', 1.8, 'suicide', false, NULL),
('don''t want to be here', 1.3, 'suicide', false, NULL),

-- Self-harm keywords (high weight)
('self harm', 1.4, 'self_harm', false, NULL),
('cut myself', 1.5, 'self_harm', false, NULL),
('hurt myself', 1.3, 'self_harm', false, NULL),
('burn myself', 1.4, 'self_harm', false, NULL),
('cutting', 1.2, 'self_harm', true, ARRAY['cutting hair', 'cutting grass', 'cutting costs', 'cutting edge']),

-- Method-related keywords (high weight)
('overdose', 1.6, 'method', false, NULL),
('pills', 1.2, 'method', true, ARRAY['vitamin pills', 'birth control pills', 'prescribed pills']),
('jump', 1.3, 'method', true, ARRAY['jump rope', 'jumping jacks', 'jump for joy', 'jump shot']),
('bridge', 1.1, 'method', true, ARRAY['bridge game', 'bridge building', 'bridge club']),
('rope', 1.2, 'method', true, ARRAY['jump rope', 'rope climbing', 'rope course']),
('gun', 1.4, 'method', true, ARRAY['water gun', 'toy gun', 'gun control debate']),

-- Emotional distress keywords (medium weight)
('hopeless', 1.2, 'emotional', false, NULL),
('worthless', 1.3, 'emotional', false, NULL),
('useless', 1.1, 'emotional', false, NULL),
('can''t go on', 1.4, 'emotional', false, NULL),
('everything is pointless', 1.3, 'emotional', false, NULL),
('nobody cares', 1.1, 'emotional', false, NULL),
('alone', 0.8, 'emotional', true, ARRAY['home alone', 'alone time', 'leave me alone']),
('trapped', 1.0, 'emotional', true, ARRAY['trapped in traffic', 'trapped door']),
('burden', 1.2, 'emotional', true, ARRAY['financial burden', 'burden of proof']),

-- Crisis situation keywords (medium weight)
('emergency', 0.9, 'crisis', true, ARRAY['emergency room', 'emergency contact', 'medical emergency']),
('help me', 1.1, 'crisis', true, ARRAY['help me understand', 'help me learn']),
('can''t handle', 1.2, 'crisis', false, NULL),
('breaking point', 1.3, 'crisis', false, NULL),
('last resort', 1.4, 'crisis', false, NULL),

-- Planning keywords (high weight)
('goodbye', 1.2, 'planning', true, ARRAY['goodbye party', 'saying goodbye']),
('final message', 1.6, 'planning', false, NULL),
('last time', 1.3, 'planning', true, ARRAY['last time we met', 'last time I checked']),
('wrote a letter', 1.4, 'planning', true, ARRAY['wrote a letter to santa', 'wrote a love letter']),
('giving away', 1.3, 'planning', true, ARRAY['giving away prizes', 'giving away free samples']);

-- Create index for keyword lookups
CREATE INDEX idx_crisis_keywords_active ON crisis_keywords_config(keyword, is_active) WHERE is_active = true;
CREATE INDEX idx_crisis_keywords_category ON crisis_keywords_config(category, weight DESC);

-- Update the crisis detection function to use the new table
CREATE OR REPLACE FUNCTION detect_crisis_keywords(content TEXT)
RETURNS TABLE(keywords TEXT[], confidence DECIMAL) AS $$
DECLARE
    keyword_record RECORD;
    matched_keywords TEXT[] := '{}';
    total_weight DECIMAL := 0.0;
    max_possible_weight DECIMAL;
    confidence_score DECIMAL := 0.0;
    content_lower TEXT;
    is_false_positive BOOLEAN;
    pattern TEXT;
BEGIN
    -- Convert content to lowercase for matching
    content_lower := lower(content);
    
    -- Get maximum possible weight for normalization
    SELECT SUM(weight) INTO max_possible_weight 
    FROM crisis_keywords_config 
    WHERE is_active = true;
    
    -- Check each active crisis keyword
    FOR keyword_record IN 
        SELECT keyword, weight, requires_context, false_positive_patterns
        FROM crisis_keywords_config 
        WHERE is_active = true
        ORDER BY weight DESC
    LOOP
        -- Check if keyword exists in content
        IF position(keyword_record.keyword IN content_lower) > 0 THEN
            is_false_positive := false;
            
            -- Check for false positive patterns if context is required
            IF keyword_record.requires_context AND keyword_record.false_positive_patterns IS NOT NULL THEN
                FOREACH pattern IN ARRAY keyword_record.false_positive_patterns LOOP
                    IF position(lower(pattern) IN content_lower) > 0 THEN
                        is_false_positive := true;
                        EXIT;
                    END IF;
                END LOOP;
            END IF;
            
            -- Add to results if not a false positive
            IF NOT is_false_positive THEN
                matched_keywords := array_append(matched_keywords, keyword_record.keyword);
                total_weight := total_weight + keyword_record.weight;
            END IF;
        END IF;
    END LOOP;
    
    -- Calculate confidence score (normalized to 0-1 range)
    IF total_weight > 0 AND max_possible_weight > 0 THEN
        confidence_score := LEAST(1.0, total_weight / (max_possible_weight * 0.3));
        
        -- Apply additional context-based adjustments
        -- Reduce confidence for negation
        IF position('not ' IN content_lower) > 0 OR 
           position('don''t ' IN content_lower) > 0 OR 
           position('never ' IN content_lower) > 0 THEN
            confidence_score := confidence_score * 0.6;
        END IF;
        
        -- Increase confidence for multiple high-weight matches
        IF array_length(matched_keywords, 1) >= 3 THEN
            confidence_score := LEAST(1.0, confidence_score * 1.3);
        END IF;
        
        -- Increase confidence for urgent language
        IF position('now' IN content_lower) > 0 OR 
           position('tonight' IN content_lower) > 0 OR 
           position('today' IN content_lower) > 0 THEN
            confidence_score := LEAST(1.0, confidence_score * 1.2);
        END IF;
    END IF;
    
    RETURN QUERY SELECT matched_keywords, confidence_score;
END;
$$ LANGUAGE plpgsql;

-- Create function to update crisis keywords configuration
CREATE OR REPLACE FUNCTION update_crisis_keyword(
    keyword_text VARCHAR(100),
    new_weight DECIMAL DEFAULT NULL,
    new_category VARCHAR(50) DEFAULT NULL,
    new_active BOOLEAN DEFAULT NULL,
    new_requires_context BOOLEAN DEFAULT NULL,
    new_false_positive_patterns TEXT[] DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE crisis_keywords_config SET
        weight = COALESCE(new_weight, weight),
        category = COALESCE(new_category, category),
        is_active = COALESCE(new_active, is_active),
        requires_context = COALESCE(new_requires_context, requires_context),
        false_positive_patterns = COALESCE(new_false_positive_patterns, false_positive_patterns),
        updated_at = NOW()
    WHERE keyword = keyword_text;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to add new crisis keyword
CREATE OR REPLACE FUNCTION add_crisis_keyword(
    keyword_text VARCHAR(100),
    keyword_weight DECIMAL DEFAULT 1.0,
    keyword_category VARCHAR(50) DEFAULT 'general',
    requires_context BOOLEAN DEFAULT false,
    false_positive_patterns TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO crisis_keywords_config (
        keyword, weight, category, requires_context, false_positive_patterns
    ) VALUES (
        keyword_text, keyword_weight, keyword_category, requires_context, false_positive_patterns
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on crisis keywords table
ALTER TABLE crisis_keywords_config ENABLE ROW LEVEL SECURITY;

-- Only admins can modify crisis keywords
CREATE POLICY "Admin full access to crisis keywords" ON crisis_keywords_config FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- All authenticated users can read crisis keywords (for client-side detection)
CREATE POLICY "Users can read crisis keywords" ON crisis_keywords_config FOR SELECT USING (
    auth.uid() IS NOT NULL
);

-- Add trigger for updated_at
CREATE TRIGGER update_crisis_keywords_config_updated_at 
    BEFORE UPDATE ON crisis_keywords_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Record migration completion
INSERT INTO schema_migrations (version, applied_at, description) 
VALUES ('002', NOW(), 'Add crisis keywords configuration table')
ON CONFLICT (version) DO NOTHING;