import { Vector2 } from "./vector2.js";

import {
  C1,
  C1_OUTER,
  C2,
  C2_OUTER,
  CIRCUMFERENCE_HALF_CIRCLE,
  F_OUTER_BOTTOM,
  F_OUTER_TOP,
  LINE_DIST,
  MEASUREMENT_LENGTH,
  MEASUREMENT_RADIUS,
  PACK_MEASURING_METHODS,
  RADIUS_INNER,
  RADIUS_OUTER,
} from "./constants.js";

import {
  angleToLineFirstHalfCircle,
  angleToLineSecondHalfCircle,
  getPivotLineDistance,
  intersectLinesUsingPivotDistance,
} from "./packFunctions.js";

/**
 * Generate the shape of the track having the start and end point
 * of the pack on the measurement line
 *
 * @param Number p1
 * @param Number p2
 * @returns PathData / Polyline?
 */
export const computePartialTrackShape2D = (options) => {
  if (options.method === PACK_MEASURING_METHODS.RECTANGLE) {
    return computePartialTrackShapeRectangle2D(options);
  } else {
    return computePartialTrackShapeSector2D(options);
  }
};

export const computePartialTrackShapeSector2D = ({ p1, p2 }) => {
  let shape = "";

  let start = p1;
  let end = p2;
  while (start < 0 || end < 0) {
    start += MEASUREMENT_LENGTH;
    end += MEASUREMENT_LENGTH;
  }

  const intersections = intersectLinesUsingPivotDistance([start, end]);

  // draw start
  const startIntersections = intersections[0];
  let drawing = drawLine({
    p1: startIntersections.inside,
    p2: startIntersections.outside,
    moveTo: true,
  });
  shape += drawing;

  let drawLength = 0;
  let currentIdx = 0;

  while (drawLength < end) {
    const newDrawLength = drawLength + drawShapes[currentIdx].length;
    const startBeforeEndOfSection = start < newDrawLength;
    const endBeforeEndOfSection = end < newDrawLength;
    const startBeforeStartOfSection = start < drawLength;

    if (startBeforeEndOfSection) {
      const drawing = drawShapes[currentIdx].drawOuterLine({
        start: startBeforeStartOfSection ? 0 : start - drawLength,
        end: endBeforeEndOfSection ? end - drawLength : false,
      });
      shape += " " + drawing;
    }
    drawLength = newDrawLength;

    if (endBeforeEndOfSection) break;
    currentIdx = (currentIdx + 1) % drawShapes.length; // not increment
  }

  const endIntersections = intersections[1];
  drawing = drawLine({
    p1: endIntersections.outside,
    p2: endIntersections.inside,
  });
  shape += drawing;

  // switching drawing direction
  // swap start and end
  const tmp = start;
  start = end;
  end = tmp;

  // draw the inside lines (drat, counterclockwise)
  while (drawLength > 0) {
    const newDrawLength = drawLength - drawShapes[currentIdx].length;
    const stillNeedsDrawing = drawLength >= end;
    const startBeforeEndOfSection = start >= drawLength;
    const endBeforeStartOfSection = end < newDrawLength;

    if (stillNeedsDrawing) {
      const drawing = drawShapes[currentIdx].drawInnerLine({
        start: startBeforeEndOfSection ? 0 : start - newDrawLength,
        end: endBeforeStartOfSection ? 0 : end - newDrawLength,
      });
      shape += " " + drawing;
    }
    drawLength = newDrawLength;

    currentIdx = (currentIdx - 1 + drawShapes.length) % drawShapes.length;
  }

  // shape closure
  shape += "Z";

  return shape;
};

