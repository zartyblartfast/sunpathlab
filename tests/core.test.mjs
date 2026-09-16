import assert from "node:assert/strict";
import { test } from "node:test";

test("flat angular-size calculation retains scenario-specific noon calibration", async () => {
  const core = await import("../src/core/index.js");
  assert.equal(typeof core.flatAngularSize, "function");
  assert.ok(Math.abs(core.flatAngularSize(4000, 4000) - 0.533) < 1e-12);
  // Doubling distance halves tan(angularDiameter / 2), not the angle itself.
  const doubled = core.flatAngularSize(4000, 8000);
  assert.ok(doubled > 0.2665 && doubled < 0.267);
  assert.equal(core.flatAngularSize(4000, 8000), core.flatAngularSize(8000, 16000));
});

test("core imports without a DOM and clock mode is explicit, isolated input", async () => {
  const { existsSync } = await import("node:fs");
  assert.ok(existsSync(new URL("../src/core/index.js", import.meta.url)), "direct-import calculation core must exist");
  const core = await import("../src/core/index.js");
  const inputs = Object.freeze({ latitude: 54.2, heightKm: 4000, longitude: 10,
    utcOffset: 1, terms: Object.freeze({ declination: 0, equationOfTime: 5 }), clockMode: true });
  const clock = core.snapshotAtInputMinute(720, inputs);
  assert.equal(clock.solarMinutes, 705);
  const solar = core.snapshotAtInputMinute(720, { ...inputs, clockMode: false });
  assert.equal(solar.solarMinutes, 720);
  assert.deepEqual(core.snapshotAtInputMinute(720, inputs), clock);
  assert.deepEqual(core.snapshotAtSolarMinute(705, inputs), clock);
  assert.equal(core.inputToSolarMinutes(720, inputs), 705);
  assert.equal(core.solarToInputMinutes(705, inputs), 720);
  assert.equal(core.snapshotAtSolarMinute(1440, inputs).solarMinutes, 0);
});
