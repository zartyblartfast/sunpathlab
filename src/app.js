import { KM_PER_MILE, SUN_DIAMETER_DEG } from "./core/constants.js";
import { clamp, normalize360, normalizeMinutes, toRad } from "./core/math.js";
import {
  solarTerms, inputToSolarMinutes, solarToInputMinutes, flatPosition,
  flatAngularSize, riseSet, shadowLength, snapshotAtInputMinute
} from "./core/index.js";

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const elements = {
    latitude: $("latitude"),
    latitudeNumber: $("latitude-number"),
    latitudeOutput: $("latitude-output"),
    date: $("date"),
    declination: $("declination-value"),
    height: $("sun-height"),
    heightUnit: $("height-unit"),
    time: $("time"),
    timeOutput: $("time-output"),
    timeContext: $("time-context"),
    play: $("play-day"),
    clockButton: $("clock-settings-button"),
    clockSettings: $("clock-settings"),
    timeBasisToggle: $("time-basis-toggle"),
    longitude: $("longitude"),
    utcOffset: $("utc-offset"),
    verdict: $("verdict"),
    verdictTitle: $("verdict-title"),
    verdictDetail: $("verdict-detail"),
    globeSky: $("globe-sky"),
    flatSky: $("flat-sky"),
    globeVisibility: $("globe-visibility"),
    flatVisibility: $("flat-visibility"),
    globeAltitude: $("globe-altitude"),
    flatAltitude: $("flat-altitude"),
    globeAzimuth: $("globe-azimuth"),
    flatAzimuth: $("flat-azimuth"),
    globePlain: $("globe-plain"),
    flatPlain: $("flat-plain"),
    altitudeGap: $("altitude-gap"),
    gapExplanation: $("gap-explanation"),
    dayChart: $("day-chart"),
    chartTooltip: $("chart-tooltip"),
    sunrise: $("sunrise-value"),
    sunset: $("sunset-value"),
    flatMin: $("flat-min-value"),
    flatSets: $("flat-sets-value"),
    stickHeight: $("stick-height"),
    stickUnit: $("stick-unit"),
    shadowDiagram: $("shadow-diagram"),
    globeShadow: $("globe-shadow"),
    flatShadow: $("flat-shadow"),
    perspectiveDiagram: $("perspective-diagram"),
    horizontalDistance: $("horizontal-distance"),
    slantDistance: $("slant-distance"),
    flatSunDisc: $("flat-sun-disc"),
    flatAngularSize: $("flat-angular-size"),
    tableBody: $("comparison-table"),
    eot: $("eot-value")
  };

  let clockMode = false;
  let playing = false;
  let playTimer = null;
  let selectedPreset = "sunset";
  let lastSnapshot = null;
  let lastHeightUnit = "mi";

  function parseDate() {
    const parts = elements.date.value.split("-").map(Number);
    if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) {
      return { year: 2026, month: 3, day: 20 };
    }
    const [year, month, day] = parts;
    return { year, month, day };
  }

  function getInputs() {
    const latitude = clamp(Number(elements.latitude.value) || 0, -80, 80);
    const inputMinutes = clamp(Number(elements.time.value) || 0, 0, 1440);
    const heightRaw = clamp(Number(elements.height.value) || 4000, 10, 100000);
    const heightKm = elements.heightUnit.value === "mi" ? heightRaw * KM_PER_MILE : heightRaw;
    const longitude = clamp(Number(elements.longitude.value) || 0, -180, 180);
    const utcOffset = clamp(Number(elements.utcOffset.value) || 0, -12, 14);
    const date = parseDate();
    const terms = solarTerms(date);
    return { latitude, inputMinutes, heightRaw, heightKm, longitude, utcOffset, date, terms, clockMode };
  }

  function formatTime(minutes) {
    let rounded = Math.round(minutes);
    if (rounded === 1440) return "24:00";
    rounded = normalizeMinutes(rounded);
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  }

  function formatLatitude(latitude) {
    if (Math.abs(latitude) < 0.05) return "0.0° · Equator";
    return `${Math.abs(latitude).toFixed(1)}° ${latitude > 0 ? "N" : "S"}`;
  }

  function formatSignedAngle(value, digits = 1) {
    const rounded = Math.abs(value) < 0.05 ? 0 : value;
    return `${rounded < 0 ? "−" : ""}${Math.abs(rounded).toFixed(digits)}°`;
  }

  function cardinal(azimuth) {
    const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    return points[Math.round(normalize360(azimuth) / 45) % 8];
  }

  function formatAzimuth(value) {
    return `${normalize360(value).toFixed(1)}° ${cardinal(value)}`;
  }

  function formatDistance(km, unit) {
    const value = unit === "mi" ? km / KM_PER_MILE : km;
    const rounded = value >= 1000 ? Math.round(value / 10) * 10 : Math.round(value);
    return `${rounded.toLocaleString()} ${unit}`;
  }

  function formatEquationOfTime(minutes) {
    const sign = minutes >= 0 ? "+" : "−";
    return `${sign}${Math.abs(minutes).toFixed(1)} minutes`;
  }

  function formatShadow(length, unit) {
    if (length === null || !Number.isFinite(length)) return "No direct Sun";
    if (length > 10000) return `Over 10,000 ${unit}`;
    const digits = length < 10 ? 2 : length < 100 ? 1 : 0;
    return `${length.toFixed(digits)} ${unit} shadow`;
  }

  function statusForGlobe(altitude) {
    if (altitude > 1) return { label: "Above horizon", className: "" };
    if (altitude >= -0.8333) return { label: "At horizon", className: "" };
    return { label: "Below horizon", className: "status-night" };
  }

  function renderSky(svg, position, color, isFlat) {
    const horizonY = 205;
    const originX = 280;
    const direction = position.hourAngle < -0.5 ? -1 : 1;
    const visualAltitude = clamp(position.altitude, -42, 90);
    const rayLength = 166;
    const x = originX + direction * Math.cos(toRad(visualAltitude)) * rayLength;
    const y = horizonY - Math.sin(toRad(visualAltitude)) * rayLength;
    const visible = position.altitude >= -0.8333;
    const labelSide = direction < 0 ? "E" : "W";
    const otherSide = direction < 0 ? "W" : "E";
    const lineDash = !visible && !isFlat ? "stroke-dasharray=\"7 7\"" : "";
    const opacity = !visible && !isFlat ? 0.48 : 1;
    const angleLabelY = visualAltitude >= 0 ? horizonY - 22 : horizonY + 34;

    const titleId = isFlat ? "flat-sky-title" : "globe-sky-title";
    const descId = isFlat ? "flat-sky-desc" : "globe-sky-desc";
    svg.innerHTML = `
      <title id="${titleId}">${isFlat ? "Flat-model" : "Globe-model"} Sun elevation</title>
      <desc id="${descId}">Side-on sky view. The Sun is ${formatSignedAngle(position.altitude)} from the horizontal at azimuth ${formatAzimuth(position.azimuth)}.</desc>
      <defs>
        <radialGradient id="skyGlow-${isFlat ? "f" : "g"}" cx="50%" cy="90%" r="85%">
          <stop offset="0" stop-color="${color}" stop-opacity="0.09"/>
          <stop offset="1" stop-color="#071522" stop-opacity="0"/>
        </radialGradient>
        <filter id="sunGlow-${isFlat ? "f" : "g"}" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="560" height="270" fill="url(#skyGlow-${isFlat ? "f" : "g"})"/>
      <path d="M62 205 Q280 -44 498 205" fill="none" stroke="#294154" stroke-width="1.5"/>
      <path d="M110 205 Q280 8 450 205" fill="none" stroke="#1b3143" stroke-width="1" stroke-dasharray="4 7"/>
      <line x1="28" y1="205" x2="532" y2="205" stroke="#8196a5" stroke-width="2"/>
      <rect x="28" y="206" width="504" height="64" fill="#0a2230" opacity="0.72"/>
      <text x="34" y="197" fill="#91a5b4" font-size="12" font-weight="700">${labelSide}</text>
      <text x="516" y="197" fill="#91a5b4" font-size="12" font-weight="700">${otherSide}</text>
      <text x="280" y="224" fill="#8296a5" font-size="12" text-anchor="middle">horizontal</text>
      <circle cx="280" cy="205" r="5" fill="#e7f2f7"/>
      <path d="M271 216h18M280 210v19" stroke="#a9bbc7" stroke-width="2" stroke-linecap="round"/>
      <line x1="${originX}" y1="${horizonY}" x2="${x.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${color}" stroke-width="2.4" opacity="${opacity}" ${lineDash}/>
      <path d="M${originX + direction * 43} ${horizonY} A43 43 0 0 ${visualAltitude < 0 ? 0 : 1} ${originX + direction * 43 * Math.cos(toRad(visualAltitude))} ${horizonY - 43 * Math.sin(toRad(visualAltitude))}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.75"/>
      <text x="${originX + direction * 66}" y="${angleLabelY}" fill="${color}" font-size="13" font-weight="800" text-anchor="middle">${formatSignedAngle(position.altitude)}</text>
      <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="12" fill="${color}" opacity="${opacity}" filter="url(#sunGlow-${isFlat ? "f" : "g"})"/>
      ${!visible && !isFlat ? `<text x="${x.toFixed(2)}" y="${Math.min(258, y + 28).toFixed(2)}" fill="#b7aef2" font-size="12" text-anchor="middle">below horizon</text>` : ""}
      ${isFlat ? `<text x="280" y="255" fill="#9badba" font-size="12" text-anchor="middle">flat plane continues beyond the drawing</text>` : ""}
    `;
  }

  function renderVerdict(snapshot, riseSetData, inputs) {
    const gap = snapshot.flat.altitude - snapshot.globe.altitude;
    const nearSet = riseSetData.type === "normal" && Math.abs(
      wrapMinutesDifference(snapshot.solarMinutes, riseSetData.set)
    ) <= 5;

    elements.verdict.classList.toggle("is-neutral", snapshot.globe.altitude > 0 && Math.abs(gap) < 2);
    if (nearSet) {
      elements.verdictTitle.textContent = `At the observed-model sunset, the flat model still places the Sun ${snapshot.flat.altitude.toFixed(1)}° above the plane.`;
      elements.verdictDetail.textContent = "Perspective alone cannot carry an elevated object through the horizontal.";
    } else if (snapshot.globe.altitude < -0.8333) {
      elements.verdictTitle.textContent = `The globe model predicts night; the flat model predicts a Sun ${snapshot.flat.altitude.toFixed(1)}° above the plane.`;
      elements.verdictDetail.textContent = "An extra obstruction or extinction rule would have to be added to hide it.";
    } else if (Math.abs(gap) >= 2) {
      elements.verdictTitle.textContent = `Both models can place the Sun in the sky, but their altitudes differ by ${Math.abs(gap).toFixed(1)}°.`;
      elements.verdictDetail.textContent = "A stick-shadow measurement distinguishes the predictions directly.";
    } else {
      elements.verdictTitle.textContent = "At this moment, the two altitude predictions happen to be close.";
      elements.verdictDetail.textContent = "Move toward sunrise, sunset or another season to test the full daily pattern.";
    }
  }

  function wrapMinutesDifference(a, b) {
    return ((a - b + 2160) % 1440) - 720;
  }

  function renderPrimary(snapshot, riseSetData, inputs) {
    const globeStatus = statusForGlobe(snapshot.globe.altitude);
    elements.globeVisibility.textContent = globeStatus.label;
    elements.globeVisibility.className = `status-badge ${globeStatus.className}`.trim();
    elements.flatVisibility.textContent = "Above plane";
    elements.flatVisibility.className = "status-badge status-warn";

    elements.globeAltitude.textContent = formatSignedAngle(snapshot.globe.altitude);
    elements.flatAltitude.textContent = formatSignedAngle(snapshot.flat.altitude);
    elements.globeAzimuth.textContent = formatAzimuth(snapshot.globe.azimuth);
    elements.flatAzimuth.textContent = formatAzimuth(snapshot.flat.azimuth);

    if (snapshot.globe.altitude > 1) {
      elements.globePlain.textContent = "The Sun is above the geometric horizon and can cast a direct shadow.";
    } else if (snapshot.globe.altitude >= -0.8333) {
      elements.globePlain.textContent = "The Sun’s upper edge is at the visible horizon under average conditions.";
    } else {
      elements.globePlain.textContent = "The Sun is below the horizon; direct sunlight is not predicted.";
    }

    elements.flatPlain.textContent = snapshot.flat.altitude > 10
      ? "The local Sun remains plainly above the flat horizontal line of sight."
      : "The local Sun is low in the view, but its centre is still above the plane.";

    const gap = snapshot.flat.altitude - snapshot.globe.altitude;
    elements.altitudeGap.textContent = formatSignedAngle(gap);
    elements.gapExplanation.textContent = `That is about ${Math.abs(gap / SUN_DIAMETER_DEG).toFixed(0)} apparent Sun-widths.`;

    renderSky(elements.globeSky, snapshot.globe, "#6ee7f2", false);
    renderSky(elements.flatSky, snapshot.flat, "#f6c85f", true);
    renderVerdict(snapshot, riseSetData, inputs);
  }

  function chartPath(samples, accessor, xScale, yScale) {
    return samples.map((sample, index) => {
      const x = xScale(sample.inputMinutes);
      const y = yScale(clamp(accessor(sample), -30, 90));
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ");
  }

  function renderDayChart(snapshot, riseSetData, inputs) {
    const left = 66;
    const right = 976;
    const top = 30;
    const bottom = 402;
    const xScale = (minutes) => left + ((minutes === 1440 ? 1440 : normalizeMinutes(minutes)) / 1440) * (right - left);
    const yScale = (altitude) => bottom - ((altitude + 30) / 120) * (bottom - top);
    const samples = [];
    for (let minute = 0; minute <= 1440; minute += 5) {
      const sample = snapshotAtInputMinute(minute === 1440 ? 0 : minute, inputs);
      sample.inputMinutes = minute;
      samples.push(sample);
    }

    const yTicks = [-30, 0, 30, 60, 90];
    const xTicks = [0, 180, 360, 540, 720, 900, 1080, 1260, 1440];
    const globePath = chartPath(samples, (s) => s.globe.altitude, xScale, yScale);
    const flatPath = chartPath(samples, (s) => s.flat.altitude, xScale, yScale);
    const currentX = xScale(snapshot.inputMinutes);
    const riseInput = riseSetData.type === "normal" ? solarToInputMinutes(riseSetData.rise, inputs) : null;
    const setInput = riseSetData.type === "normal" ? solarToInputMinutes(riseSetData.set, inputs) : null;
    const sunriseLines = riseSetData.type === "normal"
      ? [
          `<line x1="${xScale(riseInput)}" y1="${top}" x2="${xScale(riseInput)}" y2="${bottom}" stroke="#a8bac8" stroke-width="1" stroke-dasharray="4 7" opacity="0.58"/>`,
          `<line x1="${xScale(setInput)}" y1="${top}" x2="${xScale(setInput)}" y2="${bottom}" stroke="#a8bac8" stroke-width="1" stroke-dasharray="4 7" opacity="0.58"/>`,
          `<text x="${xScale(riseInput)}" y="20" fill="#93a8b6" font-size="12" text-anchor="middle">rise</text>`,
          `<text x="${xScale(setInput)}" y="20" fill="#93a8b6" font-size="12" text-anchor="middle">set</text>`
        ].join("")
      : "";

    elements.dayChart.innerHTML = `
      <title id="day-chart-title">Solar altitude over one day</title>
      <desc id="day-chart-desc">The globe and flat-model altitude predictions over 24 hours, plotted against ${clockMode ? "local clock time" : "local solar time"}.</desc>
      <defs>
        <clipPath id="chart-clip"><rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}"/></clipPath>
        <linearGradient id="daylight-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6ee7f2" stop-opacity="0.11"/>
          <stop offset="1" stop-color="#6ee7f2" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect x="${left}" y="${top}" width="${right - left}" height="${yScale(0) - top}" fill="url(#daylight-fill)"/>
      <rect x="${left}" y="${yScale(0)}" width="${right - left}" height="${bottom - yScale(0)}" fill="#241d3b" opacity="0.19"/>
      ${yTicks.map((tick) => `
        <line x1="${left}" y1="${yScale(tick)}" x2="${right}" y2="${yScale(tick)}" stroke="${tick === 0 ? "#91a5b4" : "#263d50"}" stroke-width="${tick === 0 ? 2 : 1}" ${tick === 0 ? "stroke-dasharray=\"7 6\"" : ""}/>
        <text x="${left - 13}" y="${yScale(tick) + 4}" fill="#8fa3b2" font-size="12" text-anchor="end">${tick}°</text>
      `).join("")}
      ${xTicks.map((tick) => `
        <line x1="${xScale(tick === 1440 ? 1440 : tick)}" y1="${top}" x2="${xScale(tick === 1440 ? 1440 : tick)}" y2="${bottom}" stroke="#1e3446" stroke-width="1"/>
        <text x="${xScale(tick === 1440 ? 1440 : tick)}" y="430" fill="#8fa3b2" font-size="12" text-anchor="middle">${formatTime(tick)}</text>
      `).join("")}
      ${sunriseLines}
      <g clip-path="url(#chart-clip)">
        <path d="${globePath}" fill="none" stroke="#6ee7f2" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="${flatPath}" fill="none" stroke="#f6c85f" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
        <line x1="${currentX}" y1="${top}" x2="${currentX}" y2="${bottom}" stroke="#ffffff" stroke-width="1.5" opacity="0.72"/>
        <circle cx="${currentX}" cy="${yScale(clamp(snapshot.globe.altitude, -30, 90))}" r="6" fill="#07111f" stroke="#6ee7f2" stroke-width="3"/>
        <circle cx="${currentX}" cy="${yScale(clamp(snapshot.flat.altitude, -30, 90))}" r="6" fill="#07111f" stroke="#f6c85f" stroke-width="3"/>
      </g>
      <text x="18" y="215" fill="#8fa3b2" font-size="12" text-anchor="middle" transform="rotate(-90 18 215)">altitude above horizontal</text>
      <text x="520" y="454" fill="#8fa3b2" font-size="12" text-anchor="middle">${clockMode ? "local clock time" : "local solar time"}</text>
      <rect data-chart-hit x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" fill="transparent"/>
    `;

    const flatMidnight = flatPosition(inputs.latitude, inputs.terms.declination, 0, inputs.heightKm).altitude;
    if (riseSetData.type === "normal") {
      elements.sunrise.textContent = formatTime(solarToInputMinutes(riseSetData.rise, inputs));
      elements.sunset.textContent = formatTime(solarToInputMinutes(riseSetData.set, inputs));
    } else if (riseSetData.type === "midnight-sun") {
      elements.sunrise.textContent = "No sunset";
      elements.sunset.textContent = "24-hour daylight";
    } else {
      elements.sunrise.textContent = "No sunrise";
      elements.sunset.textContent = "24-hour night";
    }
    elements.flatMin.textContent = formatSignedAngle(flatMidnight);
    elements.flatSets.textContent = "No — never reaches 0°";
  }

  function renderShadowDiagram(snapshot, inputs) {
    const stick = clamp(Number(elements.stickHeight.value) || 1, 0.1, 1000);
    const unit = elements.stickUnit.value;
    const globeLength = shadowLength(stick, snapshot.globe.altitude);
    const flatLength = shadowLength(stick, snapshot.flat.altitude);
    elements.globeShadow.textContent = formatShadow(globeLength, unit);
    elements.flatShadow.textContent = formatShadow(flatLength, unit);

    const drawTest = (cx, altitude, color, label, length) => {
      const ground = 252;
      const stickTop = 157;
      const sunVisible = altitude > 0;
      const sunX = cx + 125;
      const sunY = sunVisible ? ground - Math.tan(toRad(clamp(altitude, 4, 80))) * 125 : ground + 32;
      const rawShadowPx = sunVisible ? 95 / Math.tan(toRad(altitude)) : 0;
      const shadowPx = clamp(rawShadowPx, 18, 126);
      const overflow = rawShadowPx > 126;
      return `
        <text x="${cx}" y="34" fill="${color}" font-size="13" font-weight="800" text-anchor="middle">${label}</text>
        <line x1="${cx - 145}" y1="${ground}" x2="${cx + 145}" y2="${ground}" stroke="#78909f" stroke-width="2"/>
        <line x1="${cx}" y1="${ground}" x2="${cx}" y2="${stickTop}" stroke="#edf5f8" stroke-width="6" stroke-linecap="round"/>
        <circle cx="${sunX}" cy="${clamp(sunY, 62, 292)}" r="10" fill="${color}" opacity="${sunVisible ? 1 : 0.42}"/>
        ${sunVisible ? `
          <line x1="${sunX - 12}" y1="${clamp(sunY, 62, 292) + 9}" x2="${cx}" y2="${stickTop}" stroke="${color}" stroke-width="2" opacity="0.8"/>
          <line x1="${cx}" y1="${stickTop}" x2="${cx - shadowPx}" y2="${ground}" stroke="${color}" stroke-width="2" opacity="0.8"/>
          <line x1="${cx}" y1="${ground + 8}" x2="${cx - shadowPx}" y2="${ground + 8}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
          <text x="${cx - shadowPx / 2}" y="${ground + 29}" fill="${color}" font-size="12" text-anchor="middle">${overflow ? "longer than drawing" : formatShadow(length, unit)}</text>
        ` : `
          <path d="M${sunX - 17} ${ground + 4}h34" stroke="#b6a3ff" stroke-width="2" stroke-dasharray="4 4"/>
          <text x="${cx}" y="${ground + 29}" fill="#b9b0ef" font-size="12" text-anchor="middle">no direct shadow</text>
        `}
        <text x="${cx}" y="139" fill="#a8bac8" font-size="12" text-anchor="middle">${formatSignedAngle(altitude)}</text>
      `;
    };

    elements.shadowDiagram.innerHTML = `
      <title id="shadow-diagram-title">Predicted stick shadows</title>
      <desc id="shadow-diagram-desc">The globe prediction is ${formatSignedAngle(snapshot.globe.altitude)} and the flat prediction is ${formatSignedAngle(snapshot.flat.altitude)} for the selected vertical stick.</desc>
      <rect width="760" height="330" fill="#071522"/>
      <line x1="380" y1="22" x2="380" y2="306" stroke="#263f52" stroke-width="1"/>
      ${drawTest(190, snapshot.globe.altitude, "#6ee7f2", "GLOBE PREDICTION", globeLength)}
      ${drawTest(570, snapshot.flat.altitude, "#f6c85f", "FLAT PREDICTION", flatLength)}
    `;
  }

  function renderPerspective(snapshot, inputs) {
    const unit = elements.heightUnit.value;
    const distanceLabel = formatDistance(snapshot.flat.horizontalDistance, unit);
    const slantLabel = formatDistance(snapshot.flat.slantDistance, unit);
    const heightLabel = formatDistance(inputs.heightKm, unit);
    elements.horizontalDistance.textContent = distanceLabel;
    elements.slantDistance.textContent = slantLabel;

    const noon = flatPosition(inputs.latitude, inputs.terms.declination, 720, inputs.heightKm);
    const angularSize = flatAngularSize(noon.slantDistance, snapshot.flat.slantDistance);
    const discPx = clamp(28 * angularSize / SUN_DIAMETER_DEG, 10, 36);
    elements.flatSunDisc.style.width = `${discPx}px`;
    elements.flatSunDisc.style.height = `${discPx}px`;
    elements.flatAngularSize.textContent = `${angularSize.toFixed(2)}° now`;

    const observerX = 74;
    const groundY = 282;
    const sunX = 584;
    const sunY = 66;
    const angleArcRadius = 72;
    const displayAngle = Math.atan2(groundY - sunY, sunX - observerX);
    const arcX = observerX + Math.cos(displayAngle) * angleArcRadius;
    const arcY = groundY - Math.sin(displayAngle) * angleArcRadius;

    elements.perspectiveDiagram.innerHTML = `
      <title id="perspective-diagram-title">Perspective geometry of the local Sun</title>
      <desc id="perspective-diagram-desc">A right triangle from the observer to a local Sun at ${heightLabel}, producing a viewing altitude of ${formatSignedAngle(snapshot.flat.altitude)}.</desc>
      <defs>
        <filter id="perspective-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width="680" height="350" fill="#071522"/>
      <line x1="36" y1="${groundY}" x2="646" y2="${groundY}" stroke="#8aa0af" stroke-width="2"/>
      <text x="620" y="305" fill="#92a7b5" font-size="12" text-anchor="end">flat plane</text>
      <circle cx="${observerX}" cy="${groundY}" r="6" fill="#eef6fb"/>
      <path d="M${observerX - 10} ${groundY + 18}h20M${observerX} ${groundY + 7}v25" stroke="#b9c9d3" stroke-width="2" stroke-linecap="round"/>
      <text x="${observerX}" y="329" fill="#b2c3ce" font-size="12" text-anchor="middle">observer</text>
      <line x1="${observerX}" y1="${groundY}" x2="${sunX}" y2="${sunY}" stroke="#f6c85f" stroke-width="2.5"/>
      <line x1="${sunX}" y1="${groundY}" x2="${sunX}" y2="${sunY}" stroke="#f6c85f" stroke-width="2" stroke-dasharray="6 6" opacity="0.65"/>
      <circle cx="${sunX}" cy="${sunY}" r="14" fill="#f6c85f" filter="url(#perspective-glow)"/>
      <path d="M${observerX + angleArcRadius} ${groundY} A${angleArcRadius} ${angleArcRadius} 0 0 0 ${arcX.toFixed(2)} ${arcY.toFixed(2)}" fill="none" stroke="#f6c85f" stroke-width="2"/>
      <text x="145" y="251" fill="#ffe3a0" font-size="13" font-weight="800">${formatSignedAngle(snapshot.flat.altitude)}</text>
      <text x="${sunX + 14}" y="175" fill="#e8cb7d" font-size="12" transform="rotate(-90 ${sunX + 14} 175)" text-anchor="middle">height ${heightLabel}</text>
      <line x1="${observerX}" y1="${groundY + 12}" x2="${sunX}" y2="${groundY + 12}" stroke="#79909f" stroke-width="1"/>
      <path d="M${observerX} ${groundY + 7}v10M${sunX} ${groundY + 7}v10" stroke="#79909f"/>
      <text x="${(observerX + sunX) / 2}" y="${groundY + 32}" fill="#a8bac8" font-size="12" text-anchor="middle">horizontal distance ${distanceLabel}</text>
      <text x="350" y="145" fill="#ffe3a0" font-size="12" text-anchor="middle" transform="rotate(-23 350 145)">line of sight ${slantLabel}</text>
      <text x="340" y="40" fill="#8fa5b3" font-size="12" text-anchor="middle">diagram not to scale</text>
    `;
  }

  function observationText(snapshot, stick, stickUnit) {
    if (snapshot.globe.altitude < -0.8333) {
      return `Globe: night · Flat: Sun ${snapshot.flat.altitude.toFixed(1)}° high`;
    }
    if (snapshot.globe.altitude <= 0) return "Sun at the observed horizon";
    const length = shadowLength(stick, snapshot.globe.altitude);
    return `Measure ≈ ${formatShadow(length, stickUnit)}`;
  }

  function renderTable(snapshot, riseSetData, inputs) {
    const baseInputTimes = [0, 360, 540, 720, 900, 1080, 1440];
    const times = [...baseInputTimes, snapshot.inputMinutes];
    if (riseSetData.type === "normal") {
      times.push(solarToInputMinutes(riseSetData.rise, inputs));
      times.push(solarToInputMinutes(riseSetData.set, inputs));
    }
    const unique = [...new Set(times.map((time) => Math.round(time)))].sort((a, b) => a - b);
    const stick = clamp(Number(elements.stickHeight.value) || 1, 0.1, 1000);
    const stickUnit = elements.stickUnit.value;
    const currentRounded = Math.round(snapshot.inputMinutes);

    elements.tableBody.innerHTML = unique.map((inputMinute) => {
      const row = snapshotAtInputMinute(inputMinute === 1440 ? 0 : inputMinute, inputs);
      const gap = row.flat.altitude - row.globe.altitude;
      const observation = observationText(row, stick, stickUnit);
      const isCurrent = Math.abs(inputMinute - currentRounded) <= 1 || (inputMinute === 1440 && currentRounded === 0);
      return `
        <tr class="${isCurrent ? "is-current" : ""}">
          <th scope="row">${formatTime(inputMinute)}${isCurrent ? " · selected" : ""}</th>
          <td class="globe-number">${formatSignedAngle(row.globe.altitude)}</td>
          <td>${formatAzimuth(row.globe.azimuth)}</td>
          <td class="flat-number">${formatSignedAngle(row.flat.altitude)}</td>
          <td>${formatAzimuth(row.flat.azimuth)}</td>
          <td class="gap-number">${formatSignedAngle(gap)}</td>
          <td class="${row.globe.altitude < -0.8333 ? "observation-night" : ""}">${observation}</td>
        </tr>
      `;
    }).join("");
  }

  function updateTimeLabels(snapshot, riseSetData, inputs) {
    const inputLabel = formatTime(inputs.inputMinutes);
    elements.timeOutput.textContent = inputLabel;
    if (clockMode) {
      elements.timeOutput.textContent = `${inputLabel} clock`;
      elements.timeContext.textContent = `${inputLabel} clock time · ${formatTime(snapshot.solarMinutes)} solar time`;
    } else {
      const nearSunset = riseSetData.type === "normal" && Math.abs(wrapMinutesDifference(snapshot.solarMinutes, riseSetData.set)) <= 5;
      const nearSunrise = riseSetData.type === "normal" && Math.abs(wrapMinutesDifference(snapshot.solarMinutes, riseSetData.rise)) <= 5;
      const event = nearSunset ? "Observed sunset · " : nearSunrise ? "Observed sunrise · " : "";
      elements.timeContext.textContent = `${event}${inputLabel} solar time`;
    }
  }

  function update() {
    const inputs = getInputs();
    const snapshot = snapshotAtInputMinute(inputs.inputMinutes, inputs);
    const riseSetData = riseSet(inputs.latitude, inputs.terms.declination);
    lastSnapshot = { snapshot, riseSetData, inputs };

    elements.latitudeOutput.textContent = formatLatitude(inputs.latitude);
    elements.latitudeNumber.value = inputs.latitude.toFixed(1);
    elements.declination.textContent = formatSignedAngle(inputs.terms.declination);
    elements.eot.textContent = formatEquationOfTime(inputs.terms.equationOfTime);
    updateTimeLabels(snapshot, riseSetData, inputs);
    renderPrimary(snapshot, riseSetData, inputs);
    renderDayChart(snapshot, riseSetData, inputs);
    renderShadowDiagram(snapshot, inputs);
    renderPerspective(snapshot, inputs);
    renderTable(snapshot, riseSetData, inputs);
  }

  function setActivePreset(name) {
    selectedPreset = name;
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === name);
    });
  }

  function applyPreset(name) {
    const inputs = getInputs();
    const riseSetData = riseSet(inputs.latitude, inputs.terms.declination);
    let solarMinute = 720;
    if (name === "sunset") {
      solarMinute = riseSetData.type === "normal" ? riseSetData.set : 1080;
    } else if (name === "midnight") {
      solarMinute = 0;
    }
    elements.time.value = Math.round(solarToInputMinutes(solarMinute, inputs));
    setActivePreset(name);
    update();
  }

  function stopPlaying() {
    playing = false;
    if (playTimer !== null) window.clearInterval(playTimer);
    playTimer = null;
    elements.play.innerHTML = '<span aria-hidden="true">▶</span> Play the day';
  }

  function togglePlay() {
    if (playing) {
      stopPlaying();
      return;
    }
    playing = true;
    elements.play.innerHTML = '<span aria-hidden="true">Ⅱ</span> Pause';
    playTimer = window.setInterval(() => {
      let next = Number(elements.time.value) + 8;
      if (next > 1440) next = 0;
      elements.time.value = next;
      setActivePreset("");
      update();
    }, 45);
  }

  function toggleClockPanel() {
    const willOpen = elements.clockSettings.hidden;
    elements.clockSettings.hidden = !willOpen;
    elements.clockButton.setAttribute("aria-expanded", String(willOpen));
    elements.clockButton.textContent = willOpen ? "Hide clock-time settings" : "Use a clock time instead";
  }

  function toggleTimeBasis() {
    const before = getInputs();
    const currentInput = before.inputMinutes;
    if (!clockMode) {
      // Convert the current solar instant into the corresponding civil-clock reading.
      const clockMinute = normalizeMinutes(
        currentInput - before.terms.equationOfTime - 4 * before.longitude + 60 * before.utcOffset
      );
      clockMode = true;
      elements.time.value = Math.round(clockMinute);
    } else {
      const solarMinute = inputToSolarMinutes(currentInput, before);
      clockMode = false;
      elements.time.value = Math.round(solarMinute);
    }
    elements.timeBasisToggle.setAttribute("aria-pressed", String(clockMode));
    elements.timeBasisToggle.textContent = clockMode ? "Using clock time" : "Currently using solar time";
    const timeLabel = document.querySelector('.time-readout label[for="time"]');
    const help = timeLabel.nextElementSibling;
    timeLabel.textContent = clockMode ? "Local clock time" : "Local solar time";
    help.textContent = clockMode
      ? "Converted using longitude, UTC offset and the Equation of Time"
      : "12:00 means the Sun is on your local meridian";
    setActivePreset("");
    update();
  }

  function handleLatitude(value) {
    const latitude = clamp(Number(value) || 0, -80, 80);
    elements.latitude.value = latitude;
    elements.latitudeNumber.value = latitude;
    setActivePreset("");
    update();
  }

  function setupChartInteraction() {
    elements.dayChart.addEventListener("pointermove", (event) => {
      if (!lastSnapshot) return;
      const rect = elements.dayChart.getBoundingClientRect();
      const viewX = (event.clientX - rect.left) / rect.width * 1000;
      const minute = clamp((viewX - 66) / (976 - 66) * 1440, 0, 1440);
      const sample = snapshotAtInputMinute(minute === 1440 ? 0 : minute, lastSnapshot.inputs);
      elements.chartTooltip.innerHTML = `
        <strong>${formatTime(minute)} ${clockMode ? "clock" : "solar"} time</strong>
        <span style="color:#6ee7f2">Globe ${formatSignedAngle(sample.globe.altitude)}</span><br>
        <span style="color:#f6c85f">Flat ${formatSignedAngle(sample.flat.altitude)}</span>
      `;
      elements.chartTooltip.hidden = false;
      const localX = event.clientX - elements.dayChart.parentElement.getBoundingClientRect().left;
      const localY = event.clientY - elements.dayChart.parentElement.getBoundingClientRect().top;
      elements.chartTooltip.style.left = `${clamp(localX + 14, 8, rect.width - 184)}px`;
      elements.chartTooltip.style.top = `${clamp(localY - 32, 8, rect.height - 82)}px`;
    });
    elements.dayChart.addEventListener("pointerleave", () => {
      elements.chartTooltip.hidden = true;
    });
  }

  function setupEvents() {
    elements.latitude.addEventListener("input", (event) => handleLatitude(event.target.value));
    elements.latitudeNumber.addEventListener("change", (event) => handleLatitude(event.target.value));

    [elements.date, elements.height, elements.longitude, elements.utcOffset,
      elements.stickHeight, elements.stickUnit].forEach((element) => {
      element.addEventListener("input", () => {
        setActivePreset("");
        update();
      });
      element.addEventListener("change", update);
    });

    elements.heightUnit.addEventListener("change", () => {
      const nextUnit = elements.heightUnit.value;
      let value = Number(elements.height.value) || 4000;
      if (lastHeightUnit === "mi" && nextUnit === "km") value *= KM_PER_MILE;
      if (lastHeightUnit === "km" && nextUnit === "mi") value /= KM_PER_MILE;
      elements.height.value = Math.round(value);
      lastHeightUnit = nextUnit;
      setActivePreset("");
      update();
    });

    elements.time.addEventListener("input", () => {
      setActivePreset("");
      update();
    });
    elements.play.addEventListener("click", togglePlay);
    elements.clockButton.addEventListener("click", toggleClockPanel);
    elements.timeBasisToggle.addEventListener("click", toggleTimeBasis);
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.addEventListener("click", () => applyPreset(button.dataset.preset));
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopPlaying();
    });
    setupChartInteraction();
  }

  setupEvents();
  applyPreset(selectedPreset);
})();
