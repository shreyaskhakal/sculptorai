export interface SafeServiceError {
  status: number;
  message: string;
  code: string;
}

/** Convert internal provider/database failures to messages safe for API clients. */
export function toSafeServiceError(error: unknown, operation: string): SafeServiceError {
  const internalMessage = error instanceof Error ? error.message : "";

  if (internalMessage.includes("Google Gemini is not configured")) {
    return {
      status: 503,
      message: "AI service is unavailable because Gemini is not configured.",
      code: `${operation}_AI_NOT_CONFIGURED`,
    };
  }

  if (internalMessage.includes("Supabase operation") || internalMessage.includes("Supabase")) {
    return {
      status: 503,
      message: "Persistent storage is unavailable. The requested change was not saved.",
      code: `${operation}_STORAGE_UNAVAILABLE`,
    };
  }

  return {
    status: 502,
    message: "The AI request could not be completed. Please try again.",
    code: `${operation}_PROVIDER_FAILED`,
  };
}
