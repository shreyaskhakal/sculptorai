-- ==============================================================================
-- SculptorAI Production Migration: Heartbeat, Scene Snapshots & Intelligence
-- ==============================================================================

-- 1. Blender Devices & Heartbeat Tracking
CREATE TABLE IF NOT EXISTS public.blender_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    blender_version TEXT NOT NULL DEFAULT '4.x',
    addon_version TEXT NOT NULL DEFAULT '1.1.0',
    status TEXT NOT NULL DEFAULT 'IDLE' CHECK (status IN ('CONNECTED', 'IDLE', 'BUSY', 'EXECUTING', 'ERROR', 'OFFLINE')),
    current_project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    current_execution_id UUID REFERENCES public.executions(id) ON DELETE SET NULL,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_blender_devices_user_id ON public.blender_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_blender_devices_last_seen ON public.blender_devices(last_seen DESC);

ALTER TABLE public.blender_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and update their own devices"
    ON public.blender_devices
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Scene Snapshots (Compact 3D Scene Representations)
CREATE TABLE IF NOT EXISTS public.scene_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scene_name TEXT NOT NULL DEFAULT 'Scene',
    blender_version TEXT NOT NULL DEFAULT '4.x',
    snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_scene_snapshots_project_id ON public.scene_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_scene_snapshots_created_at ON public.scene_snapshots(created_at DESC);

ALTER TABLE public.scene_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their project scene snapshots"
    ON public.scene_snapshots
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. Generation Versions (3D Model Version Lineage & Comparison)
CREATE TABLE IF NOT EXISTS public.generation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    prompt TEXT NOT NULL,
    code TEXT NOT NULL,
    plan_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    parent_version_id UUID REFERENCES public.generation_versions(id) ON DELETE SET NULL,
    glb_url TEXT,
    snapshot_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_generation_versions_project_id ON public.generation_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_versions_version ON public.generation_versions(project_id, version_number DESC);

ALTER TABLE public.generation_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their project versions"
    ON public.generation_versions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. 3D Project Templates
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Furniture', 'Architecture', 'Game Assets', 'Product Design', 'Characters', 'Other')),
    difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    starting_prompt TEXT NOT NULL,
    starter_code TEXT NOT NULL,
    starter_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_official BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Templates are publicly viewable"
    ON public.templates
    FOR SELECT
    USING (true);

-- 5. AI Usage & Token Tracking
CREATE TABLE IF NOT EXISTS public.ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    model TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON public.ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON public.ai_usage(created_at DESC);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
    ON public.ai_usage
    FOR SELECT
    USING (auth.uid() = user_id);
