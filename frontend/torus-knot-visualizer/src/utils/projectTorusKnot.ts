import p5 from 'p5';

function roundVector(vector: p5.Vector, decimals: number): p5.Vector {
  return new p5.Vector(
    parseFloat(vector.x.toFixed(decimals)),
    parseFloat(vector.y.toFixed(decimals)),
    parseFloat(vector.z.toFixed(decimals))
  );
}

function projectTo2D(point: p5.Vector, cameraPosition: p5.Vector): p5.Vector {
  const distance = 1000; // Distance from the camera to the projection plane
  const zFactor = distance / (distance + point.z - cameraPosition.z);
  return new p5.Vector(point.x * zFactor, point.y * zFactor);
}

export function projectTorusKnot(
  quads: [p5.Vector, p5.Vector, p5.Vector, p5.Vector][],
  cameraPosition: p5.Vector,
  cameraDirection: p5.Vector
): { lines: [p5.Vector, p5.Vector][] } {
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
      const projectedA = projectTo2D(roundedA, cameraPosition);
      const projectedB = projectTo2D(roundedB, cameraPosition);
      const projectedC = projectTo2D(roundedC, cameraPosition);
      const projectedD = projectTo2D(roundedD, cameraPosition);

      visibleLines.push([projectedA, projectedB]);
      visibleLines.push([projectedB, projectedC]);
      visibleLines.push([projectedC, projectedD]);
      visibleLines.push([projectedD, projectedA]);
    }
  }

  return { lines: visibleLines };
}