// ============================================================================
// BUSINESS CONFIG  (defaults + live runtime settings)
// ============================================================================
// This file holds the DEFAULT branding/configuration, and exposes "live"
// values that the in-app Settings panel can override at runtime.
//
// How it works now:
//   • Colors are exposed as CSS variables. `BRAND.navy` is the string
//     "var(--brand-navy)", so every component that uses it keeps working —
//     changing a color just updates the CSS variable and the whole app
//     re-themes instantly (see applyColorVars).
//   • Lists/text (STAGES, SEGMENTS, BUSINESS, …) are exported with `let` so
//     applyRuntimeSettings() can reassign them from saved settings. Consumers
//     import them normally; ES module live-bindings surface the new values on
//     the next render.
//
// The Settings panel reads getDefaultSettings() for the baseline and calls
// applyRuntimeSettings(settings) to apply saved values. Storage/loading lives
// in src/hooks/useSettings.jsx.
// ============================================================================

// ---------------------------------------------------------------------------
// COLOR TOKENS
// ---------------------------------------------------------------------------
// BRAND values are CSS-variable references (constant). The actual values are
// applied to :root by applyColorVars() from the editable primary/accent.
export const BRAND = {
  navy:      "var(--brand-navy)",
  navyMid:   "var(--brand-navy-mid)",
  navyLight: "var(--brand-navy-light)",
  sand:      "var(--brand-sand)",
  sandLight: "var(--brand-sand-light)",
  sandMid:   "var(--brand-sand-mid)",
  black:     "var(--brand-black)",
  gray:      "var(--brand-gray)",
  grayLight: "var(--brand-gray-light)",
  border:    "var(--brand-border)",
  white:     "var(--brand-white)",
  green:     "var(--brand-green)",
  greenLight:"var(--brand-green-light)",
  red:       "var(--brand-red)",
  redLight:  "var(--brand-red-light)",
  amber:     "var(--brand-amber)",
  amberLight:"var(--brand-amber-light)",
};

// Editable brand colors (the two the user picks); the rest are fixed neutrals.
export const DEFAULT_COLORS = { primary: "#2B2B2B", accent: "#8C8C8C" };

// Fixed (non-editable) neutral + status colors.
const FIXED_VARS = {
  "--brand-black": "#111111",
  "--brand-gray": "#6B6B6B",
  "--brand-gray-light": "#F4F4F4",
  "--brand-border": "#E3E3E3",
  "--brand-white": "#FFFFFF",
  "--brand-green": "#5E7A5A",
  "--brand-green-light": "#EDF1EB",
  "--brand-red": "#8F5049",
  "--brand-red-light": "#F4EAE9",
  "--brand-amber": "#8A7239",
  "--brand-amber-light": "#F3EEE1",
};

