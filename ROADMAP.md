# Solar Path Lab Roadmap

Last updated: September 2026

## 1. Purpose

Solar Path Lab is intended to become an interactive visual explanation of:

- Daily Sun paths
- Seasonal changes in solar altitude and azimuth
- Solar analemmas
- The Equation of Time
- Earth’s axial tilt
- Earth’s slightly elliptical orbit
- The connection between orbital geometry and observations from Earth’s surface
- The predictions made by an explicitly defined hypothetical flat-plane local-Sun model

The application should remain understandable to non-technical users while allowing interested users to inspect the underlying assumptions, formulas and numerical results.

This roadmap deliberately uses development milestones rather than calendar deadlines.

## 2. North-star experience

A user should be able to choose a location, date and time and answer four questions:

1. Where should the Sun appear?
2. Why does its position change?
3. What does each stated model predict?
4. How can the prediction be checked by direct observation?

The most important long-term experience will link three synchronized views:

1. Earth’s orbit and axial orientation
2. The observer’s position on Earth
3. The Sun’s apparent position in the observer’s sky

Moving the date or time in any view should update all three.

## 3. Intended audience

The primary audience includes:

- Non-specialists learning about Sun paths
- Students and teachers
- Amateur observers
- Sundial and solar-geometry enthusiasts
- People comparing globe and flat-Earth predictions
- Users who prefer visual explanations over equations

No prior knowledge of astronomy or trigonometry should be required for the main experience.

## 4. Current baseline — version 0.1

The current prototype provides:

- Latitude selection
- Date selection
- Local solar-time selection
- Optional clock-time conversion
- Longitude and UTC-offset inputs
- Equation of Time calculation
- Solar declination
- Globe-model altitude and azimuth
- Flat-plane-model altitude and azimuth
- Sunrise and sunset estimates
- Polar-day and polar-night handling
- An interactive 24-hour comparison chart
- Adjustable local-Sun height
- Perspective and distance diagrams
- Apparent solar-size comparison
- Vertical-stick shadow predictions
- A numerical comparison table
- Responsive static HTML, CSS and JavaScript
- Plain-language descriptions of the results

This establishes the initial concept but is not yet the final scientific or software architecture.

## 5. Development principles

All future work should follow these principles.

### 5.1 Correctness before complexity

Calculation code must be validated before major new visualisations depend on it.

### 5.2 Explicit assumptions

Every model must state:

- Its geometry
- Its coordinate system
- Its units
- Its constants
- Its treatment of time
- Its treatment of atmospheric effects
- Any limitations or approximations

### 5.3 Predictions and observations must remain distinct

The interface must clearly distinguish between:

- A model prediction
- A user measurement
- A derived result
- An illustrative diagram

### 5.4 Diagrams must disclose scale limitations

Orbit, Earth, Sun and observer diagrams cannot use one practical common scale.

Every combined diagram must therefore state that it is not to scale. Where useful, separate scale controls or deliberately exaggerated views may be provided.

### 5.5 Progressive disclosure

The first view should communicate the result visually and in plain language.

Detailed formulas, assumptions and technical values should remain available without dominating the main interface.

### 5.6 Hypothetical models must remain testable

A flat-plane or alternative model must not gain unexplained corrections simply to match an observation.

Any additional rule must be:

- Clearly stated
- Mathematically defined
- Applied consistently
- Capable of generating testable predictions

### 5.7 Preserve accessibility

All major functions must remain usable with:

- Keyboard navigation
- Screen readers
- Touch input
- Mobile-sized displays
- Enlarged text
- Reduced-motion settings

### 5.8 Avoid unnecessary framework complexity

A framework should only be introduced when it materially improves maintainability, testing or interaction design.

The scientific calculation layer must remain independent of any UI framework.

## 6. Milestone summary

| Milestone | Main outcome                                                 |
| --------- | ------------------------------------------------------------ |
| 0.1       | Existing daily Sun-path comparison prototype                 |
| 0.2       | Maintainable source structure and validated calculation core |
| 0.3       | Improved location, time and observation controls             |
| 0.4       | Interactive solar analemma explorer                          |
| 0.5       | Linked orbit, Earth and observer-sky explanation             |
| 0.6       | Expanded flat-plane model laboratory                         |
| 0.7       | Observation, sharing and export tools                        |
| 1.0       | Validated, accessible and documented public release          |

