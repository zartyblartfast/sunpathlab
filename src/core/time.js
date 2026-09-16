import { normalizeMinutes } from "./math.js";

// Minutes wrap within the selected day; no calendar/UTC rollover is resolved.
// inputs.clockMode is explicit per call; omitted/false means solar time.
export function inputToSolarMinutes(inputMinutes, inputs) {
  if (!inputs.clockMode) return normalizeMinutes(inputMinutes === 1440 ? 0 : inputMinutes);
  return normalizeMinutes(
    inputMinutes + inputs.terms.equationOfTime + 4 * inputs.longitude - 60 * inputs.utcOffset
  );
}

export function solarToInputMinutes(solarMinutes, inputs) {
  if (!inputs.clockMode) return normalizeMinutes(solarMinutes);
  return normalizeMinutes(
    solarMinutes - inputs.terms.equationOfTime - 4 * inputs.longitude + 60 * inputs.utcOffset
  );
}
