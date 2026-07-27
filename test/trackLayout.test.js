import { describe, it, expect } from 'vitest';
import {
	getInnerBoundaryPath,
	getOuterBoundaryPath,
	getTrackSurfacePath,
	getPivotLinePath,
	getJammerLinePath,
	getTenFeetTicksPath,
	getOfficialLanePath
} from '../src/trackLayout.js';

describe('track layout paths', () => {
	const inner = getInnerBoundaryPath();
	const outer = getOuterBoundaryPath();
	const surface = getTrackSurfacePath();
	const pivot = getPivotLinePath();
	const jammer = getJammerLinePath();
	const ticks = getTenFeetTicksPath();
	const official = getOfficialLanePath();

	it('all paths are non-empty, move-started strings', () => {
		for (const p of [inner, outer, surface, pivot, jammer, ticks, official]) {
			expect(typeof p).toBe('string');
			expect(p.startsWith('M')).toBe(true);
			expect(p.length).toBeGreaterThan(10);
		}
	});

	it('inner boundary is a closed oval using the inner radius', () => {
		expect(inner).toContain('A 3.81 3.81');
		expect(inner.trimEnd().endsWith('Z')).toBe(true);
	});

	it('outer boundary is a closed oval using the outer radius', () => {
		expect(outer).toContain('A 8.08 8.08');
		expect(outer.trimEnd().endsWith('Z')).toBe(true);
	});

	it('surface composes outer + inner subpaths', () => {
		expect(surface).toBe(`${outer} ${inner}`);
	});

	it('pivot line starts at the right turn centre x (5.33)', () => {
		expect(pivot.startsWith('M5.33,')).toBe(true);
	});

	it('10-ft ticks cover both straights and both turns (16 marks)', () => {
		expect(ticks.match(/M/g)).toHaveLength(16);
	});

	it('jammer line runs from the inner boundary outward', () => {
		expect(jammer.startsWith('M')).toBe(true);
		expect(jammer).toContain('3.81'); // inner-radius y
	});

	it('official lane has arcs and closure lines', () => {
		expect(official.match(/A/g)?.length).toBeGreaterThanOrEqual(2);
		expect(official.match(/M/g)?.length).toBeGreaterThanOrEqual(4);
	});
});
