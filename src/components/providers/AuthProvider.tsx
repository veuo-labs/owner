"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getSession, saveSession, clearSession, SESSION_DURATION_MS } from "@/lib/auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isSessionExpired: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  timeRemaining: number;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isSessionExpired: false,
  login: async () => false,
  logout: () => {},
  timeRemaining: 0,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const checkAuth = useCallback(() => {
    const valid = getSession() !== null;
    setIsAuthenticated(valid);
    if (!valid) {
      setIsSessionExpired(true);
      setTimeRemaining(0);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    const interval = setInterval(() => {
      const session = getSession();
      if (session) {
        const elapsed = Date.now() - session.createdAt;
        const remaining = Math.max(0, SESSION_DURATION_MS - elapsed);
        setTimeRemaining(remaining);
        if (remaining <= 0) {
          setIsSessionExpired(true);
          setIsAuthenticated(false);
          clearSession();
        }
      } else {
        setIsAuthenticated(false);
        setIsSessionExpired(false);
        setTimeRemaining(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [checkAuth]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        saveSession(data.token || "temp");
        setIsAuthenticated(true);
        setIsSessionExpired(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setIsAuthenticated(false);
    setIsSessionExpired(false);
    setTimeRemaining(0);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isSessionExpired, login, logout, timeRemaining }}>
      {children}
    </AuthContext.Provider>
  );
}
