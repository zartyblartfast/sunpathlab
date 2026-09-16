# Solar Path Lab

Solar Path Lab is an interactive educational web app for exploring where the Sun should appear in the sky under two different geometric models:

- Standard solar geometry using a spherical Earth and a distant Sun.
- An explicitly defined hypothetical flat-plane model with a nearby Sun at a selectable height.

Rather than relying on photographs or visual impressions, the app turns both models into numerical predictions that can be compared with direct observations such as solar altitude, azimuth and the length of a shadow cast by a vertical stick.

## Live app

https://solar-path-lab.zarty-blartfast.chatgpt.site

## Repository

https://github.com/zartyblartfast/sunpathlab

## Project status

This is an early working prototype.

The current version focuses on comparing daily Sun paths. Planned development includes solar analemmas, the Equation of Time, Earth’s axial tilt and orbital eccentricity, and clearer visual links between orbital geometry and what an observer sees from Earth’s surface.

## Current features

- Selectable latitude from 80° south to 80° north
- Selectable date and time
- Local solar-time mode
- Clock-time mode using longitude and UTC offset
- Automatic Equation of Time adjustment
- Calculated solar declination
- Globe-model solar altitude and azimuth
- Flat-model solar altitude and azimuth
- Interactive 24-hour Sun-path comparison
- Sunrise and sunset calculations
- Polar-day and polar-night handling
- Adjustable hypothetical local-Sun height
- Perspective and line-of-sight diagram
- Horizontal and slant-distance calculations
- Apparent solar-size comparison
- Vertical-stick shadow predictions
- Numerical comparison table
- Plain-language explanations of the results
- Responsive and accessible interface

## Purpose

The app is designed to make the geometry understandable to non-specialists.

Many Sun-path discussions combine several different effects:

- Earth’s daily rotation
- Earth’s axial tilt
- Earth’s orbit around the Sun
- Seasonal solar declination
- Orbital eccentricity
- The Equation of Time
- Latitude
- Perspective
- Atmospheric refraction

Solar Path Lab separates these effects and shows how each one changes a measurable prediction.

The guiding principle is:

> State the model, calculate its prediction, and compare that prediction with observation.

## The two models

### Standard globe model

The globe calculation assumes:

- A spherical Earth
- A distant Sun
- Effectively parallel sunlight over Earth-sized distances
- An axial tilt of approximately 23.44°
- Solar declination determined by the selected date
- Solar hour angle determined by local solar time

Solar altitude is calculated from:

```text
sin(a) = sin(φ) sin(δ) + cos(φ) cos(δ) cos(H)
```

Where:

- `a` is solar altitude
- `φ` is observer latitude
- `δ` is solar declination
- `H` is solar hour angle

Azimuth is calculated from the same latitude, declination and hour-angle geometry.

Sunrise and sunset use a conventional solar-centre altitude of approximately −0.833°. This accounts approximately for the Sun’s angular radius and normal atmospheric refraction near the horizon.

### Hypothetical flat-plane model

There is no single agreed mathematical flat-Earth Sun model. The app therefore uses one clearly stated model whose predictions can be calculated and tested.

The current flat model assumes:

- A north-pole-centred azimuthal-equidistant plane
- An elevated local Sun
- A user-selectable but constant Sun height
- A Sun that circles the north pole once per solar day
- A solar ground track based on the real Sun’s seasonal declination

The observer’s radial distance from the north pole is:

```text
observer radius = R × (90° − latitude)
```

The Sun-track radius is:

```text
Sun-track radius = R × (90° − declination)
```

Angles are converted to radians in these distance calculations. `R = 6,371 km` is used only to establish the map scale.

The horizontal distance between the observer and the point beneath the Sun is calculated using the law of cosines:

```text
d = √(rₒ² + rₛ² − 2rₒrₛ cos(θ))
```

The predicted viewing altitude is then:

```text
altitude = arctan(Sun height ÷ horizontal distance)
```

This calculation already includes the ordinary geometric effect described as perspective.

As distance increases, an elevated object appears progressively lower. Its viewing angle approaches 0°, but it does not become negative or pass below an unobstructed flat plane.

## Shadow measurement

Solar altitude can be tested using a vertical stick on level ground.

```text
solar altitude = arctan(stick height ÷ shadow length)
```

Alternatively, the predicted shadow length is:

```text
shadow length = stick height ÷ tan(solar altitude)
```

This provides a direct comparison between calculation and observation without requiring specialist photographic equipment.

Measurements close to the horizon require extra care because terrain, buildings, observer height and atmospheric refraction can affect visibility.

## Clock time and the Equation of Time

Clock time and apparent solar time are not normally identical.

The app allows clock time to be converted into local solar time using:

- Observer longitude
- UTC offset
- The Equation of Time for the selected date

The Equation of Time occurs mainly because:

