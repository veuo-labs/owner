"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="main-content"
        style={{
          flex: 1,
          marginLeft: 240,
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          transition: "margin-left 0.3s ease",
        }}
      >
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <main style={{ flex: 1, padding: "1.5rem", overflow: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
