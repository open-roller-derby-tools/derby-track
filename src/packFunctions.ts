import { Vector2 } from "./vector2.js";

import { isSkaterInEngagementZone } from "./engagementZone.js";
import {
	C1,
	C1_OUTER,
	C2,
	C2_OUTER,
	CIRCUMFERENCE_HALF_CIRCLE,
	ENGAGEMENT_ZONE_DISTANCE_TO_PACK,
	F_OUTER_BOTTOM,
	F_OUTER_TOP,
	LINE_DIST,
	MEASUREMENT_LENGTH,
	MEASUREMENT_RADIUS,
	PACK_MEASURING_METHODS,
	type PackMethod,
	RADIUS_INNER,
	RADIUS_OUTER,
	SKATER_RADIUS
} from "./constants.js";
import type {
	Position,
	SkaterWDPInBounds,
	SkaterWDPPivotLineDistance,
	SkatersWDPPackSkater,
	SkatersWDPInPlay
} from "./types.js";

// A skater carrying the fields the pack/distance/engagement functions read.
// Inputs in practice (e.g. from Derbyboard) provide all of these.
type PackSkater = Position & {
	pivotLineDist: number;
	id: string | number;
	team?: string;
	isJammer?: boolean;
	isPivot?: boolean;
	inBounds?: boolean;
};

/**
 * Get Skaters with Derived Property inBounds
 */
export const getSkatersWDPInBounds = <Skater extends Position>(
	skaters: Skater[],
	{ radius = SKATER_RADIUS } = {}
): (Skater & SkaterWDPInBounds)[] => {
	return skaters.map((skater) => {
		const pos = new Vector2(skater.x, skater.y); // blocker position
		const ret = structuredClone(skater) as Skater & SkaterWDPInBounds;

		// first half circle
		if (pos.x > C1.x) {
			if (
				C1.distanceTo(pos) < RADIUS_INNER + radius ||
				C1_OUTER.distanceTo(pos) > RADIUS_OUTER - radius
			) {
				ret.inBounds = false;
				return ret;
			}
		}

		// straightaway -y
		if (pos.x <= C1.x && pos.x >= C2.x && pos.y <= 0) {
			if (pos.y > -RADIUS_INNER - radius || F_OUTER_TOP(pos.x) + radius > pos.y) {
				ret.inBounds = false;
				return ret;
			}
		}

		// second half circle
		if (pos.x < C2.x) {
			if (
				C2.distanceTo(pos) < RADIUS_INNER + radius ||
				C2_OUTER.distanceTo(pos) > RADIUS_OUTER - radius
			) {
				ret.inBounds = false;
				return ret;
			}
		}

		// straightaway y
		if (pos.x <= C1.x && pos.x >= C2.x && pos.y > 0) {
			if (pos.y < RADIUS_INNER + radius || F_OUTER_BOTTOM(pos.x) - radius < pos.y) {
				ret.inBounds = false;
				return ret;
			}
		}

		ret.inBounds = true;
		return ret;
	});
};

export const getPivotLineDistance = (position: Position): number => {
	let dist = 0;
	// first half circle
	if (position.x > C1.x) {
		const p = new Vector2(position.x, position.y).sub(C1);
		let angle = p.angle();
		angle = -angle + Math.PI / 2;
		angle = (angle + 2 * Math.PI) % (2 * Math.PI);

		dist += angle * MEASUREMENT_RADIUS;
		return dist;
	} else {
		dist += CIRCUMFERENCE_HALF_CIRCLE;
	}

	// straightaway -y
	if (position.x <= C1.x && position.x >= C2.x && position.y <= 0) {
		dist += C1.x - position.x;
		return dist;
	} else {
		dist += LINE_DIST;
	}

	// second half circle
	if (position.x < C2.x) {
		const p = new Vector2(position.x, position.y).sub(C2);
		let angle = p.angle();
		angle = -angle - Math.PI / 2;
		angle = (angle + 2 * Math.PI) % (2 * Math.PI);

		dist += angle * MEASUREMENT_RADIUS;
		return dist;
	} else {
		dist += CIRCUMFERENCE_HALF_CIRCLE;
	}

	// straightaway y
	if (position.x <= C1.x && position.x >= C2.x && position.y > 0) {
		dist += position.x - C2.x;
	}
	return dist;
};

/**
 * Get Skaters with Derived Property pivotLineDistance
 */
