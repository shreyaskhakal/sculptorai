# SculptorAI — Production Deployment Guide

## 1. Architecture Split
- **Web App & APIs**: Deployed on **Vercel** (Next.js 14 App Router).
- **Database & Storage**: Hosted on **Supabase** (PostgreSQL 15+, Auth, Realtime, Storage).
- **Blender Execution**: Runs locally on artists' workstations or dedicated headless render nodes.

---

## 2. Supabase Setup

1. Create a new Supabase project in your desired region.
2. In the Supabase SQL Editor, execute the schema migrations in order:
   - `supabase/migrations/20260901_sculptor_core.sql`
   - `supabase/migrations/20261001_sculptor_heartbeat_and_scene_intelligence.sql`
3. Navigate to **Storage** and ensure the `models` bucket is created with public read access or signed URL policies for GLB binary delivery.
4. Verify Row Level Security (RLS) is enabled on all tables:
   - `projects`
   - `generations`
   - `generation_versions`
   - `executions`
   - `scene_snapshots`
   - `blender_devices`
   - `ai_usage`

---

## 3. Vercel Deployment

1. Connect your repository to Vercel.
2. Set Framework Preset: **Next.js**.
3. Configure Environment Variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   GEMINI_API_KEY=<your-gemini-api-key>
   AI_GENERATION_MODEL=gemini-1.5-flash
   AI_REASONING_MODEL=gemini-1.5-pro
   AI_VISION_MODEL=gemini-1.5-flash
   AI_DEBUG_MODEL=gemini-1.5-flash
   AI_SCENE_EDITOR_MODEL=gemini-1.5-flash
   NEXT_PUBLIC_APP_URL=https://<your-custom-domain>.com
   DEMO_MODE=false
   ```
4. Trigger Deployment. Vercel will run `npm ci` and `npm run build`.

---

## 4. Blender Add-on Distribution

1. Distribute `blender-addon.zip` to artists.
2. Ensure artists enter their personal token or project ID.
3. Verify connection via the **Blender Bridge** indicator on the SculptorAI Dashboard.
