import { Vector2 } from "./vector2.js";

// Values in meters
export const C1 = new Vector2(5.33, 0);
export const C2 = new Vector2(-5.33, 0);
export const C1_OUTER = new Vector2(5.33, -0.305);
export const C2_OUTER = new Vector2(-5.33, 0.305);
export const RADIUS_INNER = 3.81;
export const RADIUS_OUTER = 8.08;
export const MEASUREMENT_RADIUS = 3.81 + 1.6;
export const CIRCUMFERENCE_HALF_CIRCLE = Math.PI * MEASUREMENT_RADIUS;
export const ENGAGEMENT_ZONE_DISTANCE_TO_PACK = 6.1;
export const SKATER_RADIUS = 0.3;

export const F_OUTER_TOP = (x: number): number => {
	const m = -0.61 / 10.66;
	const c = -8.385 - m * 5.33;
	return x * m + c;
};
export const F_OUTER_BOTTOM = (x: number): number => {
	const m = -0.61 / 10.66;
	const c = 8.385 + m * 5.33;
	return x * m + c;
};

// Measurement Lines
export const LINE1 = {
	p1: new Vector2(5.33, -MEASUREMENT_RADIUS),
	p2: new Vector2(-5.33, -MEASUREMENT_RADIUS)
};

export const LINE2 = {
	p1: new Vector2(-5.33, MEASUREMENT_RADIUS),
	p2: new Vector2(5.33, MEASUREMENT_RADIUS)
};

export const LINE_DIST = LINE1.p1.distanceTo(LINE1.p2);

export const MEASUREMENT_LENGTH = 2 * CIRCUMFERENCE_HALF_CIRCLE + 2 * LINE_DIST;

export const PACK_MEASURING_METHODS = {
	SECTOR: "sector",
	RECTANGLE: "rectangle"
} as const;

export type PackMethod = (typeof PACK_MEASURING_METHODS)[keyof typeof PACK_MEASURING_METHODS];
