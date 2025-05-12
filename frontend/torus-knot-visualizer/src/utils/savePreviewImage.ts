export async function savePreviewImage(designId: string) {
  const canvas = document.querySelector(`canvas[id="${designId}"]`) as HTMLCanvasElement;
  if (!canvas) return console.error('Canvas not found!');

  // Convert to blob (PNG)
  canvas.toBlob(async (blob) => {
    if (!blob) return console.error('Failed to convert canvas to blob.');

    const formData = new FormData();
    formData.append('image', blob, `${designId}.png`);

    try {
      const res = await fetch(`http://localhost:5018/api/Gallery/preview/${designId}`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      console.log('Preview uploaded!');
    } catch (err) {
      console.error('Upload error:', err);
    }
  }, 'image/png');
}