// --- tiny hex mixing so light/mid tints derive from the chosen base color ---
function clamp(n) { return Math.max(0, Math.min(255, Math.round(n))); }
function parseHex(hex) {
  const h = String(hex || "").replace("#", "");
  const s = h.length === 3 ? h.split("").map(c => c + c).join("") : h.padEnd(6, "0");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function toHex(r, g, b) { return "#" + [r, g, b].map(v => clamp(v).toString(16).padStart(2, "0")).join(""); }
// mix `hex` toward `target` by weight w (0..1). w=1 => target.
function mix(hex, target, w) {
  const a = parseHex(hex), b = parseHex(target);
  return toHex(a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w);
}

// Build the full CSS-variable set from editable colors.
export function computeColorVars(colors) {
  const primary = colors?.primary || DEFAULT_COLORS.primary;
  const accent = colors?.accent || DEFAULT_COLORS.accent;
  return {
    "--brand-navy": primary,
    "--brand-navy-mid": mix(primary, "#ffffff", 0.20),
    "--brand-navy-light": mix(primary, "#ffffff", 0.90),
    "--brand-sand": accent,
    "--brand-sand-light": mix(accent, "#ffffff", 0.92),
    "--brand-sand-mid": mix(accent, "#ffffff", 0.60),
    ...FIXED_VARS,
  };
}

// Apply colors to the document root (no-op safeguard outside the browser).
export function applyColorVars(colors) {
  if (typeof document === "undefined") return;
  const vars = computeColorVars(colors);
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// Swap the browser-tab favicon at runtime. `logo` is a data URL (uploaded logo)
// or empty to fall back to the default favicon shipped in /public.
export function applyFavicon(logo) {
  if (typeof document === "undefined") return;
  const pub = process.env.PUBLIC_URL || "";
  const href = logo || `${pub}/favicon.svg`;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  link.setAttribute("type", logo && !logo.startsWith("data:image/svg") ? "image/png" : "image/svg+xml");
}

// ---------------------------------------------------------------------------
// DEFAULTS for identity + lists
// ---------------------------------------------------------------------------
const DEFAULT_IDENTITY = {
  name: "Your Business Name",
  tagline: "One-line description of what you do",
  fromName: "Your Name",
  fromEmail: "you@yourbusiness.com",
  website: "yourbusiness.com",
};

const DEFAULT_STAGES = ["Lead", "Contacted", "Meeting Set", "Proposal Sent", "Negotiating", "Closed Won", "Closed Lost"];
const DEFAULT_SEGMENTS = ["General Inquiry", "Partnership", "Referral"];
const DEFAULT_LOCATIONS = ["Local", "Regional", "National"];
const DEFAULT_DEAL_TYPES = ["Project", "Recurring"];
const DEFAULT_JOURNEY_TYPES = ["Intro", "Follow-Up", "Updates", "Returning"];
const DEFAULT_HOW_MET = ["Referral", "Website / Inbound", "Direct Outreach", "Conference / Event", "Social Media", "Other"];
const DEFAULT_TEAM = []; // [{ id, name }]

// Preferred [fg, bg] color pairs for well-known category values; anything else
// cycles through this palette so custom values still get sensible colors.
const PAIRS = [
  [BRAND.gray, BRAND.grayLight],
  [BRAND.navy, BRAND.navyLight],
  [BRAND.green, BRAND.greenLight],
  [BRAND.amber, BRAND.amberLight],
  [BRAND.sand, BRAND.sandLight],
  [BRAND.red, BRAND.redLight],
];
const STAGE_PREFERRED = {
  "Lead": [BRAND.gray, BRAND.grayLight],
  "Contacted": [BRAND.navy, BRAND.navyLight],
  "Meeting Set": [BRAND.green, BRAND.greenLight],
  "Proposal Sent": [BRAND.amber, BRAND.amberLight],
  "Negotiating": [BRAND.sand, BRAND.sandLight],
  "Closed Won": [BRAND.green, BRAND.greenLight],
  "Closed Lost": [BRAND.red, BRAND.redLight],
};
const JOURNEY_PREFERRED = {
  Intro: [BRAND.gray, BRAND.grayLight],
  "Follow-Up": [BRAND.sand, BRAND.sandLight],
  Updates: [BRAND.navy, BRAND.navyLight],
  Returning: [BRAND.green, BRAND.greenLight],
};
const JOURNEY_DESC_DEFAULTS = {
  Intro: "First-touch outreach — introduce the business and offer a clear next step",
  "Follow-Up": "Nurture outreach — they know you, keep the conversation going",
  Updates: "Share news, services, or program updates with engaged contacts",
  Returning: "Re-engagement — past relationship or prior work together",
};

function assignPairs(names, preferred) {
  const fg = {}, bg = {};
  names.forEach((n, i) => {
    const p = preferred[n] || PAIRS[i % PAIRS.length];
    fg[n] = p[0];
    bg[n] = p[1];
  });
  return { fg, bg };
}
function slug(name) {
  return String(name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "member";
}

// ---------------------------------------------------------------------------
// LIVE EXPORTS (reassigned by applyRuntimeSettings)
// ---------------------------------------------------------------------------
export let BUSINESS = { ...DEFAULT_IDENTITY };

// Uploaded logo as a data URL ("" = use the default LogoMark + favicon).
export let LOGO = "";

export let STAGES = [...DEFAULT_STAGES];
export let STAGE_COLORS = assignPairs(STAGES, STAGE_PREFERRED).fg;
export let STAGE_BG = assignPairs(STAGES, STAGE_PREFERRED).bg;

export let SEGMENTS = [...DEFAULT_SEGMENTS];
export let LOCATIONS = [...DEFAULT_LOCATIONS];
export let DEAL_TYPES = [...DEFAULT_DEAL_TYPES];

export let JOURNEY_TYPES = [...DEFAULT_JOURNEY_TYPES];
export let JOURNEY_TYPE_COLORS = assignPairs(JOURNEY_TYPES, JOURNEY_PREFERRED).fg;
export let JOURNEY_TYPE_BG = assignPairs(JOURNEY_TYPES, JOURNEY_PREFERRED).bg;
export let JOURNEY_TYPE_DESC = { ...JOURNEY_DESC_DEFAULTS };

export let HOW_MET_OPTIONS = [...DEFAULT_HOW_MET];
export let TEAM_MEMBERS = [...DEFAULT_TEAM];
export let DEFAULT_INTAKE_SEGMENT = SEGMENTS[0];

// --- Tiers are a fixed, near-universal convention (not user-editable) ---
export const TIER_COLORS = { "Hot": BRAND.navy, "Warm": BRAND.sand, "Cold": BRAND.gray };
export const TIER_BG = { "Hot": BRAND.navyLight, "Warm": BRAND.sandLight, "Cold": BRAND.grayLight };

// --- Quote/proposal statuses (fixed) ---
export const QUOTE_STATUSES = ["No Quote Sent", "Quote Drafted", "Quote Sent", "Quote Accepted", "Quote Declined"];
export const QUOTE_STATUS_COLORS = {
  "No Quote Sent": BRAND.gray, "Quote Drafted": BRAND.amber, "Quote Sent": BRAND.navy,
  "Quote Accepted": BRAND.green, "Quote Declined": BRAND.red,
};
export const QUOTE_STATUS_BG = {
  "No Quote Sent": BRAND.grayLight, "Quote Drafted": BRAND.amberLight, "Quote Sent": BRAND.navyLight,
  "Quote Accepted": BRAND.greenLight, "Quote Declined": BRAND.redLight,
};

// --- Project statuses (fixed) — used by the Projects tab + Gantt timeline ---
export const PROJECT_STATUSES = ["Planning", "In Progress", "On Hold", "Completed", "Cancelled"];
export const PROJECT_STATUS_COLORS = {
  "Planning": BRAND.gray, "In Progress": BRAND.navy, "On Hold": BRAND.amber,
  "Completed": BRAND.green, "Cancelled": BRAND.red,
};
export const PROJECT_STATUS_BG = {
  "Planning": BRAND.grayLight, "In Progress": BRAND.navyLight, "On Hold": BRAND.amberLight,
  "Completed": BRAND.greenLight, "Cancelled": BRAND.redLight,
};

// --- Pricing calculator (fixed for now) ---
export const PRICING_PACKAGES = [];
export const VOLUME_THRESHOLD = 10;
export const VOLUME_DISCOUNT = 0.15;

// ---------------------------------------------------------------------------
// EMAIL TEMPLATES (rebuilt from BUSINESS on each settings apply)
// ---------------------------------------------------------------------------
function buildTemplates(b) {
  const SIGNATURE = `\n\n${b.fromName}\n${b.fromEmail}\n${b.name} | ${b.website}`;
  return {
    journey: {
      Intro: {
        subject: `Introduction from ${b.name}`,
        body: `Hi {firstName},\n\nThanks for connecting — I wanted to introduce ${b.name}. ${b.tagline}\n\nWould you be open to a short conversation this week?\n\nBest,${SIGNATURE}`,
      },
      "Follow-Up": {
        subject: `Following up — ${b.name}`,
        body: `Hi {firstName},\n\nJust wanted to follow up on my previous message. If the timing wasn't right before, no worries — happy to reconnect whenever works for you.\n\nThanks for your time.${SIGNATURE}`,
      },
      Updates: {
        subject: `An update from ${b.name}`,
        body: `Hi {firstName},\n\nWanted to share a quick update on what we've been working on at ${b.name}. Let me know if there's anything I can help with.${SIGNATURE}`,
      },
      Returning: {
        subject: `Reconnecting — ${b.name}`,
        body: `Hi {firstName},\n\nIt's been a while — hope things have been going well. Wanted to reach out and see if there's an opportunity to reconnect.${SIGNATURE}`,
      },
    },
    default: {
      subject: (c) => `Re: Your Inquiry — ${b.name}`,
      body: (c) => `Hi ${c.firstName},\n\nThanks for reaching out to ${b.name}. ${b.tagline}\n\nI'd love to learn more about what you need — would you be available for a quick call this week?\n\nBest,${SIGNATURE}`,
    },
  };
}

export let JOURNEY_TEMPLATES = buildTemplates(BUSINESS).journey;
export const EMAIL_TEMPLATES = {}; // per-segment overrides (optional)
export let DEFAULT_TEMPLATE = buildTemplates(BUSINESS).default;

// ---------------------------------------------------------------------------
// SETTINGS SHAPE + APPLY
// ---------------------------------------------------------------------------
export function getDefaultSettings() {
  return {
    identity: { ...DEFAULT_IDENTITY },
    logo: "",
    colors: { ...DEFAULT_COLORS },
    stages: [...DEFAULT_STAGES],
    segments: [...DEFAULT_SEGMENTS],
    locations: [...DEFAULT_LOCATIONS],
    dealTypes: [...DEFAULT_DEAL_TYPES],
    journeyTypes: [...DEFAULT_JOURNEY_TYPES],
    howMet: [...DEFAULT_HOW_MET],
    teamMembers: [...DEFAULT_TEAM],
  };
}

// Reassign the live exports + apply colors. Missing/empty fields fall back to
// defaults so a partial settings object can never blank out the app.
export function applyRuntimeSettings(s) {
  const d = getDefaultSettings();
  const set = s || d;

  BUSINESS = { ...d.identity, ...(set.identity || {}) };
  if (typeof document !== "undefined" && BUSINESS.name) document.title = BUSINESS.name;

  LOGO = set.logo || "";
  applyFavicon(LOGO);

  STAGES = (set.stages && set.stages.length) ? set.stages : d.stages;
  const stagePairs = assignPairs(STAGES, STAGE_PREFERRED);
  STAGE_COLORS = stagePairs.fg;
  STAGE_BG = stagePairs.bg;

  SEGMENTS = (set.segments && set.segments.length) ? set.segments : d.segments;
  LOCATIONS = (set.locations && set.locations.length) ? set.locations : d.locations;
  DEAL_TYPES = (set.dealTypes && set.dealTypes.length) ? set.dealTypes : d.dealTypes;

  JOURNEY_TYPES = (set.journeyTypes && set.journeyTypes.length) ? set.journeyTypes : d.journeyTypes;
  const jPairs = assignPairs(JOURNEY_TYPES, JOURNEY_PREFERRED);
  JOURNEY_TYPE_COLORS = jPairs.fg;
  JOURNEY_TYPE_BG = jPairs.bg;
  JOURNEY_TYPE_DESC = JOURNEY_TYPES.reduce((m, jt) => { m[jt] = JOURNEY_DESC_DEFAULTS[jt] || ""; return m; }, {});

  HOW_MET_OPTIONS = (set.howMet && set.howMet.length) ? set.howMet : d.howMet;

  TEAM_MEMBERS = (set.teamMembers || []).map(m =>
    typeof m === "string" ? { id: slug(m), name: m } : { id: m.id || slug(m.name), name: m.name }
  );

  DEFAULT_INTAKE_SEGMENT = SEGMENTS[0];

  const built = buildTemplates(BUSINESS);
  JOURNEY_TEMPLATES = built.journey;
  DEFAULT_TEMPLATE = built.default;

  applyColorVars(set.colors || d.colors);
}
