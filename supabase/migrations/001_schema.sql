-- ============================================================
-- BEAST MODE — Schema completo
-- ============================================================

-- Perfil do usuário
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  weight DECIMAL,
  height DECIMAL,
  goal TEXT CHECK (goal IN ('hypertrophy', 'strength', 'endurance', 'weight_loss')),
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  streak_count INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_workouts INTEGER DEFAULT 0,
  total_volume DECIMAL DEFAULT 0,
  total_time_minutes INTEGER DEFAULT 0,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catálogo de exercícios
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  secondary_muscles TEXT[],
  equipment TEXT,
  instructions TEXT,
  video_url TEXT,
  image_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_compound BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates de treino
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#BEFF00',
  icon TEXT DEFAULT 'dumbbell',
  day_of_week INTEGER[],
  estimated_duration INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercícios dentro de um template
CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  target_sets INTEGER DEFAULT 3,
  target_reps TEXT DEFAULT '12',
  target_weight DECIMAL,
  target_rpe DECIMAL,
  rest_seconds INTEGER DEFAULT 90,
  superset_group TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessão de treino
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume DECIMAL DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  calories_burned INTEGER,
  mood_before INTEGER CHECK (mood_before BETWEEN 1 AND 5),
  mood_after INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sets realizados
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  set_type TEXT DEFAULT 'normal' CHECK (set_type IN ('warmup', 'normal', 'drop', 'failure', 'rest_pause')),
  reps INTEGER,
  weight DECIMAL,
  rpe DECIMAL,
  duration_seconds INTEGER,
  rest_taken_seconds INTEGER,
  is_pr BOOLEAN DEFAULT false,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recordes pessoais
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  record_type TEXT CHECK (record_type IN ('1rm', 'max_weight', 'max_reps', 'max_volume')),
  value DECIMAL NOT NULL,
  previous_value DECIMAL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  session_id UUID REFERENCES workout_sessions(id) ON DELETE SET NULL
);

-- Medidas corporais
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL,
  body_fat_percentage DECIMAL,
  chest DECIMAL,
  waist DECIMAL,
  hips DECIMAL,
  biceps_left DECIMAL,
  biceps_right DECIMAL,
  thigh_left DECIMAL,
  thigh_right DECIMAL,
  calf_left DECIMAL,
  calf_right DECIMAL,
  neck DECIMAL,
  shoulders DECIMAL,
  notes TEXT,
  measured_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sistema de conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT CHECK (category IN ('streak', 'volume', 'consistency', 'strength', 'milestone')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_reward INTEGER DEFAULT 50,
  rarity TEXT CHECK (rarity IN ('common', 'rare', 'epic', 'legendary'))
);

-- Conquistas desbloqueadas
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Histórico de peso corporal
CREATE TABLE IF NOT EXISTS weight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_log ENABLE ROW LEVEL SECURITY;
-- exercises é público para leitura
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Exercises (público para leitura, usuário cria custom)
CREATE POLICY "Anyone can view exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Users can create custom exercises" ON exercises FOR INSERT WITH CHECK (is_custom = true AND auth.uid() = created_by);
CREATE POLICY "Users can update own exercises" ON exercises FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete own exercises" ON exercises FOR DELETE USING (auth.uid() = created_by);

-- Achievements (público para leitura)
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

-- Workout Templates
CREATE POLICY "Users can CRUD own templates" ON workout_templates FOR ALL USING (auth.uid() = user_id);

-- Template Exercises
CREATE POLICY "Users can CRUD template exercises" ON template_exercises
  FOR ALL USING (
    EXISTS (SELECT 1 FROM workout_templates wt WHERE wt.id = template_id AND wt.user_id = auth.uid())
  );

-- Workout Sessions
CREATE POLICY "Users can CRUD own sessions" ON workout_sessions FOR ALL USING (auth.uid() = user_id);

-- Workout Sets
CREATE POLICY "Users can CRUD own sets" ON workout_sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid())
  );

-- Personal Records
CREATE POLICY "Users can CRUD own PRs" ON personal_records FOR ALL USING (auth.uid() = user_id);

-- Body Measurements
CREATE POLICY "Users can CRUD own measurements" ON body_measurements FOR ALL USING (auth.uid() = user_id);

-- User Achievements
CREATE POLICY "Users can view own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weight Log
CREATE POLICY "Users can CRUD own weight log" ON weight_log FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER templates_updated_at BEFORE UPDATE ON workout_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
