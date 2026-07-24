import { describe, it, expect } from 'vitest';
import {
	C1,
	C2,
	MEASUREMENT_RADIUS,
	CIRCUMFERENCE_HALF_CIRCLE,
	PACK_MEASURING_METHODS
} from '../src/constants.js';
import {
	getPivotLineDistance,
	getSkatersWDPInBounds,
	getSkatersWDPPivotLineDistance,
	getSkatersWDPInPlayPackSkater,
	getSortedPackBoundaries
} from '../src/packFunctions.js';
import { computePartialTrackShape2D } from '../src/packDrawing2D.js';

describe('geometry constants', () => {
	it('C1 is the right turn centre (5.33, 0)', () => {
		expect(C1.x).toBe(5.33);
		expect(C1.y).toBe(0);
	});

	it('C2 is the left turn centre (-5.33, 0)', () => {
		expect(C2.x).toBe(-5.33);
		expect(C2.y).toBe(0);
	});

	it('measurement radius is 3.81 + 1.6', () => {
		expect(MEASUREMENT_RADIUS).toBeCloseTo(5.41, 9);
	});
});

describe('getPivotLineDistance', () => {
	it('places the pivot line at the half-circumference mark', () => {
		// dist 0 is the start of the right turn; the pivot line is at the junction
		// with the top straight = CIRCUMFERENCE_HALF_CIRCLE.
		expect(getPivotLineDistance({ x: 5.33, y: 0 })).toBeCloseTo(CIRCUMFERENCE_HALF_CIRCLE, 6);
	});
});

describe('pack pipeline (SECTOR)', () => {
	// Two blockers (mixed teams) on the top straight, plus a jammer.
	const skaters = [
		{ id: 1, x: 0, y: -5.41, team: 'A' },
		{ id: 2, x: 2, y: -5.41, team: 'B' },
		{ id: 3, x: 0, y: -6.2, team: 'A', isJammer: true }
	];
	const enriched = getSkatersWDPInPlayPackSkater(
		getSkatersWDPPivotLineDistance(getSkatersWDPInBounds(skaters)),
		{ method: PACK_MEASURING_METHODS.SECTOR }
	);

	it('finds the two blockers as the pack', () => {
		const pack = enriched.filter((s) => s.packSkater);
		expect(pack).toHaveLength(2);
		expect(pack.every((s) => s.id === 1 || s.id === 2)).toBe(true);
	});

	it('excludes the jammer from the pack', () => {
		expect(enriched.find((s) => s.isJammer).packSkater).toBeFalsy();
	});

	it('marks pack skaters in bounds', () => {
		expect(enriched.filter((s) => s.packSkater).every((s) => s.inBounds)).toBe(true);
	});
});

describe('getSkatersWDPInBounds (configurable radius)', () => {
	it('applies the provided radius', () => {
		// 0.5 m inside the inner edge: in bounds at the default 0.3 m margin,
		// out of bounds at a 1.0 m margin.
		const skaters = [{ id: 1, x: 0, y: -(3.81 + 0.5), team: 'A' }];
		expect(getSkatersWDPInBounds(skaters)[0].inBounds).toBe(true);
		expect(getSkatersWDPInBounds(skaters, { radius: 1.0 })[0].inBounds).toBe(false);
	});
});

describe('computePartialTrackShape2D (SECTOR)', () => {
	it('returns a closed SVG path for a pack', () => {
		const skaters = [
			{ id: 1, x: 0, y: -5.41, team: 'A' },
			{ id: 2, x: 2, y: -5.41, team: 'B' }
		];
		const enriched = getSkatersWDPInPlayPackSkater(
			getSkatersWDPPivotLineDistance(getSkatersWDPInBounds(skaters))
		);
		const pack = enriched.filter((s) => s.packSkater);
		const [rear, fore] = getSortedPackBoundaries(pack);
		const path = computePartialTrackShape2D({
			p1: rear,
			p2: fore,
			method: PACK_MEASURING_METHODS.SECTOR
		});
		expect(path.startsWith('M')).toBe(true);
		expect(path.trimEnd().endsWith('Z')).toBe(true);
	});
});

describe('engagement-zone membership (SECTOR)', () => {
	it('does not mark a distant blocker as in play', () => {
		// A 5-skater mixed pack on the top straight, plus one lone blocker far
		// away on the bottom straight. The lone blocker is well outside the EZ.
		// Regression: isSkaterInEngagementZone previously mutated the shared
		// packBoundaries array, growing the zone ~20 ft per skater until everyone
		// read as in play.
		const skaters = [
			{ id: 1, x: 0, y: -5.41, team: 'A' },
			{ id: 2, x: 1, y: -5.41, team: 'B' },
			{ id: 3, x: 2, y: -5.41, team: 'A' },
			{ id: 4, x: 3, y: -5.41, team: 'B' },
			{ id: 5, x: 4, y: -5.41, team: 'A' },
			{ id: 6, x: 0, y: 5.41, team: 'B' }
		];
		const enriched = getSkatersWDPInPlayPackSkater(
			getSkatersWDPPivotLineDistance(getSkatersWDPInBounds(skaters)),
			{ method: PACK_MEASURING_METHODS.SECTOR }
		);
		expect(enriched.find((s) => s.id === 6).inPlay).toBe(false);
	});
});
