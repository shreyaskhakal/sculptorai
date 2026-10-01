# SculptorAI — Template Security Pipeline & Capability Scanner

## Security Principles

Community marketplace scripts must NEVER be executed directly without strict automated static analysis and sandboxing verification. SculptorAI implements a multi-stage defense-in-depth security model:

```text
    Creator Uploads Script
              ↓
  Zero-Tolerance Primitive Scan
 (eval, exec, subprocess, shutil)
              ↓
   AST Capability Verification
(filesystem, network, process limits)
              ↓
  Declared vs Detected Boundaries
(blocks undeclared access attempts)
              ↓
     Automated Safety Score
   (100/100 or Critical Reject)
              ↓
  Human-In-The-Loop Approval
(Artist reviews before execution)
```

---

## Prohibited Operations

1. **Subprocess & OS Execution**: Calls to `subprocess.Popen`, `subprocess.run`, `os.system`, `os.popen`, and `os.spawn` are rejected.
2. **Dynamic Code Execution**: Calls to `eval()`, `exec()`, `compile()`, and `__import__()` are rejected.
3. **Filesystem Exploitation**: Unauthorized calls to `open()`, `shutil.rmtree()`, or `pathlib` are rejected unless explicitly declared and approved.
4. **Network Access**: Raw sockets (`socket.socket`), `urllib`, `requests`, and `http.client` are blocked.
5. **Runtime Reflection**: Traversal of `__subclasses__`, `__mro__`, `__bases__`, or harvesting `os.environ` secrets is rejected.

---

## Capability Boundary Model

Templates declare their required capabilities:
```json
{
  "filesystem": false,
  "network": false,
  "external_process": false,
  "blender_api": true,
  "geometry": true,
  "materials": true,
  "modifiers": true
}
```

If the static analyzer detects any undeclared capability in the script, the template is automatically rejected with HTTP 422 Unprocessable Entity.
