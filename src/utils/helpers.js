import { BRAND } from "../constants/business.config";

export function initials(first, last) {
  return ((first?.[0] || "") + (last?.[0] || "")).toUpperCase();
}

const avatarPalette = [BRAND.navy, BRAND.navyMid, BRAND.sand, BRAND.green, BRAND.amber, BRAND.red];

export function avatarColor(id) {
  return avatarPalette[id % avatarPalette.length];
}

export const fmt$ = v => v > 0 ? "$" + (v >= 1000 ? (v / 1000).toFixed(0) + "k" : v) : "—";
