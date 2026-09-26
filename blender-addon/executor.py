import time
import bpy
from .error_capture import StreamCapture, format_exception_info

def execute_blender_code(code_string):
    """
    Executes an approved Python code block within Blender's runtime.
    Pushes an undo step so artists can revert changes with Ctrl+Z.
    Captures stdout, stderr, and any raised exceptions.
    """
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
