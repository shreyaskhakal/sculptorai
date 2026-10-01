-- ==============================================================================
-- SculptorAI Production Migration: Multi-User Collaboration & Community Marketplace
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Project Members & RBAC Roles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'commenter', 'viewer')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can view members of their projects"
    ON public.project_members
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage project members"
    ON public.project_members
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role = 'owner'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_id AND p.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = project_id AND pm.user_id = auth.uid() AND pm.role = 'owner'
        )
    );

-- -----------------------------------------------------------------------------
-- 2. Creator Profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    username TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    total_downloads INTEGER NOT NULL DEFAULT 0,
    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creator profiles are publicly viewable"
    ON public.creator_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage their own creator profile"
    ON public.creator_profiles
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 3. Community Marketplace Templates
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'Furniture', 'Architecture', 'Game Assets', 'Product Design',
        'Vehicles', 'Characters', 'Environment', 'Procedural', 'Materials', 'Other'
    )),
    difficulty TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
    tags TEXT[] NOT NULL DEFAULT '{}',
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'archived')),
    blender_version TEXT NOT NULL DEFAULT '4.x',
    current_version TEXT NOT NULL DEFAULT '1.0.0',
    download_count INTEGER NOT NULL DEFAULT 0,
    favorite_count INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    declared_capabilities JSONB NOT NULL DEFAULT '{"filesystem":false,"network":false,"external_process":false,"blender_api":true,"geometry":true,"materials":true,"modifiers":true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_marketplace_templates_slug ON public.marketplace_templates(slug);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_category ON public.marketplace_templates(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_downloads ON public.marketplace_templates(download_count DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_templates_rating ON public.marketplace_templates(rating DESC);

ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published marketplace templates are publicly viewable"
    ON public.marketplace_templates
    FOR SELECT
    USING (status = 'published' OR auth.uid() = creator_id);

CREATE POLICY "Creators can manage their own templates"
    ON public.marketplace_templates
    FOR ALL
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

-- -----------------------------------------------------------------------------
-- 4. Marketplace Template Versions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_template_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    script TEXT NOT NULL,
    parameter_schema JSONB NOT NULL DEFAULT '[]'::jsonb,
    security_scan_status TEXT NOT NULL DEFAULT 'passed' CHECK (security_scan_status IN ('pending', 'passed', 'failed')),
    security_scan_report JSONB NOT NULL DEFAULT '{}'::jsonb,
    changelog TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(template_id, version)
);

CREATE INDEX IF NOT EXISTS idx_template_versions_template_id ON public.marketplace_template_versions(template_id);

ALTER TABLE public.marketplace_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Versions of published templates are publicly viewable"
    ON public.marketplace_template_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.marketplace_templates t
            WHERE t.id = template_id AND (t.status = 'published' OR t.creator_id = auth.uid())
        )
    );

CREATE POLICY "Creators can insert versions for their templates"
    ON public.marketplace_template_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.marketplace_templates t
            WHERE t.id = template_id AND t.creator_id = auth.uid()
        )
    );

-- -----------------------------------------------------------------------------
-- 5. Reviews, Ratings & Favorites
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_template_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(template_id, user_id)
);

ALTER TABLE public.marketplace_template_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
    ON public.marketplace_template_reviews
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can submit one review per template"
    ON public.marketplace_template_reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.marketplace_template_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(template_id, user_id)
);

ALTER TABLE public.marketplace_template_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
    ON public.marketplace_template_favorites
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 6. Tracked Downloads
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_template_downloads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.marketplace_templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.marketplace_template_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record template downloads"
    ON public.marketplace_template_downloads
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
