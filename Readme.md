# Derby Track

A renderer-agnostic library for roller-derby track geometry, pack definition, engagement-zone computation, and static track-layout rendering — pure functions operating in metres, emitting plain data and SVG path strings.

This is a **fork of [`roller-derby-track-utils`](https://github.com/webdingens/track-viz)** by [webdingens](https://github.com/webdingens), the package used by [Track-Viz](https://github.com/webdingens/track-viz). Full credit for the track model and rules engine goes to the original author; this fork hardens and modernises it while staying API-compatible.

## Improvements over upstream

- **Fixed engagement-zone drift** — `isSkaterInEngagementZone` (SECTOR) mutated the shared `packBoundaries` array, growing the zone ~20 ft per skater until everyone read as in play. Now computed without mutation.
- **Corrected type definitions** — `isSkaterInEngagementZone` is typed positionally (matching the runtime), `computePartialTrackShape2D` `p1`/`p2` are typed per method, and `SkaterDataType` accepts `string | number` ids and arbitrary team labels.
- **Configurable in-bounds radius** — `getSkatersWDPInBounds(skaters, { radius })`.
- **Dropped `lodash`** — `cloneDeep` replaced with `structuredClone`.
- **Dropped the hard `three` dependency for 2D** — the 2D modules use a vendored `Vector2`; `three` is now an optional peer (only `packDrawing3D` needs it).
- **Tests** — a Vitest suite (ported from the downstream Derbyboard integration), including a regression for the drift bug.
- **Documentation** — the coordinate system and `pivotLineDist` convention are documented below.
- **Track-layout SVG exporters (new)** — `getTrackSurfacePath` / `getInnerBoundaryPath` / `getOuterBoundaryPath` / `getPivotLinePath` / `getJammerLinePath` / `getTenFeetTicksPath` / `getOfficialLanePath` render the static track as path-data in metres (see [Track layout](#track-layout-svg-paths)).

See the commit history for the individual, upstreamable changes.

## Coordinate system

- **Origin**: the track is centred at `(0, 0)`.
- **Axes**: screen/SVG convention — `x` increases left → right, `y` increases top → bottom.
- **Units**: metres (the WFTDA track-layout spec).

### Track geometry (metres)

- Turn centres: `C1 = (5.33, 0)` (right), `C2 = (-5.33, 0)` (left).
- Radii: inner `3.81`, outer `8.08`; the **measurement line** sits `1.6` off the inside line → radius `5.41`.
- The outer straight is slanted: the wide end is `8.385`, the narrow end `7.775` (see `F_OUTER_TOP` / `F_OUTER_BOTTOM`).

### `pivotLineDist`

Distance along the measurement line, used as a skater's position "around" the track:

- `0` is the **start of the right turn** (the first half-circle, `x > 5.33`).
- The **pivot line** is at the junction of the right turn and the top straight = `CIRCUMFERENCE_HALF_CIRCLE` (≈ `16.996`).
- Increases in the direction of travel: right turn → top straight (`y < 0`) → left turn → bottom straight (`y > 0`), wrapping at `MEASUREMENT_LENGTH`.

### Skater data

A skater is a plain object: `{ x, y, id, team, isJammer?, isPivot?, rotation? }`. `id` is any `string | number`; `team` is any label (commonly `"A"` / `"B"`).

## Track layout (SVG paths)

The layout generators return **SVG path-data strings in metres** for the static track markings, so any renderer (SVG, Konva `Path`, Canvas) can draw a regulation track without re-deriving the geometry. As elsewhere, transform metres → your coordinate space at draw time (e.g. scale by pixels-per-metre, translate to the track centre).

| Function | Returns |
|---|---|
| `getTrackSurfacePath()` | outer + inner boundary subpaths — fill with `fill-rule: evenodd` for the ring |
| `getInnerBoundaryPath()` | inner boundary oval (closed) |
| `getOuterBoundaryPath()` | outer boundary oval (closed, slanted straights) |
| `getPivotLinePath()` | pivot line (at the right turn / top-straight junction) |
| `getJammerLinePath()` | jammer line, 30 ft behind the pivot line |
| `getTenFeetTicksPath()` | all 10 ft tick marks (both straights and both turns) |
| `getOfficialLanePath()` | outside officiating boundary, 10 ft beyond the outer track |

```js
import {
	getTrackSurfacePath,
	getInnerBoundaryPath,
	getTenFeetTicksPath
} from "@open-roller-derby-tools/derby-track";

// SVG — coordinates are already in metres:
//   <path d={getTrackSurfacePath()} fill="#d3d3d3" fill-rule="evenodd" />
//   <path d={getInnerBoundaryPath()} stroke="blue" fill="none" />
//   <path d={getTenFeetTicksPath()} stroke="black" />

// Konva — scale metres to pixels and centre on the viewport:
//   const PX = 35;
//   new Konva.Path({
//     data: getInnerBoundaryPath(),
//     scaleX: PX, scaleY: PX, x: centerX, y: centerY, stroke: "blue"
//   });
```

## Peer Dependencies

three.js is an optional peer dependency, used only for the 3D shapes (`packDrawing3D`). The 2D modules use a vendored `Vector2` and have no three.js dependency. Tested with three.js `^0.115.0`; will probably run on different versions as well.

## Examples

2D and 3D rendering examples can be found in the `examples` folder.

## License

AGPL-3.0-or-later.
