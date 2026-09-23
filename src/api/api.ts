import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { ApiError, type ApiEnvelope } from "@/types/api";
import { clearAccessToken, getAccessToken } from "./token";

const baseURL =
  import.meta.env["VITE_API_URL"] ??
  import.meta.env["VITE_API_BASE_URL"] ??
  "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data;

    if (status === 401) {
      clearAccessToken();
    }

    if (body && typeof body === "object" && "success" in body && body.success === false) {
      return Promise.reject(
        new ApiError(status, body.error.code, body.error.message, body.error.details),
      );
    }

    return Promise.reject(
      new ApiError(
        status || 500,
        "NETWORK_ERROR",
        error.message || "An unexpected error occurred.",
      ),
    );
  },
);

/** Unwrap `{ success: true, data }` envelopes. Handles 204 with no body. */
export async function unwrapData<T>(
  promise: Promise<{ data: ApiEnvelope<T> | "" | null; status: number }>,
): Promise<T> {
  const response = await promise;
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = response.data;
  if (!payload || typeof payload !== "object" || !("success" in payload)) {
    throw new ApiError(500, "INVALID_RESPONSE", "Unexpected API response.");
  }
  if (!payload.success) {
    throw new ApiError(400, payload.error.code, payload.error.message, payload.error.details);
  }
  return payload.data;
}
