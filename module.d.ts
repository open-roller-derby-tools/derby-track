/// <reference types="three" />

//
// Skater Data Types
//
export type Position = {
  x: number;
  y: number;
};

export type Rotation = {
  rotation: number;
};

type PivotLineDist = {
  pivotLineDist: number;
};

export type SkaterDataType = {
  id: string | number;
  team: string;
  isPivot?: boolean;
  isJammer?: boolean;
} & Position &
  Rotation;

//
//    Derived Properties
//
export type SkaterWDPPivotLineDistance = {
  pivotLineDist: number;
};
export type SkatersWDPInPlay = {
  inPlay: boolean;
};
export type SkatersWDPPackSkater = {
  packSkater: boolean;
};
export type SkaterWDPInBounds = {
  inBounds: boolean;
};

export const C1: THREE.Vector2;
export const C2: THREE.Vector2;
export const C1_OUTER: THREE.Vector2;
export const C2_OUTER: THREE.Vector2;
export const RADIUS_INNER: 3.81;
export const RADIUS_OUTER: 8.08;
export const MEASUREMENT_RADIUS: number;
export const CIRCUMFERENCE_HALF_CIRCLE: number;
export const ENGAGEMENT_ZONE_DISTANCE_TO_PACK: 6.1;
export const SKATER_RADIUS: 0.3;
export const F_OUTER_TOP: (number) => number;
export const F_OUTER_BOTTOM: (number) => number;
export const LINE1: {
  p1: THREE.Vector2;
  p2: THREE.Vector2;
};
export const LINE2: {
  p1: THREE.Vector2;
  p2: THREE.Vector2;
};
export const LINE_DIST: number;

export const MEASUREMENT_LENGTH: number;

export const PACK_MEASURING_METHODS = {
  SECTOR: "sector",
  RECTANGLE: "rectangle",
} as const;

/**
 * Get Skaters with Derived Property inBounds
 */
export const getSkatersWDPInBounds: <Skater extends Position>(
  skaters: Skater[],
  options?: { radius?: number }
) => (Skater & { inBounds: boolean })[];

/**
 * Get the distance from the pivot line measured on the line that has a 1.6m distance to the inside line.
 */
export const getPivotLineDistance: (position: Position) => number;

/**
 * Get Skaters with Derived Property pivotLineDistance
 */
export const getSkatersWDPPivotLineDistance: <Skater extends Position>(
  skaters: Skater[]
) => (Skater & PivotLineDist)[];

/**
 * Get close skaters
 * @returns array of tuple of indices
 */
export const getCloseSkaters: (
  skaters: Parameters<typeof getDistanceOfTwoSkaters>[0][],
  options: {
    method:
      | typeof PACK_MEASURING_METHODS.SECTOR
      | typeof PACK_MEASURING_METHODS.RECTANGLE;
  }
) => [number, number][];

/**
 * Computes the groups of skaters with a maximum distance of 3.05m
 * @returns Array of array of blockers
 */
const groupBlockers: (
  blockers: SkaterWDPPivotLineDistance[],
  options: {
    method:
      | typeof PACK_MEASURING_METHODS.SECTOR
      | typeof PACK_MEASURING_METHODS.RECTANGLE;
  }
) => SkaterWDPPivotLineDistance[][];

/**
 * Given grouped skaters find a singular largest group, return null if multiple or none found
 */
const getLargestGroup: <Skater extends SkaterWDPPivotLineDistance>(
  groups: Skater[][]
) => Skater[] | null;

/*
 *   Compute the distance between two skaters
 */
export const getDistanceOfTwoSkaters: <
  Skater extends SkaterWDPPivotLineDistance
>(
  skaterA: Skater,
  skaterB: Skater,
  options: {
    method:
      | typeof PACK_MEASURING_METHODS.SECTOR
      | typeof PACK_MEASURING_METHODS.RECTANGLE;
  }
) => number;
const getDistanceOfTwoSkatersSector: (
  skaterA: PivotLineDist,
  skaterB: PivotLineDist
) => number;
const getDistanceOfTwoSkatersRectangle: (
  skaterA: Position,
  skaterB: Position
) => number;

/**
 * @returns array of groups consisting of only one team
 */
const filterOutGroupsWithOnlyOneTeam: (
  groupedBlockers: SkaterDataType[]
) => SkaterDataType[];

/*
 *   Get Skaters that form the pack
 *   Requires array of skaters with properties inBounds and pivotLineDistanceComputed
 */
type PossiblePackSkaters = SkaterWDPInBounds &
  SkaterWDPPivotLineDistance &
  SkaterDataType;
export const getPack: (
  skaters: PossiblePackSkaters[],
  options: {
    method:
      | typeof PACK_MEASURING_METHODS.SECTOR
      | typeof PACK_MEASURING_METHODS.RECTANGLE;
  }
) => ReturnType<typeof getLargestGroup> | null;

/*
 *   Find outermost skaters
 */
