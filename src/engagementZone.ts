import { Vector2 } from "./vector2.js";

import {
  C1,
  C1_OUTER,
  C2,
  C2_OUTER,
  ENGAGEMENT_ZONE_DISTANCE_TO_PACK,
  F_OUTER_BOTTOM,
  F_OUTER_TOP,
  MEASUREMENT_LENGTH,
  PACK_MEASURING_METHODS,
  type PackMethod,
  RADIUS_INNER,
  RADIUS_OUTER,
} from "./constants.js";
import { getTwoOutermostSkatersInBothDirection } from "./packFunctions.js";
import type { Position } from "./types.js";

/*
 *   Get the engagement zone by the 2x2 intersections with the inside and
 *   outside line. (rectangle measurement)
 */
export const getEngagementZoneIntersectionsRectangle = (
  skater: Position,
  { front = true } = {}
) => {
  if (!skater) return false;
  const P1 = new Vector2(skater.x, skater.y);

  /*
   *   First Curve
   */

  // Circle Right to P1 vec
  const C1P1 = {
    x: P1.x - C1.x,
    y: P1.y - C1.y,
  };

  let alphaC1 = Math.asin(
    (0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK) /
      Math.sqrt(C1P1.x * C1P1.x + C1P1.y * C1P1.y)
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

  if (
    alphaC1Middle >= (3 / 2) * Math.PI ||
    alphaC1Middle <= (1 / 2) * Math.PI
  ) {
    // console.log("intersection in first curve");
    /*
     *   First compute the point that has the distance of ENGAGEMENT_ZONE_DISTANCE_TO_PACK
     *   then we use that point to create a line and intersect the line with the inner and outer track boundary
     */
    const distanceToMiddlePoint = Math.sqrt(
      C1P1.x * C1P1.x +
        C1P1.y * C1P1.y +
        Math.pow(0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK, 2)
    );

    const direction = new Vector2(
      Math.cos(alphaC1Middle),
      Math.sin(alphaC1Middle)
    );
    const PMiddle = {
      x: C1.x + distanceToMiddlePoint * direction.x,
      y: C1.y + distanceToMiddlePoint * direction.y,
    };
    const POnParallelLine = new Vector2(
      // Parallel to the middle line between the two points, orthogonal to the inside line (same as with distance computation)
      P1.x + 2 * (PMiddle.x - P1.x),
      P1.y + 2 * (PMiddle.y - P1.y)
    );

    /*
     *   Intersect with half circles and adjacent straight aways
     */

    const intersectionsHalfCircle = intersectLineRightHalfCircle(
      POnParallelLine,
      direction
    );

    // console.log("front: ", front);
    // console.log("P1: ", P1);
    // console.log("PMiddle: ", PMiddle);
    // console.log("PONPARALLEL: ", POnParallelLine);

    // console.log("intersect with straightaways");
    const intersectionsStraightAways = front
      ? intersectLineStraightAwaysTop(POnParallelLine, direction)
      : intersectLineStraightAwaysBottom(POnParallelLine, direction);

    // console.dir({
    //   intersectionsHalfCircle,
    //   intersectionsStraightAways,
    // });

    const intersections = {
      outside: intersectionsHalfCircle.outside
        ? intersectionsHalfCircle.outside
        : front
        ? intersectionsStraightAways.top
        : intersectionsStraightAways.bottom,
      inside: intersectionsHalfCircle.inside
        ? intersectionsHalfCircle.inside
        : front
        ? intersectionsStraightAways.bottom
        : intersectionsStraightAways.top,
    };

    return intersections;
  }

  // /*
  //  *   Second Curve
  //  */

  // Circle Left to P1 vec
  const C2P1 = {
    x: P1.x - C2.x,
    y: P1.y - C2.y,
  };

  let alphaC2 = Math.asin(
    (0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK) /
      Math.sqrt(C2P1.x * C2P1.x + C2P1.y * C2P1.y)
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

  if (
    alphaC2Middle >= (1 / 2) * Math.PI &&
    alphaC2Middle <= (3 / 2) * Math.PI
  ) {
    /*
     *   First compute the point that has the distance of ENGAGEMENT_ZONE_DISTANCE_TO_PACK
     *   then we use that point to create a line and intersect the line with the inner and outer track boundary
     */
    const distanceToMiddlePoint = Math.sqrt(
      C2P1.x * C2P1.x +
        C2P1.y * C2P1.y -
        Math.pow(0.5 * ENGAGEMENT_ZONE_DISTANCE_TO_PACK, 2)
    );
    const direction = new Vector2(
      Math.cos(alphaC2Middle),
      Math.sin(alphaC2Middle)
    );
    const PMiddle = {
      x: C2.x + distanceToMiddlePoint * direction.x,
      y: C2.y + distanceToMiddlePoint * direction.y,
    };
    const POnParallelLine = new Vector2(
      // Parallel to the middle line between the two points, orthogonal to the inside line (same as with distance computation)
      P1.x + 2 * (PMiddle.x - P1.x),
      P1.y + 2 * (PMiddle.y - P1.y)
    );

    /*
     *   Intersect with half circles and adjacent straight aways
     */

    const intersectionsLeftHalfCircle = intersectLineLeftHalfCircle(
      POnParallelLine,
      direction
    );

    const intersectionsStraightAways = front
      ? intersectLineStraightAwaysBottom(POnParallelLine, direction)
      : intersectLineStraightAwaysTop(POnParallelLine, direction);

    // console.log("front: ", front);

    // console.dir({
    //   intersectionsLeftHalfCircle,
    //   intersectionsStraightAways,
    // });

    const intersections = {
      outside: intersectionsLeftHalfCircle.outside
        ? intersectionsLeftHalfCircle.outside
        : front
        ? intersectionsStraightAways.bottom
        : intersectionsStraightAways.top,
      inside: intersectionsLeftHalfCircle.inside
        ? intersectionsLeftHalfCircle.inside
        : front
        ? intersectionsStraightAways.top
        : intersectionsStraightAways.bottom,
    };

    return intersections;
  }

  // /*
  //  *   Straightaways
  //  */
  const PMid = new Vector2(
    P1.x +
      ((front && P1.y >= 0) || (!front && P1.y < 0) ? 1 : -1) *
        0.5 *
        ENGAGEMENT_ZONE_DISTANCE_TO_PACK,
    P1.y
  );

  if (PMid.x < C1.x && PMid.x > C2.x) {
    const POnParallelLine = P1.clone().add(
      PMid.clone().sub(P1).multiplyScalar(2)
    );
    const direction = new Vector2(0, 1);
    if (POnParallelLine.y >= 0) {
      const intersectionsHalfCircle = front
        ? intersectLineRightHalfCircle(POnParallelLine, direction)
        : intersectLineLeftHalfCircle(POnParallelLine, direction);

      const intersectionsStraightAway = intersectLineStraightAwaysBottom(
        POnParallelLine,
        direction
      );

      const intersections = {
        outside: intersectionsStraightAway.bottom
          ? intersectionsStraightAway.bottom
          : intersectionsHalfCircle.outside,
        inside: intersectionsStraightAway.top
          ? intersectionsStraightAway.top
          : intersectionsHalfCircle.inside,
      };

      return intersections;
    } else {
      const intersectionsHalfCircle = front
        ? intersectLineLeftHalfCircle(POnParallelLine, direction)
        : intersectLineRightHalfCircle(POnParallelLine, direction);

      const intersectionsStraightAway = intersectLineStraightAwaysTop(
        POnParallelLine,
        direction
      );

      const intersections = {
        outside: intersectionsStraightAway.top
          ? intersectionsStraightAway.top
          : intersectionsHalfCircle.outside,
        inside: intersectionsStraightAway.bottom
          ? intersectionsStraightAway.bottom
          : intersectionsHalfCircle.inside,
      };

      return intersections;
    }
  }

  throw new Error("Should have intersected, but didn't");
};

/*
 *   Get the pack zone by the 2x2 intersections with the inside and
 *   outside line. (rectangle measurement)
 */
export const getPackIntersectionsRectangle = (pack, twoOutermostSkaters) => {
  if (!twoOutermostSkaters && (!pack || pack.length < 2)) return null;

  const _twoOutermostSkaters = twoOutermostSkaters
    ? twoOutermostSkaters
    : getTwoOutermostSkatersInBothDirection(pack);

  if (!_twoOutermostSkaters) return null;

  return {
    front: getPackIntersectionsByEndRectangle(_twoOutermostSkaters.front, {
      front: true,
    }),
    back: getPackIntersectionsByEndRectangle(_twoOutermostSkaters.back, {
      front: false,
    }),
  };
};

const getPackIntersectionsByEndRectangle = (
  twoOutermostSkaters, // [0] is closest to boundary
  { front = true } = {}
) => {
  /*
   *   First Curve
   */
  const P1 = new Vector2(twoOutermostSkaters[0].x, twoOutermostSkaters[0].y);
  const P2 = new Vector2(twoOutermostSkaters[1].x, twoOutermostSkaters[1].y);

  const alphaC1Middle = P1.clone().add(P2).multiplyScalar(0.5).sub(C1).angle();

  if (
    alphaC1Middle >= (3 / 2) * Math.PI ||
    alphaC1Middle <= (1 / 2) * Math.PI
  ) {
    const direction = new Vector2(
      Math.cos(alphaC1Middle),
      Math.sin(alphaC1Middle)
    );
    const POnParallelLine = P1;

    /*
     *   Intersect with half circles and adjacent straight aways
     */

    const intersectionsHalfCircle = intersectLineRightHalfCircle(
      POnParallelLine,
      direction
    );

    const intersectionsStraightAways = front
      ? intersectLineStraightAwaysTop(POnParallelLine, direction)
      : intersectLineStraightAwaysBottom(POnParallelLine, direction);

    const intersections = {
      outside: intersectionsHalfCircle.outside
        ? intersectionsHalfCircle.outside
        : front
        ? intersectionsStraightAways.top
        : intersectionsStraightAways.bottom,
      inside: intersectionsHalfCircle.inside
        ? intersectionsHalfCircle.inside
        : front
        ? intersectionsStraightAways.bottom
        : intersectionsStraightAways.top,
    };

    return intersections;
  }

  // /*
  //  *   Second Curve
  //  */

  const alphaC2Middle = P1.clone().add(P2).multiplyScalar(0.5).sub(C2).angle();

  if (
    alphaC2Middle >= (1 / 2) * Math.PI &&
    alphaC2Middle <= (3 / 2) * Math.PI
  ) {
    const direction = new Vector2(
      Math.cos(alphaC2Middle),
      Math.sin(alphaC2Middle)
    );
    const POnParallelLine = P1;

    /*
     *   Intersect with half circles and adjacent straight aways
     */

    const intersectionsLeftHalfCircle = intersectLineLeftHalfCircle(
      POnParallelLine,
      direction
    );

    const intersectionsStraightAways = front
      ? intersectLineStraightAwaysBottom(POnParallelLine, direction)
      : intersectLineStraightAwaysTop(POnParallelLine, direction);

    const intersections = {
      outside: intersectionsLeftHalfCircle.outside
        ? intersectionsLeftHalfCircle.outside
        : front
        ? intersectionsStraightAways.bottom
        : intersectionsStraightAways.top,
      inside: intersectionsLeftHalfCircle.inside
        ? intersectionsLeftHalfCircle.inside
        : front
        ? intersectionsStraightAways.top
        : intersectionsStraightAways.bottom,
    };

    return intersections;
  }

  // /*
  //  *   Straightaways
  //  */
  const PMid = P1.clone().add(P2).multiplyScalar(0.5);

  if (PMid.x < C1.x && PMid.x > C2.x) {
    const POnParallelLine = P1;
    const direction = new Vector2(0, 1);
    if (POnParallelLine.y >= 0) {
      const intersectionsHalfCircle = front
        ? intersectLineRightHalfCircle(POnParallelLine, direction)
        : intersectLineLeftHalfCircle(POnParallelLine, direction);

      const intersectionsStraightAway = intersectLineStraightAwaysBottom(
        POnParallelLine,
        direction
      );

      const intersections = {
        outside: intersectionsStraightAway.bottom
          ? intersectionsStraightAway.bottom
          : intersectionsHalfCircle.outside,
        inside: intersectionsStraightAway.top
          ? intersectionsStraightAway.top
          : intersectionsHalfCircle.inside,
      };

      return intersections;
    } else {
      const intersectionsHalfCircle = front
        ? intersectLineLeftHalfCircle(POnParallelLine, direction)
        : intersectLineRightHalfCircle(POnParallelLine, direction);

      const intersectionsStraightAway = intersectLineStraightAwaysTop(
        POnParallelLine,
        direction
      );

      const intersections = {
        outside: intersectionsStraightAway.top
          ? intersectionsStraightAway.top
          : intersectionsHalfCircle.outside,
        inside: intersectionsStraightAway.bottom
          ? intersectionsStraightAway.bottom
          : intersectionsHalfCircle.inside,
      };

      return intersections;
    }
  }
  console.error("Should have intersected, but didn't");
  return [];
};

/**
 * Get the inside and outside intersection of right half circle
 */
const intersectLineRightHalfCircle = (origin, direction) => {
  const intersectionsOuter = getIntersectionsWithCircle(
    origin,
    direction,
    C1_OUTER,
    RADIUS_OUTER
  )
    .filter((entry) => entry.x >= C1.x)
    .reduce((prev, curr) => {
      // check if curr is closer to origin
      if (
        !prev ||
        curr.clone().sub(origin).length() < prev.clone().sub(origin).length()
      ) {
        return curr;
      }
      return prev;
    }, null);

  const intersectionsInner = getIntersectionsWithCircle(
    origin,
    direction,
    C1,
    RADIUS_INNER
  )
    .filter((entry) => entry.x >= C1.x)
    .reduce((prev, curr) => {
      // check if curr is closer to origin
      if (
        !prev ||
        curr.clone().sub(origin).length() < prev.clone().sub(origin).length()
      ) {
        return curr;
      }
      return prev;
    }, null);

  return {
    inside: intersectionsInner,
    outside: intersectionsOuter,
  };
};

/**
 * Get the inside and outside intersection of left half circle
 */
const intersectLineLeftHalfCircle = (origin, direction) => {
  const intersectionsOuter = getIntersectionsWithCircle(
    origin,
    direction,
    C2_OUTER,
    RADIUS_OUTER
  )
    .filter((entry) => entry.x <= C2.x)
    .reduce((prev, curr) => {
      // check if curr is closer to origin
      if (
        !prev ||
        curr.clone().sub(origin).length() < prev.clone().sub(origin).length()
      ) {
        return curr;
      }
      return prev;
    }, null);

  const intersectionsInner = getIntersectionsWithCircle(
    origin,
    direction,
    C2,
    RADIUS_INNER
  )
    .filter((entry) => entry.x <= C2.x)
    .reduce((prev, curr) => {
      // check if curr is closer to origin
      if (
        !prev ||
        curr.clone().sub(origin).length() < prev.clone().sub(origin).length()
      ) {
        return curr;
      }
      return prev;
    }, null);

  return {
    inside: intersectionsInner,
    outside: intersectionsOuter,
  };
};

const intersectLines = (line1origin, line1dir, line2origin, line2dir) => {
  const P1 = line1origin;
  const P2 = line1origin.clone().add(line1dir);
  const P3 = line2origin;
  const P4 = line2origin.clone().add(line2dir);
  const x =
    ((P1.x * P2.y - P1.y * P2.x) * (P3.x - P4.x) -
      (P1.x - P2.x) * (P3.x * P4.y - P3.y * P4.x)) /
    ((P1.x - P2.x) * (P3.y - P4.y) - (P1.y - P2.y) * (P3.x - P4.x));
  const y =
    ((P1.x * P2.y - P1.y * P2.x) * (P3.y - P4.y) -
      (P1.y - P2.y) * (P3.x * P4.y - P3.y * P4.x)) /
    ((P1.x - P2.x) * (P3.y - P4.y) - (P1.y - P2.y) * (P3.x - P4.x));

  const intersection = new Vector2(x, y);
  return intersection;
};

const intersectLineStraightAwaysTop = (origin, direction) => {
  const yOuterTopC1 = F_OUTER_TOP(C1.x);
  const yOuterTopC2 = F_OUTER_TOP(C2.x);
  const intersectionTop = intersectLines(
    origin,
    direction,
    new Vector2(C1.x, yOuterTopC1),
    new Vector2(C2.x - C1.x, yOuterTopC2 - yOuterTopC1)
  );

  const intersectionBottom = intersectLines(
    origin,
    direction,
    new Vector2(C1.x, -RADIUS_INNER),
    new Vector2(-1, 0)
  );

  return {
    top:
      intersectionTop.x < C1.x && intersectionTop.x > C2.x
        ? intersectionTop
        : null,
    bottom:
      intersectionBottom.x < C1.x && intersectionBottom.x > C2.x
        ? intersectionBottom
        : null,
  };
};

const intersectLineStraightAwaysBottom = (origin, direction) => {
  const yOuterBottomC1 = F_OUTER_BOTTOM(C1.x);
  const yOuterBottomC2 = F_OUTER_BOTTOM(C2.x);
  const intersectionTop = intersectLines(
    origin,
    direction,
    new Vector2(C1.x, RADIUS_INNER),
    new Vector2(-1, 0)
  );

  const intersectionBottom = intersectLines(
    origin,
    direction,
    new Vector2(C1.x, yOuterBottomC1),
    new Vector2(C2.x - C1.x, yOuterBottomC2 - yOuterBottomC1)
  );

  return {
    top:
      intersectionTop.x < C1.x && intersectionTop.x > C2.x
        ? intersectionTop
        : null,
    bottom:
      intersectionBottom.x < C1.x && intersectionBottom.x > C2.x
        ? intersectionBottom
        : null,
  };
};

const getIntersectionsWithCircle = (
  origin,
  direction,
  circleCenter,
  radius
) => {
  const intersections = [];
  /*
   *   CIRCLE LINE INTERSECTION
   *   https://mathworld.wolfram.com/Circle-LineIntersection.html
   */
  new Vector2(1, 2).length();
  const p1 = origin.clone().add(direction).sub(circleCenter);
  const p2 = origin.clone().sub(circleCenter);
  const d = p2.clone().sub(p1);
  const dr = d.length();
  const D = p1.x * p2.y - p2.x * p1.y;

  const determinant = radius * radius * dr * dr - D * D;

  if (determinant > 0) {
    const x1 =
      (D * d.y + Math.sign(d.y) * d.x * Math.sqrt(determinant)) / (dr * dr);
    const x2 =
      (D * d.y - Math.sign(d.y) * d.x * Math.sqrt(determinant)) / (dr * dr);

    const y1 = (-D * d.x + Math.abs(d.y) * Math.sqrt(determinant)) / (dr * dr);
    const y2 = (-D * d.x - Math.abs(d.y) * Math.sqrt(determinant)) / (dr * dr);

    intersections.push(new Vector2(x1, y1).add(circleCenter));
    intersections.push(new Vector2(x2, y2).add(circleCenter));
  } else if (determinant === 0) {
    const x = (D * d.y) / (dr * dr);
    const y = (-D * d.x) / (dr * dr);

    intersections.push(new Vector2(x, y).add(circleCenter));
  }

  return intersections;
};

export const isSkaterInEngagementZone = (
  skater: Position & { pivotLineDist: number },
  packBoundaries: [number, number] | [Position, Position],
  method: PackMethod = PACK_MEASURING_METHODS.SECTOR
): boolean => {
	if (method === PACK_MEASURING_METHODS.SECTOR) {
		const p = skater.pivotLineDist;
		const [rear, fore] = packBoundaries as [number, number];
		const lo = rear - ENGAGEMENT_ZONE_DISTANCE_TO_PACK;
		const hi = fore + ENGAGEMENT_ZONE_DISTANCE_TO_PACK;
		if (
			(p >= lo && p <= hi) ||
			(p < lo && p + MEASUREMENT_LENGTH <= hi) ||
			(p > hi && p - MEASUREMENT_LENGTH >= lo)
		) {
			return true;
		}
	}
  if (method === PACK_MEASURING_METHODS.RECTANGLE) {
    const boundaries = packBoundaries as [Position, Position];
    const engagementZoneFront = getEngagementZoneIntersectionsRectangle(
      boundaries[1],
      {
        front: true,
      }
    );
    const engagementZoneBack = getEngagementZoneIntersectionsRectangle(
      boundaries[0],
      {
        front: false,
      }
    );
    if (!engagementZoneFront || !engagementZoneBack) return false;

    const frontAngle1 = engagementZoneFront.outside
      .clone()
      .sub(engagementZoneFront.inside)
      .angle();
    let frontAngle2 = engagementZoneBack.inside
      .clone()
      .sub(engagementZoneFront.inside)
      .angle();
    let frontAngleSkater = new Vector2(skater.x, skater.y)
      .sub(engagementZoneFront.inside)
      .angle();
    let frontAngleOutside = engagementZoneBack.outside
      .clone()
      .sub(engagementZoneFront.inside)
      .angle();
    while (frontAngle2 < frontAngle1) {
      frontAngle2 += Math.PI * 2;
    }
    while (frontAngleSkater < frontAngle1) {
      frontAngleSkater += Math.PI * 2;
    }
    while (frontAngleOutside < frontAngle1) {
      frontAngleOutside += Math.PI * 2;
    }

    let backAngle1 = engagementZoneBack.outside
      .clone()
      .sub(engagementZoneBack.inside)
      .angle();
    const backAngle2 = engagementZoneFront.inside
      .clone()
      .sub(engagementZoneBack.inside)
      .angle();
    let backAngleSkater = new Vector2(skater.x, skater.y)
      .sub(engagementZoneBack.inside)
      .angle();
    let backAngleOutside = engagementZoneFront.outside
      .clone()
      .sub(engagementZoneBack.inside)
      .angle();
    while (backAngle1 < backAngle2) {
      backAngle1 += Math.PI * 2;
    }
    while (backAngleSkater < backAngle2) {
      backAngleSkater += Math.PI * 2;
    }
    while (backAngleOutside < backAngle2) {
      backAngleOutside += Math.PI * 2;
    }

    // check if the skaters are on the right side by using the angles

    const isInAngleRangeFrontInside =
      frontAngleSkater > frontAngle1 && frontAngleSkater < frontAngle2;

    const isInAngleRangeBackInside =
      backAngleSkater < backAngle1 && backAngleSkater > backAngle2;

    const isInAngleRangeFrontAdjacent =
      frontAngleOutside > frontAngle1 && frontAngleOutside < frontAngle2;
    const isInAngleRangeBackAdjacent =
      backAngleOutside < backAngle1 && backAngleOutside > backAngle2;

    if (isInAngleRangeFrontAdjacent && isInAngleRangeBackAdjacent) {
      return isInAngleRangeFrontInside && isInAngleRangeBackInside;
    }

    // same with outside points of opposing ends
    const frontAngle1Outside = engagementZoneFront.outside
      .clone()
      .sub(engagementZoneFront.inside)
      .angle();
    let frontAngle2Outside = engagementZoneBack.outside
      .clone()
      .sub(engagementZoneFront.inside)
      .angle();
    let frontAngleSkaterOutside = new Vector2(skater.x, skater.y)
      .sub(engagementZoneFront.inside)
      .angle();
    while (frontAngle2Outside < frontAngle1Outside) {
      frontAngle2Outside += Math.PI * 2;
    }
    while (frontAngleSkaterOutside < frontAngle1Outside) {
      frontAngleSkaterOutside += Math.PI * 2;
    }

    let backAngle1Outside = engagementZoneBack.outside
      .clone()
      .sub(engagementZoneBack.inside)
      .angle();
    const backAngle2Outside = engagementZoneFront.outside
      .clone()
      .sub(engagementZoneBack.inside)
      .angle();
    let backAngleSkaterOutside = new Vector2(skater.x, skater.y)
      .sub(engagementZoneBack.inside)
      .angle();
    while (backAngle1Outside < backAngle2Outside) {
      backAngle1Outside += Math.PI * 2;
    }
    while (backAngleSkaterOutside < backAngle2Outside) {
      backAngleSkaterOutside += Math.PI * 2;
    }

    const isInAngleRangeFrontOutside =
      frontAngleSkaterOutside > frontAngle1Outside &&
      frontAngleSkaterOutside < frontAngle2Outside;

    const isInAngleRangeBackOutside =
      backAngleSkaterOutside < backAngle1Outside &&
      backAngleSkaterOutside > backAngle2Outside;

    return (
      (isInAngleRangeFrontInside && isInAngleRangeBackOutside) ||
      (isInAngleRangeFrontOutside && isInAngleRangeBackInside)
    );
  }
  return false;
};
