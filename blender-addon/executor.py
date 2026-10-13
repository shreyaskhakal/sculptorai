import time
import re
import bpy
from .error_capture import StreamCapture, format_exception_info

DANGEROUS_PATTERNS = [
    r"\bimport\s+subprocess\b",
    r"\bfrom\s+subprocess\b",
    r"\bos\.(system|popen|spawn[lpe]*|exec[lpe]*|fork)\b",
    r"\b(import\s+socket|from\s+socket|import\s+urllib|import\s+requests|import\s+http)\b",
    r"\b(eval|exec)\s*\(",
    r"\b__import__\s*\(",
    r"\b(getattr|setattr|delattr)\s*\(",
    r"\b(globals|locals|vars)\s*\(\s*\)",
    r"__(subclasses|bases|mro|globals|code)__",
    r"\bimport\s+ctypes\b",
    r"\bfrom\s+ctypes\b",
    r"\b__builtins__\b",
    r"\bshutil\.(rmtree|move)\b",
    r"\bos\.(remove|unlink|rmdir)\b",
    r"bpy\.ops\.wm\.(quit_blender|read_factory_settings|read_homefile)\b",
]

def validate_script_safety(code_string):
    """
    Validates untrusted script on desktop client prior to compilation.
    """
    for pattern in DANGEROUS_PATTERNS:
        if re.search(pattern, code_string, re.IGNORECASE):
            return False, f"Desktop client security violation: detected forbidden pattern '{pattern}'"
    return True, ""

def execute_blender_code(code_string):
    """
    Executes an approved Python code block within Blender's runtime.
    Pushes an undo step so artists can revert changes with Ctrl+Z.
    Captures stdout, stderr, and any raised exceptions.
    """
    is_safe, sec_err = validate_script_safety(code_string)
    if not is_safe:
        return {
            "success": False,
            "stdout": "",
            "stderr": sec_err,
            "duration_ms": 0,
            "error": sec_err,
        }

    start_time = time.perf_counter()
    stdout_text = ""
    stderr_text = ""
    success = False
    exception_msg = ""

    # Push undo state before execution
    try:
        bpy.ops.ed.undo_push(message="SculptorAI Script Execution")
    except Exception:
        pass

    with StreamCapture() as capture:
        try:
            # Prepare execution environment
            global_namespace = {
                "bpy": bpy,
                "__name__": "__main__",
            }
            
            # Compile and execute
            compiled = compile(code_string, "<sculptor_generated_script>", "exec")
            exec(compiled, global_namespace)
            success = True
        except Exception as exc:
            success = False
            exception_msg = format_exception_info(exc)

    end_time = time.perf_counter()
    duration_ms = int((end_time - start_time) * 1000)

    stdout_text = capture.get_stdout()
    stderr_text = capture.get_stderr()
    if exception_msg:
        stderr_text = f"{stderr_text}\n{exception_msg}".strip()

    return {
        "success": success,
        "stdout": stdout_text,
        "stderr": stderr_text,
        "duration_ms": duration_ms,
        "error": exception_msg,
    }
