# SculptorAI — Community 3D Template Marketplace

## Overview

The SculptorAI Marketplace empowers 3D creators to share, discover, version, and execute modular procedural assets, custom shaders, and architectural environments.

---

## Routes & Capabilities

- `/marketplace`: Browsing gallery with full-text search, category pills (`Procedural`, `Materials`, `Architecture`, `Characters`, `Game Assets`), sorting by popularity/rating/newest, and AST security badges.
- `/marketplace/[slug]`: Template detail view featuring 3D visual preview, AST Security Audit scorecard, live parameter schema sliders, ratings & reviews list, and single-click project injection.
- `/marketplace/create`: Creator publishing wizard featuring real-time client-side AST capability scanning, prohibited primitive detection, and automated capability tagging.

---

## Template to Project Execution Pipeline

When a creator or user clicks **Use Template**:
1. The user configures custom parameters (e.g. radius, count, metallic, color).
2. The endpoint `POST /api/marketplace/templates/{slug}/use` injects parameter overrides into the Python script.
3. The script passes through the hardened `validateBlenderScript` AST validator.
4. An execution record is created in the database with status `pending`.
5. A `task.created` event is broadcast via Supabase Realtime / SSE.
6. The user is redirected into their project studio where the task is ready for review and Blender execution!