## 7. Milestone 0.2 — calculation and project foundations

### Goal

Separate the scientific calculations from the interface and establish reliable automated tests before adding major features.

### Work

- Introduce an authored `src` directory.
- Treat `dist` as generated deployment output.
- Divide the JavaScript into focused modules, such as:
  - Solar coordinates
  - Time conversion
  - Globe geometry
  - Flat-plane geometry
  - Shadow calculations
  - Formatting
  - Interface state
  - Diagram rendering
- Keep calculation functions pure wherever practical.
- Introduce a minimal build process.
- Add an automated test runner.
- Add continuous integration for tests and builds.
- Record all formulas, constants, units and conventions in `MODEL_SPECIFICATION.md`.
- Add regression tests for the existing interface calculations.
- Ensure generated files contain no credentials or local configuration.

### Validation coverage

Tests should cover:

- Equinoxes
- June and December solstices
- Northern and southern latitudes
- The equator
- Normal sunrise and sunset
- Polar day
- Polar night
- Local solar noon
- Midnight
- Longitude corrections
- Positive and negative UTC offsets
- Equation of Time extrema
- Leap years
- Flat-Sun height changes
- Locations where the observer and subsolar point nearly coincide

### Initial accuracy targets

When compared under the same assumptions:

- Solar declination should normally agree with the chosen reference to within `0.1°`.
- Equation of Time should normally agree within `1 minute`.
- Solar altitude should normally agree within `0.2°`.
- Solar azimuth should normally agree within `0.2°`, except very close to the zenith where azimuth becomes unstable.
- Sunrise and sunset should normally agree within `3 minutes`, excluding unusual refraction and difficult polar-transition cases.

These targets should be reviewed in `MODEL_SPECIFICATION.md` rather than silently loosened if a test fails.

### Flat-model invariants

Automated tests should confirm that:

- A Sun at a positive fixed height remains above an unobstructed infinite plane at every finite distance.
- Increasing Sun height increases predicted altitude for the same horizontal distance.
- Predicted altitude approaches zero as horizontal distance approaches infinity.
- Morning and afternoon results are symmetrical around solar noon when the other inputs remain unchanged.
- Horizontal and slant distances are never negative.
- Unit changes do not alter the physical result.

### Acceptance criteria

Milestone 0.2 is complete when:

- The existing interface still works.
- Calculation functions are independent of the page-rendering code.
- Automated tests cover the main globe and flat-model calculations.
- A clean checkout can be built using documented commands.
- The deployed `dist` files are reproducible from source.
- No scientific behavior has changed without documentation.

## 8. Milestone 0.3 — location, time and observation controls

### Goal

Make the selected observation unambiguous and easier to reproduce.

### Work

- Add separate latitude and longitude controls.
- Add a small set of useful location presets.
- Preserve manual coordinate entry.
- Clearly identify the selected time basis:
  - Local solar time
  - Mean solar time
  - UTC
  - Civil clock time
- Add automatic time-zone support only if it can be implemented reliably.
- Show whether daylight-saving time is being applied.
- Add observer elevation.
- Add observer eye height for horizon-related calculations.
- Keep atmospheric refraction optional and visibly identified.
- Add a reset-to-default function.
- Encode important settings in the URL so a comparison can be shared.
- Improve validation and explanations for invalid or unusual inputs.

A map selector may be considered later, but it should not delay reliable coordinate and time controls.

### Acceptance criteria

- A user can reproduce a calculation from a shared set of inputs.
- The interface never labels solar time as ordinary clock time.
- Longitude and UTC corrections are shown rather than hidden.
- Changing display units does not change calculated geometry.
- All controls remain usable on a phone-sized screen.

## 9. Milestone 0.4 — solar analemma explorer

### Goal

Show what an analemma is, how it is generated and why it normally forms a figure-eight pattern.

