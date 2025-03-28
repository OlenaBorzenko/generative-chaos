import { useRef, useEffect } from 'react';
import p5 from 'p5';

interface TorusKnotProps {
  config: any;
  width?: number;
  height?: number;
}

export default function TorusCanvas({ config, width = 800, height = 800 }: TorusKnotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (s: p5) => {
      let knotPoints: p5.Vector[] = [];
      let ringPoints: p5.Vector[][] = [];

      s.setup = () => {
        s.createCanvas(width, height, s.WEBGL);
        s.ortho(-width / 2, width / 2, -height / 2, height / 2, -1000, 1000);
        s.background(20, 10, 40);
        s.noLoop();

        computeKnotPath();
        computeRingsWithParallelTransport();

        s.rotateX(s.HALF_PI * 2);
        s.scale(200);

        drawDepthFill();
        drawWireframe();
      };

      const computeKnotPath = () => {
        const { p, q, pathDetail, knotRadius, waveAmplitude } = config;

        knotPoints = [];
        for (let i = 0; i <= pathDetail; i++) {
          const t = s.map(i, 0, pathDetail, 0, s.TWO_PI);
          const r = knotRadius + waveAmplitude * s.cos(q * t); // no deformation yet
          const x = r * s.cos(p * t);
          const y = r * s.sin(p * t);
          const z = 0.5 * s.sin(q * t);
          knotPoints.push(s.createVector(x, y, z));
        }
        knotPoints.push(knotPoints[0]);
      };


      const computeRingsWithParallelTransport = () => {
        const {
          ringDetail, tubeRadius, twistDirection, twistTurns, globalTwistTurns,
          lumps, lumpHeight, lumpOffset, eccentricity, pathDetail
        } = config;

        let up = s.createVector(0, 1, 0);
        let prevNormal: p5.Vector | null = null;
        let prevTangent: p5.Vector | null = null;
        ringPoints = [];

        for (let i = 0; i < knotPoints.length - 1; i++) {
          let p1 = knotPoints[i];
          let p2 = knotPoints[i + 1];
          let tangent = p5.Vector.sub(p2, p1).normalize();
      
          let normal;
          if (i === 0) {
            normal = tangent.copy().cross(up).normalize();
          } else {
            const axis = prevTangent!.copy().cross(tangent);
            //const angle = p5.Vector.angleBetween(prevTangent!, tangent);
            const angle = s.acos(p5.Vector.dot(prevTangent as p5.Vector, tangent));
            normal = rotateVectorAroundAxis(prevNormal!, axis.normalize(), angle);
          }
      
          const binormal = tangent.copy().cross(normal).normalize();
          const u = i / pathDetail;
          const lump = 1 + lumpHeight * s.sin(s.TWO_PI * lumps * u + lumpOffset * s.TWO_PI);
          const localTwist = u * s.TWO_PI * twistTurns;
          const globalTwist = twistDirection * u * s.TWO_PI * globalTwistTurns;

          const twistedNormal = rotateVectorAroundAxis(normal, tangent, globalTwist);
          const twistedBinormal = rotateVectorAroundAxis(binormal, tangent, globalTwist);

          const ring: p5.Vector[] = [];
          for (let j = 0; j < ringDetail; j++) {
            let angle = s.map(j, 0, ringDetail, 0, s.TWO_PI) + localTwist;
            let cx = s.cos(angle);
            let cy = s.sin(angle) * (1 - eccentricity);
            let offset = p5.Vector.add(
              p5.Vector.mult(twistedNormal, cx),
              p5.Vector.mult(twistedBinormal, cy)
            ).mult(tubeRadius * lump);
            ring.push(p5.Vector.add(p1, offset));
          }
      
          ringPoints.push(ring);
          prevNormal = normal;
          prevTangent = tangent;
        }
      
        ringPoints.push(ringPoints[0]);
      };
      
      const rotateVectorAroundAxis = (v: p5.Vector, axis: p5.Vector, angle: number) : any => {
        const cosA = s.cos(angle);
        const sinA = s.sin(angle);
        const dot = v.dot(axis);
        const cross = axis.copy().cross(v);

        return p5.Vector.add(
          p5.Vector.add(
            v.copy().mult(cosA),
            cross.copy().mult(sinA)
          ),
          axis.copy().mult(dot * (1 - cosA))
        );
      };

      const drawDepthFill = () => {
        const { fillColor } = config;

        s.noStroke();
        s.fill(fillColor);
        const rd = config.ringDetail;

        for (let i = 0; i < ringPoints.length - 1; i++) {
          const ringA = ringPoints[i];
          const ringB = ringPoints[i + 1];

          s.beginShape(s.QUADS);
          for (let j = 0; j < rd; j++) {
            const a1 = ringA[j];
            const a2 = ringA[(j + 1) % rd];
            const b2 = ringB[(j + 1) % rd];
            const b1 = ringB[j];

            s.vertex(a1.x, a1.y, a1.z);
            s.vertex(a2.x, a2.y, a2.z);
            s.vertex(b2.x, b2.y, b2.z);
            s.vertex(b1.x, b1.y, b1.z);
          }
          s.endShape();
        }
      };

      const drawWireframe = () => {
        const { wireColor } = config;

        s.stroke(wireColor);
        s.strokeWeight(0.5);
        s.noFill();

        for (let i = 0; i < ringPoints.length; i++) {
          const ring = ringPoints[i];
          for (let j = 0; j < ring.length; j++) {
            const p1 = ring[j];
            const p2 = ring[(j + 1) % ring.length];
            
            s.line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
          }

          if (i < ringPoints.length - 2) {
            const nextRing = ringPoints[i + 1];
            for (let j = 0; j < ring.length; j++) {
              const p1 = ringPoints[i][j];
              const p2 = nextRing[j];
              s.line(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      };
    };

    p5InstanceRef.current = new p5(sketch, containerRef.current);
    return () => {
      p5InstanceRef.current?.remove();
    };
  }, [config, width, height]);

  return <div ref={containerRef}></div>;
}
