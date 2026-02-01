# Database Schema - Hyrox Intel

## Goal
Documentation du schéma de production PostgreSQL pour l'application Hyrox Intel.
**Database**: `hyrox_app_db`

## Tables

### training_plan
Planification et suivi des séances.

```sql
CREATE TABLE training_plan (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date TIMESTAMPTZ NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'completed', 'missed'
    planned_details JSONB NOT NULL DEFAULT '{}',
    executed_details JSONB,
    rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
    duration_minutes INTEGER,
    distance_km NUMERIC(6,3),
    training_load_tss NUMERIC(6,1),
    athlete_comments TEXT,
    ai_feedback TEXT,
    strava_activity_id BIGINT UNIQUE,
    is_structured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```
**JSONB `planned_details` structure:**
```json
{
  "warmup": [...],
  "main_set": [...],
  "cooldown": [...]
}
```

### athlete_metrics
Suivi des métriques physiologiques et progrès.

```sql
CREATE TABLE athlete_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    weight_kg NUMERIC(5,2),
    resting_hr INTEGER,
    max_hr INTEGER,
    vo2_max NUMERIC(4,1),
    current_prs JSONB DEFAULT '{}',      -- ex: {"5km": "20:00", "deadlift": 140}
    training_zones JSONB DEFAULT '{}',   -- ex: {"z2_hr": [130, 145]}
    equipment_available JSONB DEFAULT '[]'
);
```

### availability_slots
Disponibilités hebdomadaires pour l'entraînement.

```sql
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label VARCHAR(50),
    is_recurring BOOLEAN DEFAULT true,
    specific_date DATE
);
```

### exercise_library
Référentiel des exercices.

```sql
CREATE TABLE exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(50), -- 'strength', 'cardio', 'hyrox_movement'
    default_metrics JSONB -- ex: {"unit": "kg"}
);
```

### strava_sync
Activités synchronisées depuis Strava.

```sql
CREATE TABLE strava_sync (
    activity_id BIGINT PRIMARY KEY,
    name VARCHAR(255),
    start_date TIMESTAMPTZ,
    type VARCHAR(50),
    distance NUMERIC(10,2),
    moving_time INTEGER, -- seconds
    total_elevation_gain NUMERIC(6,1),
    average_heartrate NUMERIC(4,1),
    max_heartrate NUMERIC(4,1),
    suffer_score INTEGER,
    raw_data JSONB
);
```

### n8n_chat_histories
Mémoire des conversations IA via n8n.

```sql
CREATE TABLE n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    message JSONB NOT NULL
);
```

## Relations Clés
- `training_plan.strava_activity_id` -> `strava_sync.activity_id` (1:1)

## Indexes Importants
- `training_plan`: `session_date`, `status`, `strava_activity_id`
- `exercise_library`: `name` (unique)
