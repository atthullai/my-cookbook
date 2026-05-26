export type ApiClientOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  retries?: number;
  timeoutMs?: number;
  retryDelayMs?: number;
};

export class ApiClientError extends Error {
  status: number;
  url: string;
  details: unknown;

  constructor(message: string, options: { status: number; url: string; details?: unknown }) {
    super(message);
    this.name = "ApiClientError";
    this.status = options.status;
    this.url = options.url;
    this.details = options.details;
  }
}

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RETRIES = 2;

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function shouldRetry(error: unknown, responseStatus?: number) {
  if (isAbortError(error)) return false;
  if (!navigator.onLine) return false;
  if (responseStatus && responseStatus >= 400 && responseStatus < 500 && responseStatus !== 408 && responseStatus !== 429) return false;
  return true;
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("Request aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function apiRequest<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
  const { body, retries = DEFAULT_RETRIES, timeoutMs = DEFAULT_TIMEOUT_MS, retryDelayMs = 450, signal, headers, ...requestOptions } = options;
  const parentSignal = signal ?? undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

    const abortFromParent = () => controller.abort();
    parentSignal?.addEventListener("abort", abortFromParent, { once: true });

    try {
      if (!navigator.onLine) {
        throw new ApiClientError("You appear to be offline. Please try again when the connection returns.", { status: 0, url });
      }

      const response = await fetch(url, {
        ...requestOptions,
        headers: {
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await parseResponse(response);

      if (!response.ok) {
        const message = data && typeof data === "object" && "error" in data ? String(data.error) : `Request failed with status ${response.status}.`;
        throw new ApiClientError(message, { status: response.status, url, details: data });
      }

      return data as T;
    } catch (error) {
      lastError = error;
      const status = error instanceof ApiClientError ? error.status : undefined;

      if (attempt >= retries || !shouldRetry(error, status)) {
        if (isAbortError(error)) {
          throw new ApiClientError("The request timed out. Please try again.", { status: 408, url });
        }

        if (error instanceof ApiClientError) {
          throw error;
        }

        throw new ApiClientError(error instanceof Error ? error.message : "Failed to fetch. Please try again.", { status: 0, url });
      }

      await wait(retryDelayMs * (attempt + 1), parentSignal);
    } finally {
      window.clearTimeout(timeout);
      parentSignal?.removeEventListener("abort", abortFromParent);
    }
  }

  throw new ApiClientError(lastError instanceof Error ? lastError.message : "Failed to fetch. Please try again.", { status: 0, url });
}

export function createAbortController() {
  return typeof AbortController === "undefined" ? null : new AbortController();
}