### Core experience

The user selects:

- Latitude
- Longitude
- Fixed observation time
- Time basis
- Year

The app then calculates the Sun’s position at that same time throughout the year.

### Required views

#### Apparent-sky view

Plot the Sun’s altitude and azimuth for every day, or for representative intervals such as every five or seven days.

The view should:

- Display the complete annual path
- Highlight the selected date
- Support hover, focus and touch inspection
- Show date, altitude, azimuth, declination and Equation of Time
- Identify solstices, equinoxes, perihelion and aphelion
- Adapt correctly for northern and southern latitudes

#### Analemma component view

Show how the figure is formed from two components:

- North-south movement produced mainly by changing solar declination
- East-west timing displacement represented by the Equation of Time

Controls should allow the user to display:

- Declination only
- Equation of Time only
- Both effects combined

#### Time-series view

Plot during the year:

- Solar declination
- Equation of Time
- Solar altitude at the selected observation time
- Solar azimuth at the selected observation time

Selecting a date in one view must highlight the same date everywhere.

### Important time rule

The default analemma should use the same local mean solar time throughout the year.

Civil time and daylight-saving time may be offered as optional demonstrations, but they must not silently introduce a one-hour discontinuity.

### Acceptance criteria

- The annual path is calculated rather than drawn as a decorative figure eight.
- Every plotted point can be traced to a date and numerical calculation.
- Northern- and southern-hemisphere orientation is correct.
- The plot changes correctly with latitude and observation time.
- Disabling orbital eccentricity removes its contribution to the Equation of Time.
- Disabling axial tilt removes the seasonal declination cycle and its Equation of Time contribution.
- Combining both effects recreates the complete calculated analemma.
- The explanation works without requiring the user to read the formulas.

## 10. Milestone 0.5 — linked orbit, Earth and observer views

### Goal

Connect the annual analemma to the physical motions that create it.

### Primary layout

Provide three synchronized panels:

1. Orbit view
2. Earth and observer view
3. Observer-sky or analemma view

A shared date control must update all panels.

### Orbit view

Show:

- The Sun
- Earth’s orbital position
- Orbital direction
- Earth’s axis maintaining approximately the same inertial direction
- Solstices and equinoxes
- Perihelion and aphelion
- The difference between a circular reference orbit and the real slightly elliptical orbit

The Sun and Earth must not be displayed as though their sizes and separation share an accurate scale.

### Earth and observer view

Show:

- Earth’s rotation axis
- Equator
- Subsolar latitude
- Day-night boundary
- Observer latitude
- Observer’s local horizontal
- Incoming sunlight direction

### Observer-sky view

Show:

- Local horizon
- Sun altitude
- Sun azimuth
- Cardinal directions
- Current analemma point
- The complete annual analemma as context

### Explanatory controls

Include toggles for:

- Axial tilt on or off
- Orbital eccentricity on or off
- Real eccentricity or visually exaggerated eccentricity
- Daily rotation animation
- Annual orbit animation
- True Sun or mean Sun
- Diagram labels

Any exaggerated value must be labelled clearly and must never replace the real value in numerical results.

### Acceptance criteria

- The same date and time state drives every panel.
- The selected observer remains fixed to the rotating Earth.
- The axial direction remains consistent during the orbit.
- The subsolar latitude agrees with calculated declination.
- The sky position agrees with the numerical altitude and azimuth.
- Scale limitations are stated directly in the interface.
- The animation can be paused and examined frame by frame.

## 11. Milestone 0.6 — expanded flat-plane model laboratory

### Goal

Allow the hypothetical local-Sun model to be inspected without confusing its assumptions with observed solar geometry.

### Work

- Preserve the existing north-pole-centred model as the default flat model.
- Allow named experimental variants only when their assumptions are documented.
- Compare complete daily paths.
- Compare annual paths and analemma-like plots.
- Calculate horizontal and slant distance.
- Calculate the angular size expected from changing distance.
- Add an optional inverse-square illumination comparison.
- Show the minimum predicted solar altitude during a day.
- Identify when an added obstruction or atmospheric-extinction rule would be required.
- Allow the user to inspect all formulas and parameter values.
- Provide a reset to the documented baseline model.

