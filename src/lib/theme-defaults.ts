import type { ThemeConfig } from "./types";

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  announcement: {
    enabled: true,
    text: "COMPLIMENTARY EXPRESS DELIVERY ACROSS PAKISTAN // CASH ON DELIVERY",
  },
  hero: {
    eyebrow: "CONTEMPORARY LUXURY // EST. 2026",
    headingLine1: "ARCHITECTURAL",
    headingLine2: "ESSENTIALS",
    description: "Heavyweight calibrated silhouettes and minimal finishing. Each piece is crafted for permanent wear. Order directly with our styling team on WhatsApp.",
    primaryBtnText: "EXPLORE CATALOGUE ↓",
    secondaryBtnText: "VIEW HERO PIECE →",
    featuredProductId: null,
  },
  branding: {
    accentColor: "#00e575",
    badgeText: "HERO SELECTION",
  },
  socialProof: {
    enabled: true,
    badge: "VERIFIED CLIENT EXPERIENCES",
    reviews: [
      { name: "Hamza K.", city: "Lahore", rating: 5, comment: "The cut and heavyweight fabric exceeded expectations. Delivered in 2 days." },
      { name: "Bilal M.", city: "Islamabad", rating: 5, comment: "Minimal packaging, precision tailoring. Will be a permanent repeat client." },
      { name: "Daniyal S.", city: "Karachi", rating: 5, comment: "True to size and high quality hardware. Excellent WhatsApp styling support." },
    ],
  },
  shipping: {
    deliveryFee: 250,
    freeShippingEnabled: true,
    freeShippingThreshold: 3000,
    estimatedDays: "2-4 Business Days",
  },
};
