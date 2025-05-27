import p5 from 'p5';

export function exportFbxObject(
  quads: [p5.Vector, p5.Vector, p5.Vector, p5.Vector][]
): void {
  let fbx = '';
  const vertices: string[] = [];
  const faces: string[] = [];

  const vertexMap = new Map<string, number>();
  let vertexIndex = 0;

  for (const [a, b, c, d] of quads) {
    for (const pt of [a, b, c, d]) {
      const key = `${pt.x},${pt.y},${pt.z}`;
      if (!vertexMap.has(key)) {
        vertexMap.set(key, vertexIndex++);
        vertices.push(`Vertex: ${pt.x}, ${pt.y}, ${pt.z}`);
      }
    }
    const aIdx = vertexMap.get(`${a.x},${a.y},${a.z}`)!;
    const bIdx = vertexMap.get(`${b.x},${b.y},${b.z}`)!;
    const cIdx = vertexMap.get(`${c.x},${c.y},${c.z}`)!;
    const dIdx = vertexMap.get(`${d.x},${d.y},${d.z}`)!;
    faces.push(`Polygon: ${aIdx}, ${bIdx}, ${cIdx}, ${dIdx}`);
  }

  const fbxLines: string[] = [];
  fbxLines.push('FBXHeaderExtension: {');
  fbxLines.push('}');
  fbxLines.push('Objects: {');
  fbxLines.push('  Geometry: {');
  fbxLines.push('    Vertices: [');
  fbxLines.push(vertices.join(',\n'));
  fbxLines.push('    ],');
  fbxLines.push('    Faces: [');
  fbxLines.push(faces.join(',\n'));
  fbxLines.push('    ]');
  fbxLines.push('  }');
  fbxLines.push('}');
  fbx = fbxLines.join('\n');

  const blob = new Blob([fbx], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'torus-knot.fbx';
  a.click();
  URL.revokeObjectURL(url);
}
