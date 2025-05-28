import p5 from 'p5';
export function exportTopViewToSVG(quads: [p5.Vector, p5.Vector, p5.Vector, p5.Vector][]): void {
  const isQuadFrontFacing = (quad: [p5.Vector, p5.Vector, p5.Vector, p5.Vector]) => {
    const edge1 = p5.Vector.sub(quad[1], quad[0]);
    const edge2 = p5.Vector.sub(quad[2], quad[1]);
    const normal = edge1.copy().cross(edge2); // Ensure it's a p5.Vector
    return normal.z > 0;
  };

  const minZ = (quad: [p5.Vector, p5.Vector, p5.Vector, p5.Vector]) =>
    Math.min(quad[0].z, quad[1].z, quad[2].z, quad[3].z);

  const sortedQuads = [...quads].filter(isQuadFrontFacing).sort((a, b) => minZ(a) - minZ(b));

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="-400 -400 800 800">\n`;

  svgContent += `<g fill="white" stroke="none">\n`;
  for (const quad of sortedQuads) {
    svgContent += `<path d="M ${quad[0].x} ${quad[0].y} L ${quad[1].x} ${quad[1].y} L ${quad[2].x} ${quad[2].y} L ${quad[3].x} ${quad[3].y} Z" />\n`;
  }
  svgContent += `</g>\n`;

  svgContent += `<g fill="none" stroke="black" stroke-width="0.003">\n`;
  for (const quad of sortedQuads) {
    for (let i = 0; i < 4; i++) {
      const a = quad[i];
      const b = quad[(i + 1) % 4];
      svgContent += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" />\n`;
    }
  }
  svgContent += `</g>\n</svg>`;

  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "torus-knot-top-view.svg";
  a.click();
}
