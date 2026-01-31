const TOKEN_KEY = "blog_api_token";

function notifyAuthTokenChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("auth-token-changed"));
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  notifyAuthTokenChanged();
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  notifyAuthTokenChanged();
}
