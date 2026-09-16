# Prototype characterization tests

## Purpose and scope

The main purpose of Solar Path Lab is to make the differences in predicted Sun
paths and angles between spherical-Earth solar geometry and an explicitly stated
hypothetical flat-Earth model obvious. These tests preserve the current numerical
comparison after extraction into `src/core/`. Future analemma and orbital
views should support that comparison rather than replace it.

Run from the repository root with Node.js 22 or newer (verified on 24.14.1):

```sh
npm test
```

No npm install or external packages are required. The suite builds in a temporary
directory and cleans it up. Run `npm run build` to regenerate the real `dist/`.
Node is a development tool; deployment remains static HTML, CSS and native ES modules.

## What the baseline means

`fixtures/prototype-v0.1.json` contains outputs captured by executing the actual
`dist/app.js` at commit `438a6f535ad4159416d993fec47467a3f32498cf`.
It is **not independent ephemeris data and does not establish scientific accuracy**.

The 13 fixed scenarios cover the default rounded sunset time, seasonal dates,
northern and southern latitudes, the equator, polar classifications in both
hemispheres, noon and midnight, leap day, signed longitude/UTC corrections,
a fractional UTC offset, time wrapping, and different local-Sun heights.

Each fixture captures solar terms, both models' altitude and azimuth, flat-model
distances, rise/set classification and times, converted event times, and shadows.
Additional tests record the 24:00 closing copy, legacy overhead azimuth values,
and the current parallel-ray shadow approximation. These last behaviors are not
requirements for the completed app.

Comparison tolerance is `1e-9 + abs(expected) * 1e-12` per numeric field, in that
field's native units. This is a floating-point regression tolerance, not an
astronomical accuracy target. Future independent reference tests need their own
scientific tolerances and explicit assumptions.

## Direct calculation imports and build tests

The tests import `src/core/index.js` directly. `support/prototype.cjs` only
assembles result records from those functions. The temporary VM/startup bridge
has been removed; no DOM stubs or alternate calculation formulas are used.

Clock mode is explicit in each input record (`inputs.clockMode`), not global
calculation state. Additional core tests cover isolated calls and the prototype's
scenario-specific angular-size calibration.

Two negative controls deliberately perturb local-Sun height and longitude sign
in the input records. The fixed fixtures must reject the changed outputs. These
are fixture-sensitivity checks, not implementation mutation tests.

The build test verifies the exact output allowlist, removal of stale output,
byte equality with source, identical hashes over two builds, module dependencies,
the HTML module entry point, and execution of the built calculation graph. It runs
from a different working directory to check script-relative path handling.

## Known gaps and change policy

These tests do not validate browser behavior, accessibility, unit-switch events,
invalid inputs, rendering, scientific reference accuracy, or the entire input
space. In particular, the reviewed unit-conversion and clock-label defects remain
unfixed. No full-year or analemma behavior exists yet.

Do not regenerate fixtures automatically to make a failure disappear. Investigate
changes first. For an intentional scientific correction, add an independent test,
document before/after results and the relevant specification change, then update
only affected expectations. Keep legacy defects explicitly labelled until replaced
with tests for the corrected behavior.

Scope of the extraction: source organization, explicit calculation inputs, native
module loading, a copy build, and direct-import tests. No intentional changes to
numerical formulas, model assumptions, UI behavior or visual presentation.
