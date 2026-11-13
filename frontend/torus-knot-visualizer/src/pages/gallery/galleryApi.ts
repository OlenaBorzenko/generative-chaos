import type { DesignConfig } from '../../store/useStore';

const galleryUrl = 'http://localhost:5018/api/Gallery';

export async function fetchGallery(limit: number, signal?: AbortSignal): Promise<DesignConfig[]> {
  const response = await fetch(`${galleryUrl}?page=1&pageSize=${limit}`, { signal });
  if (!response.ok) throw new Error('Could not load designs. Please try again.');
  const designs: unknown = await response.json();
  if (!Array.isArray(designs)) throw new Error('Could not load designs. Please try again.');
  return designs as DesignConfig[];
}

export async function deleteGalleryDesign(id: string): Promise<void> {
  const response = await fetch(`${galleryUrl}/designs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (response.status === 404) throw new Error('This design no longer exists. Refresh the gallery.');
  if (!response.ok) throw new Error('Could not delete the design. Please try again.');
}
