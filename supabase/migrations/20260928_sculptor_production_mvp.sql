-- ==============================================================================
-- SculptorAI Production MVP Migration
-- Updates schema for full persistence, execution lifecycle, and atomic claiming
-- ==============================================================================

-- 1. Ensure profiles has email and timestamps
ALTER TABLE IF EXISTS public.profiles 
    ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Ensure conversations has user_id
ALTER TABLE IF EXISTS public.conversations 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);

-- 3. Ensure messages has user_id, image_url, metadata
ALTER TABLE IF EXISTS public.messages 
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS image_url TEXT,
    ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

-- 4. Update generations table with versioning and parameters
ALTER TABLE IF EXISTS public.generations 
    ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'create',
    ADD COLUMN IF NOT EXISTS style TEXT NOT NULL DEFAULT 'low-poly',
    ADD COLUMN IF NOT EXISTS complexity TEXT NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS plan_json JSONB;

-- Sync plan_json with existing model_plan if exists
UPDATE public.generations SET plan_json = model_plan WHERE plan_json IS NULL AND model_plan IS NOT NULL;

-- 5. Upgrade executions table for full lifecycle & atomic claiming
-- Drop old status check constraint to allow 'claimed' and 'cancelled'
ALTER TABLE IF EXISTS public.executions DROP CONSTRAINT IF EXISTS executions_status_check;

ALTER TABLE IF EXISTS public.executions 
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS script TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS prompt TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;

-- Re-add comprehensive status constraint
ALTER TABLE IF EXISTS public.executions 
    ADD CONSTRAINT executions_status_check 
    CHECK (status IN ('pending', 'claimed', 'running', 'success', 'error', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_executions_project_id ON public.executions(project_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON public.executions(status);
CREATE INDEX IF NOT EXISTS idx_executions_claimed_at ON public.executions(claimed_at);

-- 6. Create Execution Events table for auditing state transitions
CREATE TABLE IF NOT EXISTS public.execution_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'claimed', 'started', 'completed', 'cancelled', 'error', 'timeout')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_execution_events_execution_id ON public.execution_events(execution_id);
CREATE INDEX IF NOT EXISTS idx_execution_events_created_at ON public.execution_events(created_at DESC);

-- Enable RLS on execution_events
ALTER TABLE public.execution_events ENABLE ROW LEVEL SECURITY;

-- 7. Atomic Task Claiming PostgreSQL Function
CREATE OR REPLACE FUNCTION public.claim_next_execution_task(
    p_user_id UUID,
    p_blender_version TEXT DEFAULT '4.x'
)
RETURNS SETOF public.executions AS $$
DECLARE
    v_task public.executions%ROWTYPE;
BEGIN
    -- Select and lock a pending task for the authorized user
    SELECT * INTO v_task
    FROM public.executions
    WHERE user_id = p_user_id
      AND status = 'pending'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        UPDATE public.executions
        SET status = 'claimed',
            claimed_at = timezone('utc'::text, now())
        WHERE id = v_task.id
        RETURNING * INTO v_task;

        -- Log execution event
        INSERT INTO public.execution_events (execution_id, event_type, payload)
        VALUES (v_task.id, 'claimed', jsonb_build_object('claimed_at', v_task.claimed_at, 'blender_version', p_blender_version));

        RETURN NEXT v_task;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Claim specific execution task by ID (Atomic)
CREATE OR REPLACE FUNCTION public.claim_execution_task_by_id(
    p_task_id UUID,
    p_user_id UUID,
    p_blender_version TEXT DEFAULT '4.x'
)
RETURNS SETOF public.executions AS $$
DECLARE
    v_task public.executions%ROWTYPE;
BEGIN
    SELECT * INTO v_task
    FROM public.executions
    WHERE id = p_task_id
      AND user_id = p_user_id
      AND status = 'pending'
    FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        UPDATE public.executions
        SET status = 'claimed',
            claimed_at = timezone('utc'::text, now())
        WHERE id = v_task.id
        RETURNING * INTO v_task;

        INSERT INTO public.execution_events (execution_id, event_type, payload)
        VALUES (v_task.id, 'claimed', jsonb_build_object('claimed_at', v_task.claimed_at, 'blender_version', p_blender_version));

        RETURN NEXT v_task;
    END IF;

    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Row Level Security Policies for Execution Events
DROP POLICY IF EXISTS "Users can view events of their executions" ON public.execution_events;
CREATE POLICY "Users can view events of their executions"
    ON public.execution_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.executions e
        WHERE e.id = execution_events.execution_id AND e.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert events into their executions" ON public.execution_events;
CREATE POLICY "Users can insert events into their executions"
    ON public.execution_events FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.executions e
        WHERE e.id = execution_events.execution_id AND e.user_id = auth.uid()
    ));

-- 10. Update Executions RLS policy to allow cancel/updates by owner
DROP POLICY IF EXISTS "Users can update their own executions" ON public.executions;
CREATE POLICY "Users can update their own executions" 
    ON public.executions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