export const computePartialTrackShapeRectangle2D = ({
  p1, // engagementZoneBack/intersectionsBack
  p2, // engagementZoneFront/intersectionsFront
}) => {
  let shape;

  shape = "";

  /*
   *   Setup start and end for outside lines
   *   (Intersect with outside then )
   */

  // p2 is front, lower pivot Line Dist
  const intersectionsFront = p2;
  const intersectionsBack = p1;

  // draw start
  let drawing = drawLine({
    p1: intersectionsBack.inside,
    p2: intersectionsBack.outside,
    moveTo: true,
  });
  shape += drawing;

  let drawLength = 0;
  let currentIdx = 0;

  let start = getPivotLineDistance(intersectionsBack.outside);
  let end = getPivotLineDistance(intersectionsFront.outside);

  while (end < start) {
    end += MEASUREMENT_LENGTH;
  }

  while (start < 0 || end < 0) {
    start += MEASUREMENT_LENGTH;
    end += MEASUREMENT_LENGTH;
  }

  while (drawLength < end) {
    const newDrawLength = drawLength + drawShapes[currentIdx].length;
    const startBeforeEndOfSection = start < newDrawLength;
    const endBeforeEndOfSection = end < newDrawLength;
    const startBeforeStartOfSection = start < drawLength;

    if (startBeforeEndOfSection) {
      const drawing = drawShapes[currentIdx].drawOuterLine({
        start: startBeforeStartOfSection ? 0 : start - drawLength,
        end: endBeforeEndOfSection ? end - drawLength : false,
      });
      shape += " " + drawing;
    }
    drawLength = newDrawLength;

    if (endBeforeEndOfSection) break;
    currentIdx = (currentIdx + 1) % drawShapes.length; // not increment
  }

  // switching drawing direction
  drawing = drawLine({
    p1: intersectionsFront.outside,
    p2: intersectionsFront.inside,
  });
  shape += drawing;

  start = getPivotLineDistance(intersectionsFront.inside);
  end = getPivotLineDistance(intersectionsBack.inside);

  while (start < end) {
    start += MEASUREMENT_LENGTH;
  }

  while (start < 0 || end < 0) {
    start += MEASUREMENT_LENGTH;
    end += MEASUREMENT_LENGTH;
  }

  currentIdx = 0;
  drawLength = 0;
  while (drawLength < start) {
    drawLength += drawShapes[currentIdx].length;
    if (drawLength >= start) break;
    currentIdx = (currentIdx + 1) % drawShapes.length; // not increment
  }

  // draw the inside lines (counterclockwise)
  while (drawLength > 0) {
    const newDrawLength = drawLength - drawShapes[currentIdx].length;
    const stillNeedsDrawing = drawLength >= end;
    const startBeforeEndOfSection = start >= drawLength;
    const endBeforeStartOfSection = end < newDrawLength;

    if (stillNeedsDrawing) {
      const drawing = drawShapes[currentIdx].drawInnerLine({
        start: startBeforeEndOfSection ? 0 : start - newDrawLength,
        end: endBeforeStartOfSection ? 0 : end - newDrawLength,
      });
      shape += " " + drawing;
    }
    drawLength = newDrawLength;

    currentIdx = (currentIdx - 1 + drawShapes.length) % drawShapes.length;
  }

  // shape closure
  shape += "Z";

  return shape;
};

export const drawLine = ({ p1, p2, moveTo = false }) => {
  return (moveTo ? `M${p1.x},${p1.y}` : "") + `L${p2.x},${p2.y}`;
};

