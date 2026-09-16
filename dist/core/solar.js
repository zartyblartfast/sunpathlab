import { normalize360, wrap180, toRad, toDeg } from "./math.js";

// Daily approximation: selected calendar date at 12:00 UTC, not an instant.
function julianDateAtNoon(date) {
  return Date.UTC(date.year, date.month - 1, date.day, 12, 0, 0) / 86400000 + 2440587.5;
}

export function solarTerms(date) {
  // Solar coordinates follow the compact USNO-style J2000 approximation.
  const d = julianDateAtNoon(date) - 2451545.0;
  const meanAnomaly = normalize360(357.529 + 0.98560028 * d);
  const meanLongitude = normalize360(280.459 + 0.98564736 * d);
  const apparentLongitude = normalize360(
    meanLongitude +
    1.915 * Math.sin(toRad(meanAnomaly)) +
    0.020 * Math.sin(toRad(2 * meanAnomaly))
  );
  const obliquity = 23.439 - 0.00000036 * d;
  const declination = toDeg(Math.asin(
    Math.sin(toRad(obliquity)) * Math.sin(toRad(apparentLongitude))
  ));
  const rightAscension = normalize360(toDeg(Math.atan2(
    Math.cos(toRad(obliquity)) * Math.sin(toRad(apparentLongitude)),
    Math.cos(toRad(apparentLongitude))
  )));
  const equationOfTime = 4 * wrap180(meanLongitude - rightAscension);

  return { declination, equationOfTime };
}
