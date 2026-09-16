# Solar Path Lab Model Specification

Status: Working draft — agent-authored, pending scientific validation

Specification version: 0.1.1

Applies to application version: 0.1 and planned 0.x development

This document was initially authored by an agent, not supplied as an approved
scientific specification. It records the prototype and proposed requirements;
neither its presence nor passing characterization tests establishes correctness.
Revision 0.1.1 clarifies the contract without changing application calculations
or the baseline model identifiers.

## 1. Purpose

This document defines the mathematical models, coordinate conventions, time conventions, constants, assumptions and expected behavior used by Solar Path Lab.

The application's primary purpose is to make differences in predicted Sun paths
and angles between standard globe geometry and a stated hypothetical flat Earth
obvious. Explanatory orbital and analemma features serve that comparison.
Calculations MUST remain faithful to each model even where their predictions
are close; diagrams must not exaggerate numerical discrepancies.

It has four purposes:

1. Ensure that calculations remain scientifically consistent.
2. Prevent interface changes from silently changing the models.
3. Provide a reference for automated testing.
4. Make every hypothetical-model assumption visible and reproducible.

If the implementation and this specification disagree, the discrepancy must be investigated. Tests must not simply be changed to match whichever result the current code produces.

## 2. Model identifiers

Calculations and exported results should use explicit model identifiers.

### Standard solar model

```text
globe-usno-approx-v1
```

This uses spherical-Earth horizon geometry and the U.S. Naval Observatory’s approximate solar-coordinate algorithm.

### Hypothetical flat-plane model

```text
flat-ae-local-sun-v1
```

This uses a north-pole-centred azimuthal-equidistant plane and an elevated local Sun.

Material changes to a model’s assumptions or equations require a new model version.

Cosmetic changes, additional explanations and display-format changes do not require a new model version.

## 3. Scope

This specification currently covers:

- Date-to-solar-coordinate conversion
- Solar declination
- Right ascension
- Equation of Time
- Local apparent solar time
- Solar hour angle
- Globe-model altitude and azimuth
- Sunrise and sunset
- Flat-plane observer and Sun positions
- Flat-model altitude and azimuth
- Horizontal and slant distances
- Apparent angular size
- Shadow length
- Analemma generation
- Orbital explanation controls
- Numerical validation and known limitations

The application is educational. It is not intended to replace a professional astronomical ephemeris, surveying instrument or navigation system.

## 4. Normative language

The words `MUST`, `MUST NOT`, `SHOULD`, `SHOULD NOT` and `MAY` describe implementation requirements.

- `MUST` means required for model consistency.
- `SHOULD` means strongly recommended unless a documented reason exists.
- `MAY` means optional.

Sections marked **Current behavior** describe the existing prototype.

Sections marked **Target behavior** describe behavior required during the next development stages.

Normative requirements describe the intended contract, not a claim that the
prototype already satisfies it. Sections 19–20 and interfaces/records in sections
26–27 are targets, not implemented features. The model identifiers in section 2
are specified identifiers; the current prototype does not emit them in result
records. Section 28.1 tracks confirmed discrepancies separately from deliberate
baseline approximations.

## 5. Coordinate and sign conventions

### 5.1 Latitude

Latitude is represented by `φ`.

```text
Northern latitude: positive
Southern latitude: negative
Equator: 0°
North Pole: +90°
South Pole: −90°
```

The current interface restricts latitude to:

```text
−80° ≤ φ ≤ +80°
```

The underlying globe equations can be extended to the poles, provided their coordinate singularities are handled explicitly.

### 5.2 Longitude

Longitude is represented by `λ`.

```text
East of Greenwich: positive
West of Greenwich: negative
```

Valid range:

```text
−180° ≤ λ ≤ +180°
```

### 5.3 Solar declination

Solar declination is represented by `δ`.

```text
North of the celestial equator: positive
South of the celestial equator: negative
```

### 5.4 Altitude

Solar altitude is represented by `a`.

```text
Zenith: +90°
Above horizontal: positive
On geometric horizontal: 0°
Below horizontal: negative
Nadir: −90°
```

Unless explicitly described as refracted or apparent altitude, all displayed altitude values are geometric centre-of-Sun altitudes.

### 5.5 Azimuth

Azimuth is represented by `A` and is measured clockwise from true north.

```text
North: 0°
East: 90°
South: 180°
West: 270°
```

Azimuth values are normalized into:

```text
0° ≤ A < 360°
```

Azimuth becomes indeterminate when the Sun is exactly at the zenith or nadir. The target interface should display `undefined at zenith` rather than an arbitrary numerical direction.

### 5.6 Hour angle

Solar hour angle is represented by `H`.

```text
Morning/east of meridian: negative
Meridian transit: 0°
Afternoon/west of meridian: positive
```

The Sun’s hour angle increases at approximately 15° per hour.

### 5.7 Internal units

The calculation layer MUST use:

- Kilometres for large distances
- Consistent user-selected units for stick and shadow lengths
- Minutes after midnight for daily time
- Degrees at public function boundaries
- Radians inside trigonometric functions
- JavaScript double-precision numbers without intermediate display rounding