export const drawShapes = [
  {
    part: "First Half Circle",
    length: CIRCUMFERENCE_HALF_CIRCLE,
    drawOuterLine({ start, end }) {
      let data = "";

      if (end) {
        const endAngle = (end / MEASUREMENT_RADIUS) * (180 / Math.PI);
        const startAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
        const intersectionsFirstHalfCircle = angleToLineFirstHalfCircle(
          -(end / MEASUREMENT_RADIUS) + Math.PI / 2
        );
        const pOuter = intersectionsFirstHalfCircle[1];

        data += ` A ${RADIUS_OUTER} ${RADIUS_OUTER} ${
          endAngle - startAngle
        } 0 0 ${pOuter.x},${pOuter.y}`;
      } else {
        const endAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
        // draw remaining arc

        data += ` A ${RADIUS_OUTER} ${RADIUS_OUTER} ${
          180 - endAngle
        } 0 0 5.33,-8.385`;
      }

      return data;
    },
    drawInnerLine({ start, end }) {
      let data = "";
      let startAngle;
      let endAngle;

      if (start) {
        startAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
      } else {
        startAngle = 180;
      }

      if (end) {
        endAngle = (end / MEASUREMENT_RADIUS) * (180 / Math.PI);
      } else {
        endAngle = 0;
      }

      const endAngleRad = -((endAngle * Math.PI) / 180) + Math.PI / 2;
      const direction = new Vector2(Math.cos(endAngleRad), Math.sin(endAngleRad));
      const pInner = C1.clone().add(direction.multiplyScalar(RADIUS_INNER));

      data += ` A ${RADIUS_INNER} ${RADIUS_INNER} ${
        endAngle - startAngle
      } 0 1 ${pInner.x},${pInner.y}`;

      return data;
    },
  },
  {
    part: "First Straightaway",
    length: LINE_DIST,
    drawOuterLine({ end }) {
      let data = "";
      const xEnd = end ? end : LINE_DIST;
      const pEnd = new Vector2(C1_OUTER.x - xEnd, F_OUTER_TOP(C1_OUTER.x - xEnd));

      data += drawLine({
        p1: null,
        p2: pEnd,
      });

      return data;
    },
    drawInnerLine({ end }) {
      const pEnd = new Vector2(C1.x - end, -RADIUS_INNER);

      return drawLine({
        p1: null,
        p2: pEnd,
      });
    },
  },
  {
    part: "Second Half Circle",
    length: CIRCUMFERENCE_HALF_CIRCLE,
    drawOuterLine({ start, end }) {
      let data = "";

      if (end) {
        const endAngle = (end / MEASUREMENT_RADIUS) * (180 / Math.PI);
        const startAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
        const intersectionsSecondHalfCircle = angleToLineSecondHalfCircle(
          -(end / MEASUREMENT_RADIUS) + Math.PI / 2 + Math.PI
        );

        data += ` A ${RADIUS_OUTER} ${RADIUS_OUTER} ${
          endAngle - startAngle
        } 0 0 ${intersectionsSecondHalfCircle[1].x},${
          intersectionsSecondHalfCircle[1].y
        }`;
      } else {
        const endAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
        // draw remaining arc
        data += ` A ${RADIUS_OUTER} ${RADIUS_OUTER} ${
          180 - endAngle
        } 0 0 -5.33,8.385`;
      }

      return data;
    },
    drawInnerLine({ start, end }) {
      let data = "";
      let startAngle;
      let endAngle;

      if (start) {
        startAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
      } else {
        startAngle = 180;
      }

      if (end) {
        endAngle = (end / MEASUREMENT_RADIUS) * (180 / Math.PI);
      } else {
        endAngle = 0;
      }

      const endAngleRad = -((endAngle * Math.PI) / 180) + Math.PI / 2 + Math.PI;
      const direction = new Vector2(Math.cos(endAngleRad), Math.sin(endAngleRad));
      const pInner = C2.clone().add(direction.multiplyScalar(RADIUS_INNER));

      data += ` A ${RADIUS_INNER} ${RADIUS_INNER} ${
        endAngle - startAngle
      } 0 1 ${pInner.x},${pInner.y}`;

      return data;
    },
  },
  {
    part: "Second Straightaway",
    length: LINE_DIST,
    drawOuterLine({ end }) {
      let data = "";
      const xEnd = end ? end : LINE_DIST;
      const pEnd = new Vector2(
        C2_OUTER.x + xEnd,
        F_OUTER_BOTTOM(C2_OUTER.x + xEnd)
      );

      data += drawLine({
        p1: null,
        p2: pEnd,
      });

      return data;
    },
    drawInnerLine({ end }) {
      const pEnd = new Vector2(C2.x + end, RADIUS_INNER);

      return drawLine({
        p1: null,
        p2: pEnd,
      });
    },
  },
];
