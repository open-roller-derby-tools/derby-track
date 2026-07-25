import * as THREE from "three";
const { Vector2 } = THREE;

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
export const computePartialTrackShape3D = (options) => {
  if (options.method === PACK_MEASURING_METHODS.RECTANGLE) {
    return computePartialTrackShapeRectangle3D(options);
  } else {
    return computePartialTrackShapeSector3D(options);
  }
};

export const computePartialTrackShapeSector3D = ({
  p1,
  p2,
  options3D = {},
}) => {
  const defaultOptions3D = {
    curveSegments: 12,
  };

  const _options3D = Object.assign({}, defaultOptions3D, options3D);

  let shape = new THREE.Shape();

  let start = p1;
  let end = p2;
  while (start < 0 || end < 0) {
    start += MEASUREMENT_LENGTH;
    end += MEASUREMENT_LENGTH;
  }

  const intersections = intersectLinesUsingPivotDistance([start, end]);

  // draw start
  const startIntersections = intersections[0];
  drawLine3D({
    p1: startIntersections.inside,
    p2: startIntersections.outside,
    path3D: shape,
    moveTo: true,
  });

  let drawLength = 0;
  let currentIdx = 0;

  while (drawLength < end) {
    const newDrawLength = drawLength + drawShapes3D[currentIdx].length;
    const startBeforeEndOfSection = start < newDrawLength;
    const endBeforeEndOfSection = end < newDrawLength;
    const startBeforeStartOfSection = start < drawLength;

    if (startBeforeEndOfSection) {
      drawShapes3D[currentIdx].drawOuterLine({
        start: startBeforeStartOfSection ? 0 : start - drawLength,
        end: endBeforeEndOfSection ? end - drawLength : false,
        path3D: shape,
      });
    }
    drawLength = newDrawLength;

    if (endBeforeEndOfSection) break;
    currentIdx = (currentIdx + 1) % drawShapes3D.length; // not increment
  }

  const endIntersections = intersections[1];
  drawLine3D({
    p1: endIntersections.outside,
    p2: endIntersections.inside,
    path3D: shape,
  });

  // switching drawing direction
  // swap start and end
  const tmp = start;
  start = end;
  end = tmp;

  // draw the inside lines (drat, counterclockwise)
  while (drawLength > 0) {
    const newDrawLength = drawLength - drawShapes3D[currentIdx].length;
    const stillNeedsDrawing = drawLength >= end;
    const startBeforeEndOfSection = start >= drawLength;
    const endBeforeStartOfSection = end < newDrawLength;

    if (stillNeedsDrawing) {
      drawShapes3D[currentIdx].drawInnerLine({
        start: startBeforeEndOfSection ? 0 : start - newDrawLength,
        end: endBeforeStartOfSection ? 0 : end - newDrawLength,
        path3D: shape,
      });
    }
    drawLength = newDrawLength;

    currentIdx = (currentIdx - 1 + drawShapes3D.length) % drawShapes3D.length;
  }

  // bundle up the shape into a mesh
  const { curveSegments, ...materialOptions } = _options3D;
  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  const material = new THREE.MeshBasicMaterial(materialOptions);
  const mesh = new THREE.Mesh(geometry, material);
  shape = mesh;

  return shape;
};

export const computePartialTrackShapeRectangle3D = ({
  p1, // engagementZoneBack/intersectionsBack
  p2, // engagementZoneFront/intersectionsFront
  options3D = {},
}) => {
  const defaultOptions3D = {
    curveSegments: 12,
  };

  const _options3D = Object.assign({}, defaultOptions3D, options3D);

  let shape = new THREE.Shape();

  /*
   *   Setup start and end for outside lines
   *   (Intersect with outside then )
   */

  // p2 is front, lower pivot Line Dist
  const intersectionsFront = p2;
  const intersectionsBack = p1;

  // draw start
  drawLine3D({
    p1: intersectionsBack.inside,
    p2: intersectionsBack.outside,
    path3D: shape,
    moveTo: true,
  });

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
    const newDrawLength = drawLength + drawShapes3D[currentIdx].length;
    const startBeforeEndOfSection = start < newDrawLength;
    const endBeforeEndOfSection = end < newDrawLength;
    const startBeforeStartOfSection = start < drawLength;

    if (startBeforeEndOfSection) {
      drawShapes3D[currentIdx].drawOuterLine({
        start: startBeforeStartOfSection ? 0 : start - drawLength,
        end: endBeforeEndOfSection ? end - drawLength : false,
        path3D: shape,
      });
    }
    drawLength = newDrawLength;

    if (endBeforeEndOfSection) break;
    currentIdx = (currentIdx + 1) % drawShapes3D.length; // not increment
  }

  // switching drawing direction
  drawLine3D({
    p1: intersectionsFront.outside,
    p2: intersectionsFront.inside,
    path3D: shape,
  });

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
    drawLength += drawShapes3D[currentIdx].length;
    if (drawLength >= start) break;
    currentIdx = (currentIdx + 1) % drawShapes3D.length; // not increment
  }

  // draw the inside lines (counterclockwise)
  while (drawLength > 0) {
    const newDrawLength = drawLength - drawShapes3D[currentIdx].length;
    const stillNeedsDrawing = drawLength >= end;
    const startBeforeEndOfSection = start >= drawLength;
    const endBeforeStartOfSection = end < newDrawLength;

    if (stillNeedsDrawing) {
      drawShapes3D[currentIdx].drawInnerLine({
        start: startBeforeEndOfSection ? 0 : start - newDrawLength,
        end: endBeforeStartOfSection ? 0 : end - newDrawLength,
        path3D: shape,
      });
    }
    drawLength = newDrawLength;

    currentIdx = (currentIdx - 1 + drawShapes3D.length) % drawShapes3D.length;
  }

  // bundle up the shape into a mesh
  const { curveSegments, ...materialOptions } = _options3D;
  const geometry = new THREE.ShapeGeometry(shape, curveSegments);
  const material = new THREE.MeshBasicMaterial(materialOptions);
  const mesh = new THREE.Mesh(geometry, material);
  shape = mesh;

  return shape;
};

