-- =============================================
-- SPORTIA - Initial Schema
-- =============================================

-- =============================================
-- 1. ENUMS
-- =============================================

CREATE TYPE user_role AS ENUM ('ADMIN', 'CLUB_ADMIN', 'COACH', 'ATHLETE');
CREATE TYPE club_role AS ENUM ('ADMIN', 'COACH', 'ATHLETE');
CREATE TYPE sex AS ENUM ('M', 'F');
CREATE TYPE pool_type AS ENUM ('SCM', 'LCM');
CREATE TYPE swim_stroke AS ENUM ('FREE', 'BACK', 'BREAST', 'FLY', 'IM');
CREATE TYPE session_type AS ENUM ('AEROBIC', 'THRESHOLD', 'SPEED', 'TECH');
CREATE TYPE objective_scope AS ENUM ('GLOBAL', 'CLUB', 'TEMPLATE');
CREATE TYPE objective_status AS ENUM ('PENDING', 'IN_PROGRESS', 'ACHIEVED', 'FAILED');

-- =============================================
-- 2. PROFILES (extends Supabase auth.users)
-- =============================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'ATHLETE',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'ATHLETE')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 3. CLUBS
-- =============================================

CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'MX',
    city TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE club_members (
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_in_club club_role NOT NULL DEFAULT 'ATHLETE',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (club_id, user_id)
);

CREATE INDEX idx_club_members_user ON club_members(user_id);
CREATE INDEX idx_club_members_club ON club_members(club_id);

-- =============================================
-- 4. ATHLETES & COACHES
-- =============================================

CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date DATE NOT NULL,
    sex sex NOT NULL,
    photo_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_athletes_club ON athletes(club_id);
CREATE INDEX idx_athletes_user ON athletes(user_id);
CREATE INDEX idx_athletes_birth_date ON athletes(birth_date);

CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_independent BOOLEAN NOT NULL DEFAULT FALSE,
    specialization TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_coaches_user ON coaches(user_id);

CREATE TABLE coach_athlete (
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (coach_id, athlete_id)
);

CREATE INDEX idx_coach_athlete_athlete ON coach_athlete(athlete_id);

-- =============================================
-- 5. SWIM CATALOGS
-- =============================================

CREATE TABLE swim_strokes (
    id SMALLINT PRIMARY KEY,
    code swim_stroke NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_es TEXT NOT NULL
);

INSERT INTO swim_strokes (id, code, name_en, name_es) VALUES
    (1, 'FREE', 'Freestyle', 'Libre'),
    (2, 'BACK', 'Backstroke', 'Espalda'),
    (3, 'BREAST', 'Breaststroke', 'Pecho'),
    (4, 'FLY', 'Butterfly', 'Mariposa'),
    (5, 'IM', 'Individual Medley', 'Combinado');

CREATE TABLE tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distance_m SMALLINT NOT NULL,
    stroke_id SMALLINT NOT NULL REFERENCES swim_strokes(id),
    pool_type pool_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (distance_m, stroke_id, pool_type)
);

-- Insert official test combinations
INSERT INTO tests (distance_m, stroke_id, pool_type)
SELECT d.distance, s.id, p.pool
FROM (VALUES (50), (100), (200), (400), (800), (1500)) AS d(distance)
CROSS JOIN swim_strokes s
CROSS JOIN (VALUES ('SCM'::pool_type), ('LCM'::pool_type)) AS p(pool)
WHERE
    (s.code = 'FREE') OR
    (s.code IN ('BACK', 'BREAST', 'FLY') AND d.distance IN (50, 100, 200)) OR
    (s.code = 'IM' AND d.distance IN (200, 400));

-- =============================================
-- 6. TRAINING SESSIONS
-- =============================================

CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    session_type session_type NOT NULL,
    duration_min SMALLINT NOT NULL CHECK (duration_min > 0),
    session_rpe SMALLINT NOT NULL CHECK (session_rpe BETWEEN 1 AND 10),
    created_by UUID NOT NULL REFERENCES profiles(id),
    validated_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_sessions_athlete ON training_sessions(athlete_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_training_sessions_athlete_date ON training_sessions(athlete_id, session_date DESC);

CREATE TABLE training_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id),
    total_time_ms INT NOT NULL CHECK (total_time_ms > 0),
    pool_length_m SMALLINT NOT NULL DEFAULT 25,
    attempt_no SMALLINT NOT NULL DEFAULT 1,
    is_best BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_training_sets_session ON training_sets(session_id);
CREATE INDEX idx_training_sets_test ON training_sets(test_id);

CREATE TABLE training_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_set_id UUID NOT NULL REFERENCES training_sets(id) ON DELETE CASCADE,
    split_index SMALLINT NOT NULL,
    split_distance_m SMALLINT NOT NULL,
    split_time_ms INT NOT NULL CHECK (split_time_ms > 0),
    UNIQUE (training_set_id, split_index)
);

CREATE INDEX idx_training_splits_set ON training_splits(training_set_id);

CREATE TABLE training_strokes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_set_id UUID NOT NULL REFERENCES training_sets(id) ON DELETE CASCADE,
    length_index SMALLINT NOT NULL,
    stroke_count SMALLINT NOT NULL CHECK (stroke_count > 0),
    UNIQUE (training_set_id, length_index)
);

CREATE INDEX idx_training_strokes_set ON training_strokes(training_set_id);

-- =============================================
-- 7. OBJECTIVES
-- =============================================

CREATE TABLE objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id),
    target_time_ms INT NOT NULL CHECK (target_time_ms > 0),
    scope objective_scope NOT NULL DEFAULT 'CLUB',
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_objectives_test ON objectives(test_id);
CREATE INDEX idx_objectives_club ON objectives(club_id);

CREATE TABLE objective_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    objective_id UUID NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    custom_target_time_ms INT CHECK (custom_target_time_ms > 0),
    status objective_status NOT NULL DEFAULT 'PENDING',
    achieved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (objective_id, athlete_id)
);

CREATE INDEX idx_objective_assignments_athlete ON objective_assignments(athlete_id);
CREATE INDEX idx_objective_assignments_status ON objective_assignments(status);

-- =============================================
-- 8. COMPETITION RESULTS (external data)
-- =============================================

CREATE TABLE swim_competition_results (
    id BIGSERIAL PRIMARY KEY,
    year SMALLINT NOT NULL,
    tournament_name TEXT NOT NULL,
    event_date DATE,
    gender sex NOT NULL,
    distance_m SMALLINT NOT NULL,
    stroke swim_stroke NOT NULL,
    round TEXT,
    age SMALLINT,
    swimmer_name TEXT NOT NULL,
    swimmer_name_norm TEXT NOT NULL,
    team_code TEXT,
    rank SMALLINT,
    final_time_ms INT NOT NULL CHECK (final_time_ms > 0),
    seed_time_ms INT CHECK (seed_time_ms > 0),
    source TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_competition_results_event ON swim_competition_results(gender, distance_m, stroke);
CREATE INDEX idx_competition_results_year ON swim_competition_results(year);
CREATE INDEX idx_competition_results_swimmer ON swim_competition_results(swimmer_name_norm);
CREATE INDEX idx_competition_results_time ON swim_competition_results(final_time_ms);

-- =============================================
-- 9. METRIC FLAGS (feature toggles)
-- =============================================

CREATE TABLE metric_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    scope objective_scope NOT NULL DEFAULT 'GLOBAL',
    scope_id UUID,
    config_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (key, scope, scope_id)
);

-- =============================================
-- 10. UPDATED_AT TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_athletes_updated_at
    BEFORE UPDATE ON athletes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_coaches_updated_at
    BEFORE UPDATE ON coaches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_training_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_objective_assignments_updated_at
    BEFORE UPDATE ON objective_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_metric_flags_updated_at
    BEFORE UPDATE ON metric_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
