const assert = require("node:assert/strict");
const { test, before } = require("node:test");
const { evaluateCase } = require("./support/prototype.cjs");
const baseline = require("./fixtures/prototype-v0.1.json");
let core;
before(async () => { core = await import("../src/core/index.js"); });

// Tight regression tolerance, NOT a statement of astronomical accuracy.
function compare(actual, expected, label = "result") {
  if (typeof expected === "number") {
    assert.ok(Number.isFinite(actual), `${label}: expected a finite number`);
    const tolerance = 1e-9 + Math.abs(expected) * 1e-12;
    assert.ok(Math.abs(actual - expected) <= tolerance,
      `${label}: expected ${expected}, got ${actual} (tolerance ${tolerance})`);
  } else if (expected !== null && typeof expected === "object") {
    assert.ok(actual !== null && typeof actual === "object", `${label}: expected an object`);
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${label}: keys`);
    for (const key of Object.keys(expected)) compare(actual[key], expected[key], `${label}.${key}`);
  } else {
    assert.equal(actual, expected, label);
  }
}

for (const fixture of baseline.cases) {
  test(`prototype baseline: ${fixture.name}`, () => {
    compare(evaluateCase(core, fixture.input), fixture.expected);
  });
}

test("baseline explicitly identifies prototype provenance, not an ephemeris oracle", () => {
  assert.equal(baseline.provenance.commit, "438a6f535ad4159416d993fec47467a3f32498cf");
  assert.match(baseline.provenance.kind, /NOT independent scientific reference/);
  assert.equal(baseline.cases.length, 13);
});

test("baseline preserves the daily curve's 24:00 closing copy of 00:00", () => {
  const api = core;
  const input = baseline.cases[0].input;
  const start = evaluateCase(api, { ...input, inputMinutes: 0 });
  const end = evaluateCase(api, { ...input, inputMinutes: 1440 });
  compare(end.snapshot.globe, start.snapshot.globe);
  compare(end.snapshot.flat, start.snapshot.flat);
  assert.equal(end.snapshot.solarMinutes, 0);
});

test("baseline records legacy arbitrary overhead azimuths, NOT desired behavior", () => {
  const api = core;
  compare(api.globePosition(0, 0, 720), { altitude: 90, azimuth: 180, hourAngle: 0 });
  const flat = api.flatPosition(0, 0, 720, 4000);
  compare(flat.altitude, 90);
  compare(flat.azimuth, 0);
  compare(flat.horizontalDistance, 0);
  compare(flat.slantDistance, 4000);
});

test("baseline records the existing parallel-ray shadow approximation", () => {
  const api = core;
  compare(api.shadowLength(1000, 45), 1000);
  assert.equal(api.shadowLength(1, 0), null);
  assert.equal(api.shadowLength(1, -1), null);
});

// Real core imports with perturbed inputs: fixture sensitivity, not source mutation.
for (const mutation of [
  { name: "flat Sun height", change: (input) => ({ ...input, heightKm: input.heightKm * 0.9 }), caseIndex: 0 },
  { name: "clock longitude sign", change: (input) => ({ ...input, longitude: -input.longitude }), caseIndex: 9 }
]) {
  test(`negative control: baseline rejects changed ${mutation.name}`, () => {
    const fixture = baseline.cases[mutation.caseIndex];
    assert.throws(() => compare(evaluateCase(core, mutation.change(fixture.input)), fixture.expected),
      { code: "ERR_ASSERTION" });
  });
}
