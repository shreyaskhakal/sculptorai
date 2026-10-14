-- The API calls these RPCs through its server-only service-role client after
-- authenticating the user. They accept a user ID argument, so they must never
-- be exposed to anonymous or browser-authenticated PostgREST callers.
ALTER FUNCTION public.claim_next_execution_task(uuid, text)
  SECURITY INVOKER
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.claim_execution_task_by_id(uuid, uuid, text)
  SECURITY INVOKER
  SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.claim_next_execution_task(uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_execution_task_by_id(uuid, uuid, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_next_execution_task(uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_execution_task_by_id(uuid, uuid, text)
  TO service_role;
