import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export const Lock = (p: P) => <svg {...base} {...p}><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
export const LockOpen = (p: P) => <svg {...base} {...p}><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/></svg>;
export const Key = (p: P) => <svg {...base} {...p}><circle cx="8" cy="15" r="4"/><path d="M10.85 12.15 20 3l2 2-2.5 2.5L21 9l-2 2-1.5-1.5L15 12l-1 1"/></svg>;
export const Vault = (p: P) => <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V5.5M12 18.5v-3M8.5 12h-3M18.5 12h-3"/></svg>;
export const Shield = (p: P) => <svg {...base} {...p}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
export const Sparkle = (p: P) => <svg {...base} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8"/></svg>;
export const Plus = (p: P) => <svg {...base} {...p}><path d="M12 5v14M5 12h14"/></svg>;
export const Search = (p: P) => <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
export const Copy = (p: P) => <svg {...base} {...p}><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>;
export const Eye = (p: P) => <svg {...base} {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>;
export const EyeOff = (p: P) => <svg {...base} {...p}><path d="M3 3l18 18"/><path d="M10.5 6.3A10.2 10.2 0 0 1 12 6c6.5 0 10 7 10 7a15.8 15.8 0 0 1-3.3 4.1M6.5 7.5A15.5 15.5 0 0 0 2 13s3.5 7 10 7c1.5 0 2.9-.3 4.1-.8"/><path d="M9.5 9.5a3 3 0 0 0 4 4"/></svg>;
export const Trash = (p: P) => <svg {...base} {...p}><path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></svg>;
export const Share = (p: P) => <svg {...base} {...p}><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-4.2M8.2 13.2l7.6 4.2"/></svg>;
export const Download = (p: P) => <svg {...base} {...p}><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>;
export const Upload = (p: P) => <svg {...base} {...p}><path d="M12 17V5M7 10l5-5 5 5M5 21h14"/></svg>;
export const Settings = (p: P) => <svg {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>;
export const Heart = (p: P) => <svg {...base} {...p}><path d="M12 20.8 4.6 13.4a5 5 0 0 1 7.4-6.7 5 5 0 0 1 7.4 6.7Z"/></svg>;
export const ArrowRight = (p: P) => <svg {...base} {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
export const Check = (p: P) => <svg {...base} {...p}><path d="m5 12 5 5 9-11"/></svg>;
export const X = (p: P) => <svg {...base} {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>;
export const Tag = (p: P) => <svg {...base} {...p}><path d="M20.6 12.6 12 21.2a2 2 0 0 1-2.8 0l-6.4-6.4a2 2 0 0 1 0-2.8L11.4 3.4a2 2 0 0 1 1.4-.6H20a1 1 0 0 1 1 1v7.2a2 2 0 0 1-.4 1.6Z"/><circle cx="15.5" cy="8.5" r="1.2"/></svg>;
export const Refresh = (p: P) => <svg {...base} {...p}><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><path d="M21 4v4h-4"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><path d="M3 20v-4h4"/></svg>;
export const AlertTriangle = (p: P) => <svg {...base} {...p}><path d="M10.3 3.8 2 18a2 2 0 0 0 1.7 3h16.6A2 2 0 0 0 22 18L13.7 3.8a2 2 0 0 0-3.4 0Z"/><path d="M12 9v5M12 18h.01"/></svg>;
export const ChartPie = (p: P) => <svg {...base} {...p}><path d="M21 12a9 9 0 1 1-9-9v9h9Z"/><path d="M15 3a6 6 0 0 1 6 6h-6V3Z"/></svg>;
export const Cloud = (p: P) => <svg {...base} {...p}><path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 4.6 13.4 3.4 3.4 0 0 0 6 19h11.5Z"/></svg>;
export const CloudUp = (p: P) => <svg {...base} {...p}><path d="M17.5 17a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 4.6 11.4 3.4 3.4 0 0 0 6 17h2"/><path d="M12 21v-8M9 16l3-3 3 3"/></svg>;
export const CloudDown = (p: P) => <svg {...base} {...p}><path d="M17.5 17a4.5 4.5 0 1 0-1.4-8.78A6 6 0 0 0 4.6 11.4 3.4 3.4 0 0 0 6 17h2"/><path d="M12 13v8M9 18l3 3 3-3"/></svg>;
export const LinkBreak = (p: P) => <svg {...base} {...p}><path d="M9 17H7a5 5 0 0 1 0-10h2M15 7h2a5 5 0 0 1 4.5 7M3 3l18 18"/></svg>;
