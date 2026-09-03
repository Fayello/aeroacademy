import { API_VERSION, getApiUrl } from "@/lib/api";

export async function fetchPublicApi<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers["Content-Type"] && !isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${getApiUrl()}${API_VERSION}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const rawMessage =
      typeof payload === "object" && payload !== null && "message" in payload
        ? payload.message
        : null;
    const message =
      typeof rawMessage === "string"
        ? rawMessage
        : Array.isArray(rawMessage) && typeof rawMessage[0] === "string"
          ? rawMessage[0]
          : response.status >= 500
            ? "The server could not process this request right now. Please try again or email contact@xpertclass.academy."
            : response.status === 400
              ? "Please check the highlighted form fields and try again."
        : "This request could not be submitted. Please check the form and try again.";
    throw new Error(message);
  }

  return payload as T;
}
