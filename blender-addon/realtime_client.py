"""
SCULPTOR AI — Realtime Event Listener & Streaming Client
Connects to SculptorAI SSE/Streaming bridge with automatic fallback to HTTP polling.
"""

import json
import queue
import time
import threading
import urllib.request
import urllib.error
from urllib.parse import urlencode
import bpy
from .auth import get_api_url, get_auth_headers
from .api_client import SculptorApiClient
from .compat import get_blender_version_string

class SculptorRealtimeClient:
    _instance = None
    _thread = None
    _running = False
    _status = "OFFLINE" # "CONNECTED", "RECONNECTING", "OFFLINE"
    _executed_task_ids = set()
    _on_task_received = None
    _pending_tasks = queue.Queue()
    _timer_registered = False

    @classmethod
    def get_status(cls):
        return cls._status

    @classmethod
    def is_running(cls):
        return cls._running

    @classmethod
    def start(cls, project_id, device_id=None, on_task_received=None, context=None):
        if cls._running:
            return
        api_url = get_api_url(context)
        auth_headers = get_auth_headers(context)
        blender_version = get_blender_version_string()
        cls._running = True
        cls._on_task_received = on_task_received
        cls._register_main_thread_timer()
        cls._thread = threading.Thread(
            target=cls._stream_loop,
            args=(project_id, device_id, api_url, auth_headers, blender_version),
            daemon=True
        )
        cls._thread.start()

    @classmethod
    def stop(cls):
        cls._running = False
        cls._status = "OFFLINE"
        while not cls._pending_tasks.empty():
            try:
                cls._pending_tasks.get_nowait()
            except queue.Empty:
                break
        if cls._timer_registered:
            try:
                bpy.app.timers.unregister(cls._process_pending_tasks)
            except ValueError:
                pass
            cls._timer_registered = False

    @classmethod
    def _register_main_thread_timer(cls):
        if cls._timer_registered:
            return
        bpy.app.timers.register(cls._process_pending_tasks, first_interval=0.1, persistent=True)
        cls._timer_registered = True

    @classmethod
    def _process_pending_tasks(cls):
        """Apply network results on Blender's main thread only."""
        if not cls._running:
            cls._timer_registered = False
            return None

        for _ in range(20):
            try:
                payload = cls._pending_tasks.get_nowait()
            except queue.Empty:
                break
            if cls._on_task_received:
                try:
                    cls._on_task_received(payload)
                except Exception as error:
                    print("SculptorAI could not apply a claimed task to Blender UI:", type(error).__name__)

        return 0.1

    @classmethod
    def mark_task_executed(cls, task_id):
        cls._executed_task_ids.add(task_id)

    @classmethod
    def has_executed(cls, task_id):
        return task_id in cls._executed_task_ids

    @classmethod
    def _stream_loop(cls, project_id, device_id, api_url, auth_headers, blender_version):
        while cls._running:
            base_url = api_url.rstrip('/')
            query = urlencode({
                "projectId": project_id,
                "deviceId": device_id or "blender_workstation",
            })
            stream_url = f"{base_url}/api/blender/stream?{query}"
            headers = dict(auth_headers)
            headers["Accept"] = "text/event-stream"
            headers["Cache-Control"] = "no-cache"

            req = urllib.request.Request(stream_url, headers=headers, method="GET")
            cls._status = "RECONNECTING"

            try:
                with urllib.request.urlopen(req, timeout=45) as response:
                    if response.status == 200:
                        cls._status = "CONNECTED"
                        current_event = None

                        for line in response:
                            if not cls._running:
                                break
                            decoded = line.decode("utf-8").strip()
                            if not decoded:
                                continue

                            if decoded.startswith("event:"):
                                current_event = decoded.replace("event:", "").strip()
                            elif decoded.startswith("data:"):
                                raw_data = decoded.replace("data:", "").strip()
                                try:
                                    payload = json.loads(raw_data)
                                    if current_event == "task.created":
                                        task_id = payload.get("taskId") or payload.get("id")
                                        if task_id and not cls.has_executed(task_id):
                                            ok, claimed_task = SculptorApiClient.claim_task_by_id(
                                                task_id,
                                                api_url=base_url,
                                                auth_headers=auth_headers,
                                                blender_version=blender_version,
                                            )
                                            if ok and claimed_task:
                                                cls._pending_tasks.put(claimed_task)
                                except Exception as error:
                                    print("SculptorAI stream task handling failed:", type(error).__name__)
                                current_event = None
            except Exception:
                cls._status = "RECONNECTING"
                time.sleep(5) # Backoff before reconnecting

        cls._status = "OFFLINE"
