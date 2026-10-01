import json
import urllib.request
import urllib.error
from .auth import get_api_url, get_auth_headers
from .compat import get_blender_version_string

class SculptorApiClient:
    @staticmethod
    def test_connection(context=None):
        base_url = get_api_url(context)
        url = f"{base_url}/api/health"
        headers = get_auth_headers(context)
        
        req = urllib.request.Request(url, headers=headers, method="GET")
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    return True, data
                return False, {"error": f"HTTP {response.status}"}
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def generate(prompt, blender_version=None, context=None):
        if blender_version is None:
            blender_version = get_blender_version_string()

        base_url = get_api_url(context)
        url = f"{base_url}/api/generate"
        headers = get_auth_headers(context)
        
        payload = {
            "projectId": "blender_addon_session",
            "prompt": prompt,
            "blenderVersion": blender_version,
            "includeCode": True,
            "style": "low-poly",
            "complexity": "medium"
        }
        
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8') if e.fp else str(e)
            try:
                err_json = json.loads(err_body)
                return False, {"error": err_json.get("error", str(e))}
            except Exception:
                return False, {"error": f"HTTP {e.code}: {err_body}"}
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def debug_error(error_traceback, script, blender_version=None, context=None):
        if blender_version is None:
            blender_version = get_blender_version_string()

        base_url = get_api_url(context)
        url = f"{base_url}/api/debug"
        headers = get_auth_headers(context)
        
        payload = {
            "projectId": "blender_addon_session",
            "blenderVersion": blender_version,
            "error": error_traceback,
            "script": script,
        }
        
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=35) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def claim_next_task(context=None):
        """
        Atomically claims the oldest pending execution task from the server.
        """
        base_url = get_api_url(context)
        url = f"{base_url}/api/executions/claim-next"
        headers = get_auth_headers(context)
        
        payload = {
            "blenderVersion": get_blender_version_string()
        }
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                task = data.get("task")
                return True, task
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def claim_task_by_id(execution_id, context=None):
        """
        Atomically claims a specific execution task by its ID.
        """
        base_url = get_api_url(context)
        url = f"{base_url}/api/executions/{execution_id}/claim"
        headers = get_auth_headers(context)
        
        payload = {
            "blenderVersion": get_blender_version_string()
        }
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data.get("execution")
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def start_task(execution_id, context=None):
        """
        Signals that Blender is actively running the script.
        """
        if not execution_id:
            return True, {}
        base_url = get_api_url(context)
        url = f"{base_url}/api/executions/{execution_id}/start"
        headers = get_auth_headers(context)
        
        req = urllib.request.Request(url, data=b"{}", headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def report_execution_result(execution_id, status, stdout, stderr, duration_ms, context=None):
        """
        Reports true execution results (status, logs, timing, version) back to the server.
        """
        if not execution_id:
            return True, {}
        base_url = get_api_url(context)
        url = f"{base_url}/api/executions/{execution_id}/result"
        headers = get_auth_headers(context)
        
        payload = {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "durationMs": duration_ms,
            "blenderVersion": get_blender_version_string(),
        }
        
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def send_heartbeat(status="IDLE", device_id=None, device_name=None, current_project=None, current_execution=None, context=None):
        """
        Sends periodic heartbeat to the SculptorAI server to report device status.
        """
        import platform
        base_url = get_api_url(context)
        url = f"{base_url}/api/blender/heartbeat"
        headers = get_auth_headers(context)

        if not device_id:
            device_id = f"blender_{platform.node() or 'workstation'}"
        if not device_name:
            device_name = f"Blender {get_blender_version_string()} ({platform.system()})"

        payload = {
            "deviceId": device_id,
            "deviceName": device_name,
            "blenderVersion": get_blender_version_string(),
            "addonVersion": "1.1.0",
            "status": status,
            "currentProjectId": current_project,
            "currentExecutionId": current_execution,
        }

        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def send_snapshot(project_id, snapshot_data, context=None):
        """
        Transmits compact scene snapshot (<10KB) to the server for scene-aware AI.
        """
        base_url = get_api_url(context)
        url = f"{base_url}/api/blender/snapshot"
        headers = get_auth_headers(context)

        payload = {
            "projectId": project_id,
            "sceneName": snapshot_data.get("sceneName", "Scene"),
            "blenderVersion": get_blender_version_string(),
            "snapshot": snapshot_data,
        }

        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}