export const getOutermostSkaters: <Skater extends SkaterWDPPivotLineDistance>(
  pack: Skater[]
) => false | [Skater, Skater] | [Skater];

/*
 *   Get the closest skater in a pack to the provided skater
 */
export const getClosestOtherSkaterOfPack: <
  Skater extends SkaterWDPPivotLineDistance
>(
  skater: Skater,
  pack: Skater[]
) => Skater | null;

/**
 * Gets sorted first and last skater of pack (sector method)
 * @returns Tuple of [first skater of pack, last skater of pack]
 */
export const getSortedOutermostSkaters: (
  pack: SkaterWDPPivotLineDistance[]
) => false | [SkaterWDPPivotLineDistance, SkaterWDPPivotLineDistance];

/**
 * Sorts a tuple of objects with pivotLineDistances, using the shortest distance
 * (maximum half the track length measured at the line 1.6m from the inside line)
 * @returns tuple of pivotLineDist values
 */
const getSortedClosestPointsOnLine: (
  furthestSkaters?: [PivotLineDist, PivotLineDist]
) => [number, number] | undefined;

/**
 * Find the range of the pack based on the points on the measurement line
 * (used by sector measuring method)
 * @returns tuple of pivotLineDist values
 */
export const getSortedPackBoundaries: (
  pack: SkaterWDPPivotLineDistance[]
) => [number, number];

export const getSkatersWDPInPlayPackSkater: <
  Skater extends SkaterWDPPivotLineDistance
>(
  skaters: Skater[],
  options: {
    method:
      | typeof PACK_MEASURING_METHODS.SECTOR
      | typeof PACK_MEASURING_METHODS.RECTANGLE;
  }
) => (Skater & SkatersWDPInPlay & SkatersWDPPackSkater)[];

/*
 *   Get the point on the parallel line
 */
export const getPointOnParallelLineOfLastSkaterRectangle: (
  lastSkater: Position,
  options?: { front: boolean }
) => THREE.Vector2 | null | false;

/*
 *   Find the last two skaters on both ends (2x2 in total)
 */
export const getTwoOutermostSkatersInBothDirection: (
  pack: SkaterWDPPivotLineDistance[]
) => {
  front: [SkaterWDPPivotLineDistance, SkaterWDPPivotLineDistance | null];
  back: [SkaterWDPPivotLineDistance, SkaterWDPPivotLineDistance | null];
} | null;

export const intersectLinesUsingPivotDistance: (pivotDistances: number[]) => {
  inside: THREE.Vector2;
  outside: THREE.Vector2;
};

export const angleToLineFirstHalfCircle: (
  angle: number
) => [THREE.Vector2, THREE.Vector2] | undefined;

export const angleToLineSecondHalfCircle: (
  angle: number
) => [THREE.Vector2, THREE.Vector2] | undefined;

/**
 * Get the engagement zone by the 2x2 intersections with the inside and
 * outside line. (rectangle measurement)
 */
export const getEngagementZoneIntersectionsRectangle: <Skater extends Position>(
  skater: Skater,
  options?: { front: boolean }
) =>
  | false
  | {
      outside: Vector2 | null;
      inside: Vector2 | null;
    };

/*
 *   Get the pack zone by the 2x2 intersections with the inside and
 *   outside line. (rectangle measurement)
 */
export const getPackIntersectionsRectangle: <
  Skater extends SkaterWDPPivotLineDistance
>(
  pack: Skater[],
  twoOutermostSkaters: {
    front: [SkaterWDPPivotLineDistance, SkaterWDPPivotLineDistance | null];
    back: [SkaterWDPPivotLineDistance, SkaterWDPPivotLineDistance | null];
  }
) => null | {
  front: {
    outside: Vector2 | null;
    inside: Vector2 | null;
  };
  back: {
    outside: Vector2 | null;
    inside: Vector2 | null;
  };
};

const getPackIntersectionsByEndRectangle: <Skater extends Position>(
  twoOutermostSkaters: [Skater, Skater],
  options?: { front: boolean }
) => {
  outside: Vector2 | null;
  inside: Vector2 | null;
};

/**
 * Get the inside and outside intersection of right half circle
 */
const intersectLineRightHalfCircle: (
  origin: THREE.Vector2,
  direction: THREE.Vector2
) => {
  inside: THREE.Vector2 | null;
  outside: THREE.Vector2 | null;
};

/**
 * Get the inside and outside intersection of left half circle
 */
const intersectLineLeftHalfCircle: (
  origin: THREE.Vector2,
  direction: THREE.Vector2
) => {
  inside: THREE.Vector2 | null;
  outside: THREE.Vector2 | null;
};

const intersectLines: (
  line1origin: THREE.Vector2,
  line1dir: THREE.Vector2,
  line2origin: THREE.Vector2,
  line2dir: THREE.Vector2
) => THREE.Vector2;

const intersectLineStraightAwaysTop: (
  origin: THREE.Vector2,
  direction: THREE.Vector2
) => {
  top: Vector2 | null;
  bottom: Vector2 | null;
};

