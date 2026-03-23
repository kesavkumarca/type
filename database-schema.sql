-- Lakshmi Technical Institute - Database Schema
-- Run these SQL commands in your Supabase project

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Stores user profile information linked to Supabase Auth
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  mobile_number TEXT,
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 2. PASSAGES TABLE
-- ============================================
-- Stores typing test passages
CREATE TABLE public.passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('english', 'tamil')),
  level TEXT NOT NULL CHECK (level IN ('junior', 'senior')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view passages
CREATE POLICY "Authenticated users can view passages"
  ON public.passages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admin can insert (handled in application)
CREATE POLICY "Only admin can insert passages"
  ON public.passages FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Only admin can delete passages (handled in application)
CREATE POLICY "Only admin can delete passages"
  ON public.passages FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================
-- 3. TEST_RESULTS TABLE
-- ============================================
-- Stores user typing test results
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  passage_id UUID NOT NULL REFERENCES public.passages(id),
  wpm INTEGER,
  accuracy INTEGER,
  strokes INTEGER,
  duration_seconds INTEGER,
  language TEXT,
  level TEXT,
  typed_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own results
CREATE POLICY "Users can view own results"
  ON public.test_results FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own results
CREATE POLICY "Users can insert own results"
  ON public.test_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated users to view results for leaderboard
CREATE POLICY "Authenticated users can view all results"
  ON public.test_results FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Index for faster passage lookups
CREATE INDEX idx_passages_language_level 
  ON public.passages(language, level);

-- Index for faster test results lookups
CREATE INDEX idx_test_results_user_id 
  ON public.test_results(user_id);

CREATE INDEX idx_test_results_created_at 
  ON public.test_results(created_at);

-- ============================================
-- DATABASE TRIGGERS AND FUNCTIONS
-- ============================================

-- Function to insert profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================

-- Insert sample English passages
INSERT INTO public.passages (text, language, level) VALUES
(
  'The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet. Practice typing this sentence to improve your speed and accuracy. Typing faster requires consistent practice and proper technique. Focus on accuracy first, then speed will follow naturally.',
  'english',
  'junior'
),
(
  'In the digital age, typing has become an essential skill. Whether you are a student, professional, or content creator, the ability to type quickly and accurately can significantly improve your productivity. Typing practice helps you develop muscle memory and finger dexterity. Regular practice sessions will help you achieve your typing goals faster than sporadic attempts.',
  'english',
  'senior'
);

-- Insert sample Tamil passages (using romanized Tamil)
INSERT INTO public.passages (text, language, level) VALUES
(
  'Vanakkam, welcome to the Tamil typing test. This is a simple passage to help you practice. Typing in Tamil helps you learn the keyboard layout faster. Keep practicing every day to improve your speed.',
  'tamil',
  'junior'
),
(
  'Tamil is a beautiful and ancient language with over 2000 years of history. Learning to type in Tamil opens up many opportunities for communication and creativity. Professional typing skills in Tamil are increasingly valuable in the digital world. Consistent practice and dedication will help you master Tamil typing.',
  'tamil',
  'senior'
);
