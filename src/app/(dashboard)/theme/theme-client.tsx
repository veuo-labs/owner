"use client";

import { useState, useTransition } from "react";
import { ThemeConfig } from "@/lib/types";
import { DEFAULT_THEME_CONFIG } from "@/lib/theme-defaults";
import { saveThemeData } from "@/app/api/theme/actions";
import { CURRENCY_SYMBOL } from "@/lib/constants";

const COLOR_PRESETS = [
  { name: "Emerald Green", hex: "#00e575" },
  { name: "Architectural Gold", hex: "#d4af37" },
  { name: "Clean Monochrome", hex: "#ffffff" },
  { name: "High-Fashion Cobalt", hex: "#3b82f6" },
  { name: "Minimalist Crimson", hex: "#e63946" },
];

interface ThemePageProps {
  initialConfig?: ThemeConfig;
  products?: { id: string; name: string; slug: string; price: number; salePrice?: number | null }[];
  storeName?: string;
  storeSlug?: string;
}

export default function ThemePage({
  initialConfig = DEFAULT_THEME_CONFIG,
  products = [],
  storeName = "My Store",
  storeSlug = "store",
}: ThemePageProps) {
  const [config, setConfig] = useState<ThemeConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<"hero" | "announcement" | "branding" | "reviews">("hero");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const updateAnnouncement = (patch: Partial<ThemeConfig["announcement"]>) => {
    setConfig((p) => ({ ...p, announcement: { ...p.announcement, ...patch } }));
    setSavedSuccess(false);
  };
  const updateHero = (patch: Partial<ThemeConfig["hero"]>) => {
    setConfig((p) => ({ ...p, hero: { ...p.hero, ...patch } }));
    setSavedSuccess(false);
  };
  const updateBranding = (patch: Partial<ThemeConfig["branding"]>) => {
    setConfig((p) => ({ ...p, branding: { ...p.branding, ...patch } }));
    setSavedSuccess(false);
  };
  const updateSocialProof = (patch: Partial<ThemeConfig["socialProof"]>) => {
    setConfig((p) => ({ ...p, socialProof: { ...p.socialProof, ...patch } }));
    setSavedSuccess(false);
  };

  async function handleSave() {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await saveThemeData(config);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to save theme");
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    });
  }

  const featuredProd = products.find((p) => p.id === config.hero.featuredProductId) || products[0] || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storefront Visual Customizer</h1>
          <p className="text-sm text-muted-foreground mt-1">Visually manage your announcements, hero editorial copy, and brand styling for <strong>{storeName}</strong>.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/30">
              PUBLISHED LIVE
            </span>
          )}
          {errorMsg && (
            <span className="text-xs font-mono text-red-500 bg-red-500/10 px-3 py-1.5 rounded-md border border-red-500/30">{errorMsg}</span>
          )}
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
          >
            {isPending ? "Publishing..." : "Save & Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="flex border border-border rounded-lg p-1 bg-card/60 overflow-x-auto">
            {[
              { key: "hero", label: "Hero Editorial" },
              { key: "announcement", label: "Announcement Bar" },
              { key: "branding", label: "Colors & Accents" },
              { key: "reviews", label: "Social Proof" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-2 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "hero" && (
            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Hero Section Presentation</h3>
                <p className="text-xs text-muted-foreground">Customize the primary headlines and body copy displayed at the top of your store.</p>
              </div>
              <div>
                <label className="text-xs font-mono font-semibold text-muted-foreground">Eyebrow Tagline</label>
                <input
                  type="text"
                  value={config.hero.eyebrow}
                  onChange={(e) => updateHero({ eyebrow: e.target.value })}
                  placeholder="CONTEMPORARY LUXURY // EST. 2026"
                  className="w-full mt-1.5 text-xs font-mono border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono font-semibold text-muted-foreground">Headline Line 1</label>
                  <input
                    type="text"
                    value={config.hero.headingLine1}
                    onChange={(e) => updateHero({ headingLine1: e.target.value })}
                    placeholder="ARCHITECTURAL"
                    className="w-full mt-1.5 text-xs font-mono border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono font-semibold text-muted-foreground">Headline Line 2</label>
                  <input
                    type="text"
                    value={config.hero.headingLine2}
                    onChange={(e) => updateHero({ headingLine2: e.target.value })}
                    placeholder="ESSENTIALS"
                    className="w-full mt-1.5 text-xs font-mono border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono font-semibold text-muted-foreground">Description Copy</label>
                <textarea
                  rows={3}
                  value={config.hero.description}
                  onChange={(e) => updateHero({ description: e.target.value })}
                  className="w-full mt-1.5 text-xs border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-mono font-semibold text-muted-foreground">Featured Hero Product Piece</label>
                <select
                  value={config.hero.featuredProductId || ""}
                  onChange={(e) => updateHero({ featuredProductId: e.target.value || null })}
                  className="w-full mt-1.5 text-xs border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                >
                  <option value="">Auto-Detect (First Product)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — {CURRENCY_SYMBOL} {p.price.toLocaleString()}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === "announcement" && (
            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Top Announcement Ticker</h3>
              </div>
              <div className="flex items-center justify-between border border-border p-3 rounded-lg bg-background">
                <div>
                  <div className="text-xs font-semibold text-foreground">Enable Announcement Bar</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.announcement.enabled}
                  onChange={(e) => updateAnnouncement({ enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </div>
              {config.announcement.enabled && (
                <div>
                  <label className="text-xs font-mono font-semibold text-muted-foreground">Announcement Message</label>
                  <input
                    type="text"
                    value={config.announcement.text}
                    onChange={(e) => updateAnnouncement({ text: e.target.value })}
                    className="w-full mt-1.5 text-xs font-mono border border-border bg-background px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "branding" && (
            <div className="border border-border rounded-lg p-5 bg-card space-y-5">
              <div className="border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Brand Palette & Accents</h3>
              </div>
              <div>
                <label className="text-xs font-mono font-semibold text-muted-foreground">Architectural Preset Colors</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {COLOR_PRESETS.map((p) => {
                    const isSelected = config.branding.accentColor.toLowerCase() === p.hex.toLowerCase();
                    return (
                      <button
                        key={p.hex}
                        onClick={() => updateBranding({ accentColor: p.hex })}
                        className={`flex items-center gap-2.5 p-2.5 border rounded-lg text-left transition-all ${
                          isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:bg-muted"
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-black/20 flex-shrink-0" style={{ backgroundColor: p.hex }} />
                        <span className="text-xs font-mono font-medium">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="border border-border rounded-lg p-5 bg-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Verified Client Experiences</h3>
              </div>
              <div className="flex items-center justify-between border border-border p-3 rounded-lg bg-background">
                <div>
                  <div className="text-xs font-semibold text-foreground">Enable Reviews Section</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.socialProof.enabled}
                  onChange={(e) => updateSocialProof({ enabled: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                />
              </div>
              {config.socialProof.enabled && config.socialProof.reviews.length > 0 && (
                <div className="space-y-2">
                  {config.socialProof.reviews.map((rev, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-3 bg-background space-y-2">
                      <div className="font-semibold text-foreground">{rev.name} ({rev.city})</div>
                      <div className="text-xs text-muted-foreground italic">"{rev.comment}"</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">Live Storefront Simulator</span>
          <div className="border border-border/80 rounded-xl overflow-hidden shadow-2xl bg-[#070707] text-white">
            <div className="bg-[#111] px-3 py-2 border-b border-white/10 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 bg-[#1a1a1a] text-[10px] font-mono text-white/50 px-2 py-0.5 rounded text-center truncate">
                https://{storeSlug}.zedwix.shop
              </div>
            </div>
            {config.announcement.enabled && (
              <div
                className="py-1 px-3 text-[10px] font-mono font-bold text-center truncate text-black"
                style={{ backgroundColor: config.branding.accentColor }}
              >
                {config.announcement.text || "ANNOUNCEMENT BAR"}
              </div>
            )}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-extrabold text-sm tracking-tight font-display">{storeName}</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1">
                <span className="block text-[9px] font-mono tracking-wider font-semibold transition-colors" style={{ color: config.branding.accentColor }}>
                  {config.hero.eyebrow}
                </span>
                <h2 className="text-xl font-extrabold leading-none tracking-tight font-display">
                  <div>{config.hero.headingLine1 || "LINE 1"}</div>
                  <div>{config.hero.headingLine2 || "LINE 2"}</div>
                </h2>
                <p className="text-[10px] text-white/70 line-clamp-2 pt-1 font-body">{config.hero.description}</p>
              </div>
              {featuredProd && (
                <div className="border border-white/15 rounded-lg p-2.5 bg-[#0e0e0e] flex gap-3 items-center">
                  <div className="w-14 h-16 bg-black border border-white/10 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-mono text-white/30">PHOTO</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[8px] font-mono text-white/50 uppercase">FEATURED PIECE</span>
                    <h4 className="text-xs font-bold text-white truncate">{featuredProd.name}</h4>
                    <span className="text-[11px] font-mono font-bold text-white">{CURRENCY_SYMBOL} {featuredProd.price.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-[#111] p-2 text-center text-[9px] font-mono text-white/40 border-t border-white/10">
              © {new Date().getFullYear()} {storeName}. ALL RIGHTS RESERVED.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