const intersectLineStraightAwaysBottom: (
  origin: THREE.Vector2,
  direction: THREE.Vector2
) => {
  top: Vector2 | null;
  bottom: Vector2 | null;
};

const getIntersectionsWithCircle: (
  origin: THREE.Vector2,
  direction: THREE.Vector2,
  circleCenter: THREE.Vector2,
  radius: number
) => [] | [THREE.Vector2] | [THREE.Vector2, THREE.Vector2];

// Positional overloads matching the runtime call signature
// (skater, packBoundaries, method). Previously typed as a single options
// object, which did not match how the function is actually called.
export const isSkaterInEngagementZone: {
	<Skater extends SkaterWDPPivotLineDistance>(
		skater: Skater,
		packBoundaries: [number, number],
		method: typeof PACK_MEASURING_METHODS.SECTOR
	): boolean;
	<Skater extends Position>(
		skater: Skater,
		packBoundaries: [Skater, Skater],
		method: typeof PACK_MEASURING_METHODS.RECTANGLE
	): boolean;
};

/**
 * Generate the shape of the track having the start and end point
 * of the pack on the measurement line
 *
 * @param Number p1
 * @param Number p2
 * @returns PathData / Polyline?
 */
// Method-dependent input: SECTOR takes pivotLineDist numbers, RECTANGLE takes
// {inside, outside} corner intersections. Previously typed as numbers for both,
// which did not match the RECTANGLE branch.
export const computePartialTrackShape2D: {
	(options: {
		p1: number;
		p2: number;
		method: typeof PACK_MEASURING_METHODS.SECTOR;
	}): string;
	(options: {
		p1: { inside: THREE.Vector2; outside: THREE.Vector2 };
		p2: { inside: THREE.Vector2; outside: THREE.Vector2 };
		method: typeof PACK_MEASURING_METHODS.RECTANGLE;
	}): string;
};

export const computePartialTrackShapeSector2D: <
  T extends { p1: number; p2: number }
>(
  arg: T
) => string;

/**
 * p1: engagementZoneBack/intersectionsBack
 * p2: engagementZoneFront/intersectionsFront
 */
export const computePartialTrackShapeRectangle2D: <
  T extends {
    p1: { inside: THREE.Vector2; outside: THREE.Vector2 };
    p2: { inside: THREE.Vector2; outside: THREE.Vector2 };
  }
>(
  arg: T
) => string = {
  p1, //
  p2, //
};

export const drawLine: (arg: {
  p1: THREE.Vector2;
  p2: THREE.Vector2;
  moveTo: boolean;
}) => string;

export const drawShapes: {
  part: string;
  length: number;
  drawOuterLine({ start, end }: { start: number; end: number }): string;
  drawInnerLine({ start, end }: { start: number; end: number }): string;
}[];

/**
 * Generate the shape of the track having the start and end point
 * of the pack on the measurement line
 */
export const computePartialTrackShape3D: (
  options: {
    options3D?: { curveSegments?: number } & THREE.MeshBasicMaterialParameters;
  } & (
    | { method: typeof PACK_MEASURING_METHODS.SECTOR; p1: number; p2: number }
    | { method: typeof PACK_MEASURING_METHODS.RECTANGLE; p1: any; p2: any }
  )
) => THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;

export const computePartialTrackShapeSector3D: (options: {
  p1: number;
  p2: number;
  options3D?: { curveSegments?: number } & THREE.MeshBasicMaterialParameters;
}) => THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;

export const computePartialTrackShapeRectangle3D: (options: {
  p1: { inside: THREE.Vector2; outside: THREE.Vector2 };
  p2: { inside: THREE.Vector2; outside: THREE.Vector2 };
  options3D?: { curveSegments?: number } & THREE.MeshBasicMaterialParameters;
}) => THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;

const angleSVGTo3DFirstHalfCircle: (angle: number) => number;
const angleSVGTo3DSecondCircle: (angle: number) => number;

export const drawLine3D: (arg: {
  p1: Position;
  p2: Position;
  path3D: THREE.Shape;
  moveTo: boolean;
}) => void;

export const drawShapes3D: (
  | {
      part: "First Half Circle" | "Second Half Circle";
      length: number;
      drawOuterLine({
        start,
        end,
        path3D,
      }: {
        start?: number;
        end: number;
        path3D: THREE.Shape;
      }): void;
      drawInnerLine({
        start,
        end,
        path3D,
      }: {
        start?: number;
        end: number;
        path3D: THREE.Shape;
      }): void;
    }
  | {
      part: "First Straightaway" | "Second Straightaway";
      length: number;
      drawOuterLine({
        end,
        path3D,
      }: {
        end: number;
        path3D: THREE.Shape;
      }): void;
      drawInnerLine({
        end,
        path3D,
      }: {
        end: number;
        path3D: THREE.Shape;
      }): void;
    }
)[];
