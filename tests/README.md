# Prototype characterization tests

## Purpose and scope

The main purpose of Solar Path Lab is to make the differences in predicted Sun
paths and angles between spherical-Earth solar geometry and an explicitly stated
hypothetical flat-Earth model obvious. These tests preserve the current numerical
comparison while the calculation core is extracted. Future analemma and orbital
views should support that comparison rather than replace it.

Run from the repository root with Node.js 22 or newer (verified on 24.14.1):

```sh
node --test tests/prototype.test.cjs
```

No npm install, external packages or build step are required. Node is a development
test tool; the deployed app still uses only static HTML, CSS and JavaScript.

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

## Temporary test bridge

`support/prototype.cjs` loads the actual app into an isolated Node VM and replaces
only its startup calls in memory with access to existing calculation functions.
The source file on disk is untouched. A minimal element-lookup stub permits the
closure to load; startup, event handling and rendering are not run.

The adapter adds no alternative calculation formulas. Its exact startup anchor
must match once or it fails loudly. After source-module extraction, replace this
bridge with imports of the calculation core while retaining the fixed fixtures.

Two negative controls deliberately change the flat-map radius and longitude sign
in memory. The fixtures must reject both altered implementations. This checks
that the regression suite detects numerical changes rather than comparing the
implementation with freshly regenerated expectations.

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

Scope of this change: test infrastructure and documentation only. No application
calculations, model assumptions, interface behavior or visual presentation changed.