const angleSVGTo3DFirstHalfCircle = (angle) => {
  return (angle * Math.PI) / 180 - Math.PI / 2;
};

const angleSVGTo3DSecondCircle = (angle) => {
  // console.log(angle)
  return (angle * Math.PI) / 180 + Math.PI / 2;
};

export const drawLine3D = ({ p1, p2, path3D, moveTo = false }) => {
  if (moveTo) path3D.moveTo(p1.x, -p1.y);
  path3D.lineTo(p2.x, -p2.y);
};

type DrawShape3D = {
	part: string;
	length: number;
	drawOuterLine({
		start,
		end,
		path3D
	}: {
		start?: number;
		end: number | false;
		path3D: THREE.Shape;
	}): string | void;
	drawInnerLine({
		start,
		end,
		path3D
	}: {
		start?: number;
		end: number | false;
		path3D: THREE.Shape;
	}): string | void;
};

export const drawShapes3D: DrawShape3D[] = [
  {
    part: "First Half Circle",
    length: CIRCUMFERENCE_HALF_CIRCLE,
    drawOuterLine({ start, end, path3D }) {
      const data = "";

      if (end) {
        const endAngle = (end / MEASUREMENT_RADIUS) * (180 / Math.PI);
        const startAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);

        path3D.absarc(
          C1_OUTER.x,
          -C1_OUTER.y,
          RADIUS_OUTER,
          angleSVGTo3DFirstHalfCircle(startAngle),
          angleSVGTo3DFirstHalfCircle(endAngle),
          false
        );
      } else {
        const endAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
        // draw remaining arc
        path3D.absarc(
          C1_OUTER.x,
          -C1_OUTER.y,
          RADIUS_OUTER,
          angleSVGTo3DFirstHalfCircle(endAngle),
          angleSVGTo3DFirstHalfCircle(180),
          false
        );
      }

      return data;
    },
    drawInnerLine({ start, end, path3D }) {
      const data = "";
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

      path3D.absarc(
        C1.x,
        -C1.y,
        RADIUS_INNER,
        angleSVGTo3DFirstHalfCircle(startAngle),
        angleSVGTo3DFirstHalfCircle(endAngle),
        true
      );

      return data;
    },
  },
  {
    part: "First Straightaway",
    length: LINE_DIST,
    drawOuterLine({ end, path3D }) {
      let data = "";
      const xEnd = end ? end : LINE_DIST;
      const pEnd = new Vector2(C1_OUTER.x - xEnd, F_OUTER_TOP(C1_OUTER.x - xEnd));

      data += drawLine3D({
        p1: null,
        p2: pEnd,
        path3D,
      });

      return data;
    },
    drawInnerLine({ end, path3D }) {
      const pEnd = new Vector2(C1.x - (end as number), -RADIUS_INNER);

      return drawLine3D({
        p1: null,
        p2: pEnd,
        path3D,
      });
    },
  },
  {
    part: "Second Half Circle",
    length: CIRCUMFERENCE_HALF_CIRCLE,
    drawOuterLine({ start, end, path3D }) {
      const data = "";

      if (end) {
        const endAngle = (end / MEASUREMENT_RADIUS) * (180 / Math.PI);
        const startAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);

        path3D.absarc(
          C2_OUTER.x,
          -C2_OUTER.y,
          RADIUS_OUTER,
          angleSVGTo3DSecondCircle(startAngle),
          angleSVGTo3DSecondCircle(endAngle),
          false
        );
      } else {
        const endAngle = (start / MEASUREMENT_RADIUS) * (180 / Math.PI);
        // draw remaining arc
        path3D.absarc(
          C2_OUTER.x,
          -C2_OUTER.y,
          RADIUS_OUTER,
          angleSVGTo3DSecondCircle(endAngle),
          angleSVGTo3DSecondCircle(180),
          false
        );
      }

      return data;
    },
    drawInnerLine({ start, end, path3D }) {
      const data = "";
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

      path3D.absarc(
        C2.x,
        -C2.y,
        RADIUS_INNER,
        angleSVGTo3DSecondCircle(startAngle),
        angleSVGTo3DSecondCircle(endAngle),
        true
      );

      return data;
    },
  },
  {
    part: "Second Straightaway",
    length: LINE_DIST,
    drawOuterLine({ end, path3D }) {
      let data = "";
      const xEnd = end ? end : LINE_DIST;
      const pEnd = new Vector2(
        C2_OUTER.x + xEnd,
        F_OUTER_BOTTOM(C2_OUTER.x + xEnd)
      );

      data += drawLine3D({
        p1: null,
        p2: pEnd,
        path3D,
      });

      return data;
    },
    drawInnerLine({ end, path3D }) {
      const pEnd = new Vector2(C2.x + (end as number), RADIUS_INNER);

      return drawLine3D({
        p1: null,
        p2: pEnd,
        path3D,
      });
    },
  },
];