export const getSkatersWDPPivotLineDistance = <Skater extends Position>(
	skaters: Skater[]
): (Skater & SkaterWDPPivotLineDistance)[] => {
	return structuredClone(skaters).map((skater) => {
		const pos = new Vector2(skater.x, skater.y);
		const s = skater as Skater & SkaterWDPPivotLineDistance;
		s.pivotLineDist = getPivotLineDistance(pos);
		return s;
	});
};

/*
 *   Get close skaters
 *   return tuple of id
 */
export const getCloseSkaters = (
	skaters: PackSkater[],
	{ method = PACK_MEASURING_METHODS.SECTOR }: { method?: PackMethod } = {}
): [number, number][] => {
	const closeSkaters: [number, number][] = [];
	for (let i = 0; i < skaters.length - 1; i++) {
		for (let j = i + 1; j < skaters.length; j++) {
			const dist = getDistanceOfTwoSkaters(skaters[j], skaters[i], { method });

			// Inf values in case of rectangle method are filtered out here
			if (dist < 3.05) {
				closeSkaters.push([i, j]);
			}
		}
	}
	return closeSkaters;
};

/*
 * Computes the groups of skaters with a maximum distance of 3.05m
 */
const groupBlockers = (
	blockers: PackSkater[],
	{ method = PACK_MEASURING_METHODS.SECTOR }: { method?: PackMethod } = {}
): PackSkater[][] => {
	const ret: PackSkater[][] = [];
	const skaters = blockers;
	const closeSkaters = getCloseSkaters(skaters, { method });

	let toGroup = closeSkaters;

	while (toGroup.length > 0) {
		const tuple = toGroup[0];
		const newGroup = [tuple[0]];
		let checkedIdx = -1;

		while (checkedIdx < newGroup.length - 1) {
			const checking = newGroup[checkedIdx + 1];

			for (let i = 0; i < toGroup.length; i++) {
				const t = toGroup[i];
				if (t[0] === checking || t[1] === checking) {
					const idxNew = t[0] === checking ? t[1] : t[0];
					if (newGroup.indexOf(idxNew) !== -1) continue;
					newGroup.push(idxNew);
				}
			}
			checkedIdx++;
		}
		toGroup = toGroup.filter((el) => {
			return newGroup.indexOf(el[0]) === -1 && newGroup.indexOf(el[1]) === -1;
		});
		ret.push(newGroup.map((skaterIdx) => skaters[skaterIdx]));
	}

	return ret;
};

/*
 * Given grouped skaters find a singular largest group, return null if multiple or none found
 */
const getLargestGroup = (groups: PackSkater[][] = []): PackSkater[] | null => {
	let ret: PackSkater[] | null = null;
	let size = 1;

	groups.forEach((group) => {
		const length = group.length;
		if (length > size) {
			ret = group;
			size = length;
		}
	});

	const largestGroups = groups.filter((group) => group.length === size);
	const notAUniqueLargestGroup = largestGroups.length !== 1;

	return notAUniqueLargestGroup ? null : ret;
};

/*
 *   Compute the distance between two skaters
 */
