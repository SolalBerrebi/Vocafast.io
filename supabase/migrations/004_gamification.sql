-- Add gamification columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS total_xp INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_days INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_active_date DATE,
ADD COLUMN IF NOT EXISTS show_timer BOOLEAN NOT NULL DEFAULT true;

-- Add timing/xp columns to training_sessions
ALTER TABLE public.training_sessions
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS avg_response_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS xp_earned INTEGER NOT NULL DEFAULT 0;