Conversions are:

```text
radians = degrees × π ÷ 180
degrees = radians × 180 ÷ π
kilometres = miles × 1.609344
```

## 6. Constants

The current baseline constants are:

```text
J2000 Julian date                    = 2451545.0
Flat-map radial scale R              = 6371 km
Reference solar angular diameter     = 0.533°
Sunrise/set centre altitude          = −0.8333°
Minutes per degree of hour angle     = 4
Degrees per solar hour               = 15
Minutes per day                      = 1440
```

### 6.1 Meaning of the 6,371 km flat-map constant

In the flat model, `6,371 km` is a radial map-scale constant. It converts angular distance from the north pole into distance on an azimuthal-equidistant plane.

Its use does not mean the flat model is simultaneously treating the plane as a sphere.

### 6.2 Default local-Sun height

The initial interface uses:

```text
4000 miles
```

This is a demonstration default, not an accepted measurement or an independently established property of a flat-Earth model.

The user may change it.

## 7. Input domains

The current interface accepts approximately:

```text
Latitude             −80° to +80°
Longitude            −180° to +180°
UTC offset            −12 to +14 hours
Local-Sun height      10 to 100,000 miles or kilometres
Time                   0 to 1440 minutes
Stick height           0.1 to 1000 metres or feet
```

### 7.1 Date range

The U.S. Naval Observatory describes its approximate solar-coordinate algorithm as accurate to about one arcminute within two centuries of the year 2000.

The recommended supported range is therefore:

```text
1800-01-01 through 2200-12-31
```

The interface SHOULD warn when a date outside that range is used.

### 7.2 The meaning of 24:00

The current daily chart treats `24:00` as equivalent to `00:00`.

For calculations that depend on the precise date, target behavior MUST either:

- advance the calendar date at `24:00`, or
- label the sample as the closing copy of the current daily curve.

## 8. Shared numerical functions

### 8.1 Normalize an angle to 0–360 degrees

```text
normalize360(x) = ((x mod 360) + 360) mod 360
```

### 8.2 Wrap an angle to approximately −180–+180 degrees

```text
wrap180(x) = ((x + 540) mod 360) − 180
```

### 8.3 Normalize minutes within a day

```text
normalizeMinutes(t) = ((t mod 1440) + 1440) mod 1440
```

### 8.4 Clamp trigonometric inputs

Values passed to inverse sine or inverse cosine MUST be clamped to the valid interval:

```text
−1 ≤ x ≤ +1
```

This prevents floating-point noise from creating invalid results.

## 9. Solar-coordinate calculation

The current calculation follows the U.S. Naval Observatory’s approximate solar-coordinate method:

