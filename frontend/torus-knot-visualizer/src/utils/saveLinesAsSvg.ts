import p5 from 'p5';

export function saveLinesAsSvg(lines: [p5.Vector, p5.Vector][], width: number, height: number, filename: string): void {
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;

  for (const [start, end] of lines) {
    svgContent += `  <line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" stroke="black" stroke-width="1" />\n`;
  }

  svgContent += `</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}