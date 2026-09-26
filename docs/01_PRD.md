# PRD — Blender AI Copilot

## 1. Product name
Working name: **Blender AI Copilot**

## 2. One-line description
An AI assistant that helps users create, understand, modify, debug, and automate Blender scenes using natural language, reference images, and Blender Python.

## 3. Problem
Blender is powerful but has a steep learning curve. Users often need to:
- find the correct modeling workflow
- repeat technical steps
- write Blender Python
- understand Blender errors
- convert reference images into modeling plans
- modify existing scenes efficiently

## 4. Target users
### Primary
- Blender beginners
- students
- 3D artists
- indie game developers
- technical artists

### Secondary
- product designers
- architects
- animation creators
- educators

## 5. Core value proposition
Instead of only generating a finished 3D asset, the product understands Blender workflows and helps the user operate Blender.

## 6. MVP features

### F1 — AI Blender Chat
User asks:
"Create a low-poly gaming chair."

System returns:
- interpretation
- modeling plan
- Blender Python
- assumptions
- optional next actions

### F2 — Text to Blender Python
Generate executable Blender Python for supported tasks.

### F3 — Image to Blender Plan
User uploads a reference image.
AI identifies:
- major objects
- approximate geometry
- proportions
- materials
- modeling approach
- scene/lighting suggestions

### F4 — Blender Error Fixer
User pastes an error or uploads a screenshot/log.
AI returns:
- probable cause
- exact fix
- corrected code
- explanation

### F5 — Script Workspace
User can:
- view code
- copy
- download `.py`
- regenerate
- compare versions

### F6 — Blender Add-on
The add-on provides an AI panel inside Blender:
- prompt
- image/reference input
- generated code
- approve and run
- error capture
- send error back to AI

## 7. V2 features
- AI scene modification
- material generator
- lighting generator
- animation generator
- topology/optimization assistant
- scene analysis
- project/version history
- web 3D preview
- model export helpers

## 8. Non-goals for MVP
- training a foundation 3D model
- guaranteed photorealistic reconstruction
- automatic execution of arbitrary AI code without user approval
- replacing Blender
- full CAD-grade parametric modeling

## 9. Main user journey
1. User opens dashboard.
2. User creates a project.
3. User enters a natural-language request.
4. AI asks clarification only when needed.
5. AI creates structured modeling plan.
6. AI generates Blender Python.
7. User reviews code.
8. User copies/downloads it OR sends it to the Blender add-on.
9. Blender runs the approved script.
10. If an error occurs, the add-on captures it.
11. AI diagnoses and generates a corrected script.
12. User accepts the correction.

## 10. Success metrics for MVP
- First successful generation rate
- Script execution success rate
- Error recovery rate
- Time from prompt to usable Blender result
- Repeat usage per user
- Number of successful Blender add-on executions

## 11. Product differentiation
Competitors may generate 3D assets. This product focuses on:
**understanding Blender + planning + executable Python + debugging + direct Blender workflow.**

## 12. Example
Input:
"Create a futuristic desk with a monitor, keyboard, RGB strips and cable management."

Output:
1. Scene interpretation
2. Object hierarchy
3. dimensions/proportions
4. modeling operations
5. materials
6. lighting
7. Blender Python
8. optional animation

## 13. MVP acceptance criteria
A user must be able to:
- sign up
- create a project
- enter a prompt
- receive structured AI output
- receive Blender Python
- copy/download it
- upload an image and receive a modeling plan
- submit a Blender error and receive a fix
- install the add-on
- send a prompt from Blender
- approve and execute generated code
- see execution errors
- retry with AI correction
