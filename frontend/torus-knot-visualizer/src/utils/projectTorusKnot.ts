import p5 from 'p5';

function roundVector(vector: p5.Vector, decimals: number): p5.Vector {
  return new p5.Vector(
    parseFloat(vector.x.toFixed(decimals)),
    parseFloat(vector.y.toFixed(decimals)),
    parseFloat(vector.z.toFixed(decimals))
  );
}

function projectTo2D(point: p5.Vector, cameraPosition: p5.Vector, cameraDirection: p5.Vector): p5.Vector {
  const planeNormal = cameraDirection.copy().normalize();

  const toPoint = p5.Vector.sub(point, cameraPosition);

  const distanceToPlane = toPoint.dot(planeNormal);
  const projectedPoint = p5.Vector.sub(toPoint, planeNormal.copy().mult(distanceToPlane));

  const right = new p5.Vector(1, 0, 0); // Arbitrary right vector
  const up = planeNormal.cross(right).normalize();
  const alignedX = projectedPoint.dot(right);
  const alignedY = projectedPoint.dot(up);

  return new p5.Vector(alignedX, alignedY);
}

export function projectTorusKnot(
  quads: [p5.Vector, p5.Vector, p5.Vector, p5.Vector][],
  cameraPosition: p5.Vector,
  cameraDirection: p5.Vector
): { lines: [p5.Vector, p5.Vector][] } {
  debugger;
  const visibleLines: [p5.Vector, p5.Vector][] = [];

  for (const [a, b, c, d] of quads) {
    const roundedA = roundVector(a, 15);
    const roundedB = roundVector(b, 15);
    const roundedC = roundVector(c, 15);
    const roundedD = roundVector(d, 15);

    console.log('Rounded quad points:', roundedA, roundedB, roundedC, roundedD);

    if (roundedA.equals(roundedB) || roundedA.equals(roundedC) || roundedA.equals(roundedD)) {
      console.error('Degenerate quad detected: Skipping.');
      continue;
    }

    const ab = p5.Vector.sub(roundedB, roundedA);
    const ac = p5.Vector.sub(roundedC, roundedA);

    if (ab.mag() === 0 || ac.mag() === 0) {
      console.error('Invalid vectors detected: Skipping.');
      continue;
    }

    const normal = ab.cross(ac).normalize();
    if (normal.mag() === 0) {
      console.error('Invalid normal vector: Points may be collinear.');
      continue;
    }

    const toQuad = p5.Vector.sub(roundedA, cameraPosition);

    if (normal.dot(toQuad) < 0) {
      const projectedA = projectTo2D(roundedA, cameraPosition, cameraDirection);
      const projectedB = projectTo2D(roundedB, cameraPosition, cameraDirection);
      const projectedC = projectTo2D(roundedC, cameraPosition, cameraDirection);
      const projectedD = projectTo2D(roundedD, cameraPosition, cameraDirection);

      visibleLines.push([projectedA, projectedB]);
      visibleLines.push([projectedB, projectedC]);
      visibleLines.push([projectedC, projectedD]);
      visibleLines.push([projectedD, projectedA]);
    }
  }

  return { lines: visibleLines };
}