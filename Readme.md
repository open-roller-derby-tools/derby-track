# Derby Track

A renderer-agnostic library for roller-derby track geometry, pack definition and engagement-zone computation — pure functions operating in metres, emitting plain data and SVG path strings.

This is a **fork of [`roller-derby-track-utils`](https://github.com/webdingens/track-viz)** by [webdingens](https://github.com/webdingens), the package used by [Track-Viz](https://github.com/webdingens/track-viz). Full credit for the track model and rules engine goes to the original author; this fork hardens and modernises it while staying API-compatible.

## Improvements over upstream

- **Fixed engagement-zone drift** — `isSkaterInEngagementZone` (SECTOR) mutated the shared `packBoundaries` array, growing the zone ~20 ft per skater until everyone read as in play. Now computed without mutation.
- **Corrected type definitions** — `isSkaterInEngagementZone` is typed positionally (matching the runtime), `computePartialTrackShape2D` `p1`/`p2` are typed per method, and `SkaterDataType` accepts `string | number` ids and arbitrary team labels.
- **Configurable in-bounds radius** — `getSkatersWDPInBounds(skaters, { radius })`.
- **Dropped `lodash`** — `cloneDeep` replaced with `structuredClone`.
- **Dropped the hard `three` dependency for 2D** — the 2D modules use a vendored `Vector2`; `three` is now an optional peer (only `packDrawing3D` needs it).
- **Tests** — a Vitest suite (ported from the downstream Derbyboard integration), including a regression for the drift bug.
- **Documentation** — the coordinate system and `pivotLineDist` convention are documented below.

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

## Peer Dependencies

three.js is an optional peer dependency, used only for the 3D shapes (`packDrawing3D`). The 2D modules use a vendored `Vector2` and have no three.js dependency. Tested with three.js `^0.115.0`; will probably run on different versions as well.

## Examples

2D and 3D rendering examples can be found in the `examples` folder.

## License

Unlicense — same as the upstream package.
