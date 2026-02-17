-- Migration: Create objectives, coach_memory, and training_locations tables
-- Run with: docker exec -i hyrox_db_container psql -U hyrox_admin -d hyrox_app_db < migration.sql

-- 1. Objectives table for competitions and goals
CREATE TABLE IF NOT EXISTS objectives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    target_date DATE NOT NULL,
    priority CHAR(1) CHECK (priority IN ('A', 'B', 'C')),
    category VARCHAR(50),
    target_value TEXT,
    achieved_value TEXT,
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'achieved', 'missed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Coach memory for personalized context
CREATE TABLE IF NOT EXISTS coach_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    memory_type VARCHAR(30) NOT NULL CHECK (memory_type IN ('long_term', 'weekly_log', 'progression', 'ideas', 'todos')),
    category VARCHAR(50),
    title VARCHAR(255),
    content JSONB NOT NULL,
    week_start DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_type ON coach_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_memory_week ON coach_memory(week_start);

-- 3. Training locations with equipment
CREATE TABLE IF NOT EXISTS training_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    short_name VARCHAR(20),
    equipment JSONB DEFAULT '[]',
    notes TEXT,
    is_default BOOLEAN DEFAULT FALSE
);

-- Seed training locations
INSERT INTO training_locations (name, short_name, equipment, notes, is_default) VALUES
('Boate Semaines', 'boate_sem', '["barbell", "dumbbells", "pull_up_bar", "rower", "skierg", "assault_bike", "kettlebells", "wall_balls", "sandbag", "box"]', 'Équipement complet sauf sleds', TRUE),
('Boate Week-end', 'boate_we', '["barbell", "dumbbells", "pull_up_bar", "rower", "kettlebells", "box"]', 'Équipement réduit le week-end', FALSE),
('Maison', 'maison', '["pull_up_bar", "kettlebell_16kg", "resistance_bands", "foam_roller"]', 'Équipement basique maison', FALSE),
('Paris CrossFit', 'paris_cf', '["barbell", "dumbbells", "pull_up_bar", "rower", "skierg", "assault_bike", "kettlebells", "wall_balls", "sandbag", "box", "sled"]', 'Box complète avec sleds', FALSE),
('Paris Sans Matos', 'paris_outdoor', '[]', 'Running / bodyweight uniquement', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Seed objectives from current athlete_profile
INSERT INTO objectives (title, target_date, priority, category, target_value, status) VALUES
('10km sous 35 minutes', '2026-02-01', 'A', 'running', '< 35:00', 'in_progress'),
('Hyrox Open sous 1 heure', '2026-05-01', 'A', 'hyrox', '< 1:00:00', 'upcoming'),
('Challenge DOLO ENORME', '2026-05-15', 'B', 'crossfit', '< 15:00', 'upcoming')
ON CONFLICT DO NOTHING;

-- Seed initial long-term memory
INSERT INTO coach_memory (memory_type, category, title, content) VALUES
('long_term', 'preference', 'Training preferences', '{
    "preferred_run_time": "morning",
    "preferred_strength_time": "afternoon",
    "max_sessions_per_day": 2,
    "rest_day_preference": "active_recovery",
    "min_weekly_run_km": 40,
    "max_weekly_run_km": 60
}'::jsonb),
('long_term', 'equipment', 'Equipment by location', '{
    "boate_sem": ["barbell", "dumbbells", "rower", "skierg", "assault_bike", "kettlebells", "wall_balls", "sandbag", "box"],
    "boate_we": ["barbell", "dumbbells", "rower", "kettlebells", "box"],
    "maison": ["pull_up_bar", "kettlebell_16kg", "resistance_bands"],
    "paris_cf": ["everything", "sled"],
    "paris_outdoor": []
}'::jsonb);