export const getDistanceOfTwoSkaters = (
	skaterA: PackSkater,
	skaterB: PackSkater,
	{ method = PACK_MEASURING_METHODS.SECTOR }: { method?: PackMethod } = {}
): number => {
	if (method === PACK_MEASURING_METHODS.SECTOR)
		return getDistanceOfTwoSkatersSector(skaterA, skaterB);
	return getDistanceOfTwoSkatersRectangle(skaterA, skaterB);
};
const getDistanceOfTwoSkatersSector = (
	skaterA: SkaterWDPPivotLineDistance,
	skaterB: SkaterWDPPivotLineDistance
): number => {
	const distances = [skaterA.pivotLineDist, skaterB.pivotLineDist];
	distances.sort((a, b) => a - b);

	const dist = Math.min(
		distances[1] - distances[0],
		distances[0] - (distances[1] - MEASUREMENT_LENGTH)
	);

	return dist;
};
const getDistanceOfTwoSkatersRectangle = (skaterA: Position, skaterB: Position): number => {
	const P1 = new Vector2(skaterA.x, skaterA.y);
	const P2 = new Vector2(skaterB.x, skaterB.y);

	if (P1.clone().sub(P2).length() > 8)
		return Infinity; // gets rid of all the funny artifacts when skaters are on opposite sides of the curve

	/*
	 *   First Curve
	 */
	const C1P1 = new Vector2(P1.x - C1.x, P1.y - C1.y);
	const C1P2 = new Vector2(P2.x - C1.x, P2.y - C1.y);

	let alphaC1 = C1P1.clone().add(C1P2).angle();

	while (alphaC1 < 0) {
		alphaC1 = alphaC1 + 2 * Math.PI;
	}

	if (alphaC1 >= (3 / 2) * Math.PI || alphaC1 <= (1 / 2) * Math.PI) {
		return 2 * Math.abs(Math.cos(alphaC1) * C1P1.y - Math.sin(alphaC1) * C1P1.x);
	}

	/*
	 *   Second Curve
	 */
	const C2P1 = new Vector2(P1.x - C2.x, P1.y - C2.y);
	const C2P2 = new Vector2(P2.x - C2.x, P2.y - C2.y);

	let alphaC2 = C2P1.clone().add(C2P2).angle();

	while (alphaC2 < 0) {
		alphaC2 = alphaC2 + 2 * Math.PI;
	}

	if (alphaC2 >= (1 / 2) * Math.PI && alphaC2 <= (3 / 2) * Math.PI) {
		return 2 * Math.abs(Math.cos(alphaC2) * C2P1.y - Math.sin(alphaC2) * C2P1.x);
	}

	/*
	 *   Straightaways
	 */
	const PMid = {
		x: 0.5 * (P1.x + P2.x),
		y: 0.5 * (P1.y + P2.y)
	};

	if (PMid.x < C1.x && PMid.x > C2.x) {
		if (P1.y * P2.y < 0) {
			return Infinity;
		} else {
			return Math.abs(P1.x - P2.x);
		}
	}
	return Infinity;
};

const filterOutGroupsWithOnlyOneTeam = (groupedBlockers: PackSkater[][]): PackSkater[][] => {
	return groupedBlockers.filter((group) => {
		const teamA = group.filter((g) => g.team === "A");
		const teamB = group.filter((g) => g.team === "B");
		return teamA.length && teamB.length;
	});
};

/*
 *   Get Skaters that form the pack
 *   Requires array of skaters with properties inBounds and pivotLineDistanceComputed
 */
export const getPack = (
	skaters: PackSkater[],
	{ method = PACK_MEASURING_METHODS.SECTOR }: { method?: PackMethod } = {}
): PackSkater[] | null => {
	const blockers = skaters.filter((skater) => !skater.isJammer);
	// only in bounds blockers
	const inBoundsBlockers = blockers.filter((blocker) => blocker.inBounds);
	const groups = groupBlockers(inBoundsBlockers, { method });
	const mixedGroups = filterOutGroupsWithOnlyOneTeam(groups);
	const pack = getLargestGroup(mixedGroups);

	if (!pack || pack.length < 2) return null;
	return pack;
};

/*
 *   Find outermost skaters
 */
export const getOutermostSkaters = (pack: PackSkater[]): false | PackSkater[] => {
	if (!pack) return false;
	if (pack.length <= 2) return pack;
	const blockers = structuredClone(pack);

	let blockerA = blockers[0];
	let blockerB: PackSkater | undefined;
	let distMax = -1;
	let newDist = 0;

	const computeNewDistance = () => {
		blockers.forEach((blocker) => {
			if (blocker === blockerA) return;

			const dist = getDistanceOfTwoSkaters(blocker, blockerA); // relative position uses default sector method
			if (dist > newDist) {
				blockerB = blocker;
				newDist = dist;
			}
		});

		const tmp = blockerA;
		blockerA = blockerB as PackSkater;
		blockerB = tmp;

		return newDist;
	};

	while (newDist > distMax) {
		distMax = newDist;
		newDist = -1;
		newDist = computeNewDistance();
	}

	return [blockerA, blockerB].filter(Boolean) as PackSkater[];
};

/*
 *   Get the closest skater in a pack to the provided skater
 */
export const getClosestOtherSkaterOfPack = (
	skater: PackSkater,
	pack: PackSkater[],
	method: PackMethod = PACK_MEASURING_METHODS.SECTOR
): PackSkater | null => {
	const blockers = structuredClone(pack).filter((entry) => entry.id !== skater.id);
	let minDist: number | null = null;
	let closestOtherSkater: PackSkater | null = null;
	blockers.forEach((blocker) => {
		const dist = getDistanceOfTwoSkaters(skater, blocker, { method });
		if (closestOtherSkater === null || (minDist !== null && dist < minDist)) {
			closestOtherSkater = blocker;
			minDist = dist;
		}
	});
	return closestOtherSkater;
};

