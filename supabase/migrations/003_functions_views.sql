-- =============================================
-- SPORTIA - Functions and Views
-- =============================================

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Calculate age from birth date
CREATE OR REPLACE FUNCTION calculate_age(birth_date DATE, reference_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM age(reference_date, birth_date))::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get age category for swimming
CREATE OR REPLACE FUNCTION get_age_category(age INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN age <= 10 THEN '10-'
        WHEN age <= 12 THEN '11-12'
        WHEN age <= 14 THEN '13-14'
        WHEN age <= 16 THEN '15-16'
        WHEN age <= 18 THEN '17-18'
        ELSE 'OPEN'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Convert milliseconds to time string (mm:ss.cc)
CREATE OR REPLACE FUNCTION ms_to_time_string(ms INTEGER)
RETURNS TEXT AS $$
DECLARE
    total_seconds NUMERIC;
    minutes INTEGER;
    seconds NUMERIC;
BEGIN
    total_seconds := ms / 1000.0;
    minutes := FLOOR(total_seconds / 60)::INTEGER;
    seconds := total_seconds - (minutes * 60);

    IF minutes > 0 THEN
        RETURN minutes || ':' || LPAD(TO_CHAR(seconds, 'FM00.00'), 5, '0');
    ELSE
        RETURN TO_CHAR(seconds, 'FM00.00');
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate training load (RPE x duration)
CREATE OR REPLACE FUNCTION calculate_training_load(rpe SMALLINT, duration_min SMALLINT)
RETURNS INTEGER AS $$
BEGIN
    RETURN rpe * duration_min;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- VIEWS
-- =============================================

-- Athletes with calculated age and category
CREATE OR REPLACE VIEW athletes_with_age AS
SELECT
    a.*,
    calculate_age(a.birth_date) AS age,
    get_age_category(calculate_age(a.birth_date)) AS age_category,
    c.name AS club_name
FROM athletes a
JOIN clubs c ON c.id = a.club_id
WHERE a.active = TRUE;

-- Training sessions with calculated load
CREATE OR REPLACE VIEW training_sessions_with_load AS
SELECT
    ts.*,
    calculate_training_load(ts.session_rpe, ts.duration_min) AS training_load,
    a.first_name || ' ' || a.last_name AS athlete_name
FROM training_sessions ts
JOIN athletes a ON a.id = ts.athlete_id;

-- Best times per athlete and test
CREATE OR REPLACE VIEW athlete_best_times AS
SELECT DISTINCT ON (ts.session_id, tset.test_id)
    a.id AS athlete_id,
    a.first_name || ' ' || a.last_name AS athlete_name,
    a.sex,
    calculate_age(a.birth_date) AS age,
    get_age_category(calculate_age(a.birth_date)) AS age_category,
    t.id AS test_id,
    t.distance_m,
    ss.code AS stroke,
    t.pool_type,
    tset.total_time_ms AS best_time_ms,
    ms_to_time_string(tset.total_time_ms) AS best_time_formatted,
    ts.session_date AS achieved_date
FROM athletes a
JOIN training_sessions ts ON ts.athlete_id = a.id
JOIN training_sets tset ON tset.session_id = ts.id AND tset.is_best = TRUE
JOIN tests t ON t.id = tset.test_id
JOIN swim_strokes ss ON ss.id = t.stroke_id
WHERE a.active = TRUE
ORDER BY ts.session_id, tset.test_id, tset.total_time_ms ASC;

-- =============================================
-- RANKING FUNCTIONS
-- =============================================

-- Get rankings for a specific test within a club
CREATE OR REPLACE FUNCTION get_club_rankings(
    p_club_id UUID,
    p_test_id UUID,
    p_sex sex DEFAULT NULL,
    p_age_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    rank BIGINT,
    athlete_id UUID,
    athlete_name TEXT,
    age INTEGER,
    age_category TEXT,
    best_time_ms INTEGER,
    best_time_formatted TEXT,
    achieved_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY bt.best_time_ms ASC) AS rank,
        bt.athlete_id,
        bt.athlete_name,
        bt.age,
        bt.age_category,
        bt.best_time_ms,
        bt.best_time_formatted,
        bt.achieved_date
    FROM athlete_best_times bt
    JOIN athletes a ON a.id = bt.athlete_id
    WHERE a.club_id = p_club_id
    AND bt.test_id = p_test_id
    AND (p_sex IS NULL OR bt.sex = p_sex)
    AND (p_age_category IS NULL OR bt.age_category = p_age_category)
    ORDER BY bt.best_time_ms ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get direct competitors (3 faster, 3 slower)
CREATE OR REPLACE FUNCTION get_direct_competitors(
    p_athlete_id UUID,
    p_test_id UUID,
    p_time_ms INTEGER,
    p_mode TEXT DEFAULT 'club' -- 'club' or 'general'
)
RETURNS TABLE (
    position TEXT,
    athlete_id UUID,
    athlete_name TEXT,
    time_ms INTEGER,
    time_formatted TEXT,
    time_diff_ms INTEGER
) AS $$
DECLARE
    v_club_id UUID;
    v_sex sex;
    v_age_category TEXT;
BEGIN
    -- Get athlete info
    SELECT a.club_id, a.sex, get_age_category(calculate_age(a.birth_date))
    INTO v_club_id, v_sex, v_age_category
    FROM athletes a WHERE a.id = p_athlete_id;

    IF p_mode = 'club' THEN
        -- Faster competitors from club
        RETURN QUERY
        SELECT
            'faster'::TEXT AS position,
            bt.athlete_id,
            bt.athlete_name,
            bt.best_time_ms AS time_ms,
            bt.best_time_formatted AS time_formatted,
            bt.best_time_ms - p_time_ms AS time_diff_ms
        FROM athlete_best_times bt
        JOIN athletes a ON a.id = bt.athlete_id
        WHERE a.club_id = v_club_id
        AND bt.test_id = p_test_id
        AND bt.sex = v_sex
        AND bt.age_category = v_age_category
        AND bt.best_time_ms < p_time_ms
        AND bt.athlete_id != p_athlete_id
        ORDER BY bt.best_time_ms DESC
        LIMIT 3;

        -- Slower competitors from club
        RETURN QUERY
        SELECT
            'slower'::TEXT AS position,
            bt.athlete_id,
            bt.athlete_name,
            bt.best_time_ms AS time_ms,
            bt.best_time_formatted AS time_formatted,
            bt.best_time_ms - p_time_ms AS time_diff_ms
        FROM athlete_best_times bt
        JOIN athletes a ON a.id = bt.athlete_id
        WHERE a.club_id = v_club_id
        AND bt.test_id = p_test_id
        AND bt.sex = v_sex
        AND bt.age_category = v_age_category
        AND bt.best_time_ms > p_time_ms
        AND bt.athlete_id != p_athlete_id
        ORDER BY bt.best_time_ms ASC
        LIMIT 3;
    ELSE
        -- From competition results (general mode)
        RETURN QUERY
        SELECT
            'faster'::TEXT AS position,
            NULL::UUID AS athlete_id,
            cr.swimmer_name AS athlete_name,
            cr.final_time_ms AS time_ms,
            ms_to_time_string(cr.final_time_ms) AS time_formatted,
            cr.final_time_ms - p_time_ms AS time_diff_ms
        FROM swim_competition_results cr
        JOIN tests t ON t.id = p_test_id
        JOIN swim_strokes ss ON ss.id = t.stroke_id
        WHERE cr.gender = v_sex
        AND cr.distance_m = t.distance_m
        AND cr.stroke = ss.code
        AND get_age_category(cr.age) = v_age_category
        AND cr.final_time_ms < p_time_ms
        ORDER BY cr.final_time_ms DESC
        LIMIT 3;

        RETURN QUERY
        SELECT
            'slower'::TEXT AS position,
            NULL::UUID AS athlete_id,
            cr.swimmer_name AS athlete_name,
            cr.final_time_ms AS time_ms,
            ms_to_time_string(cr.final_time_ms) AS time_formatted,
            cr.final_time_ms - p_time_ms AS time_diff_ms
        FROM swim_competition_results cr
        JOIN tests t ON t.id = p_test_id
        JOIN swim_strokes ss ON ss.id = t.stroke_id
        WHERE cr.gender = v_sex
        AND cr.distance_m = t.distance_m
        AND cr.stroke = ss.code
        AND get_age_category(cr.age) = v_age_category
        AND cr.final_time_ms > p_time_ms
        ORDER BY cr.final_time_ms ASC
        LIMIT 3;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- SWIMMING METRICS FUNCTIONS
-- =============================================

-- Calculate swimming metrics for a training set
CREATE OR REPLACE FUNCTION calculate_swimming_metrics(p_training_set_id UUID)
RETURNS TABLE (
    dps NUMERIC,
    stroke_frequency NUMERIC,
    velocity NUMERIC,
    swim_index NUMERIC
) AS $$
DECLARE
    v_distance_m INTEGER;
    v_time_ms INTEGER;
    v_total_strokes INTEGER;
    v_velocity NUMERIC;
    v_dps NUMERIC;
    v_frequency NUMERIC;
BEGIN
    -- Get set info
    SELECT t.distance_m, ts.total_time_ms
    INTO v_distance_m, v_time_ms
    FROM training_sets ts
    JOIN tests t ON t.id = ts.test_id
    WHERE ts.id = p_training_set_id;

    -- Get total stroke count
    SELECT COALESCE(SUM(stroke_count), 0)
    INTO v_total_strokes
    FROM training_strokes
    WHERE training_set_id = p_training_set_id;

    IF v_total_strokes = 0 OR v_time_ms = 0 THEN
        RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
        RETURN;
    END IF;

    -- Calculate metrics
    v_velocity := v_distance_m / (v_time_ms / 1000.0);
    v_dps := v_distance_m::NUMERIC / v_total_strokes;
    v_frequency := v_total_strokes / (v_time_ms / 60000.0);

    RETURN QUERY SELECT
        ROUND(v_dps, 2) AS dps,
        ROUND(v_frequency, 1) AS stroke_frequency,
        ROUND(v_velocity, 2) AS velocity,
        ROUND(v_dps * v_velocity, 2) AS swim_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
