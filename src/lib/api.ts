/**
 * API Utility
 *
 * Helper functions untuk fetch data dari backend API.
 * Default base URL points to the provided Railway backend.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://be-blg-production.up.railway.app";

type ApiErrorBody = {
  statusCode?: number;
  error?: string;
  message?: string | string[];
  timestamp?: string;
  path?: string;
  details?: unknown;
};

export class ApiError extends Error {
  status: number;
  body?: ApiErrorBody;

  constructor(message: string, status: number, body?: ApiErrorBody) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type FetchApiOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
  token?: string;
};

/**
 * Generic fetch function with error handling.
 *
 * Backend errors follow: { statusCode, error, message, timestamp, path [, details] }
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: FetchApiOptions = {},
): Promise<T> {
  const url = new URL(endpoint, API_BASE_URL).toString();

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? ((await response.json().catch(() => null)) as unknown)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const body = (
      payload && typeof payload === "object"
        ? (payload as ApiErrorBody)
        : undefined
    ) as ApiErrorBody | undefined;

    const message = (() => {
      const fromBody = body?.message;
      if (Array.isArray(fromBody)) return fromBody.join(", ");
      if (typeof fromBody === "string" && fromBody.trim()) return fromBody;
      return response.statusText || "Request failed";
    })();

    throw new ApiError(message, response.status, body);
  }

  return payload as T;
}

// TODO: Implement API functions sesuai dengan endpoint yang tersedia
// Contoh:
// export async function getBlogPosts() {
//   return fetchAPI<BlogPost[]>('/posts');
// }
//
// export async function getBlogPost(id: string) {
//   return fetchAPI<BlogPost>(`/posts/${id}`);
// }
