import { toRad } from "./math.js";

// Legacy parallel-ray approximation for BOTH models, not finite-source geometry.
// Length uses the stick input unit; altitude is degrees; null at/below horizon.
export function shadowLength(stickHeight, altitude) {
  if (altitude <= 0) return null;
  return stickHeight / Math.tan(toRad(altitude));
}
