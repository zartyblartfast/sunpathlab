import { normalizeMinutes } from "./math.js";
import { inputToSolarMinutes, solarToInputMinutes } from "./time.js";
import { globePosition } from "./globe.js";
import { flatPosition } from "./flat.js";

// Pure daily comparisons: inputs carries terms, geometry and clockMode.
export function snapshotAtInputMinute(inputMinute, inputs) {
  const solarMinutes = inputToSolarMinutes(inputMinute, inputs);
  return {
    inputMinutes: inputMinute,
    solarMinutes,
    globe: globePosition(inputs.latitude, inputs.terms.declination, solarMinutes),
    flat: flatPosition(inputs.latitude, inputs.terms.declination, solarMinutes, inputs.heightKm)
  };
}

export function snapshotAtSolarMinute(solarMinute, inputs) {
  const inputMinutes = solarToInputMinutes(solarMinute, inputs);
  return {
    inputMinutes,
    solarMinutes: normalizeMinutes(solarMinute),
    globe: globePosition(inputs.latitude, inputs.terms.declination, normalizeMinutes(solarMinute)),
    flat: flatPosition(inputs.latitude, inputs.terms.declination, normalizeMinutes(solarMinute), inputs.heightKm)
  };
}
