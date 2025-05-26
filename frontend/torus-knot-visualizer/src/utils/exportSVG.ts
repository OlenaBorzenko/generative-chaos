import p5 from 'p5';

export function export3dObject(
  ringPoints: p5.Vector[][],

): any {
  let obj = '';
  const vertices: string[] = [];
  const faces: string[] = [];

  const ringCount = ringPoints.length;
  const ringDetail = ringPoints[0].length;

  // Write vertices
  for (const ring of ringPoints) {
    for (const pt of ring) {
      vertices.push(`v ${pt.x} ${pt.y} ${pt.z}`);
    }
  }

  // Write quad faces between adjacent rings
  for (let i = 0; i < ringCount - 1; i++) {
    for (let j = 0; j < ringDetail; j++) {
      const a = i * ringDetail + j + 1;
      const b = i * ringDetail + ((j + 1) % ringDetail) + 1;
      const c = (i + 1) * ringDetail + ((j + 1) % ringDetail) + 1;
      const d = (i + 1) * ringDetail + j + 1;

      faces.push(`f ${a} ${b} ${c} ${d}`); // quad face
    }
  }

  obj += vertices.join('\n') + '\n' + faces.join('\n');

  // Trigger download
  const blob = new Blob([obj], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  //a.href = url;
  //a.download = 'torus-knot.obj';
  //a.click();
  //URL.revokeObjectURL(url);
}