export const getSortedOutermostSkaters = (
	pack: PackSkater[]
): false | [PackSkater, PackSkater] => {
	const outermostSkaters = getOutermostSkaters(pack);
	if (!outermostSkaters || outermostSkaters.length !== 2) return false;

	const distances = [outermostSkaters[0], outermostSkaters[1]];
	distances.sort((a, b) => a.pivotLineDist - b.pivotLineDist);

	if (
		distances[1].pivotLineDist - distances[0].pivotLineDist >=
		distances[0].pivotLineDist - (distances[1].pivotLineDist - MEASUREMENT_LENGTH)
	) {
		return [distances[1], distances[0]]; // switch
	}
	return [distances[0], distances[1]];
};

const getSortedClosestPointsOnLine = (
	furthestSkaters: PackSkater[] = []
): [number, number] | undefined => {
	if (furthestSkaters.length !== 2) return;

	const distToPivotLine1 = furthestSkaters[0].pivotLineDist;
	const distToPivotLine2 = furthestSkaters[1].pivotLineDist;
	const distances = [distToPivotLine1, distToPivotLine2];
	distances.sort((a, b) => a - b);

	if (distances[1] - distances[0] >= distances[0] - (distances[1] - MEASUREMENT_LENGTH)) {
		return [distances[1] - MEASUREMENT_LENGTH, distances[0]]; // switch
	}
	return [distances[0], distances[1]];
};

/*
 *   Find the range of the pack based on the points on the measurement line
 *   (used by sector measuring method)
 */
export const getSortedPackBoundaries = (pack: PackSkater[]): [number, number] | null | undefined => {
	if (!pack || pack.length < 2) return null;

	const outermostSkaters = getOutermostSkaters(pack);
	if (!outermostSkaters) return null;
	return getSortedClosestPointsOnLine(outermostSkaters);
};

export const getSkatersWDPInPlayPackSkater = <Skater extends PackSkater>(
	skaters: Skater[],
	{ method = PACK_MEASURING_METHODS.SECTOR }: { method?: PackMethod } = {}
): (Skater & SkatersWDPInPlay & SkatersWDPPackSkater)[] => {
	const pack = getPack(skaters, { method });
	let packBoundaries: [number, number] | [PackSkater, PackSkater] | undefined;
	if (pack) {
		packBoundaries =
			method === PACK_MEASURING_METHODS.SECTOR
				? (getSortedPackBoundaries(pack) as [number, number])
				: (getSortedOutermostSkaters(pack) as [PackSkater, PackSkater]);
	}

	return skaters.map((skater) => {
		const ret = structuredClone(skater) as Skater & SkatersWDPInPlay & SkatersWDPPackSkater;

		if (skater.isJammer) {
			ret.inPlay = skater.inBounds;
		} else {
			ret.inPlay = !!(
				skater.inBounds &&
				packBoundaries &&
				isSkaterInEngagementZone(skater, packBoundaries, method)
			);

			ret.packSkater = !!(skater.inBounds && packBoundaries && pack.find((entry) => entry.id === skater.id));
		}
		return ret;
	});
};

/*
 *   Get the point on the parallel line
 */
