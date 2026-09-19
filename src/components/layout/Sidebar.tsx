"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Store,
  ShieldCheck,
  Settings,
  FolderKanban,
  CreditCard,
  ClipboardList as DeliverablesIcon,
  Activity,
  Package,
  Tag,
  BarChart3,
  Palette,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/deliverables", label: "Deliverables", icon: DeliverablesIcon },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/managed", label: "Managed Care", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/coupons", label: "Coupons", icon: Tag },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/theme", label: "Theme", icon: Palette },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <span className="sidebar-logo-text">ZEDWIX</span>
          <span className="sidebar-logo-badge">OWNER</span>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span className="live-dot" />
            <span>Supabase Connected</span>
          </div>
          ZEDWIX OWNER ENGINE v2.0
        </div>
      </aside>
    </>
  );
}