[USNO: Computing Approximate Solar Coordinates](https://aa.usno.navy.mil/faq/sun_approx)

The USNO states that this method is accurate to approximately one arcminute within two centuries of the year 2000.

### 9.1 Julian date

The current prototype evaluates the solar coordinates at `12:00 UTC` on the selected calendar date.

For a JavaScript UTC timestamp:

```text
JD = Unix milliseconds ÷ 86,400,000 + 2,440,587.5
```

Days from the J2000.0 epoch are:

```text
D = JD − 2,451,545.0
```

### 9.2 Mean anomaly

```text
g = 357.529° + 0.98560028° × D
```

Normalize `g` to `0°–360°`.

### 9.3 Mean longitude

```text
q = 280.459° + 0.98564736° × D
```

Normalize `q` to `0°–360°`.

### 9.4 Apparent ecliptic longitude

```text
L = q + 1.915° sin(g) + 0.020° sin(2g)
```

Normalize `L` to `0°–360°`.

### 9.5 Mean obliquity

```text
ε = 23.439° − 0.00000036° × D
```

### 9.6 Right ascension

```text
RA = atan2(cos(ε) sin(L), cos(L))
```

Convert the result to degrees and normalize it to `0°–360°`.

The double-argument arctangent MUST be used so that the correct quadrant is retained.

### 9.7 Declination

```text
δ = asin(sin(ε) sin(L))
```

The result is converted to degrees.

### 9.8 Current daily-coordinate approximation

**Current behavior:** declination and Equation of Time are calculated once at `12:00 UTC` and then held constant throughout the selected day.

This is adequate for the current educational daily plot but is not the exact USNO instruction, which uses the Julian date of the instant being calculated.

**Target behavior:** the calculation core SHOULD accept a complete UTC instant and calculate solar coordinates for that instant.

Daily charts MAY still use one daily declination value as an explicit performance or educational approximation, but that choice must be documented and tested.

## 10. Equation of Time

Solar Path Lab defines the Equation of Time as:

```text
Equation of Time = apparent solar time − mean solar time
```

This sign convention follows the U.S. Naval Observatory:

[USNO: The Equation of Time](https://aa.usno.navy.mil/faq/eqtime)

With right ascension expressed in degrees:

```text
E = 4 × wrap180(q − RA)
```

Where:

```text
E is in minutes
q is mean solar longitude in degrees
RA is right ascension in degrees
```

Interpretation:

```text
Positive E: apparent Sun is ahead of mean solar time
Negative E: apparent Sun is behind mean solar time
```

All interface text, exports and tests MUST use this sign convention.

## 11. Time systems

### 11.1 Local apparent solar time

Local apparent solar time is the time indicated by the actual Sun.

At apparent solar noon:

```text
local apparent solar time = 12:00
H = 0°
```

### 11.2 Local mean solar time

Local mean solar time uses a fictitious mean Sun moving uniformly.

The relationship is:

```text
apparent solar time = mean solar time + Equation of Time
```

### 11.3 Civil clock time

Let:

```text
Tclock = local civil clock minutes after midnight
λ      = longitude in degrees, east positive
z      = UTC offset in hours, local time minus UTC
E      = Equation of Time in minutes
```

Then:

```text
Tsolar = normalizeMinutes(Tclock + E + 4λ − 60z)
```

This is the local apparent solar time used by the position calculations.

Example sign behavior:

- Eastern longitude advances local solar time.
- Western longitude delays local solar time.
- A positive UTC offset moves the time-zone reference meridian eastward.
- A positive Equation of Time means the apparent Sun is ahead of the mean Sun.

### 11.4 Daylight-saving time

The current app does not contain a time-zone or daylight-saving database.

If the entered clock time includes daylight-saving time, the entered UTC offset MUST be the actual offset applying at that date and location.

For example, British Summer Time requires:

```text
UTC offset = +1
```

The interface must not add a separate daylight-saving correction unless a time-zone system has been implemented.

### 11.5 Date-boundary limitation

**Current behavior:** clock time is converted using the selected calendar date without fully resolving whether the equivalent UTC instant belongs to the previous or following date.

**Target behavior:** precise clock-time calculations MUST resolve the complete local date and time to a UTC instant before calculating solar coordinates.

## 12. Solar hour angle

Given local apparent solar time in minutes:

```text
H = Tsolar ÷ 4 − 180°
```

Equivalent values include:

```text
00:00 solar time  → H = −180°
06:00 solar time  → H = −90°
12:00 solar time  → H = 0°
18:00 solar time  → H = +90°
24:00 solar time  → H = +180°
```

## 13. Standard globe-model position

The model assumes:

- A spherical Earth
- A distant Sun
- Effectively parallel solar rays over Earth-sized distances
- No topocentric solar parallax
- No terrain
- No observer elevation
- No atmospheric refraction in ordinary altitude output

### 13.1 Solar altitude

```text
sin(a) = sin(φ) sin(δ) + cos(φ) cos(δ) cos(H)
```

Therefore:

```text
a = asin(
    sin(φ) sin(δ)
  + cos(φ) cos(δ) cos(H)
)
```

The result range is:

```text
−90° ≤ a ≤ +90°
```

This follows the standard horizon-coordinate transformation described by:

[USNO: Computing Altitude and Azimuth](https://aa.usno.navy.mil/faq/alt_az)

### 13.2 Solar azimuth

The current implementation calculates azimuth as:

```text
A = normalize360(
      atan2(
        sin(H),
        cos(H) sin(φ) − tan(δ) cos(φ)
      ) + 180°
    )
```

This produces azimuth clockwise from true north.

### 13.3 Solar-noon identity

At local apparent solar noon:

```text
H = 0°
```

For the supported latitude and declination ranges:

```text
a_noon = 90° − |φ − δ|
```

This identity SHOULD be included as an automated test.

### 13.4 Morning and afternoon symmetry

When declination is treated as constant during a day:

```text
a(−H) = a(+H)
```

Altitude is symmetrical around apparent solar noon.

Azimuth is not numerically identical, but the morning and afternoon directions should be geometrically mirrored around the local meridian.

### 13.5 Zenith singularity

When:

```text
φ = δ
H = 0°
```

the Sun is at the zenith.

Altitude is well-defined as `90°`, but azimuth is undefined. Tests SHOULD compare a three-dimensional direction vector rather than azimuth near this singularity.

## 14. Sunrise and sunset

The standard event altitude is:

```text
h₀ = −0.8333°
```

This represents the geometric centre of the Sun approximately 50 arcminutes below a level horizon:

- approximately 16 arcminutes for the Sun’s radius
- approximately 34 arcminutes for average horizon refraction

Reference:

[USNO: Rise, Set and Twilight Definitions](https://aa.usno.navy.mil/faq/RST_defs)

The sunrise/set hour angle is obtained from:

```text
cos(H₀) =
  [sin(h₀) − sin(φ) sin(δ)]
  ÷
  [cos(φ) cos(δ)]
```

Classification:

```text
cos(H₀) > +1  → no sunrise; polar night
cos(H₀) < −1  → no sunset; midnight Sun
otherwise      → normal rise and set
```

For a normal day:

```text
H₀ = acos(cos(H₀))

sunrise solar minutes = 720 − 4H₀
sunset solar minutes  = 720 + 4H₀
```

`H₀` is expressed in degrees in the time conversion above.

### 14.1 Rise/set limitations

Calculated sunrise and sunset assume:

- Observer effectively at sea level
- Level, unobstructed horizon
- Average atmospheric conditions
- No terrain
- No unusual refraction
- Solar declination effectively constant during the event calculation

Observed times can differ, especially at high latitudes.

## 15. Hypothetical flat-plane local-Sun model

### 15.1 Model assumptions

The baseline flat model assumes:

- An infinite Euclidean plane
- North pole at the centre
- Azimuthal-equidistant radial scaling
- A local Sun at constant height `h`
- A circular daily Sun track around the north pole
- One revolution per apparent solar day
- A seasonal track radius based on standard-model solar declination
- No terrain or opaque physical boundary
- No atmospheric extinction
- Straight-line light propagation
- Ordinary Euclidean perspective

### 15.2 Borrowed seasonal inputs

The flat model currently borrows:

- Solar declination from the standard astronomical calculation
- The Equation of Time when clock mode is used

These quantities are input schedules used to make the hypothetical model follow the observed seasons and solar timing as closely as practical.

They are not independently derived from the flat-plane geometry.

The interface and documentation MUST not imply that the flat geometry itself predicts those schedules.

### 15.3 Observer radius

Let `Rf` be the radial scale:

```text
Rf = 6371 km
```

The observer’s distance from the north pole is:

```text
rₒ = Rf × rad(90° − φ)
```

Consequences include:

```text
North Pole: rₒ = 0
Equator:    rₒ = πRf ÷ 2
South Pole: rₒ = πRf
```

### 15.4 Sun-track radius

The Sun’s ground-track radius is based on declination:

```text
rₛ = Rf × rad(90° − δ)
```

Examples:

```text
δ = +23.44° → smaller northern-summer track
δ = 0°      → equatorial track
δ = −23.44° → larger northern-winter track
```

### 15.5 Daily phase angle

The Sun’s angular phase around the plane is:

```text
θ = −H
```

Both angles must use the same angular unit.

This convention places the Sun east of the observer’s meridian before solar noon and west afterward.

Because the flat plane is rotationally symmetrical, the observer’s longitude can be treated as the reference meridian after clock time has been converted to local apparent solar time.

### 15.6 Horizontal distance

The horizontal distance between the observer and the point directly beneath the Sun is:

```text
d = √(rₒ² + rₛ² − 2rₒrₛ cos(θ))
```

The expression inside the square root MUST be clamped to a minimum of zero to protect against small floating-point errors.

### 15.7 Flat-model altitude

For local-Sun height `h`:

```text
a_flat = atan2(h, d)
```

The double-argument arctangent correctly handles the overhead case where `d = 0`.

### 15.8 Slant distance

The straight-line distance from observer to Sun is:

```text
s = √(h² + d²)
```

### 15.9 Flat-model azimuth

Define the line-of-sight horizontal components:

```text
north component = rₒ − rₛ cos(θ)
east component  = rₛ sin(θ)
```

Then:

```text
A_flat = normalize360(
  atan2(east component, north component)
)
```

### 15.10 Flat overhead singularity

If:

```text
d = 0
```

then:

```text
a_flat = 90°
```

Azimuth is undefined because the Sun is directly overhead.

The target interface SHOULD display an indeterminate azimuth rather than the numerical result of `atan2(0, 0)`.

### 15.11 Geometric sunset result

For:

```text
h > 0
d finite
```

the flat-model altitude satisfies:

```text
0° < atan2(h, d) ≤ 90°
```

Therefore, in this model:

- The Sun becomes lower as horizontal distance increases.
- Its altitude approaches `0°` as distance approaches infinity.
- It never acquires a negative altitude.
- It never geometrically passes below an unobstructed infinite plane.

This is a mathematical consequence of the model, not an additional application assumption.

### 15.12 Pseudo-sunrise and pseudo-sunset

The current comparison may evaluate the flat model at the standard globe model’s calculated sunrise or sunset time.

That time is a comparison timestamp only.

It MUST NOT be described as a sunrise or sunset predicted by the flat model.

Any future flat-model visibility event must specify a separate testable rule, such as:

- A defined angular-size threshold
- A defined irradiance threshold
- A defined atmospheric optical-depth model
- A physical obstruction
- A finite boundary to the plane

Perspective alone is already represented by `atan2(h, d)` and cannot be added again as a separate hiding mechanism.

## 16. Shadow model

Let:

```text
Hs = vertical stick height
Ls = horizontal shadow length
a  = solar altitude
```

**Current behavior:** the prototype applies the following parallel-ray
approximation to both models for a Sun above the horizontal:

```text
Ls = Hs ÷ tan(a)
```

The corresponding inverse measurement under that approximation is:

```text
a_observed = atan2(Hs, Ls)
```

If:

```text
a ≤ 0°
```

the prototype returns no direct solar shadow. This is a geometric centre-ray
rule, not a full visibility calculation: solar-limb and refraction effects close
to the horizon are excluded.

### 16.1 Shadow direction

If required in a future version, shadow azimuth is:

```text
A_shadow = normalize360(A_sun + 180°)
```

### 16.2 Measurement assumptions

The basic shadow calculation assumes:

- Vertical stick
- Level measurement surface
- Clearly defined shadow tip
- Negligible stick thickness
- No nearby obstruction
- Sun treated by its centre direction
- Effectively parallel rays across the stick (an approximation for the local Sun)
- Stick and shadow lengths use the same physical unit

Measurement uncertainty should be shown when observation recording is implemented.

### 16.3 Finite-source geometry

For a point-like local source at height `h`, horizontal distance `d` from the
stick base, and a vertical stick of height `Hs`, similar triangles give:

```text
Ls = Hs × d ÷ (h − Hs), for h > Hs > 0
```

All three input lengths MUST first use the same unit. This follows by extending
the straight ray from the source through the stick tip to the ground plane.
For `d = 0` and `h > Hs`, shadow length is zero in the zero-thickness-stick model.
The formula is not a valid finite-shadow rule for `h ≤ Hs`; an implementation
must reject or explicitly classify that geometry rather than return a negative length.

The existing formula uses the Sun's altitude at the stick base and gives
`Ls_approx = Hs × d ÷ h`. For `d > 0`, its fractional underestimate relative to
the finite-source result is `Hs ÷ h`. For example, `h = 10,000 m`, `d = 10,000 m`
and `Hs = 1,000 m` give approximately `1,111.11 m`, versus the prototype's `1,000 m`.
Those heights are permitted by the prototype, so the approximation cannot be
described as negligible over its entire input domain.

For a finite source, `atan2(Hs, Ls)` measures the incident ray angle at the stick
tip, not exactly the solar altitude at the base. Observation comparisons must
state that distinction or constrain the small-stick approximation.

**Target behavior:** explicitly identify the baseline approximation and its
limits. A finite-source shadow calculation is a separately tested correction,
not part of the behavior-preserving extraction. Before implementing it, document
its units, domain, treatment of invalid geometry, before/after results and model
version impact. This draft does not silently change the v1 shadow outputs.

## 17. Apparent angular size

### 17.1 Standard globe-model display

The current interface uses a fixed reference solar angular diameter:

```text
α_reference = 0.533°
```

This is a representative average.

The real solar angular diameter changes slightly during the year because Earth-Sun distance changes.

The USNO approximation provides Earth-Sun distance in astronomical units:

```text
R_AU = 1.00014 − 0.01671 cos(g) − 0.00014 cos(2g)
```

It gives solar angular semidiameter:

```text
SD = 0.2666° ÷ R_AU
```

A future model may therefore calculate:

```text
solar angular diameter = 2SD
```

If implemented, the fixed and variable-diameter modes must be clearly distinguished.

### 17.2 Flat-model calibration

The current flat comparison calibrates a hypothetical physical Sun diameter so that its angular diameter at local solar noon is `0.533°`.

Let:

```text
s_noon = flat-model slant distance at solar noon
α₀     = 0.533°
```

The calibrated physical diameter is:

```text
D_sun = 2s_noon tan(α₀ ÷ 2)
```

At another time with slant distance `s`:

```text
α_flat = 2 atan2(D_sun, 2s)
```

### 17.3 Calibration limitation

The current physical diameter is recalibrated for the selected observer, date and local-Sun height.

It is therefore useful for demonstrating daily angular-size variation but is not yet a single globally consistent flat-Sun diameter.

Any future simultaneous multi-location comparison MUST use one shared physical diameter and one shared Sun position.

## 18. Illumination comparison

Inverse-square illumination is not implemented in the current prototype.

If introduced, the unattenuated relative intensity should be:

```text
I ÷ I_noon = (s_noon ÷ s)²
```

This represents only geometric spreading.

It does not include:

- Atmospheric absorption
- Scattering
- Cloud
- Solar incidence angle on the ground
- Camera exposure
- Human visual adaptation

The interface MUST not describe inverse-square intensity alone as predicted observed brightness at the surface.

## 19. Analemma specification

### 19.1 Definition

For Solar Path Lab, an analemma is the set of calculated Sun positions observed from one location at the same selected time on successive dates through a year.

The app must distinguish between:

- Same local mean solar time
- Same civil clock time
- Same UTC time
- Same local apparent solar time

These choices do not produce identical plots.

### 19.2 Default time basis

The default educational analemma SHOULD use a fixed local mean solar time.

For each date:

```text
T_apparent = T_mean + E(date)
```

Then:

```text
H(date) = T_apparent ÷ 4 − 180°
```

Declination and Equation of Time must be calculated for that date before altitude and azimuth are calculated.

### 19.3 Civil-time analemma

For a fixed civil clock time:

```text
T_apparent(date) =
  T_clock
  + E(date)
  + 4λ
  − 60z(date)
```

If daylight-saving rules are enabled, `z(date)` may change during the year and introduce an apparent one-hour displacement.

That discontinuity must be shown and explained. It must not be mistaken for part of the astronomical analemma.

The default mode should therefore use either:

- fixed local mean solar time, or
- fixed civil time with daylight-saving disabled.

### 19.4 Sampling

A calendar-year analemma should contain one sample for every calendar date:

```text
365 samples in a common year
366 samples in a leap year
```

Lower-density display markers MAY be used, but the underlying calculated path should retain daily samples.

Each sample must contain at least:

```text
date
time basis
input time
UTC instant where applicable
declination
Equation of Time
hour angle
altitude
azimuth
above/below-horizon state
model identifier
```

### 19.5 Abstract analemma plot

The explanatory component plot uses:

```text
horizontal axis: Equation of Time in minutes
vertical axis:   solar declination in degrees
```

Because the Equation of Time is defined as apparent minus mean solar time:

```text
positive horizontal value = apparent Sun ahead of mean Sun
negative horizontal value = apparent Sun behind mean Sun
```

The axes must be labelled so the figure is not accidentally mirrored.

### 19.6 Observer-sky analemma

The observer-sky plot uses calculated altitude and azimuth.

For a three-dimensional local horizon vector:

```text
x_east  = cos(a) sin(A)
y_north = cos(a) cos(A)
z_up    = sin(a)
```

This vector should be the authoritative display input.

A simple quantitative two-dimensional view may plot:

```text
horizontal axis: unwrapped azimuth
vertical axis:   altitude
```

Azimuth must be unwrapped around `0°/360°` to prevent an artificial line across the chart.

Any camera-like projection must name its projection and orientation. A photograph may show the analemma rotated or mirrored depending on:

- Camera direction
- Lens projection
- Image orientation
- Hemisphere
- Time of observation

### 19.7 Below-horizon samples

Annual samples below the horizon remain valid mathematical results.

They may be:

- shown with a different style,
- hidden by an explicit visibility control, or
- clipped by a horizon mask.

They MUST NOT be silently deleted from the calculated dataset.

### 19.8 Analemma component demonstrations

The app is intended to demonstrate the effects of:

- Axial tilt
- Orbital eccentricity
- Both effects together

The compact USNO approximation combines these effects and does not expose eccentricity as a direct interactive parameter.

The component demonstration therefore requires a separate orbital model with explicit values for:

```text
orbital eccentricity
obliquity
orbital phase
perihelion orientation or epoch
```

Required scenarios are:

```text
Full model:              real eccentricity, real obliquity
Tilt-only experiment:    eccentricity set to zero
Eccentricity-only:       obliquity set to zero
Uniform reference:       eccentricity and obliquity set to zero
```

These are controlled hypothetical experiments.

Their results should not be assumed to add linearly unless an explicitly documented series decomposition is used.

## 20. Orbit and Earth visualisation model

The orbit visualisation must distinguish numerical geometry from drawing scale.

### 20.1 Required physical relationships

- Earth orbits the Sun.
- Earth rotates west to east.
- Earth’s axis is tilted by approximately `23.44°` relative to the normal to its orbital plane.
- Over one annual demonstration, the axis maintains approximately the same inertial direction.
- Earth’s orbit has a small eccentricity of approximately `0.0167`.
- Orbital speed is not uniform in a real elliptical orbit.
- Incoming sunlight is treated as effectively parallel at Earth scale.

### 20.2 Scale policy

The Sun, Earth, their separation and the observer cannot all be displayed at one useful common scale.

Every combined view MUST therefore:

- state that it is not to scale,
- avoid implying that exaggerated eccentricity is real,
- distinguish visual exaggeration from calculated values, and
- retain real numerical values in labels or readouts.

### 20.3 Exaggerated eccentricity

An exaggerated orbit MAY be used to make the effect visible.

When enabled:

- it must be labelled `exaggerated for explanation`,
- it must not feed the standard numerical calculation, and
- the real-eccentricity result must remain available.

## 21. Atmospheric refraction and horizon treatment

### 21.1 Current behavior

The current application:

- uses geometric altitude for ordinary Sun-position output,
- includes average refraction only through the conventional `−0.8333°` rise/set threshold,
- does not calculate continuously varying refraction,
- does not calculate terrain obstruction,
- does not include observer elevation.

### 21.2 Future refraction mode

If refraction is added, the application MUST provide separate values for:

```text
geometric altitude
refraction correction
apparent altitude
```

The interface must not overwrite geometric altitude without identifying the correction.

NOAA publishes one commonly used approximate refraction treatment, but also notes that its calculator is no longer actively maintained:

[NOAA: Solar Calculation Details](https://gml.noaa.gov/grad/solcalc/calcdetails.html)

Atmospheric refraction varies with pressure, temperature, humidity and atmospheric structure. Near-horizon results must therefore be described as approximate.

## 22. Numerical safeguards and edge cases

The implementation MUST handle:

- Invalid dates
- Non-numeric input
- Latitude and longitude limits
- Zero horizontal distance
- Zenith and nadir azimuth singularities
- Polar day
- Polar night
- Values extremely close to rise/set boundaries
- Time normalization across midnight
- Leap years
- Unit changes
- Floating-point values slightly outside inverse-trigonometric domains

### 22.1 Polar classification tolerance

Near `cos(H₀) = ±1`, floating-point noise may incorrectly switch between normal and polar classifications.

The implementation SHOULD use a documented numerical tolerance before classifying the event.

### 22.2 Angle comparisons

Automated azimuth comparisons MUST use the smallest wrapped angular difference:

```text
difference = |wrap180(A₁ − A₂)|
```

Direct subtraction is invalid near north, where values such as `359.9°` and `0.1°` are close rather than 359.8° apart.

### 22.3 Near-zenith tests

Azimuth is highly sensitive when altitude is close to `90°`.

Tests near the zenith SHOULD compare local direction vectors instead of demanding a small azimuth difference.

## 23. Display precision

Calculations MUST retain full internal precision.

Rounding occurs only for presentation.

Recommended display precision:

```text
Latitude and longitude       0.1°
Altitude and azimuth         0.1°
Declination                  0.1°
Equation of Time             0.1 minute
Angular diameter             0.01°
Clock event time             nearest minute
Distances below 1000 units   nearest unit
Large distances              sensible rounded value
```

Automated tests MUST use unrounded values.

Displayed precision must not imply measurement accuracy greater than the model or observation supports.

## 24. Validation strategy

Validation has three layers.

### 24.1 Mathematical invariant tests

Examples include:

- At solar noon, `H = 0°`.
- At the equator on an exact equinox, noon altitude approaches `90°`.
- At the equator with `δ = 0°`, geometric altitude is `0°` at `H = ±90°`.
- Globe altitude is symmetrical around noon when declination is fixed.
- A positive-height flat Sun always has positive altitude at finite distance.
- Flat-model slant distance is never less than Sun height.
- Increasing positive flat-Sun height strictly increases altitude at a fixed positive horizontal distance; at zero horizontal distance, altitude stays `90°`.
- Unit conversions do not change the physical result.
- A shadow direction is opposite the Sun’s azimuth.
- Analemma sampling returns 365 or 366 records as appropriate.

### 24.2 Authoritative reference tests

Reference fixtures should cover:

- Equinoxes
- Solstices
- Perihelion and aphelion periods
- Equation of Time extrema and zero crossings
- Equator
- Tropics
- Mid-latitudes
- Arctic and Antarctic circles
- High latitudes
- Northern and southern hemispheres
- Morning, noon and afternoon
- Sunrise and sunset
- Positive and negative longitudes
- Positive and negative UTC offsets

Primary baseline:

[USNO: Computing Approximate Solar Coordinates](https://aa.usno.navy.mil/faq/sun_approx)

High-precision comparison reference:

[NREL: Solar Position Algorithm for Solar Radiation Applications](https://www.nrel.gov/docs/fy08osti/34302.pdf)

Additional cross-check:

[NOAA Solar Calculator](https://gml.noaa.gov/grad/solcalc/)

The NOAA calculator should not be the sole test oracle because NOAA states that it is no longer actively maintained.

### 24.3 Regression tests

Regression tests should preserve:

- Previously validated input/output fixtures
- Polar classifications
- Time-conversion signs
- Default application results
- Chart sample counts
- Model identifiers
- Exported field meanings

A regression test does not establish scientific correctness by itself. It only detects changes.

The initial suite in `tests/prototype.test.cjs` captures outputs of the prototype
at commit `438a6f535ad4159416d993fec47467a3f32498cf`. These are characterization
fixtures, not previously validated scientific references. They deliberately
record some legacy behavior, including arbitrary overhead azimuths and the
parallel-ray shadow approximation. See `tests/README.md` for coverage and limits.

When correcting a confirmed defect, first add an independent test of the desired
behavior, document the discrepancy, and update only affected characterization
expectations. Do not preserve a known defect merely to keep this baseline green.

## 25. Initial accuracy targets

When the implementation and reference use compatible assumptions:

```text
Solar declination       within 0.1°
Equation of Time        within 1 minute
Solar altitude          within 0.2°
Solar azimuth           within 0.2°, except near zenith
Sunrise/sunset time     within 3 minutes under ordinary conditions
```

Larger discrepancies require investigation and documentation.

The limits must not be loosened merely to make failing tests pass.

Flat-model calculations are direct Euclidean equations and should normally agree with independent implementations to ordinary floating-point precision.

## 26. Required calculation interfaces

The reorganized calculation layer should expose functions conceptually equivalent to:

```text
solarCoordinates(utcInstant)
clockToApparentSolarTime(localDateTime, longitude, utcOffset, equationOfTime)
solarHourAngle(apparentSolarMinutes)
globeSolarPosition(latitude, declination, hourAngle)
globeRiseSet(latitude, declination, eventAltitude)
flatLocalSunPosition(latitude, declination, hourAngle, sunHeight)
shadowFromSolarPosition(stickHeight, altitude, azimuth)
analemmaSamples(location, year, fixedTime, timeBasis, model)
```

These functions SHOULD:

- be deterministic,
- avoid direct DOM access,
- return unrounded numeric values,
- identify units in their names or documentation,
- expose singular or unavailable results explicitly, and
- be testable without a browser.

## 27. Suggested calculation result records

A globe result should contain at least:

```text
modelId
utcInstant or stated solar-time input
latitudeDeg
longitudeDeg where applicable
declinationDeg
equationOfTimeMinutes
apparentSolarMinutes
hourAngleDeg
altitudeDeg
azimuthDeg or undefined
aboveGeometricHorizon
riseSetClassification where applicable
```

A flat-model result should additionally contain:

```text
sunHeightKm
observerRadiusKm
sunTrackRadiusKm
horizontalDistanceKm
slantDistanceKm
angularDiameterDeg where calculated
```

Exports must state the model identifier and specification version.

## 28. Known baseline limitations

The current prototype has the following deliberate or inherited limitations:

1. Solar terms are evaluated at 12:00 UTC and held constant during the selected day.
2. Precise UTC date rollover is not resolved in clock mode.
3. Earth is treated as a sphere.
4. Input latitude is used directly as spherical latitude.
5. Ordinary displayed altitude is unrefracted.
6. Observer elevation and horizon dip are not included.
7. Terrain and buildings are not included.
8. The globe-model solar angular diameter is fixed at `0.533°`.
9. The flat-model physical Sun diameter is recalibrated for each selected scenario.
10. The flat model borrows standard solar declination and Equation of Time.
11. The flat plane has no finite boundary.
12. The flat model contains no atmospheric-extinction rule.
13. Time zones and daylight-saving changes are not determined automatically.
14. Latitude is restricted to `−80°–+80°` in the current interface.
15. The app is not intended for professional navigation or surveying.

These limitations should be improved or explained, not hidden.

### 28.1 Confirmed prototype discrepancies and target behavior

These items are not fixed by this documentation revision. The behavior-preserving
extraction must keep numerical corrections separate and reviewable.

| Area | Current prototype behavior | Target contract |
| --- | --- | --- |
| Unit changes | Sun-height conversion rounds and then applies unit-dependent physical bounds; stick units relabel the same number. | Preserve canonical physical values and consistent physical bounds; round only for display. |
| Time labels | The comparison table says solar time even in clock mode. | Every chart, table and export identifies its actual time basis. |
| Prediction labels | Computed events are called observed sunrise/sunset despite no measurement input. | Use predicted or globe-model event labels; reserve observed for measurements. |
| Chart range | Values below −30° are drawn at −30°, creating a false plateau. | Plot actual values or explicitly clip off-scale values; never imply a different numerical altitude. |
| Invalid inputs | A blank date silently uses 2026-03-20; numeric fallback/clamping can disagree with visible inputs. | Explain invalid/incomplete inputs or show unavailable results; disclose any corrected input. |
| Overhead direction | Exact overhead cases return arbitrary numerical azimuths. | Expose undefined direction explicitly; retain the well-defined altitude. |
| Shadows | The same parallel-ray approximation is used for a distant and local Sun. | Disclose the approximation and limits; treat finite-source geometry as a separate tested correction (section 16.3). |

## 29. Model integrity rules

Any new or modified model MUST document:

- Geometry
- Coordinate system
- Time system
- Units
- Constants
- Sun path
- Seasonal mechanism
- Sun height or distance
- Sun size
- Light-propagation rule
- Atmospheric treatment
- Visibility rule
- Boundary conditions
- Expected measurable results

A model MUST use the same assumptions consistently throughout a calculation.

It is not acceptable to:

- change Sun height at sunset without defining a height function,
- add perspective twice,
- introduce extinction only when the geometric result fails,
- use different physical Sun diameters for simultaneous observers,
- switch time conventions without notifying the user, or
- label a borrowed empirical schedule as a prediction of the model.

## 30. Change-control requirements

A pull request that changes numerical results MUST include:

1. A description of the mathematical change.
2. The reason for the change.
3. Updated or additional tests.
4. Before-and-after examples.
5. Any required update to this specification.
6. A model-version change if assumptions materially changed.

A user-interface-only change should not modify calculation output.

Generated deployment files must not be treated as the sole editable source after the source structure has been introduced.

## 31. References

- U.S. Naval Observatory — Computing Approximate Solar Coordinates: https://aa.usno.navy.mil/faq/sun_approx
- U.S. Naval Observatory — Computing Altitude and Azimuth: https://aa.usno.navy.mil/faq/alt_az
- U.S. Naval Observatory — Rise, Set and Twilight Definitions: https://aa.usno.navy.mil/faq/RST_defs
- U.S. Naval Observatory — The Equation of Time: https://aa.usno.navy.mil/faq/eqtime
- NOAA Global Monitoring Laboratory — Solar Calculation Details: https://gml.noaa.gov/grad/solcalc/calcdetails.html
- National Renewable Energy Laboratory — Solar Position Algorithm for Solar Radiation Applications: https://www.nrel.gov/docs/fy08osti/34302.pdf

The U.S. Naval Observatory is the principal non-NASA reference for the current implementation.