export const getPointOnParallelLineOfLastSkaterRectangle = (
	lastSkater: Position,
	{ front = true } = {}
): Vector2 | null | false => {
	if (!lastSkater) return false;
	const P1 = new Vector2(lastSkater.x, lastSkater.y);

	/*
	 *   First Curve
	 */
	const C1P1 = {
		x: P1.x - C1.x,
		y: P1.y - C1.y
	};

	let alphaC1 = Math.asin(
		(0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK) / Math.sqrt(C1P1.x * C1P1.x + C1P1.y * C1P1.y)
	);
	while (alphaC1 < 0) {
		alphaC1 = alphaC1 + 2 * Math.PI;
	}

	let alphaSkater = Math.atan2(C1P1.y, C1P1.x);
	while (alphaSkater < 0) {
		alphaSkater = alphaSkater + 2 * Math.PI;
	}

	let alphaC1Middle;
	if (front) {
		alphaC1Middle = alphaSkater - alphaC1;
		while (alphaC1Middle < 0) {
			alphaC1Middle = alphaC1Middle + 2 * Math.PI;
		}
	} else {
		alphaC1Middle = (alphaSkater + alphaC1) % (Math.PI * 2);
	}

	if (alphaC1Middle >= (3 / 2) * Math.PI || alphaC1Middle <= (1 / 2) * Math.PI) {
		const distanceToMiddlePoint = Math.sqrt(
			C1P1.x * C1P1.x + C1P1.y * C1P1.y + Math.pow(0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK, 2)
		);

		const direction = new Vector2(Math.cos(alphaC1Middle), Math.sin(alphaC1Middle));
		const PMiddle = {
			x: C1.x + distanceToMiddlePoint * direction.x,
			y: C1.y + distanceToMiddlePoint * direction.y
		};
		const POnParallelLine = new Vector2(
			P1.x + 2 * (PMiddle.x - P1.x),
			P1.y + 2 * (PMiddle.y - P1.y)
		);

		return POnParallelLine;
	}

	// Second Curve
	const C2P1 = {
		x: P1.x - C2.x,
		y: P1.y - C2.y
	};

	let alphaC2 = Math.asin(
		(0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK) / Math.sqrt(C2P1.x * C2P1.x + C2P1.y * C2P1.y)
	);
	while (alphaC2 < 0) {
		alphaC2 = alphaC2 + 2 * Math.PI;
	}

	alphaSkater = Math.atan2(C2P1.y, C2P1.x);
	while (alphaSkater < 0) {
		alphaSkater = alphaSkater + 2 * Math.PI;
	}

	let alphaC2Middle;
	if (front) {
		alphaC2Middle = alphaSkater - alphaC2;
		while (alphaC2Middle < 0) {
			alphaC2Middle = alphaC2Middle + 2 * Math.PI;
		}
	} else {
		alphaC2Middle = (alphaSkater + alphaC2) % (Math.PI * 2);
	}

	if (alphaC2Middle >= (1 / 2) * Math.PI && alphaC2Middle <= (3 / 2) * Math.PI) {
		const distanceToMiddlePoint = Math.sqrt(
			C2P1.x * C2P1.x + C2P1.y * C2P1.y - Math.pow(0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK, 2)
		);
		const direction = new Vector2(Math.cos(alphaC2Middle), Math.sin(alphaC2Middle));
		const PMiddle = {
			x: C2.x + distanceToMiddlePoint * direction.x,
			y: C2.y + distanceToMiddlePoint * direction.y
		};
		const POnParallelLine = new Vector2(
			P1.x + 2 * (PMiddle.x - P1.x),
			P1.y + 2 * (PMiddle.y - P1.y)
		);

		return POnParallelLine;
	}

	// Straightaways
	const PMid = new Vector2(
		P1.x +
			((front && P1.y >= 0) || (!front && P1.y < 0) ? 1 : -1) *
				0.5 *
				ENGAGEMENT_ZONE_DISTANCE_TO_PACK,
		P1.y
	);

	if (PMid.x < C1.x && PMid.x > C2.x) {
		const POnParallelLine = P1.clone().add(PMid.clone().sub(P1).multiplyScalar(2));
		return POnParallelLine;
	}
	console.error("No Point found on parallel Line");
	return null;
};

/*
 *   Find the last two skaters on both ends (2x2 in total)
 */
export const getTwoOutermostSkatersInBothDirection = (pack: PackSkater[]): {
	front: [PackSkater, PackSkater | null];
	back: [PackSkater, PackSkater | null];
} | null => {
	const outermostSkaters = getSortedOutermostSkaters(pack);
	if (!outermostSkaters) throw new Error("should have outermost skaters");
	if (outermostSkaters.length < 2) return null;

	return {
		front: [
			outermostSkaters[1],
			getClosestOtherSkaterOfPack(outermostSkaters[1], pack, PACK_MEASURING_METHODS.RECTANGLE)
		],
		back: [
			outermostSkaters[0],
			getClosestOtherSkaterOfPack(outermostSkaters[0], pack, PACK_MEASURING_METHODS.RECTANGLE)
		]
	};
};

