# Security and Safety

## 1. AI-generated code is untrusted
Generated Blender Python can modify files, scene data, or call Python capabilities.

Therefore:
- do not auto-run
- show code
- require explicit approval
- maintain an execution audit record

## 2. Server secrets
Never put these in client-side code:
- Gemini API key
- Supabase service-role key
- private signing secrets

Only public Supabase client configuration belongs in the browser.

## 3. Upload security
For images/assets:
- validate MIME type
- validate size
- generate safe filenames
- use private buckets
- use signed URLs
- do not trust filename extensions

## 4. Authentication
Use Supabase Auth.
Apply RLS to every user-owned table.

## 5. Prompt injection
Treat uploaded images and user text as untrusted.
Do not allow image text or user prompts to override system-level security rules.

## 6. Logging
Never log:
- API keys
- access tokens
- passwords
- private asset URLs

Log:
- request ID
- endpoint
- latency
- status
- error class
- user ID only where necessary

## 7. Rate limiting
Limit:
- AI generations
- image analyses
- debugger requests
- add-on polling/execution requests

## 8. File limits
Set conservative limits for MVP.
Reject unsupported formats.

## 9. Data deletion
Allow users to delete:
- projects
- uploaded assets
- generations
- account

Ensure associated private assets are deleted according to the retention policy.

## 10. Production principle
Security controls must be enforced on the server. Frontend controls are only UX.
