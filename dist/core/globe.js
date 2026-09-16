import { clamp, normalize360, toRad, toDeg } from "./math.js";

// Angles in degrees, solar time in minutes. Legacy overhead azimuth retained.
export function globePosition(latitude, declination, solarMinutes) {
  const phi = toRad(latitude);
  const delta = toRad(declination);
  const hourAngle = solarMinutes / 4 - 180;
  const h = toRad(hourAngle);
  const sinAltitude = clamp(
    Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(h),
    -1,
    1
  );
  const altitude = toDeg(Math.asin(sinAltitude));
  const azimuth = normalize360(toDeg(Math.atan2(
    Math.sin(h),
    Math.cos(h) * Math.sin(phi) - Math.tan(delta) * Math.cos(phi)
  )) + 180);
  return { altitude, azimuth, hourAngle };
}

// Conventional -0.8333 degree centre-altitude threshold.
export function riseSet(latitude, declination) {
  const phi = toRad(latitude);
  const delta = toRad(declination);
  const target = toRad(-0.8333);
  const cosHour = (
    Math.sin(target) - Math.sin(phi) * Math.sin(delta)
  ) / (Math.cos(phi) * Math.cos(delta));

  if (cosHour > 1) return { type: "polar-night", rise: null, set: null };
  if (cosHour < -1) return { type: "midnight-sun", rise: null, set: null };

  const hour = toDeg(Math.acos(clamp(cosHour, -1, 1)));
  return {
    type: "normal",
    rise: 720 - hour * 4,
    set: 720 + hour * 4
  };
}
