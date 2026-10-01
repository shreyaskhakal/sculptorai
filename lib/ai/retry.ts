/**
 * Retry and timeout handling with exponential backoff and jitter.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  factor?: number;
}

export async function executeWithRetry<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 2,
    initialDelayMs = 500,
    maxDelayMs = 4000,
    timeoutMs = 40000,
    factor = 2,
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      attempt++;
      const result = await operation(controller.signal);
      clearTimeout(timer);
      return result;
    } catch (err: any) {
      clearTimeout(timer);

      const isAborted = controller.signal.aborted || err.name === "AbortError";
      const isRetryable =
        isAborted ||
        err?.status === 429 ||
        err?.status === 503 ||
        err?.message?.includes("fetch failed") ||
        err?.message?.includes("network") ||
        err?.message?.includes("timeout");

      if (attempt > maxRetries || !isRetryable) {
        throw err;
      }

      // Add jitter
      const jitter = Math.random() * 200;
      const waitTime = Math.min(delay + jitter, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      delay *= factor;
    }
  }
}