- Earth’s rotational axis is tilted relative to its orbital plane.
- Earth moves at a changing orbital speed because its orbit is slightly elliptical.

These effects cause apparent solar noon to move ahead of or behind mean clock noon during the year.

The Equation of Time changes when the Sun crosses the local meridian. It does not change the underlying line-of-sight geometry of an elevated local Sun.

## Running the app locally

The current application is dependency-free and does not require a build process.

Clone the repository:

```bash
git clone https://github.com/zartyblartfast/sunpathlab.git
cd sunpathlab
```

On Windows, start a local web server with:

```bash
py -m http.server 8000 --directory dist
```

On systems where Python is invoked as `python`:

```bash
python -m http.server 8000 --directory dist
```

Then open:

http://localhost:8000

Because the app uses only HTML, CSS and JavaScript, it can also be hosted by any ordinary static-file web server.

## Repository structure

```text
sunpathlab/
├── .openai/
│   └── hosting.json
└── dist/
    ├── index.html
    ├── styles.css
    └── app.js
```

- `dist/index.html` contains the interface and explanatory content.
- `dist/styles.css` contains the visual design and responsive layout.
- `dist/app.js` contains the calculations, state management and diagram rendering.
- `.openai/hosting.json` contains the existing deployment configuration.

The project was initially exported as a compact static application. A future development task may introduce a separate `src` directory, automated tests and a repeatable build process while retaining static deployment.

## Accuracy and limitations

Solar Path Lab is an educational comparison tool, not a surveying or navigation instrument.

The current solar-coordinate calculation uses a compact USNO-style approximation suitable for dates within approximately two centuries of the year 2000.

The current version does not fully model:

- Local terrain or buildings
- Observer elevation
- Continuously changing atmospheric refraction
- Weather and atmospheric extinction
- Detailed solar-limb effects
- Automatic civil time zones or daylight-saving rules
- High-precision ephemeris corrections
- Locations above 80° north or below 80° south

The conventional −0.833° sunrise and sunset altitude provides a useful general approximation, but observed horizon crossings can vary with local conditions.

## Planned development

Likely development stages include:

### 1. Calculation validation

- Separate calculation logic from interface rendering
- Add automated tests
- Compare selected results with authoritative solar ephemeris data
- Add documented test locations, dates and expected results
- Define consistent units, angle conventions and rounding rules

### 2. Location and observation tools

- Latitude and longitude presets
- Optional map-based location selection
- Automatic time-zone handling
- Observer elevation
- Downloadable or shareable observations
- Shadow-measurement recording

### 3. Solar analemma module

- Plot the Sun at the same mean clock time throughout a year
- Show how solar declination produces the north-south component
- Show how the Equation of Time produces the east-west component
- Allow latitude and observation time to be changed
- Animate the Sun’s position through the year
- Compare analemmas at different latitudes
- Explain why the analemma is usually a figure eight
- Show how its orientation changes with viewing direction and hemisphere

### 4. Earth-orbit visualisation

- Rotating Earth with visible axial tilt
- Earth moving around a slightly elliptical orbit
- Distant Sun and parallel incident rays
- Solstices and equinoxes
- Perihelion and aphelion
- True Sun versus mean Sun
- Explicit warnings that the combined diagram cannot use one common physical scale
- Linked orbital, globe and observer-sky views

### 5. Additional model experiments

- Alternative stated local-Sun heights
- Alternative flat-plane Sun tracks
- Optional atmospheric-extinction assumptions
- Predicted angular-size changes
- Predicted illumination and inverse-square intensity changes
- Side-by-side comparison with recorded measurements

Any alternative model should be added as a separate, documented set of assumptions rather than silently changing the existing model.

## Development principles

Contributions and AI-assisted changes should preserve the following principles:

- Keep every model assumption visible.
- Distinguish calculated predictions from direct observations.
- Do not present diagrams as physically to scale when they are not.
- Keep the main interface understandable without requiring mathematical knowledge.
- Keep detailed calculations available for users who want to inspect them.
- Cite authoritative sources for scientific constants and algorithms.
- Add tests when changing calculation logic.
- Avoid hiding discrepancies with unexplained correction factors.
- Ensure that any new hypothetical model is internally consistent and reproducible.

## Calculation references

- U.S. Naval Observatory — approximate solar coordinates: https://aa.usno.navy.mil/faq/sun_approx
- U.S. Naval Observatory — solar altitude and azimuth: https://aa.usno.navy.mil/faq/alt_az
- U.S. Naval Observatory — rise, set and twilight definitions: https://aa.usno.navy.mil/faq/RST_defs
- U.S. Naval Observatory — Equation of Time: https://aa.usno.navy.mil/faq/eqtime

The U.S. Naval Observatory is independent of NASA and provides the principal non-NASA calculation reference currently used by the project.

## Licence

No software licence has yet been selected.

Before encouraging outside reuse or contributions, an explicit licence such as the MIT Licence should be considered and added to the repository.
