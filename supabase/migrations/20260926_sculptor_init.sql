-- ==============================================================================
-- SculptorAI PostgreSQL Schema & RLS Policies (Supabase)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    blender_version TEXT NOT NULL DEFAULT '4.x',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Generations Table
CREATE TABLE IF NOT EXISTS public.generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    model_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    code TEXT NOT NULL DEFAULT '',
    blender_version TEXT NOT NULL DEFAULT '4.x',
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Assets Table
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    asset_type TEXT NOT NULL DEFAULT 'reference_image' CHECK (asset_type IN ('reference_image', 'export', 'thumbnail')),
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Executions Table
CREATE TABLE IF NOT EXISTS public.executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error')),
    stdout TEXT,
    stderr TEXT,
    duration_ms INTEGER,
    blender_version TEXT NOT NULL DEFAULT '4.x',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- 8. Debug Sessions Table
CREATE TABLE IF NOT EXISTS public.debug_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    error_text TEXT NOT NULL,
    diagnosis JSONB NOT NULL DEFAULT '{}'::jsonb,
    corrected_code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. Usage Events Table
CREATE TABLE IF NOT EXISTS public.usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- Performance Indexes
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_project_id ON public.conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON public.generations(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_executions_generation_id ON public.executions(generation_id);
CREATE INDEX IF NOT EXISTS idx_executions_user_id ON public.executions(user_id);
CREATE INDEX IF NOT EXISTS idx_debug_sessions_generation_id ON public.debug_sessions(generation_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON public.usage_events(user_id);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debug_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- 2. Projects Policies
CREATE POLICY "Users can view their own projects" 
    ON public.projects FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" 
    ON public.projects FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
    ON public.projects FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
    ON public.projects FOR DELETE 
    USING (auth.uid() = user_id);

-- 3. Conversations Policies (via project ownership)
CREATE POLICY "Users can view conversations in their projects" 
    ON public.conversations FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = conversations.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can create conversations in their projects" 
    ON public.conversations FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = conversations.project_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete conversations in their projects" 
    ON public.conversations FOR DELETE 
    USING (EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.id = conversations.project_id AND p.user_id = auth.uid()
    ));

-- 4. Messages Policies
CREATE POLICY "Users can view messages from their conversations" 
    ON public.messages FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.conversations c
        JOIN public.projects p ON c.project_id = p.id
        WHERE c.id = messages.conversation_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages into their conversations" 
    ON public.messages FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.conversations c
        JOIN public.projects p ON c.project_id = p.id
        WHERE c.id = messages.conversation_id AND p.user_id = auth.uid()
    ));

-- 5. Generations Policies
CREATE POLICY "Users can view their own generations" 
    ON public.generations FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations" 
    ON public.generations FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations" 
    ON public.generations FOR DELETE 
    USING (auth.uid() = user_id);

-- 6. Assets Policies
CREATE POLICY "Users can view their own assets" 
    ON public.assets FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assets" 
    ON public.assets FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assets" 
    ON public.assets FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Executions Policies
CREATE POLICY "Users can view their own executions" 
    ON public.executions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own executions" 
    ON public.executions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own executions" 
    ON public.executions FOR UPDATE 
    USING (auth.uid() = user_id);

-- 8. Debug Sessions Policies
CREATE POLICY "Users can view their own debug sessions" 
    ON public.debug_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debug sessions" 
    ON public.debug_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- 9. Usage Events Policies
CREATE POLICY "Users can view their own usage events" 
    ON public.usage_events FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage events" 
    ON public.usage_events FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- User Profile Auto-Creation Trigger
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
