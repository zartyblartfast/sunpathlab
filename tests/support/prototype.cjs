// Assemble fixture records from the directly imported core; no VM or DOM stubs.
function evaluateCase(api, input) {
  const terms = api.solarTerms(input.date);
  const inputs = { ...input, terms };

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

module.exports = { evaluateCase };
