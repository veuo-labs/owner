export const AUTH_CREDENTIALS = {
  email: "owner@zedwix.com",
  password: "Jugmug@12",
};

export function verifyCredentials(email: string, password: string): boolean {
  return email === AUTH_CREDENTIALS.email && password === AUTH_CREDENTIALS.password;
}

export const SESSION_KEY = "zedwix_owner_session";
export const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export function createSessionToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function getSession(): { token: string; createdAt: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() - session.createdAt > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, createdAt: Date.now() }));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
}

export function isSessionValid(): boolean {
  return getSession() !== null;
}