### Model rules

Each variant must define:

- Sun height
- Sun-track radius
- Daily angular speed
- Seasonal movement
- Physical or angular Sun diameter
- Light-intensity rule
- Visibility or extinction rule
- Any boundary to the plane

The app must not describe perspective as an additional mechanism if perspective is already represented by the line-of-sight calculation.

### Acceptance criteria

- Each model produces deterministic numerical predictions.
- Models cannot borrow different assumptions for different times of day without declaring that change.
- The app identifies whether the Sun geometrically crosses the observer’s horizontal.
- Angular-size and intensity predictions use the same distance calculated by the model.
- The displayed table can be used to compare predictions with measurements.

## 12. Milestone 0.7 — observation, sharing and export tools

### Goal

Make it straightforward to test and communicate the predictions.

### Work

- Add a guided vertical-stick experiment.
- Allow entry of stick height and measured shadow length.
- Calculate observed solar altitude.
- Compare the observation with both model predictions.
- Record date, time, coordinates and measurement notes.
- Display measurement uncertainty.
- Export comparison data as CSV.
- Generate a compact printable observation sheet.
- Create shareable URLs containing the selected setup.
- Provide a presentation or classroom mode.
- Allow charts to be exported as images with assumptions attached.

### Acceptance criteria

- A saved observation includes enough information to reproduce the calculation.
- Exported charts identify the model and input values.
- Measured and predicted values are visually distinct.
- The app does not claim more precision than the measurement supports.
- No account or server-side storage is required for the basic workflow.

## 13. Milestone 1.0 — public release

### Goal

Deliver a stable, validated and documented educational application.

### Required work

- Complete calculation validation
- Resolve high-priority accessibility findings
- Test current desktop and mobile browsers
- Test keyboard-only operation
- Test screen-reader labels and reading order
- Respect reduced-motion preferences
- Ensure charts remain understandable without colour alone
- Optimise loading and rendering performance
- Add clear error and empty states
- Finalise README and model specification
- Add an explicit software licence
- Add contributor guidance
- Add automated deployment checks
- Publish a versioned release
- Record known scientific and software limitations

### Definition of version 1.0

Version 1.0 is complete when a non-specialist can:

1. Select an observation.
2. Understand the predicted Sun position.
3. Follow the daily and annual changes visually.
4. See how axial tilt and orbital eccentricity create the analemma.
5. Compare the standard calculation with the stated hypothetical model.
6. Perform a simple shadow measurement.
7. Inspect the underlying assumptions and references.

## 14. Later possibilities

These should not delay version 1.0:

- Full interactive 3D globe
- Camera or augmented-reality overlay
- Multiple simultaneous observing locations
- Comparison of northern and southern observers
- Historical calendar support
- Offline progressive-web-app installation
- Teacher-created lesson sequences
- Embeddable charts
- Translations
- More advanced atmospheric-refraction models
- Integration with external ephemeris services

## 15. Current non-goals

The project is not currently intended to be:

- A professional navigation system
- A surveying instrument
- A replacement for a high-precision astronomical ephemeris
- A photorealistic solar-system simulator
- A complete atmospheric ray-tracing system
- A general-purpose mapping platform
- A collection of undocumented flat-Earth variants
- A debate or social-media platform
- A system requiring user accounts or personal-data storage

## 16. Immediate implementation sequence

Hermes or another coding agent should approach the next milestone in this order:

1. Preserve the current working version.
2. Add this roadmap and the project README.
3. Create `MODEL_SPECIFICATION.md`.
4. Establish the source, test and generated-output structure.
5. Extract the existing calculation functions without altering their results.
6. Add tests for the current calculations.
7. Add authoritative reference test cases.
8. Document any discrepancies found.
9. Correct confirmed calculation problems one at a time.
10. Begin the analemma module only after the calculation core passes its agreed tests.

Each pull request or development task should make one coherent change and should state whether it affects:

- Scientific calculations
- Model assumptions
- User-interface behavior
- Visual presentation
- Documentation only