export const intersectLinesUsingPivotDistance = (
	pivotDistances: number[]
): ({ inside: Vector2; outside: Vector2 })[] => {
	return pivotDistances.map((pivotDistance) => {
		let distance = pivotDistance % MEASUREMENT_LENGTH;
		while (distance < 0) {
			distance += MEASUREMENT_LENGTH;
		}

		if (distance < CIRCUMFERENCE_HALF_CIRCLE) {
			// first half circle
			let angle = distance / MEASUREMENT_RADIUS;
			angle = -angle + Math.PI / 2;
			const [inside, outside] = angleToLineFirstHalfCircle(angle)!;
			return { inside, outside };
		}

		if (distance < CIRCUMFERENCE_HALF_CIRCLE + LINE_DIST) {
			// first straightaway
			distance -= CIRCUMFERENCE_HALF_CIRCLE;
			const outside = new Vector2(C1_OUTER.x - distance, F_OUTER_TOP(C1_OUTER.x - distance));
			const inside = new Vector2(C1.x - distance, -RADIUS_INNER);
			return { inside, outside };
		}

		if (distance < 2 * CIRCUMFERENCE_HALF_CIRCLE + LINE_DIST) {
			// half circle left
			distance -= CIRCUMFERENCE_HALF_CIRCLE + LINE_DIST;
			let angle = distance / MEASUREMENT_RADIUS;
			angle = -angle + Math.PI / 2 + Math.PI;
			const [inside, outside] = angleToLineSecondHalfCircle(angle)!;
			return { inside, outside };
		}

		if (distance <= 2 * CIRCUMFERENCE_HALF_CIRCLE + 2 * LINE_DIST) {
			// straightaway bottom
			distance -= 2 * CIRCUMFERENCE_HALF_CIRCLE + LINE_DIST;
			const outside = new Vector2(C2_OUTER.x + distance, F_OUTER_BOTTOM(C2_OUTER.x + distance));
			const inside = new Vector2(C2.x + distance, RADIUS_INNER);
		return { inside, outside };
	}
	// Unreachable: distance is normalised to [0, MEASUREMENT_LENGTH), which the
	// four branches above fully cover.
	throw new Error("intersectLinesUsingPivotDistance: distance out of range");
	});
};

export const angleToLineFirstHalfCircle = (angle: number): [Vector2, Vector2] | undefined => {
	let ret;
	const direction = new Vector2(Math.cos(angle), Math.sin(angle));
	const pInner = C1.clone().add(direction.multiplyScalar(RADIUS_INNER));
	const p1 = C1.clone().add(direction).clone().sub(C1_OUTER);
	const p2 = C1.clone().sub(C1_OUTER);
	const d = p2.clone().sub(p1);
	const dr = d.length();
	const D = p1.x * p2.y - p2.x * p1.y;

	const determinant = RADIUS_OUTER * RADIUS_OUTER * dr * dr - D * D;

	if (determinant !== 0) {
		const x1 = (D * d.y + Math.sign(d.y) * d.x * Math.sqrt(determinant)) / (dr * dr);
		const x2 = (D * d.y - Math.sign(d.y) * d.x * Math.sqrt(determinant)) / (dr * dr);
		const y1 = (-D * d.x + Math.abs(d.y) * Math.sqrt(determinant)) / (dr * dr);
		const y2 = (-D * d.x - Math.abs(d.y) * Math.sqrt(determinant)) / (dr * dr);

		const pOuter1 = new Vector2(x1, y1).add(C1_OUTER);
		const pOuter2 = new Vector2(x2, y2).add(C1_OUTER);
		const pOuter = pOuter1.x > pOuter2.x ? pOuter1 : pOuter2;

		ret = [pInner, pOuter];
	}

	return ret;
};

export const angleToLineSecondHalfCircle = (angle: number): [Vector2, Vector2] | undefined => {
	let ret;
	const direction = new Vector2(Math.cos(angle), Math.sin(angle));
	const pInner = C2.clone().add(direction.multiplyScalar(RADIUS_INNER));
	const p1 = C2.clone().add(direction).clone().sub(C2_OUTER);
	const p2 = C2.clone().sub(C2_OUTER);
	const d = p2.clone().sub(p1);
	const dr = d.length();
	const D = p1.x * p2.y - p2.x * p1.y;

	const determinant = RADIUS_OUTER * RADIUS_OUTER * dr * dr - D * D;

	if (determinant !== 0) {
		const x1 = (D * d.y + Math.sign(d.y) * d.x * Math.sqrt(determinant)) / (dr * dr);
		const x2 = (D * d.y - Math.sign(d.y) * d.x * Math.sqrt(determinant)) / (dr * dr);
		const y1 = (-D * d.x + Math.abs(d.y) * Math.sqrt(determinant)) / (dr * dr);
		const y2 = (-D * d.x - Math.abs(d.y) * Math.sqrt(determinant)) / (dr * dr);

		const pOuter1 = new Vector2(x1, y1).add(C2_OUTER);
		const pOuter2 = new Vector2(x2, y2).add(C2_OUTER);
		const pOuter = pOuter1.x < pOuter2.x ? pOuter1 : pOuter2;

		ret = [pInner, pOuter];
	}

	return ret;
};
