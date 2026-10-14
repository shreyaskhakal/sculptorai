-- ==============================================================================
-- SculptorAI — Guest Anonymous Access & Foreign Key Relaxation Migration
-- File: supabase/migrations/20261015_guest_anonymous_access.sql
-- 
-- STATUS: PENDING DEPLOYMENT (Do NOT apply automatically without authorization)
-- 
-- PURPOSE:
-- 1. Relaxes rigid `REFERENCES auth.users(id)` foreign key constraints on
--    `projects`, `generations`, `executions`, `blender_devices`, and `ai_usage`.
-- 2. Allows cryptographically signed guest UUID identities to persist directly
--    in Supabase PostgreSQL without requiring a pre-existing auth.users entry.
-- 3. Retains Row Level Security (RLS) isolation and index performance.
-- 
-- DEPLOYMENT PROCEDURE:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/<project-ref>
-- 2. Navigate to SQL Editor.
-- 3. Paste this file and click "Run".
-- ==============================================================================

-- 1. Relax Foreign Key on public.projects
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_user_id_fkey' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects DROP CONSTRAINT projects_user_id_fkey;
    END IF;
END $$;

-- 2. Relax Foreign Key on public.generations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'generations_user_id_fkey' 
        AND table_name = 'generations'
    ) THEN
        ALTER TABLE public.generations DROP CONSTRAINT generations_user_id_fkey;
    END IF;
END $$;

-- 3. Relax Foreign Key on public.executions
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'executions_user_id_fkey' 
        AND table_name = 'executions'
    ) THEN
        ALTER TABLE public.executions DROP CONSTRAINT executions_user_id_fkey;
    END IF;
END $$;

-- 4. Relax Foreign Key on public.blender_devices
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'blender_devices_user_id_fkey' 
        AND table_name = 'blender_devices'
    ) THEN
        ALTER TABLE public.blender_devices DROP CONSTRAINT blender_devices_user_id_fkey;
    END IF;
END $$;

-- 5. Relax Foreign Key on public.ai_usage
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'ai_usage_user_id_fkey' 
        AND table_name = 'ai_usage'
    ) THEN
        ALTER TABLE public.ai_usage DROP CONSTRAINT ai_usage_user_id_fkey;
    END IF;
END $$;

-- 6. Ensure indexes on user_id exist for fast tenant-partitioned lookups
CREATE INDEX IF NOT EXISTS idx_projects_guest_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_guest_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_executions_guest_user_id ON public.executions(user_id);

-- 7. Document migration application record
COMMENT ON TABLE public.projects IS 'SculptorAI projects supporting both authenticated users and server-validated guest sessions.';
