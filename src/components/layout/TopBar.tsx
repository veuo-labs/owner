"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { useRealtime } from "@/components/providers/RealtimeProvider";
import { Search, Bell, Moon, Sun, Menu, Volume2 } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  onMenuClick: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const {
    isConnected,
    unreadCount,
    notifications,
    clearNotifications,
    markAllRead,
    playChime,
  } = useRealtime();

  const [notifOpen, setNotifOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        {/* Mobile menu button */}
        <button
          className="btn-ghost lg:hidden"
          onClick={onMenuClick}
          style={{ display: "flex", padding: "0.5rem" }}
        >
          <Menu size={20} />
        </button>

        {/* Live Realtime Connection Indicator Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.25rem 0.65rem",
            borderRadius: "100px",
            background: isConnected ? "rgba(34, 197, 94, 0.12)" : "rgba(234, 179, 8, 0.12)",
            border: `1px solid ${isConnected ? "rgba(34, 197, 94, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
            fontSize: "0.6875rem",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.05em",
            color: isConnected ? "#22c55e" : "#eab308",
          }}
          title={isConnected ? "Connected to Supabase Realtime (zedwix-owner-live)" : "Connecting to Realtime Channel..."}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: isConnected ? "#22c55e" : "#eab308",
              boxShadow: isConnected ? "0 0 8px #22c55e" : "none",
            }}
          />
          <span>{isConnected ? "LIVE REALTIME" : "CONNECTING"}</span>
        </div>

        {/* Search */}
        <div className="topbar-search">
          <Search size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <input type="text" placeholder="Search clients, projects, invoices..." />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {/* Date */}
        <span
          style={{
            fontSize: "0.8125rem",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono)",
            marginRight: "0.5rem",
          }}
        >
          {today}
        </span>

        {/* Theme toggle */}
        <button
          className="btn-ghost"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          style={{ display: "flex", padding: "0.5rem", borderRadius: "8px" }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            className="btn-ghost"
            onClick={() => {
              setNotifOpen(!notifOpen);
              if (!notifOpen) markAllRead();
            }}
            style={{ display: "flex", padding: "0.5rem", borderRadius: "8px", position: "relative" }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  minWidth: "16px",
                  height: "16px",
                  padding: "0 4px",
                  borderRadius: "8px",
                  background: "#ef4444",
                  color: "#ffffff",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  lineHeight: 1,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: "360px",
                background: "var(--color-surface-card)",
                border: "1px solid var(--color-border)",
                borderRadius: "12px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
                zIndex: 100,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.875rem 1rem",
                  borderBottom: "1px solid var(--color-border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.875rem" }}>Notifications</span>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "100px",
                      background: isConnected ? "rgba(34, 197, 94, 0.15)" : "rgba(234, 179, 8, 0.15)",
                      color: isConnected ? "#22c55e" : "#eab308",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                    }}
                  >
                    {isConnected ? "LIVE" : "OFFLINE"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    onClick={() => playChime("order")}
                    title="Test Audio Chime"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--color-text-secondary)",
                      cursor: "pointer",
                      padding: "0.2rem",
                      display: "flex",
                    }}
                  >
                    <Volume2 size={15} />
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--color-text-muted)",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {notifications.length === 0 ? (
                  <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
                    <Bell size={24} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                    <span style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                      No new order or plan notifications
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                      Orders from pricing page appear here in real time.
                    </span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: "0.75rem 1rem",
                        borderBottom: "1px solid var(--color-border-light)",
                        fontSize: "0.8125rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>{n.title}</span>
                        <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}>
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem", lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div
          className="avatar avatar-sm"
          style={{
            background: "var(--color-accent)",
            color: "#ffffff",
            cursor: "pointer",
          }}
        >
          Z
        </div>
      </div>
    </header>
  );
}
