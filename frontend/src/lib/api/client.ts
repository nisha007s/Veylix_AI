// The single place the frontend talks to the backend (SAD §8.5).

import type { ApiErrorBody, EmailScanResult, ScanResult } from "../../types/api";

const BASE = "/api/v1";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId?: string;
  readonly fields: { field: string; reason: string }[];

  constructor(
    code: string,
    status: number,
    message: string,
    requestId?: string,
    fields: { field: string; reason: string }[] = [],
  ) {
    super(message);
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.fields = fields;
  }
}

const UNREACHABLE =
  "Can't reach the Veylix analysis service. Make sure the backend is running, then try again.";

// Friendly text for each error type; raw server responses are never shown (SRS ERR-012).
export function friendlyMessage(code: string, serverMessage?: string): string {
  switch (code) {
    case "validation_error":
      // Backend validation messages are written for users, e.g. "URL is longer than 2,048 characters."
      return serverMessage || "Please check your input and try again.";
    case "payload_too_large":
      return "That input is too large to analyse. Please shorten it and try again.";
    case "rate_limited":
      return "Too many scans in a short time. Please wait a moment and try again.";
    case "service_unavailable":
      return "The analysis service is temporarily unavailable. Please try again shortly.";
    case "network_error":
      return UNREACHABLE;
    case "not_found":
      return "The requested item was not found.";
    default:
      return "Something went wrong on our side. Please try again.";
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiErrorBody).error?.code === "string"
  );
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      ...init,
      credentials: "same-origin",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
  } catch (err) {
    if (init.signal?.aborted) throw err;
    throw new ApiError("network_error", 0, UNREACHABLE);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (isErrorBody(body)) {
      const { code, message, request_id, fields } = body.error;
      throw new ApiError(code, response.status, friendlyMessage(code, message), request_id, fields);
    }
    // A non-JSON 5xx usually means the dev proxy could not reach the backend.
    const code = response.status >= 500 ? "network_error" : "http_error";
    throw new ApiError(code, response.status, friendlyMessage(code));
  }
  return body as T;
}

export function scanUrl(url: string, signal?: AbortSignal): Promise<ScanResult> {
  return request("/scans/url", { method: "POST", body: JSON.stringify({ url }), signal });
}

export function scanEmail(text: string, signal?: AbortSignal): Promise<EmailScanResult> {
  return request("/scans/email", { method: "POST", body: JSON.stringify({ text }), signal });
}

export function getHealth(signal?: AbortSignal): Promise<{ status: string }> {
  return request("/health", { signal });
}
