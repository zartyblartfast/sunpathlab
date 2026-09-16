const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const appPath = path.resolve(__dirname, "../../dist/app.js");

// Temporary bridge into the prototype closure. Execute the actual calculation
// bodies, but skip browser startup. Remove this bridge after module extraction.
function loadPrototype(source = fs.readFileSync(appPath, "utf8")) {
  const startup = /  setupEvents\(\);\r?\n  applyPreset\(selectedPreset\);/g;
  assert.equal([...source.matchAll(startup)].length, 1,
    "Prototype startup changed: review the test bridge rather than skipping tests");
  const instrumented = source.replace(startup, `
  globalThis.calculations = {
    solarTerms, globePosition, flatPosition, riseSet, shadowLength,
    snapshotAtInputMinute, snapshotAtSolarMinute,
    inputToSolarMinutes, solarToInputMinutes,
    setClockMode(value) { clockMode = value; }
  };`);
  const context = vm.createContext({
    // Only element lookup runs at module load; no rendering or event mocks.
    document: { getElementById() { return null; } }
  });
  vm.runInContext(instrumented, context, { filename: appPath, timeout: 1000 });
  return context.calculations;
}

function evaluateCase(api, input) {
  const terms = api.solarTerms(input.date);
  const inputs = { ...input, terms };
  api.setClockMode(input.clockMode);
  const snapshot = api.snapshotAtInputMinute(input.inputMinutes, inputs);
  const events = api.riseSet(input.latitude, terms.declination);
  return {
    terms,
    snapshot,
    events,
    eventInputMinutes: events.type === "normal" ? {
      rise: api.solarToInputMinutes(events.rise, inputs),
      set: api.solarToInputMinutes(events.set, inputs)
    } : null,
    shadows: {
      globe: api.shadowLength(input.stickHeight, snapshot.globe.altitude),
      flat: api.shadowLength(input.stickHeight, snapshot.flat.altitude)
    }
  };
}

module.exports = { loadPrototype, evaluateCase };
