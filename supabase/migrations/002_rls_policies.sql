-- =============================================
-- SPORTIA - Row Level Security Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_athlete ENABLE ROW LEVEL SECURITY;
ALTER TABLE swim_strokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_strokes ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE objective_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE swim_competition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_flags ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is club admin for a specific club
CREATE OR REPLACE FUNCTION is_club_admin(check_club_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM club_members
        WHERE club_id = check_club_id
        AND user_id = auth.uid()
        AND role_in_club = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is coach for a specific athlete
CREATE OR REPLACE FUNCTION is_coach_of_athlete(check_athlete_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM coach_athlete ca
        JOIN coaches c ON c.id = ca.coach_id
        WHERE ca.athlete_id = check_athlete_id
        AND c.user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's clubs
CREATE OR REPLACE FUNCTION get_user_club_ids()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT club_id FROM club_members WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PROFILES POLICIES
-- =============================================

CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
    ON profiles FOR SELECT
    USING (is_admin());

CREATE POLICY "Club members can view profiles in their club"
    ON profiles FOR SELECT
    USING (
        id IN (
            SELECT user_id FROM club_members
            WHERE club_id IN (SELECT get_user_club_ids())
        )
    );

-- =============================================
-- CLUBS POLICIES
-- =============================================

CREATE POLICY "Anyone can view clubs"
    ON clubs FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage clubs"
    ON clubs FOR ALL
    USING (is_admin());

CREATE POLICY "Club admins can update their club"
    ON clubs FOR UPDATE
    USING (is_club_admin(id));

-- =============================================
-- CLUB_MEMBERS POLICIES
-- =============================================

CREATE POLICY "Members can view their club members"
    ON club_members FOR SELECT
    USING (club_id IN (SELECT get_user_club_ids()));

CREATE POLICY "Club admins can manage members"
    ON club_members FOR ALL
    USING (is_club_admin(club_id));

CREATE POLICY "Admins can manage all members"
    ON club_members FOR ALL
    USING (is_admin());

-- =============================================
-- ATHLETES POLICIES
-- =============================================

CREATE POLICY "Club members can view athletes in their club"
    ON athletes FOR SELECT
    USING (club_id IN (SELECT get_user_club_ids()));

CREATE POLICY "Users can view their own athlete profile"
    ON athletes FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Club admins can manage athletes"
    ON athletes FOR ALL
    USING (is_club_admin(club_id));

CREATE POLICY "Coaches can view their assigned athletes"
    ON athletes FOR SELECT
    USING (is_coach_of_athlete(id));

CREATE POLICY "Coaches can update their assigned athletes"
    ON athletes FOR UPDATE
    USING (is_coach_of_athlete(id));

-- =============================================
-- COACHES POLICIES
-- =============================================

CREATE POLICY "Users can view their own coach profile"
    ON coaches FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Club members can view coaches"
    ON coaches FOR SELECT
    USING (
        user_id IN (
            SELECT user_id FROM club_members
            WHERE club_id IN (SELECT get_user_club_ids())
        )
    );

CREATE POLICY "Admins can manage coaches"
    ON coaches FOR ALL
    USING (is_admin());

-- =============================================
-- COACH_ATHLETE POLICIES
-- =============================================

CREATE POLICY "Coaches can view their assignments"
    ON coach_athlete FOR SELECT
    USING (
        coach_id IN (SELECT id FROM coaches WHERE user_id = auth.uid())
    );

CREATE POLICY "Club admins can manage coach assignments"
    ON coach_athlete FOR ALL
    USING (
        athlete_id IN (
            SELECT id FROM athletes WHERE is_club_admin(club_id)
        )
    );

-- =============================================
-- CATALOGS POLICIES (public read)
-- =============================================

CREATE POLICY "Anyone can view swim strokes"
    ON swim_strokes FOR SELECT
    USING (TRUE);

CREATE POLICY "Anyone can view tests"
    ON tests FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage catalogs"
    ON swim_strokes FOR ALL
    USING (is_admin());

CREATE POLICY "Admins can manage tests"
    ON tests FOR ALL
    USING (is_admin());

-- =============================================
-- TRAINING SESSIONS POLICIES
-- =============================================

CREATE POLICY "Athletes can view their own sessions"
    ON training_sessions FOR SELECT
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

CREATE POLICY "Coaches can view their athletes' sessions"
    ON training_sessions FOR SELECT
    USING (is_coach_of_athlete(athlete_id));

CREATE POLICY "Club admins can view all club sessions"
    ON training_sessions FOR SELECT
    USING (
        athlete_id IN (
            SELECT id FROM athletes WHERE is_club_admin(club_id)
        )
    );

CREATE POLICY "Coaches can create sessions for their athletes"
    ON training_sessions FOR INSERT
    WITH CHECK (
        is_coach_of_athlete(athlete_id) OR
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

CREATE POLICY "Coaches can update sessions they created"
    ON training_sessions FOR UPDATE
    USING (created_by = auth.uid() OR is_coach_of_athlete(athlete_id));

CREATE POLICY "Athletes can create their own sessions"
    ON training_sessions FOR INSERT
    WITH CHECK (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

-- =============================================
-- TRAINING SETS POLICIES
-- =============================================

CREATE POLICY "Users can view sets for accessible sessions"
    ON training_sets FOR SELECT
    USING (
        session_id IN (
            SELECT id FROM training_sessions
            WHERE athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
            OR is_coach_of_athlete(athlete_id)
        )
    );

CREATE POLICY "Users can manage sets for their sessions"
    ON training_sets FOR ALL
    USING (
        session_id IN (
            SELECT id FROM training_sessions
            WHERE created_by = auth.uid()
            OR athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
        )
    );

-- =============================================
-- TRAINING SPLITS & STROKES POLICIES
-- =============================================

CREATE POLICY "Users can view splits for accessible sets"
    ON training_splits FOR SELECT
    USING (
        training_set_id IN (
            SELECT ts.id FROM training_sets ts
            JOIN training_sessions s ON s.id = ts.session_id
            WHERE s.athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
            OR is_coach_of_athlete(s.athlete_id)
        )
    );

CREATE POLICY "Users can manage splits for their sets"
    ON training_splits FOR ALL
    USING (
        training_set_id IN (
            SELECT ts.id FROM training_sets ts
            JOIN training_sessions s ON s.id = ts.session_id
            WHERE s.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can view strokes for accessible sets"
    ON training_strokes FOR SELECT
    USING (
        training_set_id IN (
            SELECT ts.id FROM training_sets ts
            JOIN training_sessions s ON s.id = ts.session_id
            WHERE s.athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
            OR is_coach_of_athlete(s.athlete_id)
        )
    );

CREATE POLICY "Users can manage strokes for their sets"
    ON training_strokes FOR ALL
    USING (
        training_set_id IN (
            SELECT ts.id FROM training_sets ts
            JOIN training_sessions s ON s.id = ts.session_id
            WHERE s.created_by = auth.uid()
        )
    );

-- =============================================
-- OBJECTIVES POLICIES
-- =============================================

CREATE POLICY "Users can view global objectives"
    ON objectives FOR SELECT
    USING (scope = 'GLOBAL');

CREATE POLICY "Club members can view club objectives"
    ON objectives FOR SELECT
    USING (club_id IN (SELECT get_user_club_ids()));

CREATE POLICY "Club admins can manage objectives"
    ON objectives FOR ALL
    USING (is_club_admin(club_id) OR is_admin());

-- =============================================
-- OBJECTIVE ASSIGNMENTS POLICIES
-- =============================================

CREATE POLICY "Athletes can view their assignments"
    ON objective_assignments FOR SELECT
    USING (
        athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid())
    );

CREATE POLICY "Coaches can view their athletes' assignments"
    ON objective_assignments FOR SELECT
    USING (is_coach_of_athlete(athlete_id));

CREATE POLICY "Coaches can manage assignments"
    ON objective_assignments FOR ALL
    USING (is_coach_of_athlete(athlete_id));

-- =============================================
-- COMPETITION RESULTS POLICIES
-- =============================================

CREATE POLICY "Anyone can view competition results"
    ON swim_competition_results FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage competition results"
    ON swim_competition_results FOR ALL
    USING (is_admin());

-- =============================================
-- METRIC FLAGS POLICIES
-- =============================================

CREATE POLICY "Users can view global flags"
    ON metric_flags FOR SELECT
    USING (scope = 'GLOBAL');

CREATE POLICY "Club members can view club flags"
    ON metric_flags FOR SELECT
    USING (scope_id IN (SELECT get_user_club_ids()));

CREATE POLICY "Admins can manage flags"
    ON metric_flags FOR ALL
    USING (is_admin());
