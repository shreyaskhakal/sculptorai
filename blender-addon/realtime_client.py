"""
SCULPTOR AI — Realtime Event Listener & Streaming Client
Connects to SculptorAI SSE/Streaming bridge with automatic fallback to HTTP polling.
"""

import json
import time
import threading
import urllib.request
import urllib.error
from .auth import get_api_url, get_auth_headers

class SculptorRealtimeClient:
    _instance = None
    _thread = None
    _running = False
    _status = "OFFLINE" # "CONNECTED", "RECONNECTING", "OFFLINE"
    _executed_task_ids = set()
    _on_task_received = None

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
        cls._running = True
        cls._on_task_received = on_task_received
        cls._thread = threading.Thread(
            target=cls._stream_loop,
            args=(project_id, device_id, context),
            daemon=True
        )
        cls._thread.start()

    @classmethod
    def stop(cls):
        cls._running = False
        cls._status = "OFFLINE"

    @classmethod
    def mark_task_executed(cls, task_id):
        cls._executed_task_ids.add(task_id)

    @classmethod
    def has_executed(cls, task_id):
        return task_id in cls._executed_task_ids

    @classmethod
    def _stream_loop(cls, project_id, device_id, context):
        while cls._running:
            base_url = get_api_url(context)
            stream_url = f"{base_url}/api/blender/stream?projectId={project_id}&deviceId={device_id or 'blender_workstation'}"
            headers = get_auth_headers(context)
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
                                            if cls._on_task_received:
                                                cls._on_task_received(payload)
                                except Exception:
                                    pass
                                current_event = None
            except Exception:
                cls._status = "RECONNECTING"
                time.sleep(5) # Backoff before reconnecting

        cls._status = "OFFLINE"
