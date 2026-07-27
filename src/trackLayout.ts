// Static track-layout SVG path generators. Each returns SVG path-data in the
// package's metre coordinate system (origin at track centre, x right, y down).
// Ported from track-viz's TrackMarkings, but derived from this package's own
// geometry constants so the layout always matches the rules engine.

import {
	C1,
	C2,
	F_OUTER_BOTTOM,
	F_OUTER_TOP,
	MEASUREMENT_RADIUS,
	RADIUS_INNER,
	RADIUS_OUTER
} from "./constants.js";

// Layout constants (metres): 10 ft tick spacing and tick mark width.
const TEN_FEET = 3.05;
const TICK_WIDTH = 0.6;

// Outer straight endpoints (the outer boundary is slanted: wide at one end of
// each straight, narrow at the other).
const RIGHT_TOP = F_OUTER_TOP(C1.x); // -8.385
const LEFT_TOP = F_OUTER_TOP(C2.x); // -7.775
const LEFT_BOTTOM = F_OUTER_BOTTOM(C2.x); // 8.385
const RIGHT_BOTTOM = F_OUTER_BOTTOM(C1.x); // 7.775

/** Inner boundary oval (closed). */
export const getInnerBoundaryPath = (): string =>
	`M${C1.x},${-RADIUS_INNER} ` +
	`L${C2.x},${-RADIUS_INNER} ` +
	`A ${RADIUS_INNER} ${RADIUS_INNER} 180 1 0 ${C2.x},${RADIUS_INNER} ` +
	`L${C1.x},${RADIUS_INNER} ` +
	`A ${RADIUS_INNER} ${RADIUS_INNER} 180 1 0 ${C1.x},${-RADIUS_INNER} Z`;

/** Outer boundary oval (closed, slanted straights). */
export const getOuterBoundaryPath = (): string =>
	`M${C1.x},${RIGHT_TOP} ` +
	`L${C2.x},${LEFT_TOP} ` +
	`A ${RADIUS_OUTER} ${RADIUS_OUTER} 180 0 0 ${C2.x},${LEFT_BOTTOM} ` +
	`L${C1.x},${RIGHT_BOTTOM} ` +
	`A ${RADIUS_OUTER} ${RADIUS_OUTER} 180 0 0 ${C1.x},${RIGHT_TOP} Z`;

/**
 * Track surface (annulus): outer + inner boundary subpaths. Fill with
 * fill-rule "evenodd" to get the ring (the inner subpath becomes the hole).
 */
export const getTrackSurfacePath = (): string => `${getOuterBoundaryPath()} ${getInnerBoundaryPath()}`;

/** Pivot line, at the right turn / top-straight junction. */
export const getPivotLinePath = (): string => `M${C1.x},${RADIUS_INNER} L${C1.x},${RIGHT_BOTTOM}`;

/** Jammer line, 30 ft behind the pivot line. */
export const getJammerLinePath = (): string => {
	const x = C1.x - 3 * TEN_FEET;
	return `M${x},${RADIUS_INNER} L${x},${F_OUTER_BOTTOM(x)}`;
};

const rotate = (
	px: number,
	py: number,
	cx: number,
	cy: number,
	angle: number
): [number, number] => {
	const dx = px - cx;
	const dy = py - cy;
	return [
		cx + dx * Math.cos(angle) - dy * Math.sin(angle),
		cy + dx * Math.sin(angle) + dy * Math.cos(angle)
	];
};

/** All 10 ft tick marks (both straights and both turns). */
export const getTenFeetTicksPath = (): string => {
	const w = TICK_WIDTH / 2;
	const parts: string[] = [];

	// Bottom straight, near the pivot (2 ticks).
	for (let i = 1; i <= 2; i++) {
		const x = C1.x - i * TEN_FEET;
		parts.push(`M${x},${MEASUREMENT_RADIUS - w} L${x},${MEASUREMENT_RADIUS + w}`);
	}

	// Top straight (4 ticks).
	for (let i = 0; i <= 3; i++) {
		const x = C2.x + i * TEN_FEET;
		parts.push(`M${x},${-MEASUREMENT_RADIUS - w} L${x},${-MEASUREMENT_RADIUS + w}`);
	}

	// Right turn (5 ticks, rotated around C1).
	for (let i = 1; i <= 5; i++) {
		const angle = (i * -TEN_FEET) / MEASUREMENT_RADIUS;
		const [p1x, p1y] = rotate(C1.x, MEASUREMENT_RADIUS - w, C1.x, 0, angle);
		const [p2x, p2y] = rotate(C1.x, MEASUREMENT_RADIUS + w, C1.x, 0, angle);
		parts.push(`M${p1x},${p1y} L${p2x},${p2y}`);
	}

	// Left turn (5 ticks, rotated around C2).
	for (let i = 1; i <= 5; i++) {
		const angle = (i * -TEN_FEET) / MEASUREMENT_RADIUS;
		const [p1x, p1y] = rotate(C2.x, -MEASUREMENT_RADIUS - w, C2.x, 0, angle);
		const [p2x, p2y] = rotate(C2.x, -MEASUREMENT_RADIUS + w, C2.x, 0, angle);
		parts.push(`M${p1x},${p1y} L${p2x},${p2y}`);
	}

	return parts.join(" ");
};

/** Outside officiating boundary (the outer lane), 10 ft beyond the outer track. */
export const getOfficialLanePath = (): string => {
	const off = TEN_FEET;
	const r = RADIUS_OUTER + off;
	return (
		`M${C1.x},${RIGHT_BOTTOM + off} ` +
		`A ${r} ${r} 180 1 0 ${C1.x},${RIGHT_TOP - off} ` +
		`M${C2.x},${LEFT_TOP - off} ` +
		`A ${r} ${r} 180 1 0 ${C2.x},${LEFT_BOTTOM + off} ` +
		`M${C2.x},${LEFT_TOP - off} L${C1.x},${RIGHT_TOP - off} ` +
		`M${C1.x},${RIGHT_BOTTOM + off} L${C2.x},${LEFT_BOTTOM + off}`
	);
};
