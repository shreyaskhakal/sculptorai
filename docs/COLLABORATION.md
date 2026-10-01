# SculptorAI — Multi-User Realtime Collaboration

## Overview

SculptorAI supports real-time multi-user collaboration inside shared 3D project workspaces, enabling distributed teams of technical artists, modelers, and directors to work together synchronously.

---

## Features

1. **Presence Roster**: Displays all active users connected to the workspace in real-time with customizable avatars, status badges, and role indicators.
2. **Remote Object Selection Sync**: When a collaborator selects a 3D object in the Three.js viewport, an interactive badge shows `User A selected: [ObjectName]`, highlighting the selected geometry across all connected screens.
3. **Live Cursor Synchronization**: For code editing in Monaco, cursor positions `{ line, column }` are throttled to 50ms intervals and broadcast to collaborators without overloading the network or database.
4. **Member Management Modal**: Project owners can invite collaborators by email, assign roles (`owner`, `editor`, `commenter`, `viewer`), or revoke access at any time.

---

## State Model

```text
CollaboratorPresence {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  role: "owner" | "editor" | "commenter" | "viewer";
  activePanel: "chat" | "editor" | "viewer" | "execution";
  selectedObject?: string | null;
  lastActive: string;
}
```
