import sys
import io
import traceback
from contextlib import contextmanager

class StreamCapture:
    def __init__(self):
        self.stdout_buf = io.StringIO()
        self.stderr_buf = io.StringIO()
        self._orig_stdout = None
        self._orig_stderr = None

    def __enter__(self):
        self._orig_stdout = sys.stdout
        self._orig_stderr = sys.stderr
        sys.stdout = self.stdout_buf
        sys.stderr = self.stderr_buf
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self._orig_stdout
        sys.stderr = self._orig_stderr
        return False

    def get_stdout(self):
        return self.stdout_buf.getvalue()

    def get_stderr(self):
        return self.stderr_buf.getvalue()

def format_exception_info(exc):
    return "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
