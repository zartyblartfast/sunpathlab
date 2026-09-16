import { normalize360, toRad, toDeg } from "./math.js";
import { SUN_DIAMETER_DEG } from "./constants.js";

const EARTH_RADIUS_KM = 6371;

// Distances in km, angular diameter in degrees. Recalibrated per scenario,
// exactly as in the prototype; NOT one global physical Sun diameter.
export function flatAngularSize(noonSlantDistance, slantDistance) {
  const calibratedDiameter = 2 * noonSlantDistance * Math.tan(toRad(SUN_DIAMETER_DEG / 2));
  return toDeg(2 * Math.atan2(calibratedDiameter, 2 * slantDistance));
}

// North-pole-centred AE plane. Distances/height in km, angles in degrees.
// Legacy overhead azimuth retained. Seasonal declination is borrowed input.
export function flatPosition(latitude, declination, solarMinutes, heightKm) {
  const observerRadius = EARTH_RADIUS_KM * toRad(90 - latitude);
  const sunTrackRadius = EARTH_RADIUS_KM * toRad(90 - declination);
  const hourAngle = solarMinutes / 4 - 180;
  const theta = toRad(-hourAngle);
  const horizontalDistance = Math.sqrt(Math.max(0,
    observerRadius ** 2 + sunTrackRadius ** 2 -
    2 * observerRadius * sunTrackRadius * Math.cos(theta)
  ));
  const altitude = toDeg(Math.atan2(heightKm, horizontalDistance));
  const north = observerRadius - sunTrackRadius * Math.cos(theta);
  const east = sunTrackRadius * Math.sin(theta);
  const azimuth = normalize360(toDeg(Math.atan2(east, north)));
  const slantDistance = Math.hypot(heightKm, horizontalDistance);
  return {
    altitude,
    azimuth,
    hourAngle,
    observerRadius,
    sunTrackRadius,
    horizontalDistance,
    slantDistance
  };
}
