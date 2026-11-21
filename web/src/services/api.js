import axios from "axios";

import { getToken, clearSession, SESSION_EXPIRED_EVENT } from "./session";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// An expired or revoked token ends the session everywhere at once. Failed
// sign-in attempts also return 401, so auth endpoints are left alone.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    if (status === 401 && getToken() && !url.startsWith("/auth/")) {
      clearSession();
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export function getErrorMessage(error) {
  if (error?.response) {
    return (
      error.response.data?.error ||
      error.response.data?.message ||
      `Request failed (${error.response.status}).`
    );
  }

  if (error?.request) {
    return "Cannot reach the server. Check your connection and try again.";
  }

  return error?.message || "Something went wrong. Please try again.";
}

export default api;
