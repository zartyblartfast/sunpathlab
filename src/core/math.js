// Shared prototype helpers. Preserve operation order and legacy wrap behavior.
const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const normalize360 = (value) => ((value % 360) + 360) % 360;
export const normalizeMinutes = (value) => ((value % 1440) + 1440) % 1440;
export const wrap180 = (value) => ((value + 540) % 360) - 180;
export const toRad = (value) => value * RAD;
export const toDeg = (value) => value * DEG;
