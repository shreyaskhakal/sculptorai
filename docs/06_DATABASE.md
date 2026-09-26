# Database Design — Supabase/Postgres

## Tables

### profiles
- `id uuid primary key` -> auth user
- `display_name text`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`

### projects
- `id uuid primary key`
- `user_id uuid`
- `name text`
- `description text`
- `blender_version text`
- `created_at timestamptz`
- `updated_at timestamptz`

### conversations
- `id uuid primary key`
- `project_id uuid`
- `title text`
- `created_at timestamptz`
- `updated_at timestamptz`

### messages
- `id uuid primary key`
- `conversation_id uuid`
- `role text` — user/assistant/system
- `content jsonb`
- `created_at timestamptz`

### generations
- `id uuid primary key`
- `project_id uuid`
- `conversation_id uuid nullable`
- `user_id uuid`
- `prompt text`
- `model_plan jsonb`
- `code text`
- `blender_version text`
- `status text`
- `warnings jsonb`
- `created_at timestamptz`

### assets
- `id uuid primary key`
- `project_id uuid`
- `user_id uuid`
- `storage_path text`
- `asset_type text`
- `mime_type text`
- `size_bytes bigint`
- `created_at timestamptz`

### executions
- `id uuid primary key`
- `generation_id uuid`
- `user_id uuid`
- `status text`
- `stdout text`
- `stderr text`
- `duration_ms integer`
- `blender_version text`
- `created_at timestamptz`
- `completed_at timestamptz`

### debug_sessions
- `id uuid primary key`
- `generation_id uuid`
- `user_id uuid`
- `error_text text`
- `diagnosis jsonb`
- `corrected_code text`
- `created_at timestamptz`

### usage_events
- `id uuid primary key`
- `user_id uuid`
- `event_type text`
- `metadata jsonb`
- `created_at timestamptz`

## Relationships

```text
auth.users
   │
   ├── profiles
   ├── projects
   │      ├── conversations
   │      │      └── messages
   │      ├── generations
   │      │      └── executions
   │      └── assets
   └── usage_events
```

## RLS rules
Every user-owned table must enforce:
- user can SELECT only own records
- user can INSERT only records with own user ID
- user can UPDATE only own records
- user can DELETE only own records

Never rely only on frontend filtering.

## Storage buckets
- `reference-images`
- `project-assets`
- `exports`

Prefer private buckets for user assets and signed URLs where appropriate.

## Indexes
Create indexes for:
- `projects.user_id`
- `generations.user_id`
- `generations.project_id`
- `executions.generation_id`
- `usage_events.user_id`
- timestamps used for history queries
