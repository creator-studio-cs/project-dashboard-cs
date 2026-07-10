#!/usr/bin/env node
// ============================================================================
// sync-brand-assets.js
// ============================================================================
// Static files in /public (favicon.svg, favicon.ico, logo192.png, logo512.png,
// manifest.json, index.html's <title>/meta) are NOT read by the React app at
// runtime — the browser loads them directly. That means they can't respond to
// src/constants/business.config.js on their own, which is exactly how the
// original template shipped with a leftover favicon and an unbranded
// manifest.json ("Create React App Sample").
//
// This script closes that gap: it extracts the business name/tagline/colors
// straight out of business.config.js (plain text extraction, not a real JS
// parse — see NOTE below) and regenerates every static brand asset from them.
// It runs automatically before `npm start` and `npm run build` (see the
// "pre" scripts in package.json), so editing business.config.js and
// restarting is enough to re-brand everything, including the favicon.
//
// NOTE: this uses regex extraction rather than executing business.config.js
// directly, because that file is an ES module and this script runs under
// plain Node (no bundler). Keep the `name:`, `tagline:`, `navy:`, `sand:`,
// and `white:` lines in their current simple `key: "value"` string form in
// business.config.js and this will keep working. If you restructure that
// file significantly, check this script still finds the right values (it
// falls back to sane defaults and logs a warning if it can't find something).
// ============================================================================

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "src/constants/business.config.js");
const PUBLIC_DIR = path.join(ROOT, "public");

const DEFAULTS = { name: "Your Business Name", tagline: "One-line description of what you do", navy: "#2B2B2B", sand: "#8C8C8C", white: "#FFFFFF" };

function extract(text, regex, fallback, fieldName) {
  const match = text.match(regex);
  if (!match) {
    console.warn(`[sync-brand-assets] Could not find ${fieldName} in business.config.js — using default "${fallback}"`);
    return fallback;
  }
  return match[1];
}

function main() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn("[sync-brand-assets] business.config.js not found — skipping asset sync.");
    return;
  }
  const configText = fs.readFileSync(CONFIG_PATH, "utf8");

  // Branding is runtime-editable now (see business.config.js), so these static
  // assets are generated from the DEFAULT identity/colors — the baseline shown
  // before a user saves custom settings in the app's Settings panel.
  const identityBlock = (configText.match(/const DEFAULT_IDENTITY = \{([\s\S]*?)\};/) || [])[1] || "";
  const colorsBlock = (configText.match(/export const DEFAULT_COLORS = \{([\s\S]*?)\};/) || [])[1] || "";

  const name    = extract(identityBlock, /name:\s*"([^"]+)"/, DEFAULTS.name, "DEFAULT_IDENTITY.name");
  const tagline = extract(identityBlock, /tagline:\s*"([^"]*)"/, DEFAULTS.tagline, "DEFAULT_IDENTITY.tagline");
  const navy    = extract(colorsBlock, /primary:\s*"(#[0-9a-fA-F]{3,8})"/, DEFAULTS.navy, "DEFAULT_COLORS.primary");
  const sand    = extract(colorsBlock, /accent:\s*"(#[0-9a-fA-F]{3,8})"/, DEFAULTS.sand, "DEFAULT_COLORS.accent");
  const white   = DEFAULTS.white;

  // 1. favicon.svg — same generic "contact rows" mark as LogoMark.jsx,
  // driven by the same colors (rounded charcoal tile, light nodes + lines).
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${navy}"/>
  <circle cx="9" cy="9"  r="2.4" fill="${white}"/>
  <circle cx="9" cy="16" r="2.4" fill="${white}"/>
  <circle cx="9" cy="23" r="2.4" fill="${white}"/>
  <line x1="15" y1="9"  x2="25" y2="9"  stroke="${sand}" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="15" y1="16" x2="25" y2="16" stroke="${sand}" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="15" y1="23" x2="21" y2="23" stroke="${sand}" stroke-width="2.2" stroke-linecap="round"/>
</svg>
`;
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.svg"), svg);

  // 2. favicon.ico / logo192.png / logo512.png — rendered from the SVG above
  // so every icon format matches, instead of leaving stock CRA placeholders.
  // Uses rsvg-convert for crisp vector rasterization at each target size
  // (ImageMagick's `convert` alone rasterizes SVG at a small default size
  // first and then upscales, which comes out blurry).
  try {
    const svgPath = path.join(PUBLIC_DIR, "favicon.svg");
    const sizes = [16, 24, 32, 48, 64];
    const tmpFiles = sizes.map(s => path.join(PUBLIC_DIR, `._tmp_icon_${s}.png`));
    sizes.forEach((s, i) => execSync(`rsvg-convert -w ${s} -h ${s} "${svgPath}" -o "${tmpFiles[i]}"`));
    execSync(`convert ${tmpFiles.map(f => `"${f}"`).join(" ")} "${path.join(PUBLIC_DIR, "favicon.ico")}"`);
    tmpFiles.forEach(f => fs.unlinkSync(f));

    execSync(`rsvg-convert -w 192 -h 192 "${svgPath}" -o "${path.join(PUBLIC_DIR, "logo192.png")}"`);
    execSync(`rsvg-convert -w 512 -h 512 "${svgPath}" -o "${path.join(PUBLIC_DIR, "logo512.png")}"`);
  } catch (err) {
    console.warn("[sync-brand-assets] rsvg-convert/ImageMagick aren't available — skipping favicon.ico/logo192.png/logo512.png regeneration.");
    console.warn("[sync-brand-assets] favicon.svg is still updated and is what modern browsers use, so this is a minor fallback-icon gap.");
    console.warn("[sync-brand-assets] To enable this: install librsvg2-bin + imagemagick (e.g. `apt install librsvg2-bin imagemagick` or `brew install librsvg imagemagick`).");
  }

  // 3. manifest.json — was shipping as literal "Create React App Sample"
  const manifestPath = path.join(PUBLIC_DIR, "manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.short_name = name.length > 12 ? name.slice(0, 12) : name;
  manifest.name = name;
  manifest.theme_color = navy;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  // 4. index.html — <title> and meta description
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${name}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${tagline}$2`);
  html = html.replace(/(<meta name="theme-color" content=")[^"]*(")/, `$1${navy}$2`);
  fs.writeFileSync(indexPath, html);

  console.log(`[sync-brand-assets] Synced static assets for "${name}" (navy: ${navy}, sand: ${sand}).`);
}

main();
