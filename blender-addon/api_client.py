import json
import urllib.request
import urllib.error
from .auth import get_api_url, get_auth_headers

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
    def generate(prompt, blender_version="4.x", context=None):
        base_url = get_api_url(context)
        url = f"{base_url}/api/generate"
        headers = get_auth_headers(context)
        
        payload = {
            "projectId": "blender_addon_session",
            "prompt": prompt,
            "blenderVersion": blender_version,
            "includeCode": true_bool := True,
            "style": "low-poly",
            "complexity": "medium"
        }
        
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=30) as response:
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
    def debug_error(error_traceback, script, blender_version="4.x", context=None):
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
            with urllib.request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}

    @staticmethod
    def report_execution_result(execution_id, status, stdout, stderr, duration_ms, context=None):
        if not execution_id:
            return True, {}
        base_url = get_api_url(context)
        url = f"{base_url}/api/executions/{execution_id}/result"
        headers = get_auth_headers(context)
        
        payload = {
            "status": status,
            "stdout": stdout,
            "stderr": stderr,
            "durationMs": duration_ms
        }
        
        req_data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(url, data=req_data, headers=headers, method="POST")
        
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                return True, data
        except Exception as e:
            return False, {"error": str(e)}
