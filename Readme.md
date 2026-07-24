# Roller Derby Track Utils

Compute skater states, pack definition, pack shapes and engagement zone shapes. Used in [Track-Viz](https://github.com/webdingens/track-viz) project.

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

Uses lodash and three.js. Tested with three.js `^0.115.0` and with lodash `^4.17.15`. Will probably run on different versions as well. Three.js is used everywhere because of Vector2 for vector computations.

## Examples

2D and 3D rendering examples can be found in the `examples` folder.
