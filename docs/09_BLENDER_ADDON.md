# Blender Add-on Specification

## Goal
Provide a native Blender sidebar panel for Blender AI Copilot.

## UI
Panel:
`3D View > Sidebar > Blender AI`

Fields:
- API URL
- login/connect button
- prompt
- optional image path
- Generate button
- code preview
- Approve & Run
- Stop/Cancel
- execution status
- error details
- Fix with AI

## Add-on modules

```text
blender-addon/
├── __init__.py
├── api_client.py
├── auth.py
├── operators.py
├── panels.py
├── executor.py
├── error_capture.py
└── preferences.py
```

## Authentication
Use a short-lived authenticated session/token approach. Do not store permanent secrets in plain text in the Blender add-on.

## Execution workflow

```text
User prompt
 -> add-on sends request
 -> backend generates code
 -> add-on displays code
 -> user clicks Approve & Run
 -> executor runs code
 -> capture result
 -> backend stores execution
```

## Safety
- Never execute code automatically after generation.
- Show code before execution.
- Clearly label generated code.
- Provide cancel/stop controls where possible.
- Capture errors.
- Limit dangerous capabilities in the product's generated-code policy.
- Never claim static code scanning makes arbitrary Python safe.

## Blender context
The add-on may collect only the minimum context needed:
- Blender version
- selected object names
- object types
- active scene name
- relevant dimensions
- user-approved metadata

Do not upload an entire scene by default.

## Versioning
The add-on must send:
- add-on version
- Blender version
- OS where useful

This allows the backend to tailor code to the user's environment.
