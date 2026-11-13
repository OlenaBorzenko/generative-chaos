import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './Gallery.module.css';
import useStore, { DesignConfig } from '../../store/useStore';
import { deleteGalleryDesign, fetchGallery } from './galleryApi';

export default function Gallery() {
  const [designs, setDesigns] = useState<DesignConfig[]>([]);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 10;
  const navigate = useNavigate();
  const { setSelectedDesign, removeDeletedDesign } = useStore();

  useEffect(() => {
    const controller = new AbortController();
    fetchGallery(pageSize, controller.signal).then((data) => {
      setDesigns(data);
      setHasMore(data.length === pageSize);
    }).catch(() => {
      if (!controller.signal.aborted) setError('Could not load designs. Please try again.');
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, []);

  async function refreshDesigns(nextLimit: number) {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchGallery(nextLimit);
      setDesigns(data);
      setLimit(nextLimit);
      setHasMore(data.length === nextLimit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load designs. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const handleNavigation = (cfg: DesignConfig) => {
    setSelectedDesign(cfg);
    navigate(`/design/${cfg.id}`);
  };
  
  async function handleDelete(design: DesignConfig) {
    if (loading || deletingId || !window.confirm(`Delete "${design.userInput}"? This cannot be undone.`)) return;
    setDeletingId(design.id);
    setError(null);
    try {
      await deleteGalleryDesign(design.id);
      setDesigns((previous) => previous.filter((item) => item.id !== design.id));
      removeDeletedDesign(design.id);
      await refreshDesigns(limit);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the design. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className={s.container}>
      <header className={s.galleryHeader}>
        <div>
          <span className={s.eyebrow}>ARCHIVE // PUBLIC WORKS</span>
          <h1>Gallery<span>.</span></h1>
        </div>
        <p>Generated forms, collected in one place.</p>
      </header>
      <div className={s.galleryGrid}>
        {designs.map((design, idx) => (
          <div key={design.id ?? idx} className={s.gridItem}>
            <button type="button" className={s.designButton} onClick={() => handleNavigation(design)}>
              <div className={s.imageFrame}>
                <img src={design.previewUrl} alt={design.userInput || `Generated design ${idx + 1}`} className={s.gridImage} />
                <span className={s.cardIndex}>{String(idx + 1).padStart(3, '0')}</span>
                <span className={s.cardArrow} aria-hidden="true">↗</span>
              </div>
              <div className={s.imageTitle}>"{design.userInput}"</div>
            </button>
            <button
              type="button"
              className={s.deleteButton}
              aria-label={`Delete ${design.userInput || 'design'}`}
              title="Delete design"
              disabled={loading || deletingId !== null}
              onClick={() => void handleDelete(design)}
            >
              {deletingId === design.id ? '…' : (
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v7m4-7v7" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>
      {error && <p className={s.error} role="alert">{error} <button type="button" onClick={() => void refreshDesigns(limit)} disabled={loading || deletingId !== null}>Refresh</button></p>}
      {deletingId && <p className={s.status} role="status">Deleting design…</p>}
      {designs.length === 0 && !hasMore && !loading && <p className={s.emptyState}>No designs have been archived yet.</p>}
      {hasMore && (
        <button onClick={() => void refreshDesigns(limit + pageSize)} className={s.galleryButton} disabled={loading || deletingId !== null}>
          {loading ? 'Loading…' : 'Load More'}
        </button>
      )}
    </main>
  );
}
