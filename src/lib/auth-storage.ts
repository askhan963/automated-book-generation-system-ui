const TOKEN_KEY = "quill.access_token";

/** Same-document event so API 401 handling can sync AuthProvider memory. */
export const AUTH_UNAUTHORIZED_EVENT = "quill:auth:unauthorized";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export function notifyUnauthorized(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}

export function onUnauthorized(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    listener();
  };
  window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
  return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handler);
}
